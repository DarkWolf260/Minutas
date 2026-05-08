/**
 * RxDB Database initialization and schema definitions
 */

import { createRxDatabase, removeRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
export { removeRxDatabase };
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
export { getRxStorageDexie };
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

const DB_NAME = 'minutas';

/**
 * Internal state tracking to prevent multiple initialization attempts.
 */

// Types from our application
import {
  StaffMember,
  Report,
  Template,
  TemplateConfig,
  GuardReport,
  Department,
  AppSettings,
  StaffRole,
  Address,
  Guard,
  FieldConfig,
  ReportDraft,
  PersonnelAssignment,
} from '@/lib/types';

import {
  personnelSchema,
  reportsSchema,
  templatesSchema,
  lookupsSchema,
  configsSchema,
  historySchema,
  notificationsSchema,
} from './schemas';

import { logger } from '../logger';

// Add necessary plugins
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

// Collection Types
export type PersonnelCollection = RxCollection<StaffMember>;
export type ReportsCollection = RxCollection<Report>;
export type TemplatesCollection = RxCollection<Template>;

// Consolidated Types
export type LookupItem = {
  id: string; // type:originalId
  workspace_id: string;
  type: 'role' | 'department' | 'address';
  name?: string;
  data: any;
};

export type ConfigItem = {
  id: string; // type:originalId or just 'settings'
  workspace_id: string;
  type: 'settings' | 'unit' | 'field_definition' | 'template_config' | 'guard' | 'draft' | 'profile';
  name?: string;
  data: any;
};

export type HistoryItem = {
  id: string;
  workspace_id: string;
  type: 'guard_history' | 'attendance' | 'assignment_history';
  date: string;
  personnel_id: string;
  data: any;
};

export type LookupsCollection = RxCollection<LookupItem>;
export type ConfigsCollection = RxCollection<ConfigItem>;
export type HistoryCollection = RxCollection<HistoryItem>;

export type NotificationItem = {
  id: string;
  workspace_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  metadata?: any;
};

export type NotificationsCollection = RxCollection<NotificationItem>;

// Database Type
export type MinutasDatabaseCollections = {
  personnel: PersonnelCollection;
  reports: ReportsCollection;
  templates: TemplatesCollection;
  lookups: LookupsCollection;
  configs: ConfigsCollection;
  history: HistoryCollection;
  notifications: NotificationsCollection;
};

export type MinutasDatabase = RxDatabase<MinutasDatabaseCollections>;

/**
 * Database lifecycle management
 * 
 * IMPORTANT: RxDB free version limits collections to 16.
 * We must ensure only ONE database is active at any time.
 */

// Use globalThis to persist the singleton across HMR during development
const _global = globalThis as any;

interface RxDBInternalState {
  activeDatabase: MinutasDatabase | null;
  activeDatabaseName: string | null;
  dbPromiseChain: Promise<any>;
  isDevModePluginAdded: boolean;
  allDatabases: Map<string, any>;
  retryCount: number;
  storage: any | null;
}

const getInternalState = (): RxDBInternalState => {
  if (!_global.__rxdb_singleton) {
    _global.__rxdb_singleton = {
      activeDatabase: null,
      activeDatabaseName: null,
      dbPromiseChain: Promise.resolve(),
      isDevModePluginAdded: false,
      allDatabases: new Map<string, any>(), // name -> instance
      storage: null
    } as RxDBInternalState;
  }
  return _global.__rxdb_singleton;
};

const getStorage = () => {
  const state = getInternalState();
  if (!state.storage) {
    // IMPORTANT: For ignoreDuplicate: true to work, we MUST use the exact same storage instance
    // on subsequent calls. Reference: https://rxdb.info/rx-database.html#ignoreduplicate
    state.storage = wrappedValidateAjvStorage({
      storage: getRxStorageDexie()
    });
  }
  return state.storage;
};

const ensureDevMode = async () => {
  const state = getInternalState();
  if (state.isDevModePluginAdded) return;

  if (import.meta.env.DEV) {
    try {
      const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
      addRxPlugin(RxDBDevModePlugin);
      state.isDevModePluginAdded = true;
    } catch (err) {
      console.error('Failed to load RxDB dev-mode plugin', err);
    }
  }
};

const created_atabase = async (): Promise<MinutasDatabase> => {
  const name = DB_NAME;
  const state = getInternalState();

  // 1. Immediate check
  const existing = state.allDatabases.get(name);
  if (existing && !existing.destroyed) {
    logger.info(`Returning existing database instance (Pre-init check): [${name}]`);
    return existing;
  }

  await ensureDevMode();

  // 2. Double-check after any potential async/await context switch
  const existingAfterDev = state.allDatabases.get(name);
  if (existingAfterDev && !existingAfterDev.destroyed) {
    logger.info(`Returning existing database instance (Post-dev check): [${name}]`);
    return existingAfterDev;
  }

  logger.info(`Creating central database instance: [${name}]`);
  let database: MinutasDatabase;

  try {
    database = await createRxDatabase<MinutasDatabaseCollections>({
      name: name,
      storage: getStorage(),
      ignoreDuplicate: import.meta.env.DEV,
    });

    // 3. Register IMMEDIATELY in the global tracking
    state.allDatabases.set(name, database);
  } catch (err: any) {
    const rxErr = err as any;
    logger.error(`Failed to create RxDatabase [${name}]`, {
      message: err.message,
      code: rxErr.code,
      parameters: rxErr.parameters,
      stack: err.stack
    });
    throw err;
  }

  logger.info(`Central database [${name}] initialized successfully.`);

  try {
    const commonConflictHandler = {
      isEqual: (a: any, b: any) => {
        // Deep compare or simple fast check. Usually RxDB checks _rev or handles this,
        // but we can just say false to force resolution if not identical references
        return JSON.stringify(a) === JSON.stringify(b);
      },
      resolve: (i: any) => {
        const cleanObj = (obj: any) => {
          if (!obj) return;
          // No longer need manual mapping as fields are already snake_case
          if (obj._modified !== undefined) {
            delete obj._modified;
          }
          if (obj.updated_at !== undefined) {
            delete obj.updated_at;
          }
          if (obj.created_at !== undefined) {
            delete obj.created_at;
          }
          // Quitar valores null para que RxDB no falle en la validación de esquema
          Object.keys(obj).forEach(key => {
            if (obj[key] === null) delete obj[key];

            // Parse JSON strings back to objects if they were stringified for Supabase
            if (typeof obj[key] === 'string' && (key === 'data' || key === 'form_data' || key === 'statistics_rules' || key === 'statistics_sub_categories')) {
              try {
                const parsed = JSON.parse(obj[key]);
                if (parsed && typeof parsed === 'object') {
                  obj[key] = parsed;
                }
              } catch (e) {
                // Not JSON, ignore
              }
            }
          });
        };

        const master = i.realMasterState ? { ...i.realMasterState } : null;
        cleanObj(master);

        const local = i.newDocumentState ? { ...i.newDocumentState } : null;
        cleanObj(local);

        if (import.meta.env.DEV) {
          console.log(`[Conflict] Resolving for ${master?.id}`, { master, local });
        }

        // AGGRESSIVE LOCAL WINS
        // We take everything from local, but we MUST keep the cloud's 'modified'
        // timestamp exactly as it came to pass the optimistic lock check.
        const resolved = {
          ...local,
          modified: master?.modified || local?.modified || null
        };

        return Promise.resolve(resolved);
      }
    };



    const collectionsConfig: Record<string, any> = {
      personnel: {
        schema: personnelSchema,
        conflictHandler: commonConflictHandler,
      },
      reports: {
        schema: reportsSchema,
        conflictHandler: commonConflictHandler,
      },
      templates: {
        schema: templatesSchema,
        conflictHandler: commonConflictHandler,
      },
      lookups: {
        schema: lookupsSchema,
        conflictHandler: commonConflictHandler,
      },
      configs: {
        schema: configsSchema,
        conflictHandler: commonConflictHandler,
      },
      history: {
        schema: historySchema,
        conflictHandler: commonConflictHandler,
      },
      notifications: {
        schema: notificationsSchema,
      },
    };

    for (const [key, config] of Object.entries(collectionsConfig)) {
      try {
        await database.addCollections({ [key]: config });
      } catch (colErr: any) {
        const rxErr = colErr as any;
        logger.error(`Failed to add collection [${key}] to database [${name}]`, {
          message: colErr.message,
          code: rxErr.code,
          parameters: rxErr.parameters
        });
        throw colErr;
      }
    }

    // Ensure modified is never undefined in the local database
    Object.values(database.collections).forEach(col => {
      col.postCreate((docData: any, rxDoc: any) => {
        if (docData.modified === undefined) {
          rxDoc.incrementalPatch({ modified: null });
        }
      });
    });

  } catch (err: any) {
    const rxErr = err as any;
    logger.error(`Failed to initialize collections for database [${name}]. Cleaning up...`, {
      message: err.message,
      code: rxErr.code,
      parameters: rxErr.parameters
    });
    await safeDestroy(database, name);
    throw err;
  }

  return database;
};


/**
 * Helper to safely destroy a database instance and remove from tracking
 */
const safeDestroy = async (db: any, name: string) => {
  if (!db || db.destroyed) {
    if (db) getInternalState().allDatabases.delete(name);
    return;
  }
  const state = getInternalState();

  try {
    if (typeof db.destroy === 'function') {
      logger.info(`Destroying database [${name}] to free up collection slots...`);
      await db.destroy();
      logger.info(`Database [${name}] destroyed successfully.`);
    }
  } catch (err) {
    logger.error(`Error destroying database [${name}]:`, err);
  } finally {
    state.allDatabases.delete(name);
  }
};

/**
 * Serialized getter for the database.
 */
export const getDatabase = async (workspaceName: string = 'minutasdb'): Promise<MinutasDatabase> => {
  logger.info('--- DB v2_resync Initializing ---');
  const state = getInternalState();
  const dbName = DB_NAME;

  // Use a promise chain that catches errors to prevent the entire chain from breaking
  state.dbPromiseChain = state.dbPromiseChain.catch(() => { }).then(async () => {
    // Check if what we want is already active
    if (state.activeDatabase && !(state.activeDatabase as any).destroyed) {
      return state.activeDatabase;
    }

    // AGGRESSIVE CLEANUP: Close ALL databases in the tracking map except the central one if it exists
    const trackedDbs = Array.from(state.allDatabases.entries());
    for (const [name, dbInstance] of (trackedDbs as any)) {
      if (name !== dbName) {
        await safeDestroy(dbInstance, name);
      }
    }

    // Safety delay to allow internal RxDB collection registry to update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Explicitly reset active state
    state.activeDatabase = null;
    state.activeDatabaseName = null;

    // Initialize the central database
    try {
      const db = await created_atabase();
      state.activeDatabase = db;
      state.activeDatabaseName = dbName;
      return db;
    } catch (err: any) {
      // Re-throw so the caller knows it failed
      throw err;
    }
  });

  return state.dbPromiseChain;
};

/**
 * Explicitly close the database
 */
export const closeDatabase = async () => {
  const state = getInternalState();
  state.dbPromiseChain = state.dbPromiseChain.catch(() => { }).then(async () => {
    const trackedDbs = Array.from(state.allDatabases.entries());
    for (const [dbName, dbInstance] of (trackedDbs as any)) {
      await safeDestroy(dbInstance, dbName);
    }
    state.activeDatabase = null;
    state.activeDatabaseName = null;
  });
  return state.dbPromiseChain;
};





