
'use client';

import { useState, useEffect, useCallback } from 'react';
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
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && definitionsLoaded && templates.length > 0) {
        const newConfigs: Record<string, TemplateConfig> = {};

        templates.forEach(template => {
            const parsed = parseTemplate(template.content);
            const existingConfig = configs[template.id] || { fields: {}, sections: [], layout: [] };
            
            const finalConfig: TemplateConfig = {
                sections: parsed.sections,
                layout: parsed.layout,
                fields: {}
            };

            parsed.fieldNames.forEach(fieldName => {
                const existingFieldConfig = existingConfig.fields[fieldName];
                const globalDef = globalDefinitions[fieldName];
                const typeFromTemplate = parsed.fieldTypes.get(fieldName);
                const optionsFromTemplate = parsed.templateOptions.get(fieldName);

                const baseConfig = {
                    type: 'text' as const,
                    label: fieldName,
                    ...globalDef,
                    ...existingFieldConfig,
                };

                if (typeFromTemplate) {
                    baseConfig.type = typeFromTemplate;
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
    }
  }, []);
  
  const saveConfigs = useCallback((newConfigs: Record<string, TemplateConfig>) => {
    setConfigs(newConfigs);
    try {
      localStorage.setItem(TEMPLATE_CONFIGS_STORAGE_KEY, JSON.stringify(newConfigs));
    } catch (error) {
      console.error('Failed to save template configs to localStorage', error);
    }
  }, []);

  const addTemplate = (newTemplate: Template) => {
    const updatedTemplates = [...templates, { ...newTemplate, isActive: true }];
    saveTemplates(updatedTemplates);

    const { sections, layout, fieldNames, fieldTypes, templateOptions } = parseTemplate(newTemplate.content);
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
    
    saveConfigs({...configs, [newTemplate.id]: newConfig});
  };
  
  const removeTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    const updatedConfigs = {...configs};
    delete updatedConfigs[templateId];
    saveConfigs(updatedConfigs);
  };
  
  const updateTemplateConfig = (templateId: string, config: TemplateConfig) => {
    const updatedConfigs = {...configs, [templateId]: config};
    saveConfigs(updatedConfigs);
  };
  
   const updateTemplate = (updatedTemplate: Template) => {
    const updatedTemplates = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    saveTemplates(updatedTemplates);
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
