import { replicateRxCollection } from 'rxdb/plugins/replication';
import { MinutasDatabase } from './db';
import { supabase } from '../supabase';
import { logger } from '../logger';
import { stableStringify } from '../utils-pure';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
      handler: async (lastCheckpoint, batchSize) => {
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('workspace_id', workspace_id)
          .order('modified', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize);

        if (lastCheckpoint && lastCheckpoint.modified) {
          query = query.gte('modified', lastCheckpoint.modified);
        }

        const { data, error } = await query;

        if (error) {
          logger.error(`Pull error in ${collectionName}:`, error);
          throw error;
        }

        let rawDocs = data || [];
        
        if (rawDocs.length > 0) {
          const firstId = rawDocs[0].id || 'unknown';
          logger.debug(`Pulled ${rawDocs.length} rows for ${collectionName} (First ID: ${firstId})`);
        }
        
        // Filter out docs we already saw in the last checkpoint
        if (lastCheckpoint) {
          rawDocs = rawDocs.filter(d => {
            const lastMod = lastCheckpoint.modified || '';
            const docMod = d.modified || '';
            if (docMod > lastMod) return true;
            if (docMod === lastMod && d.id > lastCheckpoint.id) return true;
            return false;
          });
        }

        const documents = rawDocs.map((doc: any) => {
          // Clean NULL values (except 'modified')
          Object.keys(doc).forEach(key => {
            if (doc[key] === null && key !== 'modified') delete doc[key];
          });

          // Ensure 'modified' is never undefined
          if (doc.modified === undefined) doc.modified = null;

          // Parse stringified JSON fields back to objects
          const jsonFields = ['data', 'form_data', 'statistics_rules', 'statistics_sub_categories'];
          jsonFields.forEach(field => {
            if (typeof doc[field] === 'string') {
              try { doc[field] = JSON.parse(doc[field]); } catch (e) { }
            }
          });

          return doc;
        });

        const lastDoc = documents[documents.length - 1];
        const newCheckpoint = lastDoc 
          ? { modified: lastDoc.modified, id: lastDoc.id } 
          : lastCheckpoint;

        return {
          documents,
          checkpoint: newCheckpoint
        };
      },
      batchSize: 50,
      stream$: pullTrigger$.pipe(debounceTime(300))
    },
    push: {
      handler: async (rows) => {
        // 1. Prepare payloads
        const allowedColumns: Record<string, string[]> = {
          personnel: ['id', 'workspace_id', 'personnel_id', 'name', 'cedula', 'rank', 'cargo', 'titulo', 'role_id', 'status', 'department', 'sex', 'specialties', 'order', 'modified', '_deleted'],
          reports: ['id', 'workspace_id', 'template_id', 'title', 'timestamp', 'content', 'is_relevant', 'status', 'form_data', 'modified', '_deleted'],
          templates: ['id', 'workspace_id', 'name', 'content', 'type', 'is_active', 'statistics_category', 'statistics_sub_categories', 'statistics_rules', 'modified', '_deleted'],
          lookups: ['id', 'workspace_id', 'type', 'name', 'data', 'modified', '_deleted'],
          configs: ['id', 'workspace_id', 'type', 'name', 'data', 'modified', '_deleted'],
          history: ['id', 'workspace_id', 'type', 'date', 'personnel_id', 'data', 'modified', '_deleted']
        };

        const columns = allowedColumns[collectionName] || [];
        const payloads = rows
          .map(row => row.newDocumentState)
          .filter(doc => doc.workspace_id === workspace_id) // ONLY push records for THIS workspace
          .map(doc => {
            const payload: any = {};
            
            columns.forEach(col => {
            let value = doc[col];
            
            // Special handling for JSON fields
            if (value && typeof value === 'object' && ['data', 'form_data', 'statistics_rules', 'statistics_sub_categories'].includes(col)) {
              value = stableStringify(value);
            }

            // Special handling for Postgres Arrays
            if (col === 'specialties' && Array.isArray(value)) {
              const escape = (str: string) => '"' + str.replace(/"/g, '\\"') + '"';
              value = `{${value.map(escape).join(',')}}`;
            }

            if (value !== undefined) {
              payload[col] = value;
            }
          });
          
          return payload;
        });

        if (payloads.length === 0) return [];

        if (import.meta.env.DEV) {
          logger.info(`Pushing ${payloads.length} rows to ${collectionName}`, payloads[0]);
        }

        // 2. Execute UPSERT with explicit onConflict
        try {
          const { error } = await supabase
            .from(tableName)
            .upsert(payloads, { 
              onConflict: 'id'
            });

          if (error) {
            // If it's a conflict (409) or unique violation (23505), handle it gracefully
            if (error.code === '23505' || (error as any).status === 409) {
              logger.warn(`Push conflict in ${collectionName} for ${payloads.length} rows. Fetching master state...`);
              
              // Fetch the current state from the cloud to return as conflict
              const { data: masterDocs } = await supabase
                .from(tableName)
                .select('*')
                .in('id', payloads.map(p => p.id));
              
              if (masterDocs && masterDocs.length > 0) {
                // Return the master documents as conflicts
                // RxDB will then trigger the conflict resolution logic in db.ts
                return masterDocs.map(master => {
                  // Ensure master is parsed for RxDB
                  const jsonFields = ['data', 'form_data', 'statistics_rules', 'statistics_sub_categories'];
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

  replicationState.error$.subscribe(err => {
    logger.error(`Replication error in ${collectionName}:`, {
      message: err.message,
      code: (err as any).code,
      details: (err as any).errors || (err as any).innerError || err
    });
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
        filter: `workspace_id=eq.${workspace_id}`
      },
      (payload) => {
        logger.info(`Realtime update for ${collectionName}:`, payload.eventType);
        pullTrigger$.next('RESYNC');
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
 * Main function to orchestrate replication for all relevant collections.
 */
export async function startWorkspaceReplication(db: MinutasDatabase, workspace_id: string) {
  if (!workspace_id || workspace_id === 'minutasdb') {
    logger.info('Skipping replication for local-only workspace');
    return null;
  }

  const collectionsToSync: (keyof typeof db.collections)[] = [
    'personnel',
    'reports',
    'templates',
    'lookups',
    'configs',
    'history'
  ];

  const states = await Promise.all(
    collectionsToSync.map(col => startCollectionReplication(db, col, workspace_id))
  );

  return {
    cancel: () => states.forEach(s => s.cancel())
  };
}
