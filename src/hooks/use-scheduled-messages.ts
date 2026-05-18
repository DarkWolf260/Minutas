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

      logger.info(`Message scheduled for ${scheduledTime.toISOString()}`);
      return id;
    },
    [db, currentWorkspace]
  );

  // Function to cancel/delete a scheduled message
  const cancelMessage = useCallback(
    async (id: string) => {
      if (!db) return;
      const doc = await db.configs.findOne(id).exec();
      if (doc) {
        await doc.remove();
        logger.info(`Scheduled message ${id} cancelled`);
      }
    },
    [db]
  );

  // Background worker to check and send messages
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const checkAndSendMessages = async () => {
      const now = new Date();
      
      // Filter pending messages that are due
      const dueMessages = scheduledMessages.filter((msg) => {
        return msg.status === 'pending' && new Date(msg.scheduledTime) <= now;
      });

      for (const msg of dueMessages) {
        logger.info(`Sending scheduled message ${msg.id}...`);
        
        try {
          const response = await fetch(`${localUrl}/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: msg.chatId, message: msg.message }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
          }

          // Update status to sent
          const doc = await db.configs.findOne(msg.id).exec();
          if (doc) {
            await doc.incrementalPatch({
              data: { ...msg, status: 'sent' }
            });
          }
          logger.info(`Scheduled message ${msg.id} sent successfully.`);
        } catch (error) {
          logger.error(`Failed to send scheduled message ${msg.id}`, error);
          
          // Update status to failed
          const doc = await db.configs.findOne(msg.id).exec();
          if (doc) {
            await doc.incrementalPatch({
              data: { ...msg, status: 'failed', error: (error as Error).message }
            });
          }
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAndSendMessages, 30000);
    
    // Also run immediately on mount or when messages change
    checkAndSendMessages();

    return () => clearInterval(interval);
  }, [db, currentWorkspace, scheduledMessages, localUrl]);

  return {
    scheduledMessages,
    isLoading,
    scheduleMessage,
    cancelMessage,
  };
}
