import type { MinutasDatabase } from '@/lib/db/db';
import type { AppSettings, ReportDraft, FieldConfig, Guard, TemplateConfig } from '@/lib/types';
import { DbKeys } from './keys';
import { silentWrite, safeWrite } from './base.repository';
import { createSupabaseWatchAll, createSupabaseWatchOne, supabaseRepoUtils } from './supabase.repository';
import { supabase } from '@/lib/supabase';
import { map } from 'rxjs';
import { stableStringify } from '@/lib/db/db';

export function createConfigRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'configs';

  // Unified implementation using RxDB
  // (Replication is handled at the DatabaseProvider level)

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
      async () => {
        const doc = await db.configs.findOne(DbKeys.settings(ws)).exec();
        const currentData = doc?.toJSON().data || {};

        // 1. Crear el objeto base limpio
        const merged: any = { ...currentData, ...patch };

        // 2. Eliminar cualquier rastro de corrupción
        Object.keys(merged).forEach(key => {
          if (/^\d+$/.test(key)) delete merged[key];
        });

        // 3. Asegurar consistencia de nombres (Migración Agresiva)
        if (merged.activeGuardId !== undefined) merged.active_guard_id = merged.activeGuardId;
        if (merged.isGuardOpen !== undefined) merged.is_guard_open = merged.isGuardOpen;
        if (merged.guardPeriod !== undefined) merged.guard_period = merged.guardPeriod;
        if (merged.ordenDelDiaDraft !== undefined) merged.orden_del_dia_draft = merged.ordenDelDiaDraft;
        if (merged.finalReportStatistics !== undefined) merged.final_report_statistics = merged.finalReportStatistics;

        // Eliminar versiones viejas
        delete merged.activeGuardId;
        delete merged.isGuardOpen;
        delete merged.guardPeriod;
        delete merged.ordenDelDiaDraft;
        delete merged.finalReportStatistics;

        // 4. VERIFICACIÓN DE CAMBIO REAL (Freno al bucle)
        if (stableStringify(currentData) === stableStringify(merged)) {
          // No hay cambios reales, no guardar para evitar bucles de replicación
          return;
        }

        return db.configs.upsert({
          id: DbKeys.settings(ws),
          workspace_id: ws,
          type: 'settings',
          data: merged,
        });
      },
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

  const getOrdenDelDia = () =>
    db.configs.findOne(DbKeys.ordenDelDia(ws)).exec();

  const watchOrdenDelDia = () =>
    db.configs.findOne(DbKeys.ordenDelDia(ws)).$;

  const saveOrdenDelDia = async (draft: any) =>
    silentWrite(
      () =>
        db.configs.upsert({
          id: DbKeys.ordenDelDia(ws),
          workspace_id: ws,
          type: 'orden_del_dia',
          data: { ...draft, updated_at: new Date().toISOString() },
        }),
      { feature: 'Orden del Día' }
    );

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
        // 1. Get current to identify ones to delete
        const allDocs = await db.configs
          .find({ selector: { type: 'field_definition', workspace_id: ws } })
          .exec();
        
        const newIds = new Set(Object.keys(defaults).map(name => DbKeys.fieldDefinition(ws, name)));
        const toDelete = allDocs.filter(d => !newIds.has(d.primary));
        
        if (toDelete.length > 0) {
          await db.configs.bulkRemove(toDelete.map(d => d.primary));
        }

        // 2. Upsert defaults
        const entries = Object.entries(defaults).map(([name, config]) => ({
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
    getOrdenDelDia,
    watchOrdenDelDia,
    saveOrdenDelDia,
  };
}

export type ConfigRepository = ReturnType<typeof createConfigRepository>;




