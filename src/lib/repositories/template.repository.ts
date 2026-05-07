/**
 * Template Repository — Encapsulates all write operations on the `templates` collection.
 *
 * Read subscriptions remain in `use-templates.ts` given their tight coupling
 * with the config-sync logic. This repository handles all mutating operations.
 */

import type { MinutasDatabase } from '@/lib/db/db';
import type { Template } from '@/lib/types';
import { safeWrite, silentWrite } from './base.repository';
import { DbKeys } from './keys';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';

export function createTemplateRepository(db: MinutasDatabase, workspace_id: string) {
  const ws = workspace_id;

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
        // RxDB does not allow patching the primary key (id) or workspace_id.
        // Destructure them out and only patch the mutable fields.
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

  return { add, update, remove, toggle, bulkAdd, clearAll };
}

export type TemplateRepository = ReturnType<typeof createTemplateRepository>;



