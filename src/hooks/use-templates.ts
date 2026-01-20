
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Template, TemplateConfig } from '@/types';
import { parseTemplate } from '@/lib/template-parser';
import { useFieldDefinitions } from './use-field-definitions';
import { useSettings } from './use-settings';

const TEMPLATES_STORAGE_KEY = 'app-templates';
const TEMPLATE_CONFIGS_STORAGE_KEY = 'app-template-configs';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [configs, setConfigs] = useState<Record<string, TemplateConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const { definitions: globalDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { settings, isLoaded: settingsLoaded } = useSettings();

  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      const initialTemplates = storedTemplates ? JSON.parse(storedTemplates) : [];
      setTemplates(initialTemplates.map((t: Template) => ({ ...t, isActive: t.isActive ?? true })));

      const storedConfigs = localStorage.getItem(TEMPLATE_CONFIGS_STORAGE_KEY);
      setConfigs(storedConfigs ? JSON.parse(storedConfigs) : {});

    } catch (error) {
      console.error('Failed to load templates from localStorage', error);
      toast.error('Error al cargar las plantillas.');
    } finally {
      setIsLoaded(true);
    }
  }, []);

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
    if (isLoaded && definitionsLoaded && templates.length > 0) {
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

          const baseConfig = {
            ...globalDef,
            ...existingFieldConfig,
            label: fieldName,
          };

          if (typeFromTemplate) {
            baseConfig.type = typeFromTemplate;
          } else if (!baseConfig.type) {
            baseConfig.type = 'text';
          }

          if (optionsFromTemplate) {
            baseConfig.snippetOptions = optionsFromTemplate;
          }

          finalConfig.fields[fieldName] = baseConfig;
        });

        newConfigs[template.id] = finalConfig;
      });

      if (JSON.stringify(newConfigs) !== JSON.stringify(configs)) {
        saveConfigs(newConfigs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, definitionsLoaded, templates]);


  const saveTemplates = useCallback((newTemplates: Template[]) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
    } catch (error) {
      console.error('Failed to save templates to localStorage', error);
      toast.error('No se pudo guardar la plantilla en el almacenamiento.');
    }
  }, []);

  const saveConfigs = useCallback((newConfigs: Record<string, TemplateConfig>) => {
    setConfigs(newConfigs);
    try {
      localStorage.setItem(TEMPLATE_CONFIGS_STORAGE_KEY, JSON.stringify(newConfigs));
    } catch (error) {
      console.error('Failed to save template configs to localStorage', error);
      toast.error('Error al guardar la configuración de la plantilla.');
    }
  }, []);

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
      saveTemplates(updatedTemplates);

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

      saveConfigs({ ...configs, [newTemplate.id]: newConfig });

    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Error al procesar la plantilla. Verifica el formato.');
    }
  };

  const removeTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    const updatedConfigs = { ...configs };
    delete updatedConfigs[templateId];
    saveConfigs(updatedConfigs);
    toast.success(`Plantilla "${template?.name || 'desconocida'}" eliminada.`);
  };

  const updateTemplateConfig = (templateId: string, config: TemplateConfig) => {
    const updatedConfigs = { ...configs, [templateId]: config };
    saveConfigs(updatedConfigs);
    toast.success('Configuración de campos actualizada.');
  };

  const updateTemplate = (updatedTemplate: Template) => {
    const updatedTemplates = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    saveTemplates(updatedTemplates);
    toast.success('Plantilla actualizada.');
  };

  const toggleTemplateActive = useCallback((templateId: string) => {
    const updatedTemplates = templates.map(t =>
      t.id === templateId ? { ...t, isActive: !(t.isActive ?? true) } : t
    );
    saveTemplates(updatedTemplates);
  }, [templates, saveTemplates]);

  const clearAllTemplates = useCallback(() => {
    saveTemplates([]);
    saveConfigs({});
  }, [saveTemplates, saveConfigs]);


  return { templates, configs, addTemplate, removeTemplate, updateTemplate, updateTemplateConfig, toggleTemplateActive, clearAllTemplates, isLoaded: isLoaded && definitionsLoaded && settingsLoaded };
}
