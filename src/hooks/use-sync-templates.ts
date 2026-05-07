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
    if (!db || !currentWorkspace) return;
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

      logger.info(`Downloaded ${cloudTemplates?.length} templates and ${cloudConfigs?.length} configs from cloud.`);

      // 3. Upsert templates locally
      // We assign the current workspace_id so they appear in the current UI,
      // but they are "synced" copies of the global ones.
      if (cloudTemplates) {
        for (const t of cloudTemplates) {
          // Destructure to only get what RxDB expects (VD2 Fix)
          const { 
            id, name, content, type, is_active, 
            statistics_category, statistics_rules, statistics_sub_categories 
          } = t;
          
          await db.templates.upsert({
            id,
            name,
            content,
            type: type || 'normal',
            is_active: is_active !== undefined ? is_active : true,
            workspace_id: currentWorkspace,
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
          const { id, type, name, data } = c;
          await db.configs.upsert({
            id,
            type,
            name,
            workspace_id: currentWorkspace,
            data: typeof data === 'string' ? JSON.parse(data) : data,
          });
        }
      }

      toast.success('Plantillas sincronizadas con la nube correctamente.');
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
