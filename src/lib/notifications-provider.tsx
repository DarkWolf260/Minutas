'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useDatabase, useWorkspaceManager } from './db/db-context';
import { NotificationItem } from './db/db';
import { logger } from './logger';
import { toast } from 'sonner';

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'workspace_id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to notifications for the current workspace
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    setIsLoading(true);
    const sub = db.notifications
      .find({
        selector: {
          workspace_id: currentWorkspace,
        },
        sort: [{ timestamp: 'desc' }],
      })
      .$.subscribe((docs) => {
        const items = docs.map((d) => d.toJSON());
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
        setIsLoading(false);
      });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const addNotification = useCallback(
    async (notification: Omit<NotificationItem, 'id' | 'workspace_id' | 'timestamp' | 'read'>) => {
      if (!db || !currentWorkspace) return;

      try {
        const newNotification: NotificationItem = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
          workspace_id: currentWorkspace,
          timestamp: new Date().toISOString(),
          read: false,
        };

        await db.notifications.insert(newNotification);
        
        // Also show a toast for high priority ones or just to be helpful
        if (notification.type === 'error' || notification.type === 'warning') {
          toast[notification.type](notification.title, {
            description: notification.message
          });
        }
      } catch (error) {
        logger.error('Failed to add notification', error);
      }
    },
    [db, currentWorkspace]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        const doc = await db.notifications.findOne(id).exec();
        if (doc) {
          await doc.patch({ read: true });
        }
      } catch (error) {
        logger.error('Failed to mark notification as read', error);
      }
    },
    [db]
  );

  const markAllAsRead = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const unreadDocs = await db.notifications
        .find({
          selector: {
            workspace_id: currentWorkspace,
            read: false,
          },
        })
        .exec();

      if (unreadDocs.length > 0) {
        await Promise.all(unreadDocs.map((doc) => doc.patch({ read: true })));
      }
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error);
    }
  }, [db, currentWorkspace]);

  const clearAll = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.notifications
        .find({
          selector: {
            workspace_id: currentWorkspace,
          },
        })
        .exec();

      if (allDocs.length > 0) {
        await db.notifications.bulkRemove(allDocs.map((doc) => doc.primary));
      }
    } catch (error) {
      logger.error('Failed to clear notifications', error);
    }
  }, [db, currentWorkspace]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        isLoading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}


