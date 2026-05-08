'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MinutasDatabase, getDatabase, removeRxDatabase, getRxStorageDexie } from './db';
import { startWorkspaceReplication } from './replication';
import { logger } from '../logger';
import { DatabaseContext } from './db-context';

import { LoadingScreen } from '@/components/common/loading-screen';
import { useAuth } from '@/hooks/use-auth';
import { useCloudWorkspaces } from '@/hooks/use-cloud-workspaces';

interface DatabaseProviderProps {
  children: React.ReactNode;
  setupMode?: boolean;
}

const STORAGE_KEY_ACTIVE = 'active-workspace';
const STORAGE_KEY_LIST = 'workspaces-list';
const DEFAULT_WORKSPACE = 'minutasdb';

export function DatabaseProvider({ children, setupMode = false }: DatabaseProviderProps) {
  const [db, setDb] = useState<MinutasDatabase | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<string>(DEFAULT_WORKSPACE);
  const [workspaces, setWorkspaces] = useState<string[]>([DEFAULT_WORKSPACE]);
  const [cloudWorkspaces, setCloudWorkspaces] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const replicationRef = React.useRef<any>(null);

  const { user, isAuthenticated } = useAuth();
  const { fetchCloudWorkspaces } = useCloudWorkspaces();
  
  const isCloud = cloudWorkspaces.some(ws => ws.id === currentWorkspace);

  // Load initial workspace list and active choice
  useEffect(() => {
    const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    const savedList = localStorage.getItem(STORAGE_KEY_LIST);
    
    if (savedActive) setCurrentWorkspace(savedActive);
    if (savedList) {
      try {
        const localList = JSON.parse(savedList);
        setWorkspaces(localList);
      } catch (e) {
        console.error('Failed to parse workspaces list', e);
      }
    }
  }, []);

  // Fetch and sync cloud workspaces
  useEffect(() => {
    async function syncCloud() {
      if (!isAuthenticated || !user) {
        setCloudWorkspaces([]);
        return;
      }
      
      const cloudList = await fetchCloudWorkspaces();
      setCloudWorkspaces(cloudList);
      
      // Add cloud IDs to the overall list if not present
      const cloudIds = cloudList.map(ws => ws.id);
      setWorkspaces(prev => {
        const combined = Array.from(new Set([...prev, ...cloudIds]));
        localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(combined));
        return combined;
      });
    }
    
    syncCloud();
  }, [isAuthenticated, user, fetchCloudWorkspaces]);

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
        const database = await getDatabase();
        
        if (mounted) {
          await migrateData(database);
          // Small delay for initial splash feel (skip in setup mode)
          if (!setupMode) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
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

  // NEW: Content Replication Logic
  useEffect(() => {
    if (!db || !currentWorkspace || currentWorkspace === DEFAULT_WORKSPACE || isCloud) {
      if (replicationRef.current) {
        replicationRef.current.cancel();
        replicationRef.current = null;
      }
      return;
    }

    let cancelled = false;
    async function initReplication() {
      if (!db) return;
      
      // Cancel previous if exists
      if (replicationRef.current) {
        replicationRef.current.cancel();
      }

      logger.info(`Starting cloud replication for content in workspace: ${currentWorkspace}`);
      const replication = await startWorkspaceReplication(db, currentWorkspace);
      
      if (!cancelled) {
        replicationRef.current = replication;
      } else if (replication) {
        replication.cancel();
      }
    }

    initReplication();

    return () => {
      cancelled = true;
      if (replicationRef.current) {
        replicationRef.current.cancel();
        replicationRef.current = null;
      }
    };
  }, [db, currentWorkspace, isCloud]);

  const switchWorkspace = async (name: string) => {
    if (name === currentWorkspace) return;
    
    setIsSwitching(true);
    
    // Aesthetic delay for the transition
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setCurrentWorkspace(name);
    localStorage.setItem(STORAGE_KEY_ACTIVE, name);
    
    // Ensure name is in list
    if (!workspaces.includes(name)) {
      const newList = [...workspaces, name];
      setWorkspaces(newList);
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(newList));
    }
    
    // Keep overlay a bit longer to hide re-rendering
    await new Promise(resolve => setTimeout(resolve, 400));
    setIsSwitching(false);
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

  const exportWorkspace = async (name: string) => {
    if (!db) return;
    try {
      const exportData: any = {
        metadata: {
          workspace_id: name,
          exportDate: new Date().toISOString(),
          app: 'PC Reportes',
          version: '1.0'
        },
        collections: {}
      };

      const collectionNames = Object.keys(db.collections);
      for (const colName of collectionNames) {
        const docs = await (db.collections as any)[colName].find({
          selector: { workspace_id: name }
        }).exec();
        exportData.collections[colName] = docs.map((d: any) => d.toJSON());
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `minutas-backup-${name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logger.info(`Workspace [${name}] exported successfully`);
    } catch (err) {
      logger.error(`Failed to export workspace [${name}]`, err);
      alert('Error al exportar el área de trabajo: ' + (err as Error).message);
    }
  };

  const importWorkspace = async (file: File) => {
    if (!db) return;
    setIsSwitching(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.metadata || !importData.collections) {
        throw new Error('Formato de archivo de respaldo inválido.');
      }

      const workspace_id = importData.metadata.workspace_id;
      
      // 1. Ensure workspace is in the list
      if (!workspaces.includes(workspace_id)) {
        const newList = [...workspaces, workspace_id];
        setWorkspaces(newList);
        localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(newList));
      }

      // 2. Import data to collections
      const idMapping: Record<string, string> = {};
      const collectionEntries = Object.entries(importData.collections);

      // Sort collections: process templates first to build remapping table
      collectionEntries.sort(([a], [b]) => (a === 'templates' ? -1 : b === 'templates' ? 1 : 0));

      for (const [colName, docs] of collectionEntries) {
        const collection = (db.collections as any)[colName];
        if (!collection) {
          logger.warn(`Collection ${colName} not found in database during import. Skipping.`);
          continue;
        }

        for (const doc of (docs as any[])) {
          const docToUpsert = { ...doc };

          // 1. Semantic Deduplication for Templates
          if (colName === 'templates') {
            const existing = await collection.findOne({
              selector: {
                workspace_id: workspace_id,
                name: doc.name
              }
            }).exec();

            if (existing && existing.id !== doc.id) {
              logger.info(`Deduplicating template [${doc.name}]: mapping imported ${doc.id} -> existing ${existing.id}`);
              idMapping[doc.id] = existing.id;
              docToUpsert.id = existing.id;
            }
          } 
          
          // 2. Remapping for Template-Dependent Entities
          else if (colName === 'configs' && doc.type === 'template_config') {
            // Remap template_config ID and its name field (which holds the template ID)
            const mappedtemplate_id = idMapping[doc.name];
            if (mappedtemplate_id) {
              docToUpsert.id = `${workspace_id}:template_config:${mappedtemplate_id}`;
              docToUpsert.name = mappedtemplate_id;
            }
          }
          else if (colName === 'reports') {
            // Ensure reports point to the correct deduplicated template
            const mappedtemplate_id = idMapping[doc.template_id];
            if (mappedtemplate_id) {
              docToUpsert.template_id = mappedtemplate_id;
            }
          }

          // Use upsert to handle existing documents
          await collection.upsert(docToUpsert);
        }
      }

      logger.info(`Workspace [${workspace_id}] imported successfully`);
      // Use switchWorkspace to activate it immediately
      await switchWorkspace(workspace_id);
    } catch (err) {
      logger.error('Failed to import workspace', err);
      alert('Error al importar el área de trabajo: ' + (err as Error).message);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleHardReset = async () => {
    if (!confirm('¿Estás seguro? Esto borrará todos los datos locales de la aplicación.')) return;
    
    try {
      // Use the version name we know is causing issues or just a general wipe if possible
      // RxDB removeRxDatabase is very effective.
      // We don't have the DB_NAME constant here but we can try to guess or use the one from db.ts if exported.
      // For now, we'll use a more general approach or try to import it.
      // Actually, I'll just reload and hope the v2_resync logic handles it, 
      // but a "Hard Reset" should really wipe IndexedDB.
      
      // I'll export DB_NAME from db.ts too for this.
      logger.info('Performing hard reset of all local databases...');
      
      // This is a bit of a hack but effective for IndexedDB
      const dbs = await window.indexedDB.databases();
      for (const dbInfo of dbs) {
        if (dbInfo.name) window.indexedDB.deleteDatabase(dbInfo.name);
      }
      
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      alert('Error al resetear: ' + (e as Error).message);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="p-8 max-w-md bg-card border border-destructive/30 rounded-2xl text-center shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive/50" />
          
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">Sincronización Fallida</h2>
          <div className="max-h-[200px] overflow-y-auto mb-8 px-2 custom-scrollbar">
            <p className="text-xs text-muted-foreground leading-relaxed break-words text-left font-mono bg-muted/30 p-3 rounded-lg border border-border/50">
              {error.message.includes('DB9') 
                ? 'Se detectó un conflicto crítico de configuración en el almacenamiento local. Los intentos de recuperación automática han fallado.'
                : error.message}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              variant="default"
              size="lg"
              onClick={() => window.location.reload()} 
              className="w-full shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              Reintentar Conexión
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={handleHardReset} 
              className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-300"
            >
              Limpiar Todo (Hard Reset)
            </Button>
            
            <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest opacity-50">
              Usa el "Hard Reset" solo si el reintento no funciona.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!db && !setupMode) {
    return <LoadingScreen message={`Iniciando área de trabajo: ${currentWorkspace}...`} />;
  }

  return (
    <DatabaseContext.Provider value={{ 
      db, 
      currentWorkspace, 
      workspaces, 
      cloudWorkspaces,
      isCloud,
      switchWorkspace, 
      deleteWorkspace,
      createWorkspace,
      exportWorkspace,
      importWorkspace
    }}>
      {isSwitching && <LoadingScreen isOverlay message="Cambiando área de trabajo..." />}
      {children}
    </DatabaseContext.Provider>
  );
}





