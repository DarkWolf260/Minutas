
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DefinitionSection } from '@/types';

const DEFINITION_SECTIONS_STORAGE_KEY = 'app-definition-sections';

const defaultSections: DefinitionSection[] = [];

export function useDefinitionSections() {
  const [sections, setSections] = useState<DefinitionSection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEFINITION_SECTIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setSections(parsed);
        } else {
            setSections(defaultSections);
        }
      } else {
        setSections(defaultSections);
      }
    } catch (error) {
      console.error('Failed to load definition sections from localStorage', error);
      setSections(defaultSections);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveSections = useCallback((newSections: DefinitionSection[]) => {
    try {
      localStorage.setItem(DEFINITION_SECTIONS_STORAGE_KEY, JSON.stringify(newSections));
      setSections(newSections);
    } catch (error) {
      console.error('Failed to save definition sections to localStorage', error);
    }
  }, []);
  
  const addSection = useCallback((newSection: DefinitionSection) => {
    const updated = [...sections, newSection].sort((a,b) => a.name.localeCompare(b.name));
    saveSections(updated);
  }, [sections, saveSections]);

  const removeSection = useCallback((sectionId: string) => {
    const updated = sections.filter(s => s.id !== sectionId);
    saveSections(updated);
  }, [sections, saveSections]);

  return { sections, saveSections, addSection, removeSection, isLoaded };
}
