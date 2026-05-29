import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { useSettings } from '@/hooks/use-settings';
import { DbKeys } from '@/lib/repositories/keys';
import { logger } from '@/lib/logger';

export interface ScheduledMessage {
  id: string;
  chatId: string;
  message: string;
  title: string;
  scheduledTime: string; // ISO string
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  media?: { url: string; name?: string; description?: string }[];
}

// Module-level cache to share offline status across all instances of this hook and prevent console ERR_CONNECTION_REFUSED spam.
let globalIsOffline = false;
let lastCheckTime = 0;
let consecutiveFailures = 0;
let currentPollingInterval = 10000; // Start at 10s
let lastCheckedUrl = '';

export function useScheduledMessages() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const { settings } = useSettings();
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const deletingIds = useRef<Set<string>>(new Set());

  const localUrl = settings?.whatsapp_local_url || 'http://localhost:3001';

  // Load and watch scheduled messages
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const query = db.configs.find({
      selector: {
        type: 'scheduled_message' as any,
        workspace_id: currentWorkspace,
      },
    });

    const sub = query.$.subscribe((docs) => {
      const messages = docs.map((doc) => {
        const json = doc.toJSON();
        return {
          id: json.id,
          ...json.data,
        } as ScheduledMessage;
      });
      setScheduledMessages(messages);
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  // Function to schedule a message
  const scheduleMessage = useCallback(
    async (
      chatId: string, 
      message: string, 
      scheduledTime: Date, 
      title: string, 
      media?: { url: string; name?: string; description?: string }[]
    ) => {
      if (!db || !currentWorkspace) throw new Error('Database not initialized');

      if (scheduledTime < new Date()) {
        throw new Error('No puedes programar un mensaje para una fecha u hora en el pasado.');
      }

      const id = DbKeys.scheduledMessage(currentWorkspace, crypto.randomUUID());
      
      const data: Omit<ScheduledMessage, 'id'> = {
        chatId,
        message,
        title,
        scheduledTime: scheduledTime.toISOString(),
        status: 'pending',
        media,
      };

      await db.configs.upsert({
        id,
        workspace_id: currentWorkspace,
        type: 'scheduled_message' as any, // Cast to avoid TS error with strict types
        data,
      });

      // Enviar al backend Node para que lo programe en segundo plano
      try {
        await fetch(`${localUrl}/api/whatsapp/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id, 
            chatId, 
            message, 
            scheduledTime: data.scheduledTime, 
            title,
            media
          }),
        });
      } catch (error) {
        logger.error('Failed to schedule message in background server', error);
      }

      logger.info(`Message scheduled for ${scheduledTime.toISOString()}`);
      return id;
    },
    [db, currentWorkspace, localUrl]
  );

  // Function to cancel/delete a scheduled message
  const cancelMessage = useCallback(
    async (id: string) => {
      if (!db) return;
      
      deletingIds.current.add(id);
      
      try {
        const doc = await db.configs.findOne(id).exec();
        if (doc) {
          await doc.remove();
          logger.info(`Scheduled message ${id} cancelled locally`);
        }

        // Cancelar en el backend Node
        try {
          await fetch(`${localUrl}/api/whatsapp/schedule/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
        } catch (error) {
          logger.error(`Failed to cancel scheduled message ${id} in background server`, error);
        }
      } finally {
        deletingIds.current.delete(id);
      }
    },
    [db, localUrl]
  );

  // Background worker to sync statuses from Node bot with exponential backoff if offline
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    let timeoutId: NodeJS.Timeout;

    // Reset backoff ONLY if the URL genuinely changed (ignore transient resets to the default fallback)
    const DEFAULT_URL = 'http://localhost:3001';
    if (localUrl !== lastCheckedUrl && !(localUrl === DEFAULT_URL && lastCheckedUrl !== '')) {
      globalIsOffline = false;
      consecutiveFailures = 0;
      currentPollingInterval = 10000;
      lastCheckedUrl = localUrl;
    }

    const syncStatuses = async () => {
      const now = Date.now();

      // If offline cache is valid, skip request and reschedule to avoid console ERR_CONNECTION_REFUSED spam.
      if (globalIsOffline && now < lastCheckTime + currentPollingInterval) {
        timeoutId = setTimeout(syncStatuses, currentPollingInterval);
        return;
      }

      try {
        const response = await fetch(`${localUrl}/api/whatsapp/scheduled`);
        if (!response.ok) {
          throw new Error('Server returned non-ok status');
        }

        const serverMessages: any[] = await response.json();
        
        // Reset backoff on successful connection
        globalIsOffline = false;
        lastCheckTime = now;
        consecutiveFailures = 0;
        currentPollingInterval = 10000;

        const serverMap = new Map(serverMessages.map(m => [m.id, m]));

        // Consultar directamente a la base de datos local para tener el estado absoluto y evitar retrasos de React
        const docs = await db.configs.find({
          selector: {
            type: 'scheduled_message' as any,
            workspace_id: currentWorkspace,
          },
        }).exec();

        const currentMessages = docs.map((doc) => {
          const json = doc.toJSON();
          return {
            id: json.id,
            ...json.data,
          } as ScheduledMessage;
        });

        // Check if any local message has changed status in the backend
        // or if it's missing from the backend and needs to be pushed
        for (const msg of currentMessages) {
          if (deletingIds.current.has(msg.id)) {
            continue;
          }
          if (msg.status === 'pending') {
            const serverMsg = serverMap.get(msg.id);
            
            if (serverMsg) {
              if (serverMsg.status !== 'pending') {
                // Status changed (sent or failed), update local DB
                const doc = await db.configs.findOne(msg.id).exec();
                if (doc) {
                  await doc.incrementalPatch({
                    data: { 
                      ...msg, 
                      status: serverMsg.status, 
                      error: serverMsg.error 
                    }
                  });
                  logger.info(`Synced status for ${msg.id} to ${serverMsg.status}`);
                }
              }
            } else {
              // Message is pending locally but MISSING on the server
              // Push it to the backend!
              try {
                await fetch(`${localUrl}/api/whatsapp/schedule`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    id: msg.id, 
                    chatId: msg.chatId, 
                    message: msg.message, 
                    scheduledTime: msg.scheduledTime, 
                    title: msg.title,
                    media: msg.media
                  }),
                });
                logger.info(`Pushed missing pending message ${msg.id} to background server`);
              } catch (err) {
                logger.error(`Failed to push missing message ${msg.id} to server`, err);
              }
            }
          }
        }
      } catch (error) {
        // Increment failure count and back off exponentially to avoid flooding the console
        globalIsOffline = true;
        lastCheckTime = now;
        consecutiveFailures++;
        
        if (consecutiveFailures === 1) {
          currentPollingInterval = 30000; // 30s
        } else if (consecutiveFailures === 2) {
          currentPollingInterval = 60000; // 1m
        } else if (consecutiveFailures === 3) {
          currentPollingInterval = 120000; // 2m
        } else {
          currentPollingInterval = 300000; // 5m max
        }
        
        logger.debug(`[WhatsApp Sync] Server is offline (consecutive failures: ${consecutiveFailures}). Backing off sync to ${currentPollingInterval / 1000}s`);
      } finally {
        // Schedule next sync dynamically based on the current interval
        timeoutId = setTimeout(syncStatuses, currentPollingInterval);
      }
    };

    // Initial sync – only run immediately if offline backoff is not active
    const now = Date.now();
    if (!globalIsOffline || now >= lastCheckTime + currentPollingInterval) {
      syncStatuses();
    } else {
      // Backoff still active: schedule next sync without making a network request now
      timeoutId = setTimeout(syncStatuses, lastCheckTime + currentPollingInterval - now);
    }

    return () => clearTimeout(timeoutId);
  }, [db, currentWorkspace, localUrl]);

  return {
    scheduledMessages,
    isLoading,
    scheduleMessage,
    cancelMessage,
  };
}
