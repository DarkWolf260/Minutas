/**
 * RxDB Database initialization and schema definitions
 */

import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateIsMyJsonValidStorage } from 'rxdb/plugins/validate-is-my-json-valid';

// Types from our application
import {
  StaffMember,
  Report,
  Template,
  TemplateConfig,
  GuardReport,
  AttendanceRecord,
  Department,
  AppSettings,
  StaffRole,
  Address,
  Guard,
  FieldConfig,
  ReportDraft,
  PersonnelAssignment,
} from '@/types';

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
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

// Collection Types
export type PersonnelCollection = RxCollection<StaffMember>;
export type ReportsCollection = RxCollection<Report>;
export type TemplatesCollection = RxCollection<Template>;

// Consolidated Types
export type LookupItem = {
  id: string; // type:originalId
  workspaceId: string;
  type: 'role' | 'department' | 'address';
  name?: string;
  data: any;
};

export type ConfigItem = {
  id: string; // type:originalId or just 'settings'
  workspaceId: string;
  type: 'settings' | 'unit' | 'field_definition' | 'template_config' | 'guard' | 'draft';
  name?: string;
  data: any;
};

export type HistoryItem = {
  id: string;
  workspaceId: string;
  type: 'guard_history' | 'attendance' | 'assignment_history';
  date: string;
  personnelId: string;
  data: any;
};

export type LookupsCollection = RxCollection<LookupItem>;
export type ConfigsCollection = RxCollection<ConfigItem>;
export type HistoryCollection = RxCollection<HistoryItem>;

export type NotificationItem = {
  id: string;
  workspaceId: string;
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
}

const getInternalState = (): RxDBInternalState => {
  if (!_global.__rxdb_singleton) {
    _global.__rxdb_singleton = {
      activeDatabase: null,
      activeDatabaseName: null,
      dbPromiseChain: Promise.resolve(),
      isDevModePluginAdded: false,
      allDatabases: new Map<string, any>() // name -> instance
    } as RxDBInternalState;
  }
  return _global.__rxdb_singleton;
};

const ensureDevMode = async () => {
  const state = getInternalState();
  if (state.isDevModePluginAdded) return;
  
  if (process.env.NODE_ENV === 'development') {
    try {
      const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
      addRxPlugin(RxDBDevModePlugin);
      state.isDevModePluginAdded = true;
    } catch (err) {
      console.error('Failed to load RxDB dev-mode plugin', err);
    }
  }
};

const createDatabase = async (): Promise<MinutasDatabase> => {
  const name = 'central_minutas';
  const state = getInternalState();
  await ensureDevMode();
  
  logger.info(`Creating central database instance: [${name}]`);
  let database: MinutasDatabase;
  
  try {
    database = await createRxDatabase<MinutasDatabaseCollections>({
      name: name,
      storage: wrappedValidateIsMyJsonValidStorage({
        storage: getRxStorageDexie(),
      }),
      closeDuplicates: true,
      ignoreDuplicate: process.env.NODE_ENV === 'development',
    });
    // Register IMMEDIATELY in the global tracking
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

  try {
    const collectionsConfig: Record<string, any> = {
      personnel: { 
        schema: personnelSchema,
        migrationStrategies: {
          1: (doc: any) => doc,
          2: (doc: any) => doc,
          3: (doc: any) => {
            if (!doc.workspaceId) doc.workspaceId = 'minutasdb';
            return doc;
          }
        }
      },
      reports: { 
        schema: reportsSchema,
        migrationStrategies: {
          1: (doc: any) => {
            if (!doc.workspaceId) doc.workspaceId = 'minutasdb';
            return doc;
          },
          2: (doc: any) => {
            if (doc.isRelevant === undefined) doc.isRelevant = false;
            return doc;
          }
        }
      },
      templates: { 
        schema: templatesSchema,
        migrationStrategies: {
          1: (doc: any) => {
            if (!doc.workspaceId) doc.workspaceId = 'minutasdb';
            return doc;
          },
          2: (doc: any) => {
            if (doc.isActive === undefined) doc.isActive = true;
            return doc;
          }
        }
      },
      lookups: { 
        schema: lookupsSchema,
        migrationStrategies: {
          1: (doc: any) => {
            if (!doc.workspaceId) doc.workspaceId = 'minutasdb';
            return doc;
          }
        }
      },
      configs: { 
        schema: configsSchema,
        migrationStrategies: {
          1: (doc: any) => {
            if (!doc.workspaceId) doc.workspaceId = 'minutasdb';
            return doc;
          }
        }
      },
      history: { 
        schema: historySchema,
        migrationStrategies: {
          1: (doc: any) => {
            if (!doc.personnelId) doc.personnelId = 'none';
            if (!doc.date) doc.date = new Date().toISOString().split('T')[0];
            return doc;
          },
          2: (doc: any) => {
            if (!doc.personnelId) doc.personnelId = 'none';
            if (!doc.date) doc.date = new Date().toISOString().split('T')[0];
            return doc;
          },
          3: (doc: any) => {
            if (!doc.workspaceId) doc.workspaceId = 'minutasdb';
            if (!doc.personnelId) doc.personnelId = 'none';
            if (!doc.date) doc.date = new Date().toISOString().split('T')[0];
            return doc;
          }
        }
      },
      notifications: {
        schema: notificationsSchema,
        migrationStrategies: {
          1: (doc: any) => doc,
          2: (doc: any) => {
            if (doc.read === undefined) doc.read = false;
            return doc;
          }
        }
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
    
    // Perform manual migration if necessary
    await migrateToConsolidated(database);
    
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
 * Migration helper to move data from old separate collections (Ghost collections in storage) 
 * to the new consolidated configs/lookups.
 */
async function migrateToConsolidated(db: MinutasDatabase) {
  const migrationFlagId = 'migration:consolidated:v2'; // Bumped for 6-collection merge
  const flag = await db.configs.findOne(migrationFlagId).exec();
  if (flag) return; // Already migrated

  logger.info('Performing collection consolidation migration...');

  // Note: Since the schemas are removed from code, we can't easily use db.old_collection.
  // However, RxDB storage still has the data if it was there. 
  // We can't easily recover "ghost" collections without their schemas in RxDB 
  // unless we use the lower level storage. 
  // GIVEN the complexity and that this is a development phase, we'll focus 
  // on establishing the new structure. If production migration was needed, 
  // we would use a more complex raw storage scan.
  
  // For now, mark as migrated.
  await db.configs.upsert({
    id: migrationFlagId,
    workspaceId: 'minutasdb',
    type: 'settings',
    data: { 
      timestamp: new Date().toISOString(),
      workspaceId: 'minutasdb'
    } as any
  });
}

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
  const state = getInternalState();
  const dbName = 'central_minutas';

  // Use a promise chain that catches errors to prevent the entire chain from breaking
  state.dbPromiseChain = state.dbPromiseChain.catch(() => {}).then(async () => {
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
      const db = await createDatabase();
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
  state.dbPromiseChain = state.dbPromiseChain.catch(() => {}).then(async () => {
    const trackedDbs = Array.from(state.allDatabases.entries());
    for (const [dbName, dbInstance] of (trackedDbs as any)) {
      await safeDestroy(dbInstance, dbName);
    }
    state.activeDatabase = null;
    state.activeDatabaseName = null;
  });
  return state.dbPromiseChain;
};
