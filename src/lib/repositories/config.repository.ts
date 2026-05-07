/**
 * Config Repository — Encapsulates all operations on the `configs` collection.
 *
 * The configs collection is a catch-all for structured documents:
 * settings, drafts, field definitions, guards, units, profiles, and template configs.
 */

import type { MinutasDatabase } from '@/lib/db/db';
import type { AppSettings, ReportDraft, FieldConfig, Guard, TemplateConfig } from '@/lib/types';
import { DbKeys } from './keys';
import { safeWrite, silentWrite } from './base.repository';

export function createConfigRepository(db: MinutasDatabase, workspace_id: string) {
  const ws = workspace_id;

  // ─── Settings ────────────────────────────────────────────────────────────

  const getSettings = () =>
    db.configs.findOne(DbKeys.settings(ws)).exec();

  const watchSettings = () =>
    db.configs.findOne(DbKeys.settings(ws)).$;

  const saveSettings = async (
    current: AppSettings,
    patch: Partial<AppSettings>
  ) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.settings(ws),
          workspace_id: ws,
          type: 'settings',
          data: { ...current, ...patch },
        }),
      { feature: 'Settings' }
    );

  const initSettings = async (defaults: AppSettings) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.settings(ws),
          workspace_id: ws,
          type: 'settings',
          data: { ...defaults },
        }),
      { feature: 'Settings' }
    );

  // ─── Draft ───────────────────────────────────────────────────────────────

  const watchDraft = () =>
    db.configs.findOne(DbKeys.draft(ws)).$;

  const saveDraft = async (draft: ReportDraft) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.draft(ws),
          workspace_id: ws,
          type: 'draft',
          name: 'active-draft',
          data: { ...draft, lastSaved: new Date().toISOString() },
        }),
      { feature: 'Drafts' }
    );

  const clearDraft = async () => {
    const doc = await db.configs.findOne(DbKeys.draft(ws)).exec();
    if (!doc) return;
    return silentWrite(() => doc.remove(), { feature: 'Drafts' });
  };

  // ─── Profile ─────────────────────────────────────────────────────────────

  const watchProfile = () =>
    db.configs.findOne(DbKeys.profile(ws)).$;

  const getProfile = () =>
    db.configs.findOne(DbKeys.profile(ws)).exec();

  const saveProfile = async <T extends object>(current: T, patch: Partial<T>) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.profile(ws),
          workspace_id: ws,
          type: 'profile',
          data: { ...current, ...patch },
        }),
      { feature: 'Profile', rethrow: true }
    );

  const initProfile = async <T extends object>(defaults: T) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.profile(ws),
          workspace_id: ws,
          type: 'profile',
          data: { ...defaults },
        }),
      { feature: 'Profile' }
    );

  const clearProfile = async () => {
    const doc = await db.configs.findOne(DbKeys.profile(ws)).exec();
    if (!doc) return;
    return silentWrite(() => doc.remove(), { feature: 'Profile' });
  };

  // ─── Field Definitions ───────────────────────────────────────────────────

  const watchFieldDefinitions = () =>
    db.configs.find({
      selector: { type: 'field_definition', workspace_id: ws },
    }).$;

  const bulkInitFieldDefinitions = async (
    defs: Record<string, FieldConfig>
  ) => {
    const entries = Object.entries(defs).map(([name, config]) => ({
      id: DbKeys.fieldDefinition(ws, name),
      workspace_id: ws,
      type: 'field_definition' as const,
      name,
      data: { ...config },
    }));
    return silentWrite(() => db.configs.bulkInsert(entries as any), {
      feature: 'FieldDefinitions',
    });
  };

  const saveAllFieldDefinitions = async (
    defs: Record<string, FieldConfig>
  ) =>
    silentWrite(
      async () => {
        const allDocs = await db.configs
          .find({ selector: { type: 'field_definition', workspace_id: ws } })
          .exec();
        const newIds = new Set(Object.keys(defs));
        const toDelete = allDocs.filter(
          (d) => !newIds.has(d.toJSON().name || '')
        );
        if (toDelete.length > 0) {
          await db.configs.bulkRemove(toDelete.map((d) => d.primary));
        }
        const entries = Object.entries(defs).map(([name, config]) => ({
          id: DbKeys.fieldDefinition(ws, name),
          workspace_id: ws,
          type: 'field_definition' as const,
          name,
          data: { ...config },
        }));
        await db.configs.bulkUpsert(entries as any);
      },
      { feature: 'FieldDefinitions' }
    );

  const upsertFieldDefinition = async (fieldName: string, config: FieldConfig) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.fieldDefinition(ws, fieldName),
          workspace_id: ws,
          type: 'field_definition',
          name: fieldName,
          data: { ...config },
        } as any),
      { feature: 'FieldDefinitions' }
    );

  const removeFieldDefinition = async (fieldName: string) => {
    const doc = await db.configs
      .findOne(DbKeys.fieldDefinition(ws, fieldName))
      .exec();
    if (!doc) return;
    return silentWrite(() => doc.remove(), { feature: 'FieldDefinitions' });
  };

  const clearAllFieldDefinitions = async (
    defaults: Record<string, FieldConfig>
  ) =>
    silentWrite(
      async () => {
        const allDocs = await db.configs
          .find({ selector: { type: 'field_definition', workspace_id: ws } })
          .exec();
        await db.configs.bulkRemove(allDocs.map((d) => d.primary));
        const entries = Object.entries(defaults).map(([name, config]) => ({
          id: DbKeys.fieldDefinition(ws, name),
          workspace_id: ws,
          type: 'field_definition' as const,
          name,
          data: { ...config },
        }));
        await db.configs.bulkInsert(entries as any);
      },
      { feature: 'FieldDefinitions' }
    );

  // ─── Guards ──────────────────────────────────────────────────────────────

  const watchGuards = () =>
    db.configs.find({
      selector: { type: 'guard', workspace_id: ws },
    }).$;

  const bulkInitGuards = async (guards: Guard[]) => {
    const docs = guards.map((g) => ({
      id: DbKeys.guard(ws, g.id),
      workspace_id: ws,
      type: 'guard' as const,
      name: g.id,
      data: { ...g },
    }));
    return silentWrite(() => db.configs.bulkInsert(docs), { feature: 'Guards' });
  };

  const saveGuards = async (guards: Guard[]) =>
    silentWrite(
      async () => {
        const existingDocs = await db.configs
          .find({ selector: { type: 'guard', workspace_id: ws } })
          .exec();
        const newIds = new Set(guards.map((g) => DbKeys.guard(ws, g.id)));
        const toDelete = existingDocs.filter((doc) => !newIds.has(doc.id));
        await Promise.all(toDelete.map((doc) => doc.remove()));
        if (guards.length > 0) {
          const docs = guards.map((g) => ({
            id: DbKeys.guard(ws, g.id),
            workspace_id: ws,
            type: 'guard' as const,
            name: g.id,
            data: { ...g },
          }));
          await db.configs.bulkUpsert(docs);
        }
      },
      { feature: 'Guards' }
    );

  const clearAllGuards = async (defaults: Guard[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.configs
          .find({ selector: { type: 'guard', workspace_id: ws } })
          .exec();
        await Promise.all(allDocs.map((d) => d.remove()));
        const docs = defaults.map((g) => ({
          id: DbKeys.guard(ws, g.id),
          workspace_id: ws,
          type: 'guard' as const,
          name: g.id,
          data: { ...g },
        }));
        await db.configs.bulkInsert(docs);
      },
      { feature: 'Guards' }
    );

  // ─── Template Configs ────────────────────────────────────────────────────

  const watchTemplateConfigs = () =>
    db.configs.find({
      selector: { type: 'template_config', workspace_id: ws },
    }).$;

  const upsertTemplateConfig = async (template_id: string, config: TemplateConfig) =>
    safeWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.templateConfig(ws, template_id),
          workspace_id: ws,
          type: 'template_config',
          name: template_id,
          data: config,
        } as any),
      { feature: 'Templates' }
    );

  const removeTemplateConfig = async (template_id: string) => {
    const doc = await db.configs
      .findOne(DbKeys.templateConfig(ws, template_id))
      .exec();
    if (doc) await doc.remove();
  };

  const clearAllTemplateConfigs = async () =>
    silentWrite(
      async () => {
        const allDocs = await db.configs
          .find({ selector: { type: 'template_config', workspace_id: ws } })
          .exec();
        await Promise.all(allDocs.map((d: any) => d.remove()));
      },
      { feature: 'Templates' }
    );

  return {
    // Settings
    getSettings,
    watchSettings,
    saveSettings,
    initSettings,
    // Draft
    watchDraft,
    saveDraft,
    clearDraft,
    // Profile
    watchProfile,
    getProfile,
    saveProfile,
    initProfile,
    clearProfile,
    // Field Definitions
    watchFieldDefinitions,
    bulkInitFieldDefinitions,
    saveAllFieldDefinitions,
    upsertFieldDefinition,
    removeFieldDefinition,
    clearAllFieldDefinitions,
    // Guards
    watchGuards,
    bulkInitGuards,
    saveGuards,
    clearAllGuards,
    // Template Configs
    watchTemplateConfigs,
    upsertTemplateConfig,
    removeTemplateConfig,
    clearAllTemplateConfigs,
  };
}

export type ConfigRepository = ReturnType<typeof createConfigRepository>;




