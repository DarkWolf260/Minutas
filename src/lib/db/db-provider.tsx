'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MinutasDatabase, getDatabase } from './db';
import { logger } from '../logger';
import { DatabaseContext } from './db-context';

interface DatabaseProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY_ACTIVE = 'active-workspace';
const STORAGE_KEY_LIST = 'workspaces-list';
const DEFAULT_WORKSPACE = 'minutasdb';

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<MinutasDatabase | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<string>(DEFAULT_WORKSPACE);
  const [workspaces, setWorkspaces] = useState<string[]>([DEFAULT_WORKSPACE]);
  const [error, setError] = useState<Error | null>(null);

  // Load initial workspace list and active choice
  useEffect(() => {
    const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    const savedList = localStorage.getItem(STORAGE_KEY_LIST);
    
    if (savedActive) setCurrentWorkspace(savedActive);
    if (savedList) {
      try {
        setWorkspaces(JSON.parse(savedList));
      } catch (e) {
        console.error('Failed to parse workspaces list', e);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function migrateData(database: MinutasDatabase) {
      const hasMigrated = localStorage.getItem('rxdb-migrated-single');
      if (hasMigrated) return;

      logger.info('Performing initial multi-tenant check...');
      // Note: Data migration for existing default workspace should be handled by RxDB migration strategies
      localStorage.setItem('rxdb-migrated-single', 'true');
    }

    async function initDB() {
      try {
        if (!mounted) return;

        // Initialize central database once
        const database = await getDatabase('central_minutas');
        
        if (mounted) {
          await migrateData(database);
          setDb(database);
          logger.info(`RxDB Central instance initialized successfully`);
        }
      } catch (err) {
        logger.error(`Failed to initialize RxDB Central instance`, err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown database error'));
        }
      }
    }

    initDB();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  const switchWorkspace = async (name: string) => {
    if (name === currentWorkspace) return;
    setCurrentWorkspace(name);
    localStorage.setItem(STORAGE_KEY_ACTIVE, name);
    
    // Ensure name is in list
    if (!workspaces.includes(name)) {
      const newList = [...workspaces, name];
      setWorkspaces(newList);
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(newList));
    }
  };

  const createWorkspace = async (name: string) => {
    const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!sanitized || workspaces.includes(sanitized)) return;
    
    const newList = [...workspaces, sanitized];
    setWorkspaces(newList);
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(newList));
    await switchWorkspace(sanitized);
  };

  const deleteWorkspace = async (name: string) => {
    if (name === DEFAULT_WORKSPACE) return; // Don't delete default
    
    // Close db if active (simplified for now, RxDB will handle it)
    const newList = workspaces.filter((w: string) => w !== name);
    setWorkspaces(newList);
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(newList));
    
    if (currentWorkspace === name) {
      await switchWorkspace(DEFAULT_WORKSPACE);
    }
    
    // Physical deletion from IndexedDB would require more logic, 
    // but removing from list "hides" it and frees it for re-creation.
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 max-w-md bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Error de Base de Datos</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando área de trabajo: {currentWorkspace}...</p>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ 
      db, 
      currentWorkspace, 
      workspaces, 
      switchWorkspace, 
      deleteWorkspace,
      createWorkspace 
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}
