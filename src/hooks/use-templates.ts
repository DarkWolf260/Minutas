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

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import type { Template, TemplateConfig, FieldConfig, SectionConfig } from '@/lib/types';
import { parseTemplate } from '@/lib/template-parser';
import { useFieldDefinitions } from './use-field-definitions';
import { useSettings } from './use-settings';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { TemplateSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { stableStringify } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils/id';

const getUserFriendlyErrorMessage = (error: any) => {
  if (error?.message) return error.message;
  return 'Error desconocido';
};

// Global lock to prevent multiple instances from bootstrapping the same workspace
const bootstrapLocks: Record<string, boolean> = {};

export function useTemplates() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [configs, setConfigs] = useState<Record<string, TemplateConfig>>({});
  const [isTemplatesLoaded, setIsTemplatesLoaded] = useState(false);
  const [isConfigsLoaded, setIsConfigsLoaded] = useState(false);

  const { definitions: globalDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { isLoaded: settingsLoaded } = useSettings();

  // Use a ref to track what was last synced to the DB to break the update loop
  const lastSyncedConfigsRef = useRef<string>('');

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const subTemplates = db.templates.find({
      selector: { workspaceId: currentWorkspace }
    }).$.subscribe(data => {
      setTemplates(data.map(d => d.toJSON()) as Template[]);
      setIsTemplatesLoaded(true);
    });

    const subConfigs = db.configs
      .find({
        selector: { 
          type: 'template_config',
          workspaceId: currentWorkspace
        },
      })
      .$.subscribe((data) => {
        const configMap: Record<string, TemplateConfig> = {};
        data.forEach((d) => {
          const item = d.toJSON();
          configMap[item.name || ''] = item.data as TemplateConfig;
        });
        setConfigs(configMap);
        setIsConfigsLoaded(true);
      });

    return () => {
      subTemplates.unsubscribe();
      subConfigs.unsubscribe();
    };
  }, [db, currentWorkspace]);

  // Caché de parse para evitar re-parsing innecesario
  const parsedTemplates = useMemo(() => {
    const cache = new Map();
    templates.forEach(template => {
      const cacheKey = `${template.id}-${template.content.length}`;
      cache.set(cacheKey, parseTemplate(template.content));
    });
    return cache;
  }, [templates]);

  // Optimize config synchronization to avoid unnecessary writes and re-renders
  useEffect(() => {
    if (isTemplatesLoaded && definitionsLoaded && templates.length > 0 && db && currentWorkspace) {
      const newConfigs: Record<string, TemplateConfig> = {};
      let hasSignificantChanges = false;

      templates.forEach(template => {
        const cacheKey = `${template.id}-${template.content.length}`;
        const parsed = parsedTemplates.get(cacheKey);
        const existingConfig = configs[template.id] || { fields: {}, sections: [], layout: [] };

        const finalConfig: TemplateConfig = {
          sections: parsed.sections.map((parsedSection: SectionConfig) => {
            const existingSection = (existingConfig.sections || []).find((s: SectionConfig) => s.label === parsedSection.label);
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

        // Check if this specific template config actually changed from what we have in state
        const configStr = stableStringify(finalConfig);
        const existingStr = stableStringify(existingConfig);

        if (configStr !== existingStr) {
          hasSignificantChanges = true;
        }
      });

      if (hasSignificantChanges) {
        const fullNewConfigsStr = stableStringify(newConfigs);
        lastSyncedConfigsRef.current = fullNewConfigsStr;

        // Use a small timeout to debounce bulkUpsert if multiple renders happen quickly
        const timeoutId = setTimeout(() => {
          const entries = Object.entries(newConfigs).map(([id, config]) => ({
            id: `template_config:${id}`,
            workspaceId: currentWorkspace,
            type: 'template_config' as const,
            name: id,
            data: config,
          }));
          
          db.configs.bulkUpsert(entries as any).catch((err: any) =>
            logger.error('Failed to sync template configs', err, { feature: 'Templates' })
          );
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isTemplatesLoaded, definitionsLoaded, templates, db, currentWorkspace, parsedTemplates, globalDefinitions]);

  // Bootstrap initial templates from Cloud if local list is empty
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  useEffect(() => {
    if (isTemplatesLoaded && templates.length === 0 && db && currentWorkspace) {
      // Check global lock for this specific workspace
      if (bootstrapLocks[currentWorkspace]) return;
      bootstrapLocks[currentWorkspace] = true;
      
      const doBootstrap = async () => {
        setIsBootstrapping(true);
        const toastId = toast.loading('Sincronizando plantillas de la comunidad...');
        
        try {
          const { data, error } = await supabase
            .from('community_templates')
            .select('*');

          if (error) throw error;
          if (!data || data.length === 0) {
            toast.dismiss(toastId);
            return;
          }

          logger.info('Bootstrapping templates from cloud', { count: data.length });
          
          // Bulk insert into templates
          const newTemplates = data.map(ct => ({
            id: generateId('template'),
            workspaceId: currentWorkspace,
            name: ct.name,
            content: ct.content,
            type: ct.type || 'normal',
            isActive: true,
          }));

          await db.templates.bulkInsert(newTemplates);
          toast.success(`${data.length} plantillas sincronizadas automáticamente.`, { id: toastId });
        } catch (err) {
          logger.error('Failed to bootstrap templates', err);
          toast.error('No se pudieron descargar las plantillas iniciales.', { id: toastId });
        } finally {
          setIsBootstrapping(false);
        }
      };

      doBootstrap();
    }
  }, [isTemplatesLoaded, templates.length, db, currentWorkspace]);

  const addTemplate = async (newTemplate: Template) => {
    if (!db || !currentWorkspace) return;
    try {
      // Validate with Zod first
      const validatedTemplate = TemplateSchema.parse({
        ...newTemplate,
        workspaceId: currentWorkspace
      });

      const { sections, layout, fieldNames, fieldTypes, templateOptions, errors } = parseTemplate(validatedTemplate.content);

      if (errors.length > 0) {
        toast.error(`La plantilla tiene errores: ${errors[0]}`);
        logger.warn('Template has parsing errors', { id: validatedTemplate.id, errors });
      } else {
        toast.success(`Plantilla "${validatedTemplate.name}" agregada correctamente.`);
        logger.info('Template added', { id: validatedTemplate.id, name: validatedTemplate.name, workspaceId: currentWorkspace });
      }

      await db.templates.insert({ ...validatedTemplate, isActive: errors.length === 0 });

      const newConfig: TemplateConfig = { fields: {}, sections, layout };
      fieldNames.forEach((fieldName: string) => {
        newConfig.fields[fieldName] = {
          ...(globalDefinitions[fieldName] || { type: 'text', label: fieldName }),
        };
        const typeFromTemplate = fieldTypes.get(fieldName);
        if (typeFromTemplate) {
          const field = newConfig.fields[fieldName];
          if (field) field.type = typeFromTemplate;
        }
        const optionsFromTemplate = templateOptions.get(fieldName);
        if (optionsFromTemplate) {
          const field = newConfig.fields[fieldName];
          if (field) field.snippetOptions = optionsFromTemplate;
        }
      });

      await db.configs.upsert({
        id: `template_config:${validatedTemplate.id}`,
        workspaceId: currentWorkspace,
        type: 'template_config',
        name: validatedTemplate.id,
        data: newConfig,
      } as any);

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

      const configDoc = await db.configs.findOne(`template_config:${templateId}`).exec();
      if (configDoc) await configDoc.remove();

      logger.info('Template removed', { id: templateId });
      toast.success('Plantilla eliminada.');
    } catch (error) {
      logger.error('Failed to remove template', error);
      toast.error('Error al eliminar la plantilla.');
    }
  };

  const updateTemplateConfig = async (templateId: string, config: TemplateConfig) => {
    if (!db || !currentWorkspace) return;
    try {
      await db.configs.upsert({
        id: `template_config:${templateId}`,
        workspaceId: currentWorkspace,
        type: 'template_config',
        name: templateId,
        data: config,
      } as any);
      toast.success('Configuración de campos actualizada.');
    } catch (error) {
      logger.error('Failed to update template config', error, { feature: 'Templates', metadata: { templateId } });
    }
  };

  const updateTemplate = async (updatedTemplate: Template) => {
    if (!db || !currentWorkspace) return;
    try {
      // Validate with Zod
      const validatedTemplate = TemplateSchema.parse({
        ...updatedTemplate,
        workspaceId: currentWorkspace
      });

      const doc = await db.templates.findOne(validatedTemplate.id).exec();
      if (doc) {
        await doc.patch(validatedTemplate);
        logger.info('Template updated', { id: validatedTemplate.id, workspaceId: currentWorkspace });
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
    if (!db || !currentWorkspace) return;
    
    // Prevent auto-bootstrap from triggering immediately after manual clear
    bootstrapLocks[currentWorkspace] = true;
    
    const allTemplates = await db.templates.find({
      selector: { workspaceId: currentWorkspace }
    }).exec();
    await Promise.all(allTemplates.map(d => d.remove()));
    const allConfigs = await db.configs.find({ 
      selector: { 
        type: 'template_config',
        workspaceId: currentWorkspace
      } 
    }).exec();
    await Promise.all(allConfigs.map((d: any) => d.remove()));
  }, [db, currentWorkspace]);

  return useMemo(() => ({
    templates,
    configs,
    addTemplate,
    removeTemplate,
    updateTemplate,
    updateTemplateConfig,
    toggleTemplateActive,
    clearAllTemplates,
    isLoaded: isTemplatesLoaded && definitionsLoaded && settingsLoaded
  }), [
    templates, 
    configs, 
    addTemplate, 
    removeTemplate, 
    updateTemplate, 
    updateTemplateConfig, 
    toggleTemplateActive, 
    clearAllTemplates, 
    isTemplatesLoaded, 
    definitionsLoaded, 
    settingsLoaded
  ]);
}
