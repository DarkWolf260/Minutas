import { useState, useEffect, useCallback } from 'react';
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
}

export function useScheduledMessages() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const { settings } = useSettings();
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    async (chatId: string, message: string, scheduledTime: Date, title: string) => {
      if (!db || !currentWorkspace) throw new Error('Database not initialized');

      const id = DbKeys.scheduledMessage(currentWorkspace, crypto.randomUUID());
      
      const data: Omit<ScheduledMessage, 'id'> = {
        chatId,
        message,
        title,
        scheduledTime: scheduledTime.toISOString(),
        status: 'pending',
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
            title 
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
      
      // Cancelar en el backend Node
      try {
        await fetch(`${localUrl}/api/whatsapp/schedule/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        logger.error(`Failed to cancel scheduled message ${id} in background server`, error);
      }

      const doc = await db.configs.findOne(id).exec();
      if (doc) {
        await doc.remove();
        logger.info(`Scheduled message ${id} cancelled`);
      }
    },
    [db, localUrl]
  );

  // Background worker to sync statuses from Node bot
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const syncStatuses = async () => {
      try {
        const response = await fetch(`${localUrl}/api/whatsapp/scheduled`);
        if (!response.ok) return;

        const serverMessages: any[] = await response.json();
        const serverMap = new Map(serverMessages.map(m => [m.id, m]));

        // Check if any local message has changed status in the backend
        // or if it's missing from the backend and needs to be pushed
        for (const msg of scheduledMessages) {
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
              // This happens if it was scheduled before the backend update,
              // or if the server restarted and lost its JSON file.
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
                    title: msg.title 
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
        // Silently fail if bot is offline
      }
    };

    // Check every 10 seconds to sync statuses quickly
    const interval = setInterval(syncStatuses, 10000);
    
    // Initial sync
    syncStatuses();

    return () => clearInterval(interval);
  }, [db, currentWorkspace, scheduledMessages, localUrl]);

  return {
    scheduledMessages,
    isLoading,
    scheduleMessage,
    cancelMessage,
  };
}
