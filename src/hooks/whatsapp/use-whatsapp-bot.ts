import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { DbKeys } from '@/lib/repositories/keys';
import { logger } from '@/lib/logger';
import { OfflinePhotosDB } from '@/lib/offline-photos';

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
  const newState = { ...botState, ...updates };
  
  // Guard estricto: Si el bot local responde en esta máquina pero no está listo (esperando QR o desconectado),
  // o si no hay bot local ni bot en la nube listo:
  // ¡LA LISTA DE CHATS DEBE SER ESTRICTAMENTE VACÍA!
  const hasLocalBot = newState.isAvailable;
  const isLocalReady = hasLocalBot && newState.status.isReady;
  const isCloudReady = !hasLocalBot && newState.isCloudActive;

  if (!isLocalReady && !isCloudReady) {
    newState.chats = [];
  }
  
  botState = newState;
  listeners.forEach(listener => listener(botState));
}

async function convertPhotoToBase64(photoId: string, url: string, localBlobId?: string): Promise<string> {
  // 1. Try to load from OfflinePhotosDB first
  try {
    let blob: Blob | null = null;
    if (localBlobId) {
      blob = await OfflinePhotosDB.get(localBlobId);
    }
    if (!blob) {
      blob = await OfflinePhotosDB.get(photoId);
    }
    
    if (blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (dbErr) {
    console.warn('Failed to load blob from OfflinePhotosDB:', dbErr);
  }

  // 2. Fallback to fetching URL if it is a blob URL of the same origin
  if (url && url.startsWith('blob:')) {
    let isSameOrigin = false;
    try {
      const urlObj = new URL(url.replace('blob:', ''));
      isSameOrigin = urlObj.origin === window.location.origin;
    } catch (e) {}

    if (isSameOrigin) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fetchErr) {
        console.warn('Failed to fetch blob URL:', fetchErr);
      }
    }
  }

  // 3. Keep http public URLs as is so the bot can download them
  return url;
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

    // Si NO está listo (esperando QR o desconectado), comprobar mucho más rápido (1000ms)
    // para que el QR aparezca de inmediato cuando la consola lo emita.
    const minInterval = globalIsOffline ? currentPollingInterval : (botState.status.isReady ? 3500 : 1000);

    if (!force && now < lastCheckTime + minInterval) {
      return botState.status.isReady;
    }

    isChecking = true;
    try {
      const cacheBuster = `_t=${Date.now()}`;
      const url = `${localUrl}/api/whatsapp/status?${cacheBuster}`;
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
      });
      
      if (!response.ok) throw new Error('Status no ok');
      
      const data = await response.json();
      
      // Capturar si estaba listo ANTES de actualizar el estado
      const wasReady = botState.status.isReady;
      const isReadyChanged = wasReady !== data.isReady;

      // Success! Reset backoff variables
      globalIsOffline = false;
      lastCheckTime = Date.now();
      consecutiveFailures = 0;
      // Intervalo dinámico: si no está listo, poll cada 1.5s; si está listo, poll cada 5s
      currentPollingInterval = data.isReady ? 5000 : 1500;
      
      updateBotState({
        status: data,
        isAvailable: true,
        // Si data.isReady es false, chats debe ser vacía SIEMPRE
        chats: data.isReady ? botState.chats : []
      });

      // Report active status to the database (heartbeat)
      if (db && currentWorkspace && isCloud) {
        const statusId = `whatsapp_bot_status:${currentWorkspace}`;
        const chatsId = `whatsapp_chats:${currentWorkspace}`;
        const shouldWrite = force || isReadyChanged || (data.isReady && Date.now() - lastHeartbeatTime > 45000);
        
        if (shouldWrite) {
          if (data.isReady) {
            lastHeartbeatTime = Date.now();
          }
          db.configs.upsert({
            id: statusId,
            workspace_id: currentWorkspace,
            type: 'whatsapp_bot_status',
            data: {
              isReady: data.isReady,
              lastSeen: new Date().toISOString(),
              botId: localUrl
            }
          }).catch(err => logger.error('Error writing bot heartbeat:', err));

          // Si el bot local ya NO está listo, limpiar los chats en la base de datos INMEDIATAMENTE
          if (!data.isReady) {
            db.configs.upsert({
              id: chatsId,
              workspace_id: currentWorkspace,
              type: 'whatsapp_bot_status',
              data: {
                chats: [],
                updatedAt: new Date().toISOString()
              }
            }).catch(err => console.error('Error clearing chats in DB:', err));
          }
        }
      }
      
      return data.isReady;
    } catch (error) {
      // Failure! Record offline state and increase polling interval (exponential backoff)
      globalIsOffline = true;
      lastCheckTime = Date.now();
      consecutiveFailures++;
      
      if (consecutiveFailures === 1) {
        currentPollingInterval = 5000;
      } else if (consecutiveFailures === 2) {
        currentPollingInterval = 10000;
      } else {
        currentPollingInterval = 20000;
      }
      
      updateBotState({
        isAvailable: false,
        status: { isReady: false, needsAuth: false, qr: null, statusMessage: 'Servidor no disponible' },
        chats: []
      });
      return false;
    } finally {
      isChecking = false;
      updateBotState({ isLoading: false });
    }
  }, [localUrl, db, currentWorkspace, isCloud]);

  const loadChats = useCallback(async () => {
    const isBotReady = state.status.isReady || (state.isCloudActive && isCloud);
    if (!isBotReady) return;
    
    // If the local bot is running on this device, fetch from it
    if (state.isAvailable && state.status.isReady) {
      try {
        const response = await fetch(`${localUrl}/api/whatsapp/chats`);
        if (response.ok) {
          const data = await response.json();
          updateBotState({ chats: data });
          
          // Sync to database if we are in cloud workspace
          if (db && currentWorkspace && isCloud) {
            const chatsId = `whatsapp_chats:${currentWorkspace}`;
            await db.configs.upsert({
              id: chatsId,
              workspace_id: currentWorkspace,
              type: 'whatsapp_bot_status',
              data: {
                chats: data,
                updatedAt: new Date().toISOString()
              }
            }).catch(err => console.error('Error syncing chats list to DB:', err));
          }
        }
      } catch (error) {
        console.error('Error fetching chats from local bot:', error);
      }
    } else if (isCloud && db && currentWorkspace) {
      // If we are a remote client, load from the database
      try {
        const chatsId = `whatsapp_chats:${currentWorkspace}`;
        const doc = await db.configs.findOne(chatsId).exec();
        if (doc) {
          const item = doc.toJSON();
          const data = item.data || {};
          if (Array.isArray(data.chats)) {
            updateBotState({ chats: data.chats });
          }
        }
      } catch (error) {
        console.error('Error loading chats from database:', error);
      }
    }
  }, [localUrl, state.isAvailable, state.status.isReady, state.isCloudActive, isCloud, db, currentWorkspace]);

  const sendMessage = useCallback(async (chatId: string, message: string, media?: { id?: string; local_blob_id?: string; url: string; name?: string; description?: string }[]) => {
    try {
      // Convert any local blob: URLs to base64 before sending to the bot
      const processedMedia = media
        ? await Promise.all(
            media.map(async (item) => {
              try {
                const base64Url = await convertPhotoToBase64(item.id || '', item.url, item.local_blob_id);
                return { ...item, url: base64Url };
              } catch (err) {
                console.error('Failed to convert blob URL to base64:', err);
                return item;
              }
            })
          )
        : undefined;

      const response = await fetch(`${localUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message, media: processedMedia }),
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
        const id = DbKeys.scheduledMessage(currentWorkspace, crypto.randomUUID());
        
        // Ensure processedMedia is prepared (in case conversion failed, or wasn't run)
        const finalMedia = media
          ? await Promise.all(
              media.map(async (item) => {
                try {
                  const base64Url = await convertPhotoToBase64(item.id || '', item.url, item.local_blob_id);
                  return { ...item, url: base64Url };
                } catch (err) {
                  return item;
                }
              })
            )
          : [];

        await db.scheduled_messages.upsert({
          id,
          workspace_id: currentWorkspace,
          chatId,
          message,
          title: 'Envío Instantáneo (Nube)',
          scheduledTime: new Date().toISOString(),
          status: 'pending',
          media: finalMedia,
        });
        return { success: true, viaCloud: true };
      }
      
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }, [localUrl, isCloud, db, currentWorkspace]);

  // Polling for status with dynamic interval
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;
      await checkStatus();
      if (isCancelled) return;

      // Si el bot no está listo (esperando QR o desconectado), consultar rápido (1500ms)
      const nextInterval = globalIsOffline 
        ? currentPollingInterval 
        : (!botState.status.isReady ? 1500 : 5000);

      timeoutId = setTimeout(poll, nextInterval);
    };

    timeoutId = setTimeout(poll, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
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

  // 3. Suscribirse a los chats del bot en la base de datos (para clientes en la nube)
  useEffect(() => {
    if (!db || !currentWorkspace || !isCloud) return;

    const chatsId = `whatsapp_chats:${currentWorkspace}`;
    const sub = db.configs.findOne(chatsId).$.subscribe((doc) => {
      // Si el bot local está respondiendo en esta máquina, la fuente de verdad es estrictamente local:
      if (botState.isAvailable) {
        if (!botState.status.isReady) {
          updateBotState({ chats: [] });
        }
        return;
      }

      // Si es un cliente puramente remoto (nube):
      if (botState.isCloudActive && doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        if (Array.isArray(data.chats) && data.chats.length > 0) {
          updateBotState({ chats: data.chats });
          return;
        }
      }
      updateBotState({ chats: [] });
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  // Load chats when ready locally
  useEffect(() => {
    if (state.isAvailable && state.status.isReady && state.chats.length === 0) {
      loadChats();
    }
  }, [state.isAvailable, state.status.isReady, state.chats.length, loadChats]);

  const logout = useCallback(async () => {
    try {
      updateBotState({
        status: { isReady: false, needsAuth: false, qr: null, statusMessage: 'Cerrando sesión...' },
        chats: []
      });

      if (db && currentWorkspace && isCloud) {
        const statusId = `whatsapp_bot_status:${currentWorkspace}`;
        const chatsId = `whatsapp_chats:${currentWorkspace}`;
        await Promise.all([
          db.configs.upsert({
            id: statusId,
            workspace_id: currentWorkspace,
            type: 'whatsapp_bot_status',
            data: { isReady: false, lastSeen: new Date().toISOString(), botId: localUrl }
          }).catch(() => {}),
          db.configs.upsert({
            id: chatsId,
            workspace_id: currentWorkspace,
            type: 'whatsapp_bot_status',
            data: { chats: [], updatedAt: new Date().toISOString() }
          }).catch(() => {})
        ]);
      }

      await fetch(`${localUrl}/api/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});

      setTimeout(() => checkStatus(true), 1200);
    } catch (e) {
      console.error('Error during logout:', e);
    }
  }, [localUrl, db, currentWorkspace, isCloud, checkStatus]);

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
    logout,
    localUrl,
    isCloudActive: state.isCloudActive,
    conflictBotUrl: state.conflictBotUrl
  };
}
