import type { MinutasDatabase } from '@/lib/db/db';
import type { AppSettings, ReportDraft, FieldConfig, Guard, TemplateConfig } from '@/lib/types';
import { DbKeys } from './keys';
import { silentWrite, safeWrite } from './base.repository';
import { createSupabaseWatchAll, createSupabaseWatchOne, supabaseRepoUtils } from './supabase.repository';
import { supabase } from '@/lib/supabase';
import { map } from 'rxjs/operators';

export function createConfigRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'configs';

  if (isCloud) {
    return {
      // Settings
      getSettings: async () => {
        const { data, error } = await supabase.from(TABLE).select('*').eq('id', DbKeys.settings(ws)).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      watchSettings: () => createSupabaseWatchOne<any>(TABLE, DbKeys.settings(ws)),
      saveSettings: async (current: AppSettings, patch: Partial<AppSettings>) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.settings(ws),
          workspace_id: ws,
          type: 'settings',
          data: { ...current, ...patch },
        }),
      initSettings: async (defaults: AppSettings) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.settings(ws),
          workspace_id: ws,
          type: 'settings',
          data: { ...defaults },
        }),

      // Draft
      watchDraft: () => createSupabaseWatchOne<any>(TABLE, DbKeys.draft(ws)),
      saveDraft: async (draft: ReportDraft) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.draft(ws),
          workspace_id: ws,
          type: 'draft',
          name: 'active-draft',
          data: { ...draft, lastSaved: new Date().toISOString() },
        }),
      clearDraft: () => supabaseRepoUtils.remove(TABLE, DbKeys.draft(ws)),

      // Profile
      watchProfile: () => createSupabaseWatchOne<any>(TABLE, DbKeys.profile(ws)),
      getProfile: async () => {
        const { data, error } = await supabase.from(TABLE).select('*').eq('id', DbKeys.profile(ws)).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      saveProfile: async <T extends object>(current: T, patch: Partial<T>) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.profile(ws),
          workspace_id: ws,
          type: 'profile',
          data: { ...current, ...patch },
        }),
      initProfile: async <T extends object>(defaults: T) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.profile(ws),
          workspace_id: ws,
          type: 'profile',
          data: { ...defaults },
        }),
      clearProfile: () => supabaseRepoUtils.remove(TABLE, DbKeys.profile(ws)),

      // Field Definitions
      watchFieldDefinitions: () => createSupabaseWatchAll<any>(TABLE, ws, { 
        filter: (q) => q.eq('type', 'field_definition') 
      }),
      bulkInitFieldDefinitions: async (defs: Record<string, FieldConfig>) => {
        const entries = Object.entries(defs).map(([name, config]) => ({
          id: DbKeys.fieldDefinition(ws, name),
          workspace_id: ws,
          type: 'field_definition' as const,
          name,
          data: { ...config },
        }));
        return supabaseRepoUtils.bulkAdd(TABLE, entries);
      },
      saveAllFieldDefinitions: async (defs: Record<string, FieldConfig>) => {
        // Simple implementation: delete and insert
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'field_definition');
        const entries = Object.entries(defs).map(([name, config]) => ({
          id: DbKeys.fieldDefinition(ws, name),
          workspace_id: ws,
          type: 'field_definition' as const,
          name,
          data: { ...config },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, entries);
      },
      upsertFieldDefinition: (fieldName: string, config: FieldConfig) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.fieldDefinition(ws, fieldName),
          workspace_id: ws,
          type: 'field_definition',
          name: fieldName,
          data: { ...config },
        }),
      removeFieldDefinition: (fieldName: string) => supabaseRepoUtils.remove(TABLE, DbKeys.fieldDefinition(ws, fieldName)),
      clearAllFieldDefinitions: async (defaults: Record<string, FieldConfig>) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'field_definition');
        const entries = Object.entries(defaults).map(([name, config]) => ({
          id: DbKeys.fieldDefinition(ws, name),
          workspace_id: ws,
          type: 'field_definition' as const,
          name,
          data: { ...config },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, entries);
      },

      // Units
      watchUnits: () => createSupabaseWatchAll<any>(TABLE, ws, { filter: (q) => q.eq('type', 'unit') }),
      saveUnits: async (units: string[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'unit');
        if (units.length > 0) {
          const docs = units.map((u) => ({
            id: DbKeys.unit(ws, u),
            workspace_id: ws,
            type: 'unit' as const,
            name: u,
            data: { name: u },
          }));
          await supabaseRepoUtils.bulkAdd(TABLE, docs);
        }
      },
      clearAllUnits: () => supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'unit'),

      // Guards
      watchGuards: () => createSupabaseWatchAll<any>(TABLE, ws, { filter: (q) => q.eq('type', 'guard') }),
      bulkInitGuards: (guards: Guard[]) => {
        const docs = guards.map((g) => ({
          id: DbKeys.guard(ws, g.id),
          workspace_id: ws,
          type: 'guard' as const,
          name: g.id,
          data: { ...g },
        }));
        return supabaseRepoUtils.bulkAdd(TABLE, docs);
      },
      saveGuards: async (guards: Guard[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'guard');
        if (guards.length > 0) {
          const docs = guards.map((g) => ({
            id: DbKeys.guard(ws, g.id),
            workspace_id: ws,
            type: 'guard' as const,
            name: g.id,
            data: { ...g },
          }));
          await supabaseRepoUtils.bulkAdd(TABLE, docs);
        }
      },
      clearAllGuards: async (defaults: Guard[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'guard');
        const docs = defaults.map((g) => ({
          id: DbKeys.guard(ws, g.id),
          workspace_id: ws,
          type: 'guard' as const,
          name: g.id,
          data: { ...g },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, docs);
      },

      // Template Configs
      watchTemplateConfigs: () => createSupabaseWatchAll<any>(TABLE, ws, { filter: (q) => q.eq('type', 'template_config') }),
      upsertTemplateConfig: (template_id: string, config: TemplateConfig) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.templateConfig(ws, template_id),
          workspace_id: ws,
          type: 'template_config',
          name: template_id,
          data: config,
        }),
      removeTemplateConfig: (template_id: string) => supabaseRepoUtils.remove(TABLE, DbKeys.templateConfig(ws, template_id)),
      clearAllTemplateConfigs: () => {
        return supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'template_config');
      },
      bulkUpsertTemplateConfigs: async (entries: any[]) => {
        const { error } = await supabase.from(TABLE).upsert(entries);
        if (error) throw error;
      }
    };
  }

  // RxDB Implementation
  if (!db) throw new Error('Database not initialized');

  const watchUnits = () =>
    db.configs.find({ selector: { type: 'unit', workspace_id: ws } }).$;

  const saveUnits = async (units: string[]) =>
    silentWrite(async () => {
      const allDocs = await db.configs
        .find({ selector: { type: 'unit', workspace_id: ws } })
        .exec();
      await db.configs.bulkRemove(allDocs.map((d: any) => d.primary));
      if (units.length > 0) {
        const toInsert = units.map((name) => ({
          id: DbKeys.unit(ws, name),
          workspace_id: ws,
          type: 'unit' as const,
          name,
          data: { name },
        }));
        await db.configs.bulkInsert(toInsert as any);
      }
    }, { feature: 'Units' });

  const clearAllUnits = async () =>
    silentWrite(async () => {
      const allDocs = await db.configs
        .find({ selector: { type: 'unit', workspace_id: ws } })
        .exec();
      await db.configs.bulkRemove(allDocs.map((d: any) => d.primary));
    }, { feature: 'Units' });

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

  const bulkUpsertTemplateConfigs = async (entries: any[]) =>
    silentWrite(() => db.configs.bulkUpsert(entries as any), { feature: 'Templates' });

  return {
    watchUnits,
    saveUnits,
    clearAllUnits,
    getSettings,
    watchSettings,
    saveSettings,
    initSettings,
    watchDraft,
    saveDraft,
    clearDraft,
    watchProfile,
    getProfile,
    saveProfile,
    initProfile,
    clearProfile,
    watchFieldDefinitions,
    bulkInitFieldDefinitions,
    saveAllFieldDefinitions,
    upsertFieldDefinition,
    removeFieldDefinition,
    clearAllFieldDefinitions,
    watchGuards,
    bulkInitGuards,
    saveGuards,
    clearAllGuards,
    watchTemplateConfigs,
    upsertTemplateConfig,
    removeTemplateConfig,
    clearAllTemplateConfigs,
    bulkUpsertTemplateConfigs,
  };
}

export type ConfigRepository = ReturnType<typeof createConfigRepository>;




