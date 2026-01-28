/**
 * Hook for managing report templates with field configuration.
 * 
 * Manages templates and their field configurations with automatic parsing,
 * validation, and migration support. Handles dual storage for templates
 * and their associated field configurations.
 * 
 * @returns Template state and operations
 * @property {Template[]} templates - List of all templates
 * @property {Record<string, TemplateConfig>} configs - Field configs per template
 * @property {(template: Template) => void} addTemplate - Create new template
 * @property {(id: string) => void} removeTemplate - Delete template
 * @property {(template: Template) => void} updateTemplate - Update template
 * @property {(id: string, config: TemplateConfig) => void} updateTemplateConfig - Update field config
 * @property {(id: string) => void} toggleTemplateActive - Toggle template active state
 * @property {() => void} clearAllTemplates - Delete all templates
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { templates, addTemplate, configs } = useTemplates();
 * 
 * addTemplate({
 *   id: 'new-template',
 *   name: 'Reporte de Emergencia',
 *   content: '{Fecha}\n{Hora}\n...'
 * });
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Template, TemplateConfig, FieldConfig } from '@/types';
import { parseTemplate } from '@/lib/template-parser';
import { useFieldDefinitions } from './use-field-definitions';
import { useSettings } from './use-settings';
import { useDatabase } from '@/lib/db/db-provider';
import { TemplateSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';

export function useTemplates() {
  const db = useDatabase();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [configs, setConfigs] = useState<Record<string, TemplateConfig>>({});
  const [isTemplatesLoaded, setIsTemplatesLoaded] = useState(false);
  const [isConfigsLoaded, setIsConfigsLoaded] = useState(false);

  const { definitions: globalDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { settings, isLoaded: settingsLoaded } = useSettings();

  useEffect(() => {
    if (!db) return;

    const subTemplates = db.templates.find().$.subscribe(data => {
      setTemplates(data.map(d => d.toJSON()) as Template[]);
      setIsTemplatesLoaded(true);
    });

    const subConfigs = db.template_configs.find().$.subscribe(data => {
      const configMap: Record<string, TemplateConfig> = {};
      data.forEach(d => {
        const item = d.toJSON();
        configMap[item.id] = item.config as TemplateConfig;
      });
      setConfigs(configMap);
      setIsConfigsLoaded(true);
    });

    return () => {
      subTemplates.unsubscribe();
      subConfigs.unsubscribe();
    };
  }, [db]);

  // Caché de parse para evitar re-parsing innecesario
  const parsedTemplates = useMemo(() => {
    const cache = new Map();
    templates.forEach(template => {
      const cacheKey = `${template.id}-${template.content.length}`;
      cache.set(cacheKey, parseTemplate(template.content));
    });
    return cache;
  }, [templates]);

  useEffect(() => {
    if (isTemplatesLoaded && definitionsLoaded && templates.length > 0 && db) {
      const newConfigs: Record<string, TemplateConfig> = {};
      let changed = false;

      templates.forEach(template => {
        const cacheKey = `${template.id}-${template.content.length}`;
        const parsed = parsedTemplates.get(cacheKey);
        const existingConfig = configs[template.id] || { fields: {}, sections: [], layout: [] };

        const finalConfig: TemplateConfig = {
          sections: parsed.sections.map((parsedSection: any) => {
            const existingSection = (existingConfig.sections || []).find((s: any) => s.label === parsedSection.label);
            return {
              ...parsedSection,
              statisticsCategory: existingSection?.statisticsCategory
            };
          }),
          layout: parsed.layout,
          fields: {}
        };

        parsed.fieldNames.forEach((fieldName: string) => {
          const existingFieldConfig = existingConfig.fields[fieldName];
          const globalDef = globalDefinitions[fieldName];
          const typeFromTemplate = parsed.fieldTypes.get(fieldName);
          const optionsFromTemplate = parsed.templateOptions.get(fieldName);

          const baseConfig: FieldConfig = {
            type: 'text',
            label: fieldName,
            ...globalDef,
            ...existingFieldConfig,
          };

          if (typeFromTemplate) {
            baseConfig.type = typeFromTemplate;
          } else if (globalDef?.type) {
            baseConfig.type = globalDef.type;
          }

          if (optionsFromTemplate) {
            baseConfig.snippetOptions = optionsFromTemplate;
          }

          finalConfig.fields[fieldName] = baseConfig;
        });

        newConfigs[template.id] = finalConfig;
      });

      // Check if actually changed to avoid infinite loop
      if (JSON.stringify(newConfigs) !== JSON.stringify(configs)) {
        changed = true;
      }

      if (changed) {
        // Persist change to RxDB
        const entries = Object.entries(newConfigs).map(([id, config]) => ({ id, config }));
        db.template_configs.bulkUpsert(entries).catch(err => logger.error('Failed to sync template configs', err, { feature: 'Templates' }));
      }
    }
  }, [isTemplatesLoaded, isConfigsLoaded, definitionsLoaded, templates, db, parsedTemplates, configs, globalDefinitions]);

  const addTemplate = async (newTemplate: Template) => {
    if (!db) return;
    try {
      // Validate with Zod first
      const validatedTemplate = TemplateSchema.parse(newTemplate);

      const { sections, layout, fieldNames, fieldTypes, templateOptions, errors } = parseTemplate(validatedTemplate.content);

      if (errors.length > 0) {
        toast.error(`La plantilla tiene errores: ${errors[0]}`);
        logger.warn('Template has parsing errors', { id: validatedTemplate.id, errors });
      } else {
        toast.success(`Plantilla "${validatedTemplate.name}" agregada correctamente.`);
        logger.info('Template added', { id: validatedTemplate.id, name: validatedTemplate.name });
      }

      await db.templates.insert({ ...validatedTemplate, isActive: errors.length === 0 });

      const newConfig: TemplateConfig = { fields: {}, sections, layout };
      fieldNames.forEach(fieldName => {
        newConfig.fields[fieldName] = {
          ...(globalDefinitions[fieldName] || { type: 'text', label: fieldName }),
        };
        const typeFromTemplate = fieldTypes.get(fieldName);
        if (typeFromTemplate) newConfig.fields[fieldName].type = typeFromTemplate;
        const optionsFromTemplate = templateOptions.get(fieldName);
        if (optionsFromTemplate) newConfig.fields[fieldName].snippetOptions = optionsFromTemplate;
      });

      await db.template_configs.upsert({ id: validatedTemplate.id, config: newConfig });

    } catch (error) {
      logger.error('Error adding template', error);
      toast.error(getUserFriendlyErrorMessage(error));
    }
  };

  const removeTemplate = async (templateId: string) => {
    if (!db) return;
    try {
      const templateDoc = await db.templates.findOne(templateId).exec();
      if (templateDoc) await templateDoc.remove();

      const configDoc = await db.template_configs.findOne(templateId).exec();
      if (configDoc) await configDoc.remove();

      logger.info('Template removed', { id: templateId });
      toast.success('Plantilla eliminada.');
    } catch (error) {
      logger.error('Failed to remove template', error);
      toast.error('Error al eliminar la plantilla.');
    }
  };

  const updateTemplateConfig = async (templateId: string, config: TemplateConfig) => {
    if (!db) return;
    try {
      await db.template_configs.upsert({ id: templateId, config });
      toast.success('Configuración de campos actualizada.');
    } catch (error) {
      logger.error('Failed to update template config', error, { feature: 'Templates', metadata: { templateId } });
    }
  };

  const updateTemplate = async (updatedTemplate: Template) => {
    if (!db) return;
    try {
      // Validate with Zod
      const validatedTemplate = TemplateSchema.parse(updatedTemplate);

      const doc = await db.templates.findOne(validatedTemplate.id).exec();
      if (doc) {
        await doc.patch(validatedTemplate);
        logger.info('Template updated', { id: validatedTemplate.id });
        toast.success('Plantilla actualizada.');
      } else {
        toast.error('Plantilla no encontrada.');
      }
    } catch (error) {
      logger.error('Failed to update template', error);
      toast.error(getUserFriendlyErrorMessage(error));
    }
  };

  const toggleTemplateActive = useCallback(async (templateId: string) => {
    if (!db) return;
    const doc = await db.templates.findOne(templateId).exec();
    if (doc) {
      await doc.patch({ isActive: !(doc.toJSON().isActive ?? true) });
    }
  }, [db]);

  const clearAllTemplates = useCallback(async () => {
    if (!db) return;
    const allTemplates = await db.templates.find().exec();
    await Promise.all(allTemplates.map(d => d.remove()));
    const allConfigs = await db.template_configs.find().exec();
    await Promise.all(allConfigs.map(d => d.remove()));
  }, [db]);

  return {
    templates,
    configs,
    addTemplate,
    removeTemplate,
    updateTemplate,
    updateTemplateConfig,
    toggleTemplateActive,
    clearAllTemplates,
    isLoaded: isTemplatesLoaded && definitionsLoaded && settingsLoaded
  };
}
