import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
}

export interface WhatsAppStatus {
  isReady: boolean;
  needsAuth: boolean;
  qr: string | null;
  statusMessage?: string;
}

// Module-level cache to share offline status and state across all hook instances
interface BotState {
  status: WhatsAppStatus;
  chats: WhatsAppChat[];
  isAvailable: boolean;
  isLoading: boolean;
  isCloudActive: boolean;
  conflictBotUrl: string | null;
}

let globalIsOffline = false;
let lastCheckTime = 0;
let consecutiveFailures = 0;
let currentPollingInterval = 5000; // Start at 5s
let lastCheckedUrl = '';
let lastHeartbeatTime = 0; // Throttled timestamp to reduce excessive RxDB replication spam
let isChecking = false;

let botState: BotState = {
  status: { isReady: false, needsAuth: false, qr: null, statusMessage: 'Iniciando...' },
  chats: [],
  isAvailable: false,
  isLoading: true,
  isCloudActive: false,
  conflictBotUrl: null,
};

const listeners = new Set<(state: BotState) => void>();

function updateBotState(updates: Partial<BotState>) {
  botState = { ...botState, ...updates };
  listeners.forEach(listener => listener(botState));
}

export function useWhatsAppBot(localUrl: string = 'http://localhost:3001') {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();

  const [state, setState] = useState<BotState>(botState);

  // Subscribe to global bot state updates
  useEffect(() => {
    listeners.add(setState);
    // Sync with the latest state on mount
    setState(botState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  // Stable ref for callbacks
  const isCloudActiveRef = useRef(false);
  useEffect(() => {
    isCloudActiveRef.current = state.isCloudActive;
  }, [state.isCloudActive]);

  const checkStatus = useCallback(async (forceParam: boolean | any = false) => {
    let force = forceParam === true || (typeof forceParam === 'object' && forceParam !== null && !(forceParam instanceof Headers));
    
    // Force check if the target URL has changed
    if (localUrl && localUrl !== lastCheckedUrl) {
      force = true;
      lastCheckedUrl = localUrl;
    }

    const now = Date.now();

    // If another check is already in progress, wait
    if (isChecking) {
      return botState.status.isReady;
    }

    // Determine the minimum time we must wait before making another fetch request
    const minInterval = globalIsOffline ? currentPollingInterval : 4000;

    if (!force && now < lastCheckTime + minInterval) {
      return botState.status.isReady;
    }

    isChecking = true;
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Status no ok');
      
      const data = await response.json();
      
      // Success! Reset backoff variables
      globalIsOffline = false;
      lastCheckTime = Date.now();
      consecutiveFailures = 0;
      currentPollingInterval = 5000;
      
      updateBotState({
        status: data,
        isAvailable: true
      });

      // Report active status to the database (heartbeat) - throttled to once every 45 seconds to avoid excessive RxDB push/pull replication network spam
      if (db && currentWorkspace && isCloud && data.isReady) {
        const statusId = `whatsapp_bot_status:${currentWorkspace}`;
        const shouldWrite = force || (Date.now() - lastHeartbeatTime > 45000);
        
        if (shouldWrite) {
          lastHeartbeatTime = Date.now();
          db.configs.upsert({
            id: statusId,
            workspace_id: currentWorkspace,
            type: 'whatsapp_bot_status' as any,
            data: {
              isReady: true,
              lastSeen: new Date().toISOString(),
              botId: localUrl
            }
          }).catch(err => logger.error('Error writing bot heartbeat:', err));
        }
      }
      
      return data.isReady;
    } catch (error) {
      // Failure! Record offline state and increase polling interval (exponential backoff)
      globalIsOffline = true;
      lastCheckTime = Date.now();
      consecutiveFailures++;
      
      if (consecutiveFailures === 1) {
        currentPollingInterval = 15000; // 15s
      } else if (consecutiveFailures === 2) {
        currentPollingInterval = 30000; // 30s
      } else if (consecutiveFailures === 3) {
        currentPollingInterval = 60000; // 1m
      } else {
        currentPollingInterval = 120000; // 2m max
      }
      
      updateBotState({
        isAvailable: false,
        status: { isReady: false, needsAuth: false, qr: null, statusMessage: 'Servidor no disponible' }
      });
      return false;
    } finally {
      isChecking = false;
      updateBotState({ isLoading: false });
    }
  }, [localUrl, db, currentWorkspace, isCloud]);

  const loadChats = useCallback(async () => {
    if (!state.status.isReady) return;
    
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/chats`);
      if (response.ok) {
        const data = await response.json();
        updateBotState({ chats: data });
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [localUrl, state.status.isReady]);

  const sendMessage = useCallback(async (chatId: string, message: string, media?: { url: string; name?: string; description?: string }[]) => {
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message, media }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error sending message');
      }
      
      return await response.json();
    } catch (error) {
      // FALLBACK: Si falla el envío directo pero estamos en la nube y el bot está activo globalmente,
      // lo programamos para "ya mismo" (dentro de la base de datos).
      if (isCloud && isCloudActiveRef.current && db && currentWorkspace) {
        logger.info('Direct send failed/unreachable. Scheduling immediately via Cloud fallback...');
        const id = `scheduled_message:${currentWorkspace}:${crypto.randomUUID()}`;
        const data = {
          chatId,
          message,
          title: 'Envío Instantáneo (Nube)',
          scheduledTime: new Date().toISOString(),
          status: 'pending',
          media, // También guardamos la referencia de media para fallbacks si el despachador en la nube lo soporta
        };
        await db.configs.upsert({
          id,
          workspace_id: currentWorkspace,
          type: 'scheduled_message' as any,
          data,
        });
        return { success: true, viaCloud: true };
      }
      
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }, [localUrl, isCloud, db, currentWorkspace]);

  // Polling for status with dynamic interval
  useEffect(() => {
    const now = Date.now();
    const minInterval = globalIsOffline ? currentPollingInterval : 4000;
    const shouldCheckImmediately = !lastCheckTime || (now - lastCheckTime >= minInterval);

    if (shouldCheckImmediately) {
      checkStatus();
    }
    
    let timeoutId: NodeJS.Timeout;
    
    const poll = async () => {
      await checkStatus();
      timeoutId = setTimeout(poll, currentPollingInterval);
    };
    
    timeoutId = setTimeout(poll, currentPollingInterval);
    
    return () => clearTimeout(timeoutId);
  }, [checkStatus]);

  // 1. Suscribirse al estado del bot en la base de datos (Supabase Cloud)
  useEffect(() => {
    if (!db || !currentWorkspace || !isCloud) {
      updateBotState({ isCloudActive: false, conflictBotUrl: null });
      return;
    }

    const statusId = `whatsapp_bot_status:${currentWorkspace}`;
    const sub = db.configs.findOne(statusId).$.subscribe((doc) => {
      if (doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        const lastSeen = new Date(data.lastSeen || 0).getTime();
        const isRecent = Date.now() - lastSeen < 120000; // 2 min TTL
        const active = !!data.isReady && isRecent;
        const conflict = active && data.botId && data.botId !== localUrl ? data.botId : null;
        updateBotState({ 
          isCloudActive: active,
          conflictBotUrl: conflict
        });
      } else {
        updateBotState({ isCloudActive: false, conflictBotUrl: null });
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud, localUrl]);

  // 2. Re-verificar la expiración del TTL cada 30 segundos
  useEffect(() => {
    if (!db || !currentWorkspace || !isCloud) return;

    const timer = setInterval(async () => {
      const statusId = `whatsapp_bot_status:${currentWorkspace}`;
      const doc = await db.configs.findOne(statusId).exec();
      if (doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        const lastSeen = new Date(data.lastSeen || 0).getTime();
        const isRecent = Date.now() - lastSeen < 120000;
        const active = !!data.isReady && isRecent;
        const conflict = active && data.botId && data.botId !== localUrl ? data.botId : null;
        updateBotState({ 
          isCloudActive: active,
          conflictBotUrl: conflict
        });
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [db, currentWorkspace, isCloud, localUrl]);

  // Load chats when ready locally
  useEffect(() => {
    if (state.isAvailable && state.status.isReady && state.chats.length === 0) {
      loadChats();
    }
  }, [state.isAvailable, state.status.isReady, state.chats.length, loadChats]);

  const finalAvailable = state.isAvailable || (state.isCloudActive && isCloud);
  const finalStatus = state.isAvailable
    ? state.status
    : (state.isCloudActive && isCloud)
      ? { isReady: true, needsAuth: false, qr: null, statusMessage: 'Disponible en la Nube' }
      : state.status;

  return {
    isAvailable: finalAvailable,
    isLoading: state.isLoading,
    status: finalStatus,
    chats: state.chats,
    checkStatus,
    loadChats,
    sendMessage,
    localUrl,
    isCloudActive: state.isCloudActive,
    conflictBotUrl: state.conflictBotUrl
  };
}
