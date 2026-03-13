'use client';

import { createContext, useContext } from 'react';
import { MinutasDatabase } from './db';

export interface DatabaseContextType {
  db: MinutasDatabase | null;
  currentWorkspace: string;
  workspaces: string[];
  switchWorkspace: (name: string) => Promise<void>;
  deleteWorkspace: (name: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
}

export const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    return null;
  }
  return context.db;
}

export function useWorkspaceManager() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useWorkspaceManager must be used within a DatabaseProvider');
  }
  return {
    currentWorkspace: context.currentWorkspace,
    workspaces: context.workspaces,
    switchWorkspace: context.switchWorkspace,
    deleteWorkspace: context.deleteWorkspace,
    createWorkspace: context.createWorkspace,
  };
}
