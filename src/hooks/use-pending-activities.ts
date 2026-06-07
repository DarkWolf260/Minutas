import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { DbKeys } from '@/lib/repositories/keys';
import { logger } from '@/lib/logger';

export type ActivityStatus = 'pending' | 'in_progress' | 'completed';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface PendingActivity {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "14:00 HLV"
  text: string;
  category: string; // category key (e.g. "guardia", "apoyo", etc)
  status: ActivityStatus;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  subtasks?: SubTask[];
}

export function usePendingActivities() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [activities, setActivities] = useState<PendingActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Watch activities
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const query = db.pending_activities.find({
      selector: {
        workspace_id: currentWorkspace,
      },
    });

    const sub = query.$.subscribe((docs) => {
      const list = docs.map((doc) => {
        const json = doc.toJSON();
        return {
          id: json.id,
          date: json.date,
          time: json.time,
          text: json.text,
          category: json.category,
          status: json.status,
          completed: !!json.completed,
          priority: json.priority || 'medium',
          subtasks: json.subtasks || [],
        } as PendingActivity;
      });
      setActivities(list);
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  // Add activity
  const addActivity = useCallback(async (
    date: string, 
    time: string, 
    text: string, 
    category: string, 
    status: ActivityStatus = 'pending',
    priority: 'low' | 'medium' | 'high' = 'medium',
    subtasks: SubTask[] = []
  ) => {
    if (!db || !currentWorkspace) throw new Error('Database not initialized');
    const id = DbKeys.pendingActivity(currentWorkspace, crypto.randomUUID());
    
    await db.pending_activities.upsert({
      id,
      workspace_id: currentWorkspace,
      date,
      time,
      text,
      category,
      status,
      completed: status === 'completed',
      priority,
      subtasks,
    });
    
    logger.info(`Activity added: ${text}`);
  }, [db, currentWorkspace]);

  // Update activity status (Kanban movement)
  const updateActivityStatus = useCallback(async (id: string, newStatus: ActivityStatus) => {
    if (!db) return;
    const doc = await db.pending_activities.findOne(id).exec();
    if (doc) {
      await doc.incrementalPatch({
        status: newStatus,
        completed: newStatus === 'completed',
      });
    }
  }, [db]);

  // Edit activity
  const editActivity = useCallback(async (
    id: string, 
    date: string, 
    time: string, 
    text: string, 
    category: string,
    status: ActivityStatus,
    priority: 'low' | 'medium' | 'high',
    subtasks: SubTask[]
  ) => {
    if (!db) return;
    const doc = await db.pending_activities.findOne(id).exec();
    if (doc) {
      await doc.incrementalPatch({
        date,
        time,
        text,
        category,
        status,
        completed: status === 'completed',
        priority,
        subtasks,
      });
    }
  }, [db]);

  // Toggle specific subtask
  const toggleSubtask = useCallback(async (activityId: string, subtaskId: string) => {
    if (!db) return;
    const doc = await db.pending_activities.findOne(activityId).exec();
    if (doc) {
      const json = doc.toJSON();
      const subtasks = (json.subtasks || []).map((sub: any) => {
        if (sub.id === subtaskId) {
          return { ...sub, completed: !sub.completed };
        }
        return sub;
      });
      await doc.incrementalPatch({
        subtasks,
      });
    }
  }, [db]);

  // Clear all completed activities
  const clearCompletedActivities = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const docs = await db.pending_activities.find({
      selector: {
        workspace_id: currentWorkspace,
        status: 'completed',
      }
    }).exec();
    
    for (const doc of docs) {
      await doc.remove();
    }
    logger.info(`Cleared ${docs.length} completed activities.`);
  }, [db, currentWorkspace]);

  // Delete activity
  const deleteActivity = useCallback(async (id: string) => {
    if (!db) return;
    const doc = await db.pending_activities.findOne(id).exec();
    if (doc) {
      await doc.remove();
      logger.info(`Activity deleted: ${id}`);
    }
  }, [db]);

  return {
    activities,
    isLoading,
    addActivity,
    updateActivityStatus,
    editActivity,
    toggleSubtask,
    clearCompletedActivities,
    deleteActivity,
  };
}
