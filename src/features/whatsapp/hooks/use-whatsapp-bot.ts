import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { DbKeys } from '@/lib/repositories/keys';
import { logger } from '@/lib/logger';
import { OfflinePhotosDB } from '@/lib/offline-photos';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { safeBotFetch } from '../services/safe-fetch';

import type {
  WhatsAppChat,
  WhatsAppLocation,
  QuotedWhatsAppMessage,
  WhatsAppMessage,
  WhatsAppStatus,
  BotState
} from '../types';

let globalIsOffline = false;
let lastCheckTime = 0;
let consecutiveFailures = 0;
let currentPollingInterval = 5000; // Start at 5s
let lastCheckedUrl = '';
let lastHeartbeatTime = 0; // Throttled timestamp to reduce excessive RxDB replication spam
let isChecking = false;

let globalInFlightLoadChatsPromise: Promise<void> | null = null;
let globalHasAutoLoadedChats = false;
let lastChatsLoadAttemptTime = 0;
let chatsConsecutiveFailures = 0;

let botState: BotState = {
  status: { isReady: false, needsAuth: false, qr: null, statusMessage: 'Iniciando...' },
  chats: [],
  isAvailable: false,
  isLoading: true,
  isCloudActive: false,
  conflictBotUrl: null,
  activeWorkspace: null,
  isWorkspaceMatch: true,
};

const listeners = new Set<(state: BotState) => void>();

function isValidWhatsAppChatId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const lower = id.toLowerCase().trim();
  if (
    lower === 'status@broadcast' ||
    lower.startsWith('status@') ||
    lower.includes('@broadcast') ||
    lower.includes('@newsletter')
  ) {
    return false;
  }
  return true;
}

function isStatusEqual(a: WhatsAppStatus, b: WhatsAppStatus): boolean {
  if (a === b) return true;
  return (
    a.isReady === b.isReady &&
    a.needsAuth === b.needsAuth &&
    a.qr === b.qr &&
    a.statusMessage === b.statusMessage &&
    a.activeWorkspace === b.activeWorkspace &&
    a.isWorkspaceMatch === b.isWorkspaceMatch
  );
}

function areChatsEqual(a: WhatsAppChat[], b: WhatsAppChat[]): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const cA = a[i];
    const cB = b[i];
    if (!cA || !cB) return false;
    if (
      cA.id !== cB.id ||
      cA.name !== cB.name ||
      cA.avatarUrl !== cB.avatarUrl ||
      cA.timestamp !== cB.timestamp ||
      cA.isGroup !== cB.isGroup ||
      cA.unreadCount !== cB.unreadCount
    ) {
      return false;
    }
  }
  return true;
}

function updateBotState(updates: Partial<BotState>) {
  const newState = { ...botState, ...updates };
  
  // Guard estricto: Si el bot local responde en esta máquina pero no está listo (esperando QR o desconectado),
  // o si no coincide el área de trabajo activa:
  // ¡LA LISTA DE CHATS LOCALES DEBE SER ESTRICTAMENTE VACÍA!
  const hasLocalBot = newState.isAvailable && newState.isWorkspaceMatch;
  const isLocalReady = hasLocalBot && newState.status.isReady;

  if (hasLocalBot && !isLocalReady) {
    newState.chats = [];
  } else if (Array.isArray(newState.chats)) {
    newState.chats = newState.chats.filter(c => isValidWhatsAppChatId(c.id));
  }
  
  // Guard de igualdad para evitar re-renders innecesarios (tirones en la UI)
  const isIdentical =
    botState.isAvailable === newState.isAvailable &&
    botState.isLoading === newState.isLoading &&
    botState.isWorkspaceMatch === newState.isWorkspaceMatch &&
    botState.isCloudActive === newState.isCloudActive &&
    botState.conflictBotUrl === newState.conflictBotUrl &&
    botState.activeWorkspace === newState.activeWorkspace &&
    isStatusEqual(botState.status, newState.status) &&
    areChatsEqual(botState.chats, newState.chats);

  if (isIdentical) {
    return;
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

/**
 * Resolves the effective base URL for WhatsApp Bot API requests.
 * In development mode (Vite dev server) when targeting the local bot (localhost:3001 / 127.0.0.1:3001),
 * returns empty string ('') to route calls through the same-origin Vite proxy (/api/whatsapp).
 * This completely avoids browser CORS preflight blocks and Mixed-Content warnings.
 */
export function getEffectiveBotUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');

  const isLocalBot = /^https?:\/\/(localhost|127\.0\.0\.1):3001$/i.test(trimmed);
  if (isLocalBot && import.meta.env.DEV) {
    return '';
  }

  return trimmed;
}

/**
 * Normaliza y valida una URL de avatar.
 * En páginas HTTPS (ej: producción en Vercel), normaliza URLs relativas (/api/whatsapp...)
 * hacia la URL del bot (o http://localhost:3001 por defecto) para que useSafeMediaSrc
 * pueda descargarlas de manera segura vía CORS/PNA y convertirlas en blob: HTTPS.
 */
export function getCleanAvatarUrl(avatarUrl?: string | null, customApiUrl?: string): string | null {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed) return null;

  // Si es un pixel transparente 1x1 conocido en base64, retornar null
  if (trimmed.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')) {
    return null;
  }

  // Si ya es una URL HTTPS directa, data URI o blob URL, es segura y válida
  if (/^https:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Si es una ruta relativa (/api/whatsapp...) en entorno web
  if (trimmed.startsWith('/')) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttps) {
      const base = customApiUrl || 'http://localhost:3001';
      return `${base.replace(/\/+$/, '')}${trimmed}`;
    }
    return trimmed;
  }

  return trimmed;
}

export const WHATSAPP_BOT_URL_STORAGE_KEY = 'minutas_whatsapp_bot_url';

export function getLocalWhatsAppBotUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  try {
    return localStorage.getItem(WHATSAPP_BOT_URL_STORAGE_KEY) || 'http://localhost:3001';
  } catch {
    return 'http://localhost:3001';
  }
}

export function setLocalWhatsAppBotUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = (url || 'http://localhost:3001').trim();
  try {
    localStorage.setItem(WHATSAPP_BOT_URL_STORAGE_KEY, clean);
    window.dispatchEvent(new CustomEvent('minutas_whatsapp_bot_url_changed', { detail: clean }));
  } catch {}
}

export function useWhatsAppBotUrl(): string {
  const [storedUrl, setStoredUrl] = useState<string>(getLocalWhatsAppBotUrl);

  useEffect(() => {
    const handler = (e: any) => {
      setStoredUrl(e.detail || getLocalWhatsAppBotUrl());
    };
    window.addEventListener('minutas_whatsapp_bot_url_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('minutas_whatsapp_bot_url_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return storedUrl;
}

export function useWhatsAppBot(customUrl?: string) {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();

  const currentUrl = useWhatsAppBotUrl();
  const localUrl = customUrl || currentUrl || 'http://localhost:3001';
  const apiUrl = getEffectiveBotUrl(localUrl);

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
      const wsParam = currentWorkspace ? `&workspace=${encodeURIComponent(currentWorkspace)}` : '';
      const url = `${apiUrl}/api/whatsapp/status?${cacheBuster}${wsParam}`;
      const response = await safeBotFetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(currentWorkspace ? { 'x-workspace-id': currentWorkspace } : {})
        },
      });
      
      if (!response.ok) throw new Error('Status no ok');
      
      const data = await response.json();

      // Si la respuesta del proxy (en desarrollo) o del bot indica que el bot no está disponible
      if (data.isAvailable === false || data.offline === true) {
        throw new Error('Bot offline');
      }
      const isMatch = data.isWorkspaceMatch !== false;

      // Success! Reset backoff variables
      globalIsOffline = false;
      lastCheckTime = Date.now();
      consecutiveFailures = 0;
      currentPollingInterval = data.isReady ? 5000 : 1500;

      // Si el bot local está activo pero asignado a otra área de trabajo
      if (!isMatch) {
        updateBotState({
          status: {
            ...data,
            isReady: false,
            needsAuth: false,
            qr: null,
            statusMessage: `El bot está asignado al área de trabajo "${data.activeWorkspace}".`
          },
          isAvailable: false,
          isWorkspaceMatch: false,
          activeWorkspace: data.activeWorkspace,
          chats: []
        });
        return false;
      }
      
      // Capturar si estaba listo ANTES de actualizar el estado
      const wasReady = botState.status.isReady;
      const isReadyChanged = wasReady !== data.isReady;

      updateBotState({
        status: data,
        isAvailable: true,
        isWorkspaceMatch: true,
        activeWorkspace: data.activeWorkspace || currentWorkspace,
        // Si data.isReady es false, chats debe ser vacía SIEMPRE
        chats: data.isReady ? botState.chats : []
      });

      // Report active status to the database (heartbeat)
      if (db && currentWorkspace && isCloud) {
        const statusId = `whatsapp_bot_status:${currentWorkspace}`;
        const chatsId = `whatsapp_chats:${currentWorkspace}`;
        const shouldWrite = force || isReadyChanged || (data.isReady && Date.now() - lastHeartbeatTime > 25000);
        
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
              lastSeen: new Date().toISOString()
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
      
      // Si esta máquina estaba emitiendo heartbeats y el bot local se apagó/cerró,
      // notificar inmediatamente a la nube que el bot ya no está listo.
      if (lastHeartbeatTime > 0 && db && currentWorkspace && isCloud) {
        lastHeartbeatTime = 0;
        const statusId = `whatsapp_bot_status:${currentWorkspace}`;
        db.configs.upsert({
          id: statusId,
          workspace_id: currentWorkspace,
          type: 'whatsapp_bot_status',
          data: {
            isReady: false,
            lastSeen: new Date().toISOString()
          }
        }).catch(() => {});
      }

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
        ...(isCloud ? {} : { chats: [] })
      });
      return false;
    } finally {
      isChecking = false;
      updateBotState({ isLoading: false });
    }
  }, [localUrl, db, currentWorkspace, isCloud]);

  const loadChats = useCallback(async () => {
    const isLocalBotReady = state.isAvailable && state.isWorkspaceMatch && state.status.isReady;
    const canLoad = isLocalBotReady || (isCloud && Boolean(currentWorkspace));
    if (!canLoad) return;

    // Compartir la promesa en curso entre todas las instancias del hook para evitar llamadas concurrentes duplicadas
    if (globalInFlightLoadChatsPromise) {
      return globalInFlightLoadChatsPromise;
    }

    globalInFlightLoadChatsPromise = (async () => {
      try {
        // If the local bot is running on this device and matched, fetch from it
        if (state.isAvailable && state.isWorkspaceMatch && state.status.isReady) {
          try {
            const wsParam = currentWorkspace ? `?workspace=${encodeURIComponent(currentWorkspace)}` : '';
            const controller = new AbortController();
            // Tiempo de espera holgado (25s) para permitir que Puppeteer en el bot extraiga y procese los chats sin abortos prematuros
            const timeoutId = setTimeout(() => {
              controller.abort(new DOMException('Tiempo de espera agotado al consultar chats del bot de WhatsApp (25s)', 'TimeoutError'));
            }, 25000);

            const response = await safeBotFetch(`${apiUrl}/api/whatsapp/chats${wsParam}`, {
              signal: controller.signal,
              headers: {
                ...(currentWorkspace ? { 'x-workspace-id': currentWorkspace } : {})
              }
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const normalizedChats = Array.isArray(data) ? data.map((c: any) => ({
                ...c,
                avatarUrl: c.avatarUrl
                  ? (c.avatarUrl.startsWith('https://')
                      ? c.avatarUrl
                      : c.avatarUrl.startsWith('/') && apiUrl
                        ? `${apiUrl}${c.avatarUrl}`
                        : c.avatarUrl)
                  : null
              })) : [];
              updateBotState({ chats: normalizedChats });
              chatsConsecutiveFailures = 0;

              // Sync to database if we are in cloud workspace
              if (db && currentWorkspace && isCloud) {
                const chatsId = `whatsapp_chats:${currentWorkspace}`;
                await db.configs.upsert({
                  id: chatsId,
                  workspace_id: currentWorkspace,
                  type: 'whatsapp_bot_status',
                  data: {
                    chats: normalizedChats,
                    updatedAt: new Date().toISOString()
                  }
                }).catch(err => console.error('Error syncing chats list to DB:', err));
              }
            } else {
              chatsConsecutiveFailures++;
            }
          } catch (error: any) {
            chatsConsecutiveFailures++;
            if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
              logger.warn(`[WhatsApp] Consulta de chats cancelada o demorada: ${error?.message || 'Timeout'}`);
            } else {
              console.error('Error fetching chats from local bot:', error);
            }
          }
        } else if (isCloud && db && currentWorkspace) {
          // If we are a remote client, load from the database
          try {
            const chatsId = `whatsapp_chats:${currentWorkspace}`;
            let doc = await db.configs.findOne(chatsId).exec();

            // Si aún no ha replicado en RxDB local, consultar directamente a Supabase
            if (!doc && isSupabaseConfigured) {
              const { data: cloudRow } = await supabase
                .from('configs')
                .select('data')
                .eq('id', chatsId)
                .maybeSingle();

              if (cloudRow?.data?.chats && Array.isArray(cloudRow.data.chats)) {
                const normalizedChats = cloudRow.data.chats.map((c: any) => ({
                  ...c,
                  avatarUrl: c.avatarUrl
                    ? (c.avatarUrl.startsWith('https://')
                        ? c.avatarUrl
                        : c.avatarUrl.startsWith('/') && apiUrl
                          ? `${apiUrl}${c.avatarUrl}`
                          : c.avatarUrl)
                    : null
                }));
                updateBotState({ chats: normalizedChats });
                await db.configs.upsert({
                  id: chatsId,
                  workspace_id: currentWorkspace,
                  type: 'whatsapp_bot_status',
                  data: cloudRow.data
                }).catch(() => {});
                return;
              }
            }

            if (doc) {
              const item = doc.toJSON();
              const data = item.data || {};
              if (Array.isArray(data.chats)) {
                const normalizedChats = data.chats.map((c: any) => ({
                  ...c,
                  avatarUrl: c.avatarUrl
                    ? (c.avatarUrl.startsWith('https://')
                        ? c.avatarUrl
                        : c.avatarUrl.startsWith('/') && apiUrl
                          ? `${apiUrl}${c.avatarUrl}`
                          : c.avatarUrl)
                    : null
                }));
                updateBotState({ chats: normalizedChats });
              }
            }
          } catch (error) {
            console.error('Error loading chats from database:', error);
          }
        }
      } finally {
        globalInFlightLoadChatsPromise = null;
      }
    })();

    return globalInFlightLoadChatsPromise;
  }, [apiUrl, state.isAvailable, state.isWorkspaceMatch, state.status.isReady, isCloud, db, currentWorkspace]);

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

      const response = await safeBotFetch(`${apiUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentWorkspace ? { 'x-workspace-id': currentWorkspace } : {})
        },
        body: JSON.stringify({ 
          chatId, 
          message, 
          media: processedMedia,
          workspaceId: currentWorkspace 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error sending message');
      }
      
      return await response.json();
    } catch (error) {
      // FALLBACK: Si falla el envío directo pero estamos en la nube,
      // lo programamos para "ya mismo" (dentro de la base de datos).
      if (isCloud && db && currentWorkspace) {
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

    // Consulta inicial directa a Supabase por si la replicación aún está en curso
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data: cloudRow } = await supabase
            .from('configs')
            .select('data')
            .eq('id', statusId)
            .maybeSingle();

          if (cloudRow?.data) {
            const lastSeen = new Date(cloudRow.data.lastSeen || 0).getTime();
            const isRecent = Date.now() - lastSeen < 60000; // 60s TTL
            const active = !!cloudRow.data.isReady && isRecent;
            updateBotState({ 
              isCloudActive: active,
              conflictBotUrl: null
            });
          }
        } catch (_) {}
      })();
    }

    const sub = db.configs.findOne(statusId).$.subscribe((doc) => {
      if (doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        const lastSeen = new Date(data.lastSeen || 0).getTime();
        const isRecent = Date.now() - lastSeen < 60000; // 60s TTL
        const active = !!data.isReady && isRecent;
        updateBotState({ 
          isCloudActive: active,
          conflictBotUrl: null
        });
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  // 2. Re-verificar la expiración del TTL cada 15 segundos
  useEffect(() => {
    if (!db || !currentWorkspace || !isCloud) return;

    const timer = setInterval(async () => {
      const statusId = `whatsapp_bot_status:${currentWorkspace}`;
      const doc = await db.configs.findOne(statusId).exec();
      if (doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        const lastSeen = new Date(data.lastSeen || 0).getTime();
        const isRecent = Date.now() - lastSeen < 60000; // 60s TTL
        const active = !!data.isReady && isRecent;
        updateBotState({ 
          isCloudActive: active,
          conflictBotUrl: null
        });
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [db, currentWorkspace, isCloud]);

  // 3. Suscribirse a los chats del bot en la base de datos (para clientes en la nube)
  useEffect(() => {
    if (!db || !currentWorkspace || !isCloud) return;

    const chatsId = `whatsapp_chats:${currentWorkspace}`;
    const sub = db.configs.findOne(chatsId).$.subscribe((doc) => {
      // Si el bot local está respondiendo en esta máquina y coincide el área, la fuente de verdad es estrictamente local:
      if (botState.isAvailable && botState.isWorkspaceMatch) {
        if (!botState.status.isReady) {
          updateBotState({ chats: [] });
        }
        return;
      }

      // Si es un cliente puramente remoto (nube):
      if (doc) {
        const item = doc.toJSON();
        const data = item.data || {};
        if (Array.isArray(data.chats) && data.chats.length > 0) {
          const normalizedChats = data.chats.map((c: any) => ({
            ...c,
            avatarUrl: c.avatarUrl
              ? (c.avatarUrl.startsWith('https://')
                  ? c.avatarUrl
                  : c.avatarUrl.startsWith('/') && apiUrl
                    ? `${apiUrl}${c.avatarUrl}`
                    : c.avatarUrl)
              : null
          }));
          updateBotState({ chats: normalizedChats });
          return;
        } else if (Array.isArray(data.chats)) {
          updateBotState({ chats: [] });
        }
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud, apiUrl]);

  // Manejo de cambio de área de trabajo en el dispositivo principal
  const previousWorkspaceRef = useRef<string>(currentWorkspace);

  useEffect(() => {
    const prev = previousWorkspaceRef.current;
    if (prev && prev !== currentWorkspace) {
      previousWorkspaceRef.current = currentWorkspace;
      globalHasAutoLoadedChats = false;
      chatsConsecutiveFailures = 0;

      logger.info(`[WhatsApp] Cambio de área de trabajo: de "${prev}" a "${currentWorkspace}"`);

      // Si este cliente tenía el bot local activo:
      if (botState.isAvailable) {
        // 1. Limpiar heartbeat y chats del área de trabajo anterior en DB
        if (db && isCloud) {
          const oldStatusId = `whatsapp_bot_status:${prev}`;
          const oldChatsId = `whatsapp_chats:${prev}`;
          db.configs.upsert({
            id: oldStatusId,
            workspace_id: prev,
            type: 'whatsapp_bot_status',
            data: {
              isReady: false,
              lastSeen: new Date().toISOString()
            }
          }).catch(err => console.error('Error desvinculando estado anterior:', err));

          db.configs.upsert({
            id: oldChatsId,
            workspace_id: prev,
            type: 'whatsapp_bot_status',
            data: {
              chats: [],
              updatedAt: new Date().toISOString()
            }
          }).catch(err => console.error('Error limpiando chats anteriores:', err));
        }

        // 2. Limpiar chats en memoria de la UI
        updateBotState({ chats: [] });

        // 3. Vincular el bot local a la nueva área de trabajo
        safeBotFetch(`${apiUrl}/api/whatsapp/workspace`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace: currentWorkspace })
        }).then(() => {
          checkStatus(true);
        }).catch(err => console.error('Error cambiando workspace en bot:', err));
      } else {
        updateBotState({ chats: [] });
        checkStatus(true);
      }
    } else {
      previousWorkspaceRef.current = currentWorkspace;
    }
  }, [currentWorkspace, localUrl, db, isCloud, checkStatus]);

  // Cargar chats automáticamente una vez cuando el bot esté listo localmente o si estamos en la nube
  useEffect(() => {
    const isBotReady = (state.isAvailable && state.isWorkspaceMatch && state.status.isReady) || (isCloud && Boolean(currentWorkspace));
    if (!isBotReady) {
      globalHasAutoLoadedChats = false;
      return;
    }

    const now = Date.now();
    // Backoff si hubo fallos consecutivos (mínimo 20s, hasta 60s) para prevenir bucles de reintentos rápidos
    const backoffDelay = chatsConsecutiveFailures > 0 
      ? Math.min(20000 * Math.pow(1.5, chatsConsecutiveFailures - 1), 60000)
      : 3000;

    if (state.chats.length === 0 && !globalHasAutoLoadedChats && !globalInFlightLoadChatsPromise && (now - lastChatsLoadAttemptTime > backoffDelay)) {
      globalHasAutoLoadedChats = true;
      lastChatsLoadAttemptTime = now;
      loadChats().catch(() => {});
    }
  }, [state.isAvailable, state.isWorkspaceMatch, state.status.isReady, isCloud, currentWorkspace, state.chats.length, loadChats]);

  const claimWorkspace = useCallback(async (targetWorkspace?: string) => {
    const ws = targetWorkspace || currentWorkspace;
    if (!ws || !localUrl) return;
    try {
      const prevWs = botState.activeWorkspace;
      if (prevWs && prevWs !== ws && db && isCloud) {
        const oldStatusId = `whatsapp_bot_status:${prevWs}`;
        const oldChatsId = `whatsapp_chats:${prevWs}`;
        await Promise.all([
          db.configs.upsert({
            id: oldStatusId,
            workspace_id: prevWs,
            type: 'whatsapp_bot_status',
            data: { isReady: false, lastSeen: new Date().toISOString() }
          }).catch(() => {}),
          db.configs.upsert({
            id: oldChatsId,
            workspace_id: prevWs,
            type: 'whatsapp_bot_status',
            data: { chats: [], updatedAt: new Date().toISOString() }
          }).catch(() => {})
        ]);
      }

      const res = await safeBotFetch(`${apiUrl}/api/whatsapp/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: ws })
      });
      if (res.ok) {
        globalHasAutoLoadedChats = false;
        chatsConsecutiveFailures = 0;
        updateBotState({ chats: [] });
        await checkStatus(true);
        await loadChats();
      }
    } catch (e) {
      console.error('Error al reclamar área de trabajo en bot:', e);
    }
  }, [currentWorkspace, localUrl, db, isCloud, checkStatus, loadChats]);

  const logout = useCallback(async () => {
    try {
      globalHasAutoLoadedChats = false;
      chatsConsecutiveFailures = 0;
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
            data: { isReady: false, lastSeen: new Date().toISOString() }
          }).catch(() => {}),
          db.configs.upsert({
            id: chatsId,
            workspace_id: currentWorkspace,
            type: 'whatsapp_bot_status',
            data: { chats: [], updatedAt: new Date().toISOString() }
          }).catch(() => {})
        ]);
      }

      // Descartar mensajes programados vencidos localmente
      if (db && currentWorkspace) {
        try {
          const now = new Date();
          const pendingDocs = await db.scheduled_messages.find({
            selector: {
              workspace_id: currentWorkspace,
              status: 'pending'
            }
          }).exec();
          for (const doc of pendingDocs) {
            if (new Date(doc.scheduledTime) <= now) {
              await doc.incrementalPatch({
                status: 'failed',
                error: 'Descartado: Mensaje vencido al cerrar sesión'
              });
            }
          }
        } catch (_) {}
      }

      await safeBotFetch(`${apiUrl}/api/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});

      setTimeout(() => checkStatus(true), 1200);
    } catch (e) {
      console.error('Error during logout:', e);
    }
  }, [localUrl, db, currentWorkspace, isCloud, checkStatus]);

  const restartBot = useCallback(async () => {
    try {
      globalHasAutoLoadedChats = false;
      chatsConsecutiveFailures = 0;
      updateBotState({
        status: { isReady: false, needsAuth: false, qr: null, statusMessage: 'Reiniciando cliente...' },
        chats: []
      });

      await safeBotFetch(`${apiUrl}/api/whatsapp/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentWorkspace ? { 'x-workspace-id': currentWorkspace } : {})
        }
      });

      setTimeout(() => checkStatus(true), 1500);
      return true;
    } catch (e) {
      console.error('Error during restartBot:', e);
      return false;
    }
  }, [apiUrl, currentWorkspace, checkStatus]);

  const fetchChatMessages = useCallback(async (chatId: string, limit: number = 50): Promise<WhatsAppMessage[]> => {
    try {
      const wsParam = currentWorkspace ? `&workspace=${encodeURIComponent(currentWorkspace)}` : '';
      const response = await safeBotFetch(`${apiUrl}/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}${wsParam}`, {
        headers: {
          ...(currentWorkspace ? { 'x-workspace-id': currentWorkspace } : {})
        }
      });
      if (!response.ok) return [];
      const data: WhatsAppMessage[] = await response.json();
      return data.map(m => ({
        ...m,
        mediaUrl: m.mediaUrl ? (apiUrl ? `${apiUrl}${m.mediaUrl}` : m.mediaUrl) : null,
        quotedMsg: m.quotedMsg ? {
          ...m.quotedMsg,
          mediaUrl: m.quotedMsg.mediaUrl ? (apiUrl ? `${apiUrl}${m.quotedMsg.mediaUrl}` : m.quotedMsg.mediaUrl) : null
        } : null
      }));
    } catch (e) {
      console.warn('Error fetching chat messages:', e);
      return [];
    }
  }, [apiUrl, currentWorkspace]);

  const finalAvailable = (state.isAvailable && state.isWorkspaceMatch) || (state.isCloudActive && isCloud);
  const finalStatus = (state.isAvailable && state.isWorkspaceMatch)
    ? state.status
    : (state.isCloudActive && isCloud)
      ? { isReady: true, needsAuth: false, qr: null, statusMessage: 'Disponible en la Nube', activeWorkspace: currentWorkspace, isWorkspaceMatch: true }
      : state.status;

  return useMemo(() => ({
    isAvailable: finalAvailable,
    isLoading: state.isLoading,
    status: finalStatus,
    chats: state.chats,
    checkStatus,
    loadChats,
    fetchChatMessages,
    sendMessage,
    logout,
    restartBot,
    claimWorkspace,
    localUrl,
    isCloudActive: state.isCloudActive,
    conflictBotUrl: state.conflictBotUrl,
    activeWorkspace: state.activeWorkspace,
    isWorkspaceMatch: state.isWorkspaceMatch
  }), [
    finalAvailable,
    state.isLoading,
    finalStatus,
    state.chats,
    checkStatus,
    loadChats,
    fetchChatMessages,
    sendMessage,
    logout,
    restartBot,
    claimWorkspace,
    localUrl,
    state.isCloudActive,
    state.conflictBotUrl,
    state.activeWorkspace,
    state.isWorkspaceMatch
  ]);
}
