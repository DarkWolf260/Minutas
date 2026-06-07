import { replicateRxCollection } from 'rxdb/plugins/replication';
import { MinutasDatabase } from './db';
import { supabase, callWithTokenRefresh } from '../supabase';
import { logger } from '../logger';
import { stableStringify } from '../utils-pure';
import { Subject } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs';
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

// Global subject to trigger all replications at once
export const globalPullTrigger$ = new Subject<any>();

/**
 * Starts bidirectional replication for a given collection and workspace using custom handlers.
 * This replaces the default replicateSupabase plugin to gain full control over UPSERT logic
 * and solve persistent 409 Conflict loops.
 */
async function startCollectionReplication(
  db: MinutasDatabase,
  collectionName: keyof typeof db.collections,
  workspace_id: string
) {
  const collection = db.collections[collectionName];
  const tableName = String(collectionName);

  logger.info(`Starting CUSTOM replication for ${collectionName} [Workspace: ${workspace_id}]`);

  type Checkpoint = {
    modified: string | null;
    id: string;
  };

  const pullTrigger$ = new Subject<any>();

  const replicationState = replicateRxCollection<any, Checkpoint>({
    collection: collection as any,
    replicationIdentifier: `supabase-custom-v3-${collectionName}-${workspace_id}`,
    pull: {
      handler: async (lastCheckpoint: any, batchSize: number) => {
        try {
          let query = supabase
            .from(tableName)
            .select('*');

          // For templates, we pull EVERYTHING (Global Repository)
          // For others, we filter by workspace_id
          if (collectionName !== 'templates') {
            query = query.eq('workspace_id', workspace_id);
          }
          
          query = query.order('modified', { ascending: true })
            .order('id', { ascending: true })
            .limit(batchSize);

          if (lastCheckpoint && lastCheckpoint.modified) {
            query = query.gte('modified', lastCheckpoint.modified);
          }

          const { data, error } = await callWithTokenRefresh(() => query);

          if (error) {
            logger.error(`Pull error in ${collectionName}:`, error);
            throw error;
          }

          let rawDocs = data || [];
          
          // 3. Robust Filtering: Only include docs NEWER than our last checkpoint
          if (lastCheckpoint) {
            rawDocs = rawDocs.filter((d: any) => {
              const lastMod = lastCheckpoint.modified || '';
              const docMod = d.modified || '';
              
              if (docMod > lastMod) return true;
              if (docMod === lastMod && d.id > lastCheckpoint.id) return true;
              
              return false;
            });
          }

          if ((rawDocs?.length || 0) > 0) {
            logger.debug(`Pulled ${rawDocs.length} rows for ${collectionName}`);
          }
          
          // Defensive documents mapping
          const documents = (rawDocs || []).map((doc: any) => {
            if (!doc) return null;
            const cleanDoc = { ...doc };
            
            // Clean NULL values (except 'modified', 'workspace_id' for templates, and '_deleted')
            Object.keys(cleanDoc).forEach(key => {
              if (cleanDoc[key] === null && key !== 'modified' && key !== '_deleted' && (collectionName !== 'templates' || key !== 'workspace_id')) {
                delete cleanDoc[key];
              }
            });

            // Ensure '_deleted' is always a boolean and never undefined/null for RxDB
            cleanDoc._deleted = !!cleanDoc._deleted;

            // Ensure 'modified' is never undefined
            if (cleanDoc.modified === undefined) cleanDoc.modified = null;

            // Parse stringified JSON fields back to objects
            const jsonFields = ['data', 'form_data', 'sections', 'statistics_rules', 'statistics_sub_categories', 'photos', 'subtasks', 'media'];
            jsonFields.forEach(field => {
              if (typeof cleanDoc[field] === 'string') {
                try { cleanDoc[field] = JSON.parse(cleanDoc[field]); } catch (e) { }
              }
            });

            return cleanDoc;
          }).filter(Boolean);

          const lastDoc = documents.length > 0 ? documents[documents.length - 1] : null;
          const newCheckpoint = lastDoc 
            ? { modified: lastDoc.modified, id: lastDoc.id } 
            : lastCheckpoint || { modified: null, id: '' };

          // CRITICAL: Ensure return is ALWAYS valid and conforms to RxDB expectations
          return {
            documents: Array.isArray(documents) ? documents : [],
            checkpoint: newCheckpoint || (lastCheckpoint ? lastCheckpoint : { modified: null, id: '' })
          };
        } catch (err: any) {
          logger.error(`CRITICAL Exception in pull handler for ${collectionName}:`, err);
          return {
            documents: [],
            checkpoint: lastCheckpoint || { modified: null, id: '' }
          };
        }
      },
      batchSize: 50,
      stream$: globalPullTrigger$.pipe(
        debounceTime(100),
        map(() => 'RESYNC' as any) // Use official 'RESYNC' command to trigger pull handler
      )
    },
    push: {
      handler: async (rows) => {
        // 1. Prepare payloads
        const allowedColumns: Record<string, string[]> = {
          personnel: ['id', 'workspace_id', 'personnel_id', 'name', 'cedula', 'rank', 'cargo', 'titulo', 'role_id', 'status', 'department', 'sex', 'specialties', 'order', '_deleted'],
          reports: ['id', 'workspace_id', 'template_id', 'title', 'timestamp', 'content', 'is_relevant', 'status', 'form_data', 'sections', 'photos', '_deleted'],
          templates: ['id', 'workspace_id', 'name', 'content', 'description', 'type', 'is_active', 'statistics_category', 'statistics_sub_categories', 'statistics_rules', '_deleted'],
          lookups: ['id', 'workspace_id', 'type', 'name', 'data', '_deleted'],
          configs: ['id', 'workspace_id', 'type', 'name', 'data', '_deleted'],
          history: ['id', 'workspace_id', 'type', 'date', 'personnel_id', 'data', '_deleted'],
          pending_activities: ['id', 'workspace_id', 'date', 'time', 'text', 'category', 'status', 'completed', 'priority', 'subtasks', '_deleted'],
          scheduled_messages: ['id', 'workspace_id', 'chatId', 'message', 'title', 'scheduledTime', 'status', 'error', 'media', '_deleted']
        };

        const columns = allowedColumns[collectionName] || [];
        const payloads = rows
          .map(row => row.newDocumentState)
          .filter(doc => {
            if (collectionName === 'templates' && doc.workspace_id === null) return true;
            return doc.workspace_id === workspace_id;
          }) // Push records for THIS workspace or global templates
          .map(doc => {
            const payload: any = {};
            
            columns.forEach(col => {
              let value = doc[col];
              
              // Special handling for Postgres Arrays
              if (col === 'specialties' && Array.isArray(value)) {
                const escape = (str: string) => '"' + str.replace(/"/g, '\\"') + '"';
                value = `{${value.map(escape).join(',')}}`;
              }

              if (value !== undefined) {
                payload[col] = value;
              }
            });

            // CRITICAL: Explicitly ensure _deleted is handled
            if (doc._deleted === true) {
              payload._deleted = true;
            } else if (payload._deleted === undefined) {
              payload._deleted = false;
            }
            
            // CRITICAL: Always include a fresh modified timestamp so other devices see this as new
            payload.modified = new Date().toISOString();
            
            if (payload._deleted) {
              logger.info(`Pushing DELETION for ${collectionName}: ${payload.id}`);
            }
            
            return payload;
          });

        if (payloads.length === 0) return [];

        // 2. Execute UPSERT with explicit onConflict
        try {
          const { error } = await callWithTokenRefresh(() => 
            supabase
              .from(tableName)
              .upsert(payloads, { 
                onConflict: 'id'
              })
          );

          if (error) {
            // If it's a conflict (409) or unique violation (23505), handle it gracefully
            if (error.code === '23505' || (error as any).status === 409) {
              logger.warn(`Push conflict in ${collectionName} for ${payloads.length} rows. Fetching master state...`);
              
              // Fetch the current state from the cloud to return as conflict
              const { data: masterDocs } = await callWithTokenRefresh(() => 
                supabase
                  .from(tableName)
                  .select('*')
                  .in('id', payloads.map(p => p.id))
              );
              
              if (masterDocs && masterDocs.length > 0) {
                // Return the master documents as conflicts
                // RxDB will then trigger the conflict resolution logic in db.ts
                return masterDocs.map(master => {
                  // Ensure master is parsed for RxDB
                  const jsonFields = ['data', 'form_data', 'sections', 'statistics_rules', 'statistics_sub_categories', 'photos'];
                  jsonFields.forEach(field => {
                    if (typeof master[field] === 'string') {
                      try { master[field] = JSON.parse(master[field]); } catch (e) {}
                    }
                  });
                  return master;
                });
              }
            }
            
            logger.error(`Push error in ${collectionName}:`, error);
            throw error;
          }
        } catch (err: any) {
          logger.error(`Push exception in ${collectionName}:`, err);
          throw err;
        }

        return []; // Push handler returns empty array on success
      },
      batchSize: 50,
    },
    live: true,
    retryTime: 5000,
  });

  replicationState.error$.subscribe({
    error: (err) => {
      logger.error(`Replication error in ${collectionName}:`, {
        message: err.message,
        code: (err as any).code,
        details: (err as any).errors || (err as any).innerError || err
      });
    }
  });

  // REALTIME SUBSCRIPTION
  const channel = supabase
    .channel(`public:${tableName}:${workspace_id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: collectionName === 'templates' ? undefined : `workspace_id=eq.${workspace_id}`
      },
      (payload) => {
        logger.info(`Realtime update for ${collectionName}:`, payload.eventType);
        globalPullTrigger$.next('RESYNC');
      }
    )
    .subscribe();

  // Wrap cancel to clean up subscription
  const originalCancel = replicationState.cancel.bind(replicationState);
  replicationState.cancel = async () => {
    logger.info(`Stopping replication and realtime for ${collectionName}`);
    await supabase.removeChannel(channel);
    return originalCancel();
  };

  return replicationState;
}

/**
 * Manually triggers a full synchronization for all active replications.
 */
export function triggerCloudSync() {
  logger.info('Manual sync triggered by user');
  globalPullTrigger$.next('MANUAL_SYNC');
}

/**
 * Main function to orchestrate replication for all relevant collections.
 */
export async function startWorkspaceReplication(db: MinutasDatabase, workspace_id: string) {
  // If it's a local-only workspace, we ONLY sync templates (Community Repository)
  const isLocalOnly = !workspace_id || workspace_id === 'minutasdb';

  const collectionsToSync: (keyof typeof db.collections)[] = isLocalOnly 
    ? ['templates'] 
    : ['personnel', 'reports', 'templates', 'lookups', 'configs', 'history', 'pending_activities', 'scheduled_messages'];

  if (isLocalOnly) {
    logger.info('Starting community-only replication for local workspace');
  }

  const states = await Promise.all(
    collectionsToSync.map(col => startCollectionReplication(db, col, workspace_id || 'minutasdb'))
  );

  return {
    cancel: () => states.forEach(s => s && (s as any).cancel ? (s as any).cancel() : null)
  };
}
