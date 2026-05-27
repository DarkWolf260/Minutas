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

      // 1. Fetch all templates from cloud (ignoring workspace_id for global access)
      const { data: cloudTemplates, error: tError } = await supabase
        .from('templates')
        .select('*');

      if (tError) throw tError;

      // 2. Fetch shared template configurations
      const { data: cloudConfigs, error: cError } = await supabase
        .from('configs')
        .select('*')
        .eq('type', 'template_config');

      if (cError) throw cError;

      const templateCount = cloudTemplates?.length || 0;
      const configCount = cloudConfigs?.length || 0;

      logger.info(`Downloaded ${templateCount} templates and ${configCount} configs from cloud.`);

      if (templateCount === 0) {
        toast.info('No se encontraron plantillas nuevas en la nube.');
        return;
      }

      // 3. Upsert templates locally
      if (cloudTemplates) {
        for (const t of cloudTemplates) {
          // Destructure to only get what RxDB expects (Now including description)
          const { 
            id, name, content, type, is_active, description, workspace_id,
            statistics_category, statistics_rules, statistics_sub_categories 
          } = t;
          
          // Safeguard: Find and remove any local template duplicate by name that has a mismatching ID
          const existingByName = await db.templates.findOne({
            selector: {
              name: name,
              id: { $ne: id }
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
            description,
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

      // 4. Upsert configs locally
      if (cloudConfigs) {
        for (const c of cloudConfigs) {
          const { id, type, name, data, workspace_id } = c;
          await db.configs.upsert({
            id,
            type,
            name,
            workspace_id: workspace_id || currentWorkspace || 'minutasdb',
            data: typeof data === 'string' ? JSON.parse(data) : data,
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
