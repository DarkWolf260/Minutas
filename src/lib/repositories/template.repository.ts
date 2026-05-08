import type { MinutasDatabase } from '@/lib/db/db';
import type { Template } from '@/lib/types';
import { safeWrite, silentWrite } from './base.repository';
import { DbKeys } from './keys';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { createSupabaseWatchAll, supabaseRepoUtils } from './supabase.repository';
import { map } from 'rxjs/operators';

export function createTemplateRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'templates';

  if (isCloud) {
    return {
      watchAll: () => createSupabaseWatchAll<Template>(TABLE, ws, { orderCol: 'name' }),
      add: async (template: Template) => supabaseRepoUtils.add(TABLE, template),
      update: async (template: Template) => {
        const { id, workspace_id, ...patchData } = template;
        return supabaseRepoUtils.update(TABLE, id, patchData);
      },
      remove: async (template_id: string) => {
        await supabaseRepoUtils.remove(TABLE, template_id);
        // Also remove config if it exists in configs table
        await supabaseRepoUtils.remove('configs', DbKeys.templateConfig(ws, template_id));
      },
      toggle: async (template_id: string) => {
        // This requires a fetch first or a toggle RPC. 
        // For simplicity, let's just do a direct update if we have the current state, 
        // but since we don't here, we might need a more complex implementation.
        // For now, toggle is mostly used in local mode.
      },
      bulkAdd: (templates: Template[]) => supabaseRepoUtils.bulkAdd(TABLE, templates),
      clearAll: async () => {
        await supabaseRepoUtils.clearAll(TABLE, ws);
        // Also clear configs
        const { error } = await (supabaseRepoUtils as any).supabase.from('configs').delete().eq('workspace_id', ws).eq('type', 'template_config');
      }
    };
  }

  // RxDB Implementation
  if (!db) throw new Error('Database not initialized');

  const watchAll = () =>
    db.templates.find({
      selector: { workspace_id: ws },
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON() as Template).sort((a, b) => a.name.localeCompare(b.name)))
    );

  const add = async (template: Template) =>
    safeWrite(
      () => db.templates.insert(template),
      {
        feature: 'Templates',
        errorMessage: getUserFriendlyErrorMessage(null),
        rethrow: true,
      }
    );

  const update = async (template: Template) =>
    safeWrite(
      async () => {
        const doc = await db.templates.findOne(template.id).exec();
        if (!doc) throw new Error('Plantilla no encontrada.');
        const { id, workspace_id, ...patchData } = template;
        await doc.patch(patchData);
      },
      { feature: 'Templates', rethrow: true }
    );

  const remove = async (template_id: string) =>
    safeWrite(
      async () => {
        const templateDoc = await db.templates.findOne(template_id).exec();
        if (templateDoc) await templateDoc.remove();
        const configDoc = await db.configs
          .findOne(DbKeys.templateConfig(ws, template_id))
          .exec();
        if (configDoc) await configDoc.remove();
      },
      { feature: 'Templates', successMessage: 'Plantilla eliminada.' }
    );

  const toggle = async (template_id: string) =>
    silentWrite(
      async () => {
        const doc = await db.templates.findOne(template_id).exec();
        if (doc) {
          await doc.patch({ is_active: !(doc.toJSON().is_active ?? true) });
        }
      },
      { feature: 'Templates' }
    );

  const bulkAdd = async (templates: Template[]) =>
    silentWrite(() => db.templates.bulkInsert(templates), { feature: 'Templates' });

  const clearAll = async () =>
    silentWrite(
      async () => {
        const allTemplates = await db.templates
          .find({ selector: { workspace_id: ws } })
          .exec();
        await Promise.all(allTemplates.map((d) => d.remove()));
        const allConfigs = await db.configs
          .find({ selector: { type: 'template_config', workspace_id: ws } })
          .exec();
        await Promise.all(allConfigs.map((d: any) => d.remove()));
      },
      { feature: 'Templates' }
    );

  return { watchAll, add, update, remove, toggle, bulkAdd, clearAll };
}

export type TemplateRepository = ReturnType<typeof createTemplateRepository>;



