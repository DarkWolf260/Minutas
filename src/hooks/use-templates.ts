
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
      if (storedTemplates) {
        const parsed = JSON.parse(storedTemplates);
        setTemplates(parsed.map((t: Template) => ({ ...t, isActive: t.isActive ?? true })));
      }
      const storedConfigs = localStorage.getItem(TEMPLATE_CONFIGS_STORAGE_KEY);
      if (storedConfigs) {
        setConfigs(JSON.parse(storedConfigs));
      }
    } catch (error) {
      console.error('Failed to load templates from localStorage', error);
    } finally {
      if (definitionsLoaded && settingsLoaded) {
        setIsLoaded(true);
      }
    }
  }, [definitionsLoaded, settingsLoaded]);

  const saveTemplates = useCallback((newTemplates: Template[]) => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Failed to save templates to localStorage', error);
    }
  }, []);
  
  const saveConfigs = useCallback((newConfigs: Record<string, TemplateConfig>) => {
    try {
      localStorage.setItem(TEMPLATE_CONFIGS_STORAGE_KEY, JSON.stringify(newConfigs));
      setConfigs(newConfigs);
    } catch (error) {
      console.error('Failed to save template configs to localStorage', error);
    }
  }, []);

  const addTemplate = (newTemplate: Template) => {
    const predefinedKeys = Object.keys(settings);
    const templateWithStatus = { ...newTemplate, isActive: true };
    const updatedTemplates = [...templates, templateWithStatus];
    saveTemplates(updatedTemplates);

    const { sections, layout, fieldNames } = parseTemplate(newTemplate.content);
    const newConfig: TemplateConfig = { fields: {}, sections, layout };

    let hasTimeField = false;
    const globalTimeField = Object.keys(globalDefinitions).find(key => globalDefinitions[key].type === 'time-hlv');

    fieldNames.forEach(fieldId => {
      // Priority: Global Definition > Predefined > Heuristic > Default
      if (globalDefinitions[fieldId]) {
        newConfig.fields[fieldId] = { ...globalDefinitions[fieldId], label: fieldId };
        if (newConfig.fields[fieldId].type === 'time-hlv') {
          hasTimeField = true;
        }
      } else if (predefinedKeys.includes(fieldId)) {
        newConfig.fields[fieldId] = { type: 'predefined', label: fieldId };
      } else {
        newConfig.fields[fieldId] = { type: 'text', label: fieldId };
        if (fieldId.toLowerCase() === 'hora' && !hasTimeField && !globalTimeField) {
          newConfig.fields[fieldId].type = 'time-hlv';
          hasTimeField = true;
        }
      }
    });

    const updatedConfigs = {...configs, [newTemplate.id]: newConfig};
    saveConfigs(updatedConfigs);
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
    try {
      localStorage.removeItem(TEMPLATES_STORAGE_KEY);
      localStorage.removeItem(TEMPLATE_CONFIGS_STORAGE_KEY);
      setTemplates([]);
      setConfigs({});
    } catch (error) {
      console.error('Failed to clear all templates from localStorage', error);
    }
  }, []);


  return { templates, configs, addTemplate, removeTemplate, updateTemplate, updateTemplateConfig, toggleTemplateActive, clearAllTemplates, isLoaded };
}
