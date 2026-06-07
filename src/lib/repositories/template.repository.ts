import type { MinutasDatabase } from '@/lib/db/db';
import type { Template } from '@/lib/types';
import { safeWrite, silentWrite } from './base.repository';
import { DbKeys } from './keys';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { createSupabaseWatchAll, supabaseRepoUtils } from './supabase.repository';
import { map } from 'rxjs';

export function createTemplateRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'templates';

  // Unified implementation using RxDB
  // (Replication is handled at the DatabaseProvider level)

  // RxDB Implementation
  if (!db) throw new Error('Database not initialized');

  const watchAll = () =>
    db.templates.find({
      selector: {
        $or: [
          { workspace_id: ws },
          { workspace_id: null }
        ]
      },
    }).$.pipe(
      map(docs => {
        const list = docs.map(d => (typeof d.toJSON === 'function' ? d.toJSON() : d) as Template);
        const workspaceNames = new Set(
          list
            .filter(t => t.workspace_id === ws)
            .map(t => t.name.toLowerCase())
        );
        const filtered = list.filter(
          t => t.workspace_id === ws || !workspaceNames.has(t.name.toLowerCase())
        );
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      })
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
        const { id, workspace_id, _rev, ...patchData } = template as any;
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



