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
import { createConfigRepository, createTemplateRepository, DbKeys } from '@/lib/repositories';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { useAdmin } from './use-admin';


// Global lock to prevent multiple instances from bootstrapping the same workspace
const bootstrapLocks: Record<string, boolean> = {};

export function useTemplates() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const { isAdmin } = useAdmin();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplatesLoaded, setIsTemplatesLoaded] = useState(false);

  const { definitions: globalDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { isLoaded: settingsLoaded } = useSettings();

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const templateRepo = createTemplateRepository(db, currentWorkspace, isCloud);
    const subTemplates = templateRepo.watchAll().subscribe(data => {
      setTemplates(data);
      setIsTemplatesLoaded(true);
    });

    return () => {
      subTemplates.unsubscribe();
    };
  }, [db, currentWorkspace, isCloud]);

  // Caché de parse para evitar re-parsing innecesario
  const parsedTemplates = useMemo(() => {
    const cache = new Map();
    templates.forEach(template => {
      const cacheKey = `${template.id}-${template.content.length}`;
      cache.set(cacheKey, parseTemplate(template.content));
    });
    return cache;
  }, [templates]);

  // Calcular las configuraciones de plantilla en memoria
  const configs = useMemo(() => {
    if (!isTemplatesLoaded || !definitionsLoaded || templates.length === 0) {
      return {};
    }

    const newConfigs: Record<string, TemplateConfig> = {};

    templates.forEach(template => {
      const cacheKey = `${template.id}-${template.content.length}`;
      const parsed = parsedTemplates.get(cacheKey);
      if (!parsed) return;

      const finalConfig: TemplateConfig = {
        sections: parsed.sections.map((parsedSection: SectionConfig) => {
          return {
            ...parsedSection,
            statistics_category: parsedSection.statistics_category
          };
        }),
        layout: parsed.layout,
        fields: {},
      };

      parsed.fieldNames.forEach((fieldName: string) => {
        const globalDef = globalDefinitions[fieldName];
        const typeFromTemplate = parsed.fieldTypes.get(fieldName);
        const optionsFromTemplate = parsed.templateOptions.get(fieldName);

        const baseConfig: FieldConfig = {
          type: 'text',
          label: fieldName,
          ...globalDef,
        };

        if (typeFromTemplate) {
          baseConfig.type = typeFromTemplate;
        } else if (globalDef?.type) {
          baseConfig.type = globalDef.type;
        }

        if (optionsFromTemplate) {
          baseConfig.snippet_options = optionsFromTemplate;
        }

        const modifiersFromTemplate = parsed.fieldModifiers.get(fieldName);
        if (modifiersFromTemplate) {
          baseConfig.modifiers = modifiersFromTemplate;
        }

        finalConfig.fields[fieldName] = baseConfig;
      });

      newConfigs[template.id] = finalConfig;
    });

    return newConfigs;
  }, [isTemplatesLoaded, definitionsLoaded, templates, parsedTemplates, globalDefinitions]);

  // Bootstrap initial templates from Cloud ONLY if:
  //   1. No local templates exist yet
  //   2. The user explicitly opted in during onboarding (minutas-template-bootstrap-ok)
  //   3. The setup flow has been completed (minutas-setup-complete-v1)
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  useEffect(() => {
    if (isTemplatesLoaded && templates.length === 0 && db && currentWorkspace) {
      // Check global lock for this specific workspace
      if (bootstrapLocks[currentWorkspace]) return;

      // Respect the user's choice from onboarding — don't auto-download if they skipped
      let userOptedIn = false;
      try {
        userOptedIn = localStorage.getItem('minutas-template-bootstrap-ok') === 'true';
      } catch {
        userOptedIn = sessionStorage.getItem('minutas-template-bootstrap-ok') === 'true';
      }
      if (!userOptedIn) return;

      bootstrapLocks[currentWorkspace] = true;
      
      const doBootstrap = async () => {
        setIsBootstrapping(true);
        const toastId = toast.loading('Sincronizando plantillas...');
        
        try {
          const { data, error } = await supabase
            .from('templates')
            .select('id, name, content, type, statistics_category, statistics_sub_categories, statistics_rules');

          if (error) throw error;
          if (!data || data.length === 0) {
            toast.dismiss(toastId);
            return;
          }

          logger.info('Bootstrapping templates from cloud', { count: data.length });
          
          // 1. Fetch existing template names in this workspace to avoid duplicates
          const existingTemplates = await db.templates.find({
            selector: { workspace_id: currentWorkspace }
          }).exec();
          const existingNames = new Set(existingTemplates.map(t => t.name));

          // 2. Filter out already existing templates by name
          const newTemplates = data
            .filter(ct => !existingNames.has(ct.name))
            .map(ct => ({
              id: generateId('template'),
              workspace_id: currentWorkspace,
              name: ct.name,
              content: ct.content,
              type: ct.type || 'normal',
              is_active: true,
              statistics_category: ct.statistics_category,
              statistics_sub_categories: ct.statistics_sub_categories,
              statistics_rules: ct.statistics_rules,
            }));

          if (newTemplates.length > 0) {
            logger.info('Inserting unique cloud templates', { count: newTemplates.length });
            await db.templates.bulkInsert(newTemplates);
            toast.success(`${newTemplates.length} plantillas sincronizadas automáticamente.`, { id: toastId });
          } else {
            toast.dismiss(toastId);
          }

          // Clear the one-time bootstrap flag so it doesn't run again
          try {
            localStorage.removeItem('minutas-template-bootstrap-ok');
          } catch {
            sessionStorage.removeItem('minutas-template-bootstrap-ok');
          }
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
      const validatedTemplate = TemplateSchema.parse({
        ...newTemplate,
        workspace_id: currentWorkspace,
      });

      const { errors } = parseTemplate(validatedTemplate.content);

      if (errors.length > 0) {
        toast.error(`La plantilla tiene errores: ${errors[0]}`);
        logger.warn('Template has parsing errors', { id: validatedTemplate.id, errors });
      } else {
        toast.success(`Plantilla "${validatedTemplate.name}" agregada correctamente.`);
        logger.info('Template added', {
          id: validatedTemplate.id,
          name: validatedTemplate.name,
          workspace_id: currentWorkspace,
        });
      }

      const templateRepo = createTemplateRepository(db, currentWorkspace, isCloud);
      await templateRepo.add({ ...validatedTemplate, is_active: errors.length === 0 });
    } catch (error) {
      logger.error('Error adding template', error);
      toast.error(getUserFriendlyErrorMessage(error));
    }
  };

  const removeTemplate = async (template_id: string) => {
    if (!db || !currentWorkspace) return;
    const repo = createTemplateRepository(db, currentWorkspace, isCloud);
    await repo.remove(template_id);
    logger.info('Template removed', { id: template_id });
  };

  const updateTemplate = async (updatedTemplate: Template): Promise<string | undefined> => {
    if (!db || !currentWorkspace) return;
    try {
      if (isCloud && !isAdmin) {
        const errMsg = 'No tienes permisos para modificar las plantillas en la nube.';
        logger.error(errMsg);
        toast.error(errMsg);
        return undefined;
      }

      const validatedTemplate = TemplateSchema.parse({
        ...updatedTemplate,
        workspace_id: isCloud ? null : currentWorkspace,
      });
      const repo = createTemplateRepository(db, currentWorkspace, isCloud);
      await repo.update(validatedTemplate);
      logger.info('Template updated', { id: validatedTemplate.id, workspace_id: validatedTemplate.workspace_id });
      return validatedTemplate.id;
    } catch (error) {
      logger.error('Failed to update template', error);
      toast.error(getUserFriendlyErrorMessage(error));
      return undefined;
    }
  };

  const toggleTemplateActive = useCallback(async (template_id: string) => {
    if (!db || !currentWorkspace) return;
    const repo = createTemplateRepository(db, currentWorkspace, isCloud);
    await repo.toggle(template_id);
  }, [db, currentWorkspace, isCloud]);

  const clearAllTemplates = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    // Prevent auto-bootstrap from triggering immediately after manual clear
    bootstrapLocks[currentWorkspace] = true;
    const repo = createTemplateRepository(db, currentWorkspace, isCloud);
    await repo.clearAll();
  }, [db, currentWorkspace, isCloud]);

  return useMemo(() => ({
    templates,
    configs,
    addTemplate,
    removeTemplate,
    updateTemplate,
    toggleTemplateActive,
    clearAllTemplates,
    isLoaded: isTemplatesLoaded && definitionsLoaded && settingsLoaded
  }), [
    templates, 
    configs, 
    addTemplate, 
    removeTemplate, 
    updateTemplate, 
    toggleTemplateActive, 
    clearAllTemplates, 
    isTemplatesLoaded, 
    definitionsLoaded, 
    settingsLoaded
  ]);
}



