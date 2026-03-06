/**
 * RxDB Database Provider
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MinutasDatabase, getDatabase } from './db';
import { logger } from '../logger';

const DatabaseContext = createContext<MinutasDatabase | null>(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    // We don't throw here to allow hooks to be called before DB is ready,
    // but they should handle the null state.
    return null;
  }
  return context;
};

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<MinutasDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function migrateData(database: MinutasDatabase) {
      const hasMigrated = localStorage.getItem('rxdb-migrated');
      if (hasMigrated) return;

      logger.info('Starting data migration to RxDB...');

      const collections = [
        { key: 'app-personnel', col: database.personnel },
        { key: 'app-reports', col: database.reports },
        { key: 'app-templates', col: database.templates },
        { key: 'app-guard-history', col: database.guard_history },
        { key: 'app-attendance', col: database.attendance },
        { key: 'app-departments', col: database.departments },
        { key: 'app-staff-roles', col: database.roles },
        { key: 'app-addresses', col: database.addresses },
        { key: 'app-guards', col: database.guards },
      ];

      for (const { key, col } of collections) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await col.bulkInsert(parsed);
            }
          } catch (err) {
            logger.error(`Migration failed for ${key}`, err);
          }
        }
      }

      // Specialized migrations

      // Settings
      const settingsData = localStorage.getItem('app-settings');
      if (settingsData) {
        try {
          const parsed = JSON.parse(settingsData);
          await database.settings.insert({ ...parsed, id: 'app-settings' });
        } catch (err) {
          logger.error('Settings migration failed', err);
        }
      }

      // Units (string[] -> {name}[])
      const unitsData = localStorage.getItem('app-units');
      if (unitsData) {
        try {
          const parsed = JSON.parse(unitsData);
          if (Array.isArray(parsed)) {
            await database.units.bulkInsert(parsed.map((u) => ({ name: u })));
          }
        } catch (err) {
          logger.error('Units migration failed', err);
        }
      }

      // Field Definitions (Record -> {id, config}[])
      const fieldsData = localStorage.getItem('app-global-field-configs');
      if (fieldsData) {
        try {
          const parsed = JSON.parse(fieldsData);
          const entries = Object.entries(parsed).map(([id, config]) => ({
            id,
            config: config as any,
          }));
          if (entries.length > 0) {
            await database.field_definitions.bulkInsert(entries);
          }
        } catch (err) {
          logger.error('Field definitions migration failed', err);
        }
      }

      // Drafts
      const draftData = localStorage.getItem('app-report-draft');
      if (draftData) {
        try {
          const parsed = JSON.parse(draftData);
          if (parsed) {
            await database.drafts.insert({ ...parsed, id: 'current' });
          }
        } catch (err) {
          logger.error('Draft migration failed', err);
        }
      }

      // Template Configs (Record -> {id, config}[])
      const templateConfigsData = localStorage.getItem('app-template-configs');
      if (templateConfigsData) {
        try {
          const parsed = JSON.parse(templateConfigsData);
          const entries = Object.entries(parsed).map(([id, config]) => ({
            id,
            config: config as any,
          }));
          if (entries.length > 0) {
            await database.template_configs.bulkInsert(entries);
          }
        } catch (err) {
          logger.error('Template configs migration failed', err);
        }
      }

      localStorage.setItem('rxdb-migrated', 'true');
      logger.info('Migration completed successfully');
    }

    async function initDB() {
      try {
        const database = await getDatabase();
        if (mounted) {
          await migrateData(database);
          setDb(database);
          logger.info('RxDB initialized successfully');
        }
      } catch (err) {
        logger.error('Failed to initialize RxDB', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown database error'));
        }
      }
    }

    initDB();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 max-w-md bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Error de Base de Datos</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Inicializando base de datos...</p>
        </div>
      </div>
    );
  }

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}
