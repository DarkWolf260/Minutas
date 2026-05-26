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

// Module-level cache to share offline status across all hook instances and prevent duplicate requests / console ERR_CONNECTION_REFUSED spam.
let globalIsOffline = false;
let lastCheckTime = 0;
let consecutiveFailures = 0;
let currentPollingInterval = 5000; // Start at 5s
let lastCheckedUrl = '';
let lastHeartbeatTime = 0; // Throttled timestamp to reduce excessive RxDB replication spam

export function useWhatsAppBot(localUrl: string = 'http://localhost:3001') {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();

  const [status, setStatus] = useState<WhatsAppStatus>({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Iniciando...' });
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudActive, setIsCloudActive] = useState<boolean>(false);

  // Stable ref for callbacks
  const isCloudActiveRef = useRef(false);
  useEffect(() => {
    isCloudActiveRef.current = isCloudActive;
  }, [isCloudActive]);

  const checkStatus = useCallback(async (forceParam: boolean | any = false) => {
    let force = forceParam === true || (typeof forceParam === 'object' && forceParam !== null && !(forceParam instanceof Headers));
    
    // Force check if the target URL has changed
    if (localUrl !== lastCheckedUrl) {
      force = true;
      lastCheckedUrl = localUrl;
    }

    const now = Date.now();

    // If we're not forcing and we know the server was recently offline, return cached status immediately
    // without making a fetch request, preventing console ERR_CONNECTION_REFUSED spam.
    if (!force && globalIsOffline && now < lastCheckTime + currentPollingInterval) {
      setIsAvailable(false);
      setStatus({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Servidor no disponible' });
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(`${localUrl}/api/whatsapp/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Status no ok');
      
      const data = await response.json();
      
      // Success! Reset backoff variables
      globalIsOffline = false;
      lastCheckTime = now;
      consecutiveFailures = 0;
      currentPollingInterval = 5000;
      
      setStatus(data);
      setIsAvailable(true);

      // Report active status to the database (heartbeat) - throttled to once every 45 seconds to avoid excessive RxDB push/pull replication network spam
      if (db && currentWorkspace && isCloud && data.isReady) {
        const statusId = `whatsapp_bot_status:${currentWorkspace}`;
        const shouldWrite = force || (now - lastHeartbeatTime > 45000);
        
        if (shouldWrite) {
          lastHeartbeatTime = now;
          db.configs.upsert({
            id: statusId,
            workspace_id: currentWorkspace,
            type: 'whatsapp_bot_status' as any,
            data: {
              isReady: true,
              lastSeen: new Date().toISOString()
            }
          }).catch(err => logger.error('Error writing bot heartbeat:', err));
        }
      }
      
      return data.isReady;
    } catch (error) {
      // Failure! Record offline state and increase polling interval (exponential backoff)
      globalIsOffline = true;
      lastCheckTime = now;
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
      
      setIsAvailable(false);
      setStatus({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Servidor no disponible' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [localUrl, db, currentWorkspace, isCloud]);

  const loadChats = useCallback(async () => {
    if (!status.isReady) return;
    
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/chats`);
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [localUrl, status.isReady]);

  const sendMessage = useCallback(async (chatId: string, message: string) => {
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
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
    checkStatus();
    
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
      setIsCloudActive(false);
      return;
    }

    const statusId = `whatsapp_bot_status:${currentWorkspace}`;
    const sub = db.configs.findOne(statusId).$.subscribe((doc) => {
      if (doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        const lastSeen = new Date(data.lastSeen || 0).getTime();
        const isRecent = Date.now() - lastSeen < 120000; // 2 min TTL
        setIsCloudActive(!!data.isReady && isRecent);
      } else {
        setIsCloudActive(false);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

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
        setIsCloudActive(!!data.isReady && isRecent);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [db, currentWorkspace, isCloud]);

  // Load chats when ready locally
  useEffect(() => {
    if (isAvailable && status.isReady && chats.length === 0) {
      loadChats();
    }
  }, [isAvailable, status.isReady, chats.length, loadChats]);

  const finalAvailable = isAvailable || (isCloudActive && isCloud);
  const finalStatus = isAvailable
    ? status
    : (isCloudActive && isCloud)
      ? { isReady: true, needsAuth: false, qr: null, statusMessage: 'Disponible en la Nube' }
      : status;

  return {
    isAvailable: finalAvailable,
    isLoading,
    status: finalStatus,
    chats,
    checkStatus,
    loadChats,
    sendMessage,
    localUrl,
    isCloudActive
  };
}
