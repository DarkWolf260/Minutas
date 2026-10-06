/**
 * Deep module for Cloud Template operations, synchronization, and storage.
 *
 * Encapsulates backend connectivity verification, deduplication against RxDB,
 * cloud publishing, catalog retrieval, and bootstrap synchronization.
 *
 * Designed according to codebase-design principles:
 * - High depth: rich domain & sync logic behind a compact interface.
 * - Testable: returns pure results without UI side-effects (toasts).
 */

import { supabase, isSupabaseOnline } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { generateId } from '@/lib/utils/id';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import type { Template } from '@/lib/types';

export interface CloudTemplate {
  id: string;
  name: string;
  content: string;
  type: 'normal' | 'relevante';
  created_at?: string;
  workspace_id?: string | null;
  statistics_category?: string | null;
  statistics_sub_categories?: string[] | null;
  statistics_rules?: any[] | null;
  disable_main_stat_on_apoyo?: boolean | null;
  disabled_sub_categories_on_apoyo?: string[] | null;
}

export interface CloudSyncResult {
  success: boolean;
  count: number;
  error?: string;
}

export interface CloudPublishResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CloudDownloadResult {
  success: boolean;
  action: 'created' | 'updated';
  templateName: string;
  error?: string;
}

export class TemplateCloudService {
  /**
   * Fast verification of backend connectivity.
   */
  static async checkAvailability(force = false): Promise<boolean> {
    return isSupabaseOnline(force);
  }

  /**
   * Fetches the complete catalog of cloud templates from Supabase.
   */
  static async fetchCatalog(): Promise<{ templates: CloudTemplate[]; error: string | null }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { templates: [], error: 'Sin conexión a internet' };
    }

    const online = await this.checkAvailability();
    if (!online) {
      return { templates: [], error: 'Sin conexión con el backend' };
    }

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, content, type, statistics_category, statistics_sub_categories, statistics_rules, disable_main_stat_on_apoyo, disabled_sub_categories_on_apoyo')
        .order('name');

      if (error) throw error;
      return { templates: data || [], error: null };
    } catch (err: any) {
      logger.error('Failed to fetch cloud templates catalog', err);
      return { templates: [], error: getUserFriendlyErrorMessage(err) };
    }
  }

  /**
   * Downloads a single cloud template into the local RxDB workspace,
   * handling updates or inserts seamlessly.
   */
  static async downloadTemplate(
    db: any,
    currentWorkspace: string,
    cloudTemplate: CloudTemplate,
    localTemplates: Template[]
  ): Promise<CloudDownloadResult> {
    if (!db || !currentWorkspace) {
      return { success: false, action: 'created', templateName: cloudTemplate.name, error: 'Base de datos no disponible' };
    }

    const online = await this.checkAvailability();
    if (!online) {
      return { success: false, action: 'created', templateName: cloudTemplate.name, error: 'Sin conexión con el backend' };
    }

    const existing = localTemplates.find((t) => t.name === cloudTemplate.name);

    try {
      if (existing) {
        const updatedTemplate: Template = {
          ...existing,
          content: cloudTemplate.content,
          type: cloudTemplate.type || existing.type || 'normal',
          statistics_category: cloudTemplate.statistics_category || existing.statistics_category,
          statistics_sub_categories: cloudTemplate.statistics_sub_categories || existing.statistics_sub_categories,
          statistics_rules: cloudTemplate.statistics_rules || existing.statistics_rules,
          disable_main_stat_on_apoyo:
            cloudTemplate.disable_main_stat_on_apoyo !== undefined
              ? cloudTemplate.disable_main_stat_on_apoyo
              : existing.disable_main_stat_on_apoyo,
          disabled_sub_categories_on_apoyo:
            cloudTemplate.disabled_sub_categories_on_apoyo !== undefined
              ? cloudTemplate.disabled_sub_categories_on_apoyo
              : existing.disabled_sub_categories_on_apoyo,
        };

        const doc = await db.templates.findOne(existing.id).exec();
        if (doc) {
          await doc.patch(updatedTemplate);
        } else {
          await db.templates.upsert(updatedTemplate);
        }

        return { success: true, action: 'updated', templateName: cloudTemplate.name };
      } else {
        const newTemplate: Template = {
          id: generateId('template'),
          workspace_id: currentWorkspace,
          name: cloudTemplate.name,
          content: cloudTemplate.content,
          type: cloudTemplate.type || 'normal',
          is_active: true,
          statistics_category: cloudTemplate.statistics_category,
          statistics_sub_categories: cloudTemplate.statistics_sub_categories,
          statistics_rules: cloudTemplate.statistics_rules,
          disable_main_stat_on_apoyo: cloudTemplate.disable_main_stat_on_apoyo,
          disabled_sub_categories_on_apoyo: cloudTemplate.disabled_sub_categories_on_apoyo,
        };

        await db.templates.insert(newTemplate);
        return { success: true, action: 'created', templateName: cloudTemplate.name };
      }
    } catch (err: any) {
      logger.error('Error downloading template', { name: cloudTemplate.name, err });
      return { success: false, action: existing ? 'updated' : 'created', templateName: cloudTemplate.name, error: getUserFriendlyErrorMessage(err) };
    }
  }

  /**
   * Bulk downloads multiple cloud templates into the local workspace.
   */
  static async downloadBulk(
    db: any,
    currentWorkspace: string,
    cloudTemplates: CloudTemplate[],
    localTemplates: Template[]
  ): Promise<CloudSyncResult> {
    if (!db || !currentWorkspace || cloudTemplates.length === 0) {
      return { success: true, count: 0 };
    }

    const online = await this.checkAvailability();
    if (!online) {
      return { success: false, count: 0, error: 'Sin conexión con el backend' };
    }

    let successCount = 0;
    for (const ct of cloudTemplates) {
      const res = await this.downloadTemplate(db, currentWorkspace, ct, localTemplates);
      if (res.success) {
        successCount++;
      }
    }

    return { success: true, count: successCount };
  }

  /**
   * Synchronizes all global templates from cloud to local RxDB storage,
   * performing local deduplication and JSON deserialization.
   */
  static async syncAll(db: any, currentWorkspace: string | null): Promise<CloudSyncResult> {
    if (!db) return { success: false, count: 0, error: 'Base de datos no inicializada' };

    const online = await this.checkAvailability(true);
    if (!online) {
      return { success: false, count: 0, error: 'Sin conexión con el backend para sincronizar plantillas' };
    }

    try {
      logger.info('Starting manual template sync from cloud...');

      const { data: cloudTemplates, error: tError } = await supabase
        .from('templates')
        .select('*')
        .is('workspace_id', null);

      if (tError) throw tError;

      const templateCount = cloudTemplates?.length || 0;
      if (templateCount === 0) {
        return { success: true, count: 0 };
      }

      for (const t of cloudTemplates) {
        const {
          id,
          name,
          content,
          type,
          is_active,
          workspace_id,
          statistics_category,
          statistics_rules,
          statistics_sub_categories,
          disable_main_stat_on_apoyo,
          disabled_sub_categories_on_apoyo,
        } = t;

        // Deduplication safeguard
        const existingByName = await db.templates.findOne({
          selector: {
            name,
            id: { $ne: id },
            workspace_id: workspace_id || null,
          },
        }).exec();

        if (existingByName) {
          logger.info(`Deduplicating local template "${name}" (removing old ID "${existingByName.id}" in favor of "${id}")`);
          await existingByName.remove();
        }

        await db.templates.upsert({
          id,
          name,
          content,
          type: type || 'normal',
          is_active: is_active !== undefined ? is_active : true,
          workspace_id: workspace_id || null,
          statistics_category,
          statistics_rules: typeof statistics_rules === 'string' ? JSON.parse(statistics_rules) : statistics_rules,
          statistics_sub_categories: typeof statistics_sub_categories === 'string' ? JSON.parse(statistics_sub_categories) : statistics_sub_categories,
          disable_main_stat_on_apoyo: disable_main_stat_on_apoyo ?? null,
          disabled_sub_categories_on_apoyo: typeof disabled_sub_categories_on_apoyo === 'string' ? JSON.parse(disabled_sub_categories_on_apoyo) : (disabled_sub_categories_on_apoyo ?? null),
        });
      }

      return { success: true, count: templateCount };
    } catch (err: any) {
      logger.error('Failed to sync templates from cloud', err);
      return { success: false, count: 0, error: getUserFriendlyErrorMessage(err) };
    }
  }

  /**
   * Publishes a local template to the cloud server.
   */
  static async publishTemplate(template: Template): Promise<CloudPublishResult> {
    const online = await this.checkAvailability(true);
    if (!online) {
      return { success: false, error: 'Sin conexión con el backend para subir la plantilla' };
    }

    if (!template.name || !template.content) {
      return { success: false, error: 'La plantilla debe tener un nombre y contenido válidos' };
    }

    try {
      const { data, error } = await supabase
        .from('templates')
        .upsert(
          [
            {
              id: template.id,
              name: template.name,
              content: template.content,
              type: template.type || 'normal',
              workspace_id: null,
              statistics_category: template.statistics_category,
              statistics_sub_categories: template.statistics_sub_categories,
              statistics_rules: template.statistics_rules,
              disable_main_stat_on_apoyo: template.disable_main_stat_on_apoyo,
              disabled_sub_categories_on_apoyo: template.disabled_sub_categories_on_apoyo,
            },
          ],
          { onConflict: 'name' }
        )
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      logger.error('Failed to publish template to cloud', err);
      return { success: false, error: getUserFriendlyErrorMessage(err) };
    }
  }

  /**
   * Initial one-time bootstrap from Supabase for empty workspaces.
   */
  static async bootstrapWorkspace(
    db: any,
    currentWorkspace: string,
    isCloud: boolean
  ): Promise<CloudSyncResult> {
    const online = await this.checkAvailability();
    if (!online) {
      return { success: false, count: 0, error: 'Backend no disponible' };
    }

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, content, type, statistics_category, statistics_sub_categories, statistics_rules, disable_main_stat_on_apoyo, disabled_sub_categories_on_apoyo');

      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: true, count: 0 };
      }

      const existingTemplates = await db.templates.find({
        selector: isCloud ? { workspace_id: null } : { workspace_id: currentWorkspace },
      }).exec();
      const existingNames = new Set(existingTemplates.map((t: any) => t.name));

      const newTemplates = data
        .filter((ct: any) => !existingNames.has(ct.name))
        .map((ct: any) => ({
          id: ct.id,
          workspace_id: isCloud ? null : currentWorkspace,
          name: ct.name,
          content: ct.content,
          type: ct.type || 'normal',
          is_active: true,
          statistics_category: ct.statistics_category,
          statistics_sub_categories: ct.statistics_sub_categories,
          statistics_rules: ct.statistics_rules,
          disable_main_stat_on_apoyo: ct.disable_main_stat_on_apoyo,
          disabled_sub_categories_on_apoyo: ct.disabled_sub_categories_on_apoyo,
        }));

      if (newTemplates.length > 0) {
        logger.info('Inserting unique cloud bootstrap templates', { count: newTemplates.length });
        await db.templates.bulkInsert(newTemplates);
      }

      return { success: true, count: newTemplates.length };
    } catch (err: any) {
      logger.error('Failed to bootstrap workspace templates', err);
      return { success: false, count: 0, error: getUserFriendlyErrorMessage(err) };
    }
  }
}
