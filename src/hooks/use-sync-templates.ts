import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useSyncTemplates() {
  const [isSyncing, setIsSyncing] = useState(false);
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();

  const syncFromCloud = async () => {
    if (!db) return;
    
    setIsSyncing(true);
    
    try {
      logger.info('Starting manual template sync from cloud...');

      // 1. Fetch global templates from cloud (workspace_id is NULL)
      const { data: cloudTemplates, error: tError } = await supabase
        .from('templates')
        .select('*')
        .is('workspace_id', null);

      if (tError) throw tError;

      const templateCount = cloudTemplates?.length || 0;

      logger.info(`Downloaded ${templateCount} global templates from cloud.`);

      if (templateCount === 0) {
        toast.info('No se encontraron plantillas nuevas en la nube.');
        return;
      }

      // 2. Upsert templates locally
      if (cloudTemplates) {
        for (const t of cloudTemplates) {
          // Destructure to only get what RxDB expects
          const { 
            id, name, content, type, is_active, workspace_id,
            statistics_category, statistics_rules, statistics_sub_categories 
          } = t;
          
          // Safeguard: Find and remove any local template duplicate by name that has a mismatching ID and same workspace_id
          const existingByName = await db.templates.findOne({
            selector: {
              name: name,
              id: { $ne: id },
              workspace_id: workspace_id || null
            }
          }).exec();

          if (existingByName) {
            logger.info(`Deduplicating local template "${name}" (removing old ID "${existingByName.id}" in favor of cloud ID "${id}")`);
            await existingByName.remove();
          }

          await db.templates.upsert({
            id,
            name,
            content,
            type: type || 'normal',
            is_active: is_active !== undefined ? is_active : true,
            workspace_id: workspace_id || null, // Keep NULL if global
            statistics_category,
            // Parse JSON fields if they came as strings
            statistics_rules: typeof statistics_rules === 'string' ? JSON.parse(statistics_rules) : statistics_rules,
            statistics_sub_categories: typeof statistics_sub_categories === 'string' ? JSON.parse(statistics_sub_categories) : statistics_sub_categories,
          });
        }
      }

      toast.success(`Se sincronizaron ${templateCount} plantillas correctamente.`);
    } catch (err: any) {
      logger.error('Failed to sync templates from cloud', err);
      toast.error('Error al sincronizar plantillas: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncFromCloud,
    isSyncing
  };
}
