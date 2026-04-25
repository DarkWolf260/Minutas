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

export function createTemplateRepository(db: MinutasDatabase, workspaceId: string) {
  const ws = workspaceId;

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
        // RxDB does not allow patching the primary key (id) or workspaceId.
        // Destructure them out and only patch the mutable fields.
        const { id, workspaceId, ...patchData } = template;
        await doc.patch(patchData);
      },
      { feature: 'Templates', rethrow: true }
    );

  const remove = async (templateId: string) =>
    safeWrite(
      async () => {
        const templateDoc = await db.templates.findOne(templateId).exec();
        if (templateDoc) await templateDoc.remove();
        const configDoc = await db.configs
          .findOne(DbKeys.templateConfig(templateId))
          .exec();
        if (configDoc) await configDoc.remove();
      },
      { feature: 'Templates', successMessage: 'Plantilla eliminada.' }
    );

  const toggle = async (templateId: string) =>
    silentWrite(
      async () => {
        const doc = await db.templates.findOne(templateId).exec();
        if (doc) {
          await doc.patch({ isActive: !(doc.toJSON().isActive ?? true) });
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
          .find({ selector: { workspaceId: ws } })
          .exec();
        await Promise.all(allTemplates.map((d) => d.remove()));
        const allConfigs = await db.configs
          .find({ selector: { type: 'template_config', workspaceId: ws } })
          .exec();
        await Promise.all(allConfigs.map((d: any) => d.remove()));
      },
      { feature: 'Templates' }
    );

  return { add, update, remove, toggle, bulkAdd, clearAll };
}

export type TemplateRepository = ReturnType<typeof createTemplateRepository>;
