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
import type { Template, TemplateConfig } from '@/types';
import { parseTemplate } from '@/lib/template-parser';
import { useFieldDefinitions } from './use-field-definitions';
import { useSettings } from './use-settings';
import { useLocalStorage } from './use-local-storage';

const TEMPLATES_STORAGE_KEY = 'app-templates';
const TEMPLATE_CONFIGS_STORAGE_KEY = 'app-template-configs';

export function useTemplates() {
  const [templates, setTemplates, isTemplatesLoaded] = useLocalStorage<Template[]>(
    TEMPLATES_STORAGE_KEY,
    [],
    {
      migrate: (initialTemplates: any[]) => {
        return initialTemplates.map((t: Template) => ({ ...t, isActive: t.isActive ?? true }));
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} templates:`, error);
        if (operation === 'load') {
          toast.error('Error al cargar las plantillas.');
        } else {
          toast.error('No se pudo guardar la plantilla en el almacenamiento.');
        }
      }
    }
  );

  const [configs, setConfigs, isConfigsLoaded] = useLocalStorage<Record<string, TemplateConfig>>(
    TEMPLATE_CONFIGS_STORAGE_KEY,
    {},
    {
      onError: (error, operation) => {
        console.error(`Failed to ${operation} template configs:`, error);
        if (operation === 'save') {
          toast.error('Error al guardar la configuración de la plantilla.');
        }
      }
    }
  );

  const { definitions: globalDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { settings, isLoaded: settingsLoaded } = useSettings();

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
    if (isTemplatesLoaded && definitionsLoaded && templates.length > 0) {
      const newConfigs: Record<string, TemplateConfig> = {};

      templates.forEach(template => {
        const cacheKey = `${template.id}-${template.content.length}`;
        const parsed = parsedTemplates.get(cacheKey);
        const existingConfig = configs[template.id] || { fields: {}, sections: [], layout: [] };

        const finalConfig: TemplateConfig = {
          sections: parsed.sections.map((parsedSection: any) => {
            // Unir por label es más estable que por ID auto-incrementado cuando cambia el texto
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
            type: 'text', // Default type
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

      if (JSON.stringify(newConfigs) !== JSON.stringify(configs)) {
        setConfigs(newConfigs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTemplatesLoaded, definitionsLoaded, templates]);




  const addTemplate = (newTemplate: Template) => {
    try {
      const { sections, layout, fieldNames, fieldTypes, templateOptions, errors } = parseTemplate(newTemplate.content);

      if (errors.length > 0) {
        toast.error(`La plantilla tiene errores: ${errors[0]}`);
        // We still allow adding it so they can fix it, but warn them? 
        // Text files are edited externally usually. Or maybe we block it?
        // Let's add it but warn.
      } else {
        toast.success(`Plantilla "${newTemplate.name}" agregada correctamente.`);
      }

      const updatedTemplates = [...templates, { ...newTemplate, isActive: errors.length === 0 }]; // Disable if invalid
      setTemplates(updatedTemplates);

      const newConfig: TemplateConfig = { fields: {}, sections, layout };

      fieldNames.forEach(fieldName => {
        newConfig.fields[fieldName] = {
          ...(globalDefinitions[fieldName] || { type: 'text', label: fieldName }),
        };
        const typeFromTemplate = fieldTypes.get(fieldName);
        if (typeFromTemplate) {
          newConfig.fields[fieldName].type = typeFromTemplate;
        }
        const optionsFromTemplate = templateOptions.get(fieldName);
        if (optionsFromTemplate) {
          newConfig.fields[fieldName].snippetOptions = optionsFromTemplate;
        }
      });

      setConfigs(prev => ({ ...prev, [newTemplate.id]: newConfig }));

    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Error al procesar la plantilla. Verifica el formato.');
    }
  };

  const removeTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    setConfigs(prev => {
      const updatedConfigs = { ...prev };
      delete updatedConfigs[templateId];
      return updatedConfigs;
    });
    toast.success(`Plantilla "${template?.name || 'desconocida'}" eliminada.`);
  };

  const updateTemplateConfig = (templateId: string, config: TemplateConfig) => {
    setConfigs(prev => ({ ...prev, [templateId]: config }));
    toast.success('Configuración de campos actualizada.');
  };

  const updateTemplate = (updatedTemplate: Template) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    toast.success('Plantilla actualizada.');
  };

  const toggleTemplateActive = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, isActive: !(t.isActive ?? true) } : t
    ));
  }, [setTemplates]);

  const clearAllTemplates = useCallback(() => {
    setTemplates([]);
    setConfigs({});
  }, [setTemplates, setConfigs]);


  return { templates, configs, addTemplate, removeTemplate, updateTemplate, updateTemplateConfig, toggleTemplateActive, clearAllTemplates, isLoaded: isTemplatesLoaded && definitionsLoaded && settingsLoaded };
}
