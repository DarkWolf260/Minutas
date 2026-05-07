import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { MinutasDatabase } from './db';
import { supabase } from '../supabase';
import { logger } from '../logger';

/**
 * Starts bidirectional replication for a given collection and workspace.
 */
async function startCollectionReplication(
  db: MinutasDatabase,
  collectionName: keyof typeof db.collections,
  workspace_id: string
) {
  const collection = db.collections[collectionName];

  logger.info(`Starting replication for ${collectionName} [Workspace: ${workspace_id}]`);

  const replicationState = replicateSupabase({
    collection: collection as any,
    client: supabase,
    replicationIdentifier: `supabase-sync-v2-${collectionName}-${workspace_id}`,

    tableName: String(collectionName),
    modifiedField: 'modified', // Now matches both sides!
    deletedField: '_deleted',
    pull: {
      batchSize: 50,
      queryBuilder: (params: any) => {
        return params.query.eq('workspace_id', workspace_id);
      },
      modifier: (doc: any) => {
        // 1. Clean NULL values (except 'modified' which we might need to keep as null)
        Object.keys(doc).forEach(key => {
          if (doc[key] === null && key !== 'modified') delete doc[key];
        });

        // 2. Ensure 'modified' is never undefined (PostgREST hates "undefined" string)
        if (doc.modified === undefined) {
          doc.modified = null;
        }

        // 3. Parse stringified JSON fields back to objects
        const jsonFields = ['data', 'form_data', 'statistics_rules', 'statistics_sub_categories'];
        jsonFields.forEach(field => {
          if (typeof doc[field] === 'string') {
            try { doc[field] = JSON.parse(doc[field]); } catch (e) { }
          }
        });

        return doc;
      },
    },
    push: {
      batchSize: 50,
      modifier: (doc: any) => {
        // Isolation check
        if (doc.workspace_id !== workspace_id) return null;

        // 1. Define allowed columns for this specific collection
        // (This prevents RxDB internal fields or extra schema fields from leaking to SQL)
        const allowedColumns: Record<string, string[]> = {
          personnel: ['id', 'workspace_id', 'personnel_id', 'name', 'cedula', 'rank', 'cargo', 'titulo', 'role_id', 'status', 'department', 'sex', 'specialties', 'order', 'modified', '_deleted'],
          reports: ['id', 'workspace_id', 'template_id', 'title', 'timestamp', 'content', 'is_relevant', 'status', 'form_data', 'modified', '_deleted'],
          templates: ['id', 'workspace_id', 'name', 'content', 'type', 'is_active', 'statistics_category', 'statistics_sub_categories', 'statistics_rules', 'modified', '_deleted'],
          lookups: ['id', 'workspace_id', 'type', 'name', 'data', 'modified', '_deleted'],
          configs: ['id', 'workspace_id', 'type', 'name', 'data', 'modified', '_deleted'],
          history: ['id', 'workspace_id', 'type', 'date', 'personnel_id', 'data', 'modified', '_deleted']
        };

        const columns = allowedColumns[collectionName] || [];
        const payload: any = {};

        // 2. Only include allowed columns that are NOT undefined/null
        columns.forEach(col => {
          let value = doc[col];
          
          // Special handling for JSON fields
          if (value && typeof value === 'object' && ['data', 'form_data', 'statistics_rules', 'statistics_sub_categories'].includes(col)) {
            value = JSON.stringify(value);
          }

          // Special handling for Postgres Arrays
          if (col === 'specialties' && Array.isArray(value)) {
            const escape = (str: string) => '"' + str.replace(/"/g, '\\"') + '"';
            value = `{${value.map(escape).join(',')}}`;
          }

          if (value !== undefined && value !== null) {
            payload[col] = value;
          }
        });

        if (import.meta.env.DEV) {
          logger.info(`Pushing ${collectionName} [${payload.id}]`, payload);
        }

        return payload;
      },
    },
    live: true,
    retryTime: 5000,
  });

  replicationState.error$.subscribe(err => {
    logger.error(`Replication error in ${collectionName}:`, {
      message: err.message,
      code: (err as any).code,
      stack: err.stack,
      parameters: (err as any).parameters,
      response: (err as any).response,
      details: (err as any).errors || (err as any).innerError
    });
  });

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
    // 'templates', // Manual sync only
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





