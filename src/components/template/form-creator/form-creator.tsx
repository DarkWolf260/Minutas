'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Eye, FileText, Layout, Copy, RotateCcw } from 'lucide-react';
import {
  defaultDropAnimationSideEffects,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';

import type {
  Template,
  TemplateConfig,
  FieldConfig,
  SectionConfig,
  SnippetOption,
} from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useTemplates } from '@/hooks/plantillas';
import { useIsMobile } from '@/hooks/ui';
import { ReportForm, ReportFormRef } from '@/components/report/report-form';
import { ReportPreview } from '@/components/report/report-preview';
import { parseTemplate, resolveTemplateTitle } from '@/lib/template-parser';
import { validateTemplateSyntax } from '@/lib/validators';
import { cn } from '@/lib/utils';

import {
  type FormCreatorField,
  type FormCreatorFieldType,
  compileFormToTemplateString,
  updateFieldTagInText,
  removeFieldTagFromText,
  appendFieldTagToText,
  reorderFieldsInTemplateText,
  sanitizeFieldId,
  getAllFieldsFlat,
  parseTemplateToFields,
  isSystemFieldTag,
} from './template-compiler';

import {
  type AvailableField,
  AVAILABLE_FIELDS,
  INITIAL_FIELDS,
  getNextFieldLabel,
  findFieldInTree,
  updateFieldInTree,
  deleteFieldFromTree,
  findLocation,
  customCollisionDetection,
  getBadgeLabel,
} from './form-creator-constants';

import { FormCreatorHeader } from './components/form-creator-header';
import { AvailableFieldsSidebar } from './components/available-fields-sidebar';
import { FieldSettingsSidebar } from './components/field-settings-sidebar';
import { TemplateTextEditor } from './components/template-text-editor';
import { SortableCanvasFieldCard } from './components/sortable-canvas-field';
import { SortableCanvasSectionCard } from './components/sortable-canvas-section';
import { CanvasFieldDragOverlay } from './components/canvas-field-drag-overlay';

export interface FormCreatorProps {
  onAdd: (newTemplate: Template) => void;
  onUpdate?: (updatedTemplate: Template) => void;
  onCreated?: (templateId: string) => void;
  onBack?: () => void;
  initialTemplate?: Template | null;
  templates?: Template[];
}

export function FormCreator({
  onAdd,
  onUpdate,
  onCreated,
  onBack,
  initialTemplate,
  templates: templatesProp,
}: FormCreatorProps) {
  const { currentWorkspace } = useWorkspaceManager();
  const { templates: workspaceTemplates, updateTemplate: hookUpdateTemplate } = useTemplates();
  const allWorkspaceTemplates = templatesProp || workspaceTemplates || [];

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(initialTemplate || null);
  const canvasFormRef = useRef<ReportFormRef>(null);
  const dialogFormRef = useRef<ReportFormRef>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Form Header State
  const [formTitle, setFormTitle] = useState(initialTemplate?.name || 'Formulario sin título');
  const [formDescription, setFormDescription] = useState('Agrega una descripción');

  // Fields State
  const [fields, setFields] = useState<FormCreatorField[]>(() => {
    if (initialTemplate?.content) {
      const parsed = parseTemplateToFields(initialTemplate.content);
      if (parsed.length > 0) return parsed;
    }
    return INITIAL_FIELDS;
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(() => {
    if (initialTemplate?.content) {
      const parsed = parseTemplateToFields(initialTemplate.content);
      if (parsed.length > 0 && parsed[0]) return parsed[0].id;
    }
    return 'f_init_1';
  });

  const allCurrentFields = useMemo(() => getAllFieldsFlat(fields), [fields]);

  // Canvas View Mode: 'visual' vs 'text'
  const [canvasView, setCanvasView] = useState<'visual' | 'text'>('visual');

  // Template text state
  const [templateText, setTemplateText] = useState<string>(() => {
    if (initialTemplate?.content) {
      return initialTemplate.content;
    }
    return compileFormToTemplateString({
      name: 'Formulario sin título',
      type: 'normal',
      headerTitle: 'FORMULARIO SIN TÍTULO',
      fields: INITIAL_FIELDS,
    });
  });

  // Track initial template updates
  const lastLoadedIdRef = useRef<string | null>(initialTemplate?.id || null);
  useEffect(() => {
    if (initialTemplate && initialTemplate.id !== lastLoadedIdRef.current) {
      lastLoadedIdRef.current = initialTemplate.id;
      setEditingTemplate(initialTemplate);
      setFormTitle(initialTemplate.name || 'Formulario sin título');
      const parsed = initialTemplate.content ? parseTemplateToFields(initialTemplate.content) : [];
      if (parsed.length > 0 && parsed[0]) {
        setFields(parsed);
        setSelectedFieldId(parsed[0].id);
      } else {
        setFields(INITIAL_FIELDS);
        setSelectedFieldId('f_init_1');
      }
      setTemplateText(initialTemplate.content || '');
    } else if (!initialTemplate && lastLoadedIdRef.current !== null) {
      lastLoadedIdRef.current = null;
      setEditingTemplate(null);
      setFormTitle('Formulario sin título');
      setFields(INITIAL_FIELDS);
      setSelectedFieldId('f_init_1');
      setTemplateText(
        compileFormToTemplateString({
          name: 'Formulario sin título',
          type: 'normal',
          headerTitle: 'FORMULARIO SIN TÍTULO',
          fields: INITIAL_FIELDS,
        })
      );
    }
  }, [initialTemplate]);

  // Load template / create new
  const handleLoadTemplate = (tpl: Template) => {
    lastLoadedIdRef.current = tpl.id;
    setEditingTemplate(tpl);
    setFormTitle(tpl.name || 'Formulario sin título');
    const parsed = tpl.content ? parseTemplateToFields(tpl.content) : [];
    if (parsed.length > 0 && parsed[0]) {
      setFields(parsed);
      setSelectedFieldId(parsed[0].id);
    } else {
      setFields(INITIAL_FIELDS);
      setSelectedFieldId('f_init_1');
    }
    setTemplateText(tpl.content || '');
    toast.success(`Plantilla "${tpl.name}" cargada para editar`);
  };

  const handleCreateNewForm = () => {
    lastLoadedIdRef.current = null;
    setEditingTemplate(null);
    setFormTitle('Formulario sin título');
    setFields(INITIAL_FIELDS);
    setSelectedFieldId('f_init_1');
    setTemplateText(
      compileFormToTemplateString({
        name: 'Formulario sin título',
        type: 'normal',
        headerTitle: 'FORMULARIO SIN TÍTULO',
        fields: INITIAL_FIELDS,
      })
    );
    toast.info('Modo creación: nuevo formulario en blanco');
  };

  // Debounced template content for live form preview
  const [debouncedContent, setDebouncedContent] = useState(templateText);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(templateText);
    }, 300);
    return () => clearTimeout(timer);
  }, [templateText]);

  // Canvas Mode: 'wysiwyg' | 'result' | 'form'
  const [canvasMode, setCanvasMode] = useState<'wysiwyg' | 'result' | 'form'>('wysiwyg');

  // Preview Dialogs State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFormData, setPreviewFormData] = useState<Record<string, any>>({});
  const [previewReportContent, setPreviewReportContent] = useState('');
  const [isPreviewReportOpen, setIsPreviewReportOpen] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<'En proceso' | 'Finalizado'>('En proceso');

  const previewControlledValues = useMemo(() => ({
    Estatus: previewStatus,
    Enc: '(E)',
  }), [previewStatus]);

  const handlePreviewFormDataChange = useCallback((data: Record<string, any>) => {
    setPreviewFormData(data);
  }, []);

  const questionNumberMap = useMemo(() => {
    const map = new Map<string, string>();
    let rootCounter = 1;
    fields.forEach((field) => {
      if (field.type === 'separator') return;
      if (field.type === 'section') {
        const secNum = `${rootCounter++}`;
        map.set(field.id, secNum);
        (field.fields || []).forEach((inner, iIdx) => {
          map.set(inner.id, `${secNum}.${iIdx + 1}`);
        });
        return;
      }
      map.set(field.id, `${rootCounter++}`);
    });
    return map;
  }, [fields]);

  const selectedField = useMemo(() => {
    return findFieldInTree(fields, selectedFieldId);
  }, [fields, selectedFieldId]);

  const previewTemplate = useMemo<Template>(() => ({
    id: 'preview-form',
    name: formTitle || 'Vista Previa',
    type: 'normal',
    content: debouncedContent,
    workspace_id: currentWorkspace || 'preview',
    is_active: true,
  }), [debouncedContent, formTitle, currentWorkspace]);

  const previewConfig = useMemo<TemplateConfig>(() => {
    const parsed = parseTemplate(debouncedContent);
    const configFields: Record<string, FieldConfig> = {};
    const layout: string[] = [];
    const parsedSections: SectionConfig[] = [];

    parsed.sections.forEach((sec) => {
      if (!sec.is_virtual && sec.is_repeatable) {
        parsedSections.push({
          id: sec.id,
          label: sec.label || sec.id,
          singular_title: sec.singular_title || sec.label,
          plural_title: sec.plural_title,
          repeatable_item_label: sec.repeatable_item_label || sec.singular_title,
          is_repeatable: true,
          field_ids: sec.field_ids,
        });
      }
    });

    fields.forEach((f) => {
      if (f.type === 'section') {
        const matchingParsed = parsedSections.find(
          (s) =>
            s.label.toLowerCase() === f.label.toLowerCase() ||
            (f.singularTitle && s.singular_title?.toLowerCase() === f.singularTitle.toLowerCase())
        );
        layout.push(matchingParsed ? matchingParsed.id : `sec_${f.id}`);
      } else {
        layout.push(f.label);
      }
    });

    const flat = getAllFieldsFlat(fields);
    flat.forEach((f) => {
      if (f.type === 'section' || f.type === 'separator') return;
      const cleanLabel = sanitizeFieldId(f.label);
      const snippetOpts: SnippetOption[] = (f.options || []).map((opt) => ({
        id: opt,
        label: opt,
        value: opt,
      }));

      const matchedKey =
        Object.keys(configFields).find(
          (k) =>
            k.toLowerCase() === f.label.toLowerCase() ||
            k.toLowerCase() === cleanLabel.toLowerCase()
        ) || cleanLabel;

      const enriched: FieldConfig = {
        ...(configFields[matchedKey] || {}),
        type: f.type,
        label: f.label || 'Nueva pregunta',
        required: f.required,
        is_full_width: f.isFullWidth,
        default_value: f.defaultValue || configFields[matchedKey]?.default_value || '',
        snippet_options: snippetOpts.length > 0 ? snippetOpts : configFields[matchedKey]?.snippet_options,
      };

      configFields[matchedKey] = enriched;
      if (matchedKey !== cleanLabel) configFields[cleanLabel] = enriched;
      if (matchedKey !== f.label.trim()) configFields[f.label.trim()] = enriched;
    });

    return {
      sections: parsedSections,
      layout,
      fields: configFields,
    };
  }, [debouncedContent, fields]);

  // DnD Sensors & State
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);
  const activeDragLocation = useMemo(
    () => (activeDragId ? findLocation(fields, activeDragId) : null),
    [fields, activeDragId]
  );
  const activeDragField = activeDragLocation?.field || null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    const initialWidth = event.active.rect.current.initial?.width;
    if (initialWidth) setActiveDragWidth(initialWidth);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setActiveDragWidth(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeLoc = findLocation(fields, activeId);
    if (!activeLoc) return;

    if (overId.startsWith('droppable-sec-')) {
      const targetSecId = overId.replace('droppable-sec-', '');
      if (activeLoc.field.type === 'section') return;

      if (activeLoc.container === targetSecId) return;

      const strippedFields = deleteFieldFromTree(fields, activeId);
      const nextFields = strippedFields.map((sec) => {
        if (sec.id === targetSecId && sec.type === 'section') {
          return {
            ...sec,
            fields: [...(sec.fields || []), activeLoc.field],
          };
        }
        return sec;
      });

      setFields(nextFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      return;
    }

    const overLoc = findLocation(fields, overId);
    if (!overLoc) return;

    if (activeLoc.container === 'root' && overLoc.container === 'root') {
      const next = arrayMove(fields, activeLoc.index, overLoc.index);
      setFields(next);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, next, formTitle));
      return;
    }

    if (activeLoc.container === overLoc.container && activeLoc.container !== 'root') {
      const secId = activeLoc.container;
      const nextFields = fields.map((sec) => {
        if (sec.id === secId && sec.type === 'section') {
          return {
            ...sec,
            fields: arrayMove(sec.fields || [], activeLoc.index, overLoc.index),
          };
        }
        return sec;
      });
      setFields(nextFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      return;
    }

    if (activeLoc.container === 'root' && overLoc.container !== 'root') {
      if (activeLoc.field.type === 'section') return;

      const targetSecId = overLoc.container;
      const strippedFields = fields.filter((f) => f.id !== activeId);
      const nextFields = strippedFields.map((sec) => {
        if (sec.id === targetSecId && sec.type === 'section') {
          const nextInner = [...(sec.fields || [])];
          nextInner.splice(overLoc.index, 0, activeLoc.field);
          return { ...sec, fields: nextInner };
        }
        return sec;
      });
      setFields(nextFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      return;
    }

    if (activeLoc.container !== 'root' && overLoc.container === 'root') {
      const fromSecId = activeLoc.container;
      const strippedFields = fields.map((sec) => {
        if (sec.id === fromSecId && sec.type === 'section') {
          return {
            ...sec,
            fields: (sec.fields || []).filter((f) => f.id !== activeId),
          };
        }
        return sec;
      });

      const nextFields = [...strippedFields];
      nextFields.splice(overLoc.index, 0, activeLoc.field);
      setFields(nextFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    }
  };

  // Add field from sidebar
  const handleAddAvailableField = (item: AvailableField) => {
    const isRep = item.type === 'section' && item.isRepeatable !== false;
    const isStandardSec = item.type === 'section' && item.isRepeatable === false;

    const baseTitle = getNextFieldLabel(item, fields);
    const cleanSingular = sanitizeFieldId(baseTitle).toUpperCase();
    const isPlural = cleanSingular.endsWith('S') && cleanSingular.length > 3;
    const defaultSingular = isPlural ? cleanSingular.slice(0, -1) : cleanSingular;
    const defaultPlural = isPlural ? cleanSingular : (cleanSingular ? `${cleanSingular}S` : 'ITEMS');

    const newField: FormCreatorField = {
      id: isStandardSec
        ? `sec_std_${Date.now()}`
        : isRep
        ? `sec_${Date.now()}`
        : item.type === 'separator'
        ? `sep_${Date.now()}`
        : `f_${Date.now()}`,
      label: baseTitle,
      type: item.type,
      required: false,
      isFullWidth: false,
      modifier: 'none',
      options: item.defaultOptions ? [...item.defaultOptions] : undefined,
      isRepeatable: isRep ? true : isStandardSec ? false : undefined,
      singularTitle: isRep ? (defaultSingular || 'ITEM') : undefined,
      pluralTitle: isRep ? (defaultPlural || 'ITEMS') : undefined,
      subLabel: isRep ? (defaultSingular || 'ITEM') : undefined,
      fields: item.type === 'section' ? [] : undefined,
    };

    const nextFields = [...fields, newField];
    setFields(nextFields);
    setSelectedFieldId(newField.id);
    setTemplateText((prev) => appendFieldTagToText(prev, newField));
    toast.success(`Añadido: "${newField.label}"`);
  };

  // Field updates
  const handleUpdateSelectedField = (updates: Partial<FormCreatorField>) => {
    if (!selectedFieldId || !selectedField) return;

    if (updates.label !== undefined && updates.label.trim()) {
      if (isSystemFieldTag(updates.label)) {
        toast.warning(
          `"${updates.label}" es una etiqueta especial reservada del sistema. Se completará automáticamente al generar reportes y no debe usarse como campo de entrada.`,
          { duration: 4000 }
        );
      }
    }

    const oldLabel = selectedField.label;
    const updatedField: FormCreatorField = { ...selectedField, ...updates };
    const nextFields = updateFieldInTree(fields, selectedFieldId, updates);
    setFields(nextFields);

    if (updatedField.type === 'section') {
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    } else {
      setTemplateText((prev) => updateFieldTagInText(prev, oldLabel, updatedField));
    }
  };

  const handleDeleteSelectedField = () => {
    if (!selectedFieldId || !selectedField) return;
    const fieldToDelete = selectedField;
    const nextFields = deleteFieldFromTree(fields, selectedFieldId);
    setFields(nextFields);

    const flat = getAllFieldsFlat(nextFields);
    setSelectedFieldId(flat.length > 0 && flat[0] ? flat[0].id : null);
    setTemplateText((prev) => removeFieldTagFromText(prev, fieldToDelete));
    toast.info('Elemento eliminado');
  };

  const handleUpdateFieldById = (fieldId: string, updates: Partial<FormCreatorField>) => {
    const target = findFieldInTree(fields, fieldId);
    if (!target) return;

    if (updates.label !== undefined && updates.label.trim()) {
      if (isSystemFieldTag(updates.label)) {
        toast.warning(
          `"${updates.label}" es una etiqueta especial reservada del sistema. Se completará automáticamente al generar reportes y no debe usarse como campo de entrada.`,
          { duration: 4000 }
        );
      }
    }

    const oldLabel = target.label;
    const updatedField: FormCreatorField = { ...target, ...updates };
    const nextFields = updateFieldInTree(fields, fieldId, updates);
    setFields(nextFields);

    if (updatedField.type === 'section') {
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    } else {
      setTemplateText((prev) => updateFieldTagInText(prev, oldLabel, updatedField));
    }
  };

  const handleDeleteFieldById = (fieldId: string) => {
    const target = findFieldInTree(fields, fieldId);
    if (!target) return;
    const nextFields = deleteFieldFromTree(fields, fieldId);
    setFields(nextFields);

    if (selectedFieldId === fieldId) {
      const flat = getAllFieldsFlat(nextFields);
      setSelectedFieldId(flat.length > 0 && flat[0] ? flat[0].id : null);
    }

    setTemplateText((prev) => removeFieldTagFromText(prev, target));
    toast.info('Campo eliminado');
  };

  const handleDuplicateFieldById = (fieldId: string) => {
    const target = findFieldInTree(fields, fieldId);
    if (!target) return;
    if (target.type === 'section') {
      handleDuplicateSection(fieldId);
      return;
    }

    const duplicated: FormCreatorField = {
      ...target,
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${target.label} 2`,
      options: target.options ? [...target.options] : undefined,
    };

    const loc = findLocation(fields, fieldId);
    if (!loc) return;

    if (loc.parentSection) {
      const parentSecId = loc.parentSection.id;
      const nextFields = fields.map((sec) => {
        if (sec.id === parentSecId && sec.type === 'section') {
          const nextInner = [...(sec.fields || [])];
          nextInner.splice(loc.index + 1, 0, duplicated);
          return { ...sec, fields: nextInner };
        }
        return sec;
      });
      setFields(nextFields);
      setSelectedFieldId(duplicated.id);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    } else {
      const nextFields = [...fields];
      nextFields.splice(loc.index + 1, 0, duplicated);
      setFields(nextFields);
      setSelectedFieldId(duplicated.id);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    }
    toast.success(`Campo "${duplicated.label}" duplicado`);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const next = arrayMove(fields, index, targetIndex);
    setFields(next);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, next, formTitle));
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<FormCreatorField>) => {
    const nextFields = updateFieldInTree(fields, sectionId, updates);
    setFields(nextFields);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
  };

  const handleDeleteSection = (sectionId: string) => {
    const secToDelete = fields.find((f) => f.id === sectionId);
    if (!secToDelete) return;
    const nextFields = fields.filter((f) => f.id !== sectionId);
    setFields(nextFields);
    const flat = getAllFieldsFlat(nextFields);
    setSelectedFieldId(flat.length > 0 && flat[0] ? flat[0].id : null);
    setTemplateText((prev) => removeFieldTagFromText(prev, secToDelete));
    toast.info('Sección eliminada');
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sec = fields.find((f) => f.id === sectionId);
    if (!sec || sec.type !== 'section') return;

    const isRep = sec.isRepeatable !== false;
    const duplicated: FormCreatorField = {
      ...sec,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${sec.label} (Copia)`,
      isRepeatable: isRep,
      singularTitle: isRep ? `${sec.singularTitle || 'ITEM'} (COPIA)` : undefined,
      pluralTitle: isRep ? `${sec.pluralTitle || 'ITEMS'} (COPIA)` : undefined,
      subLabel: isRep ? `${sec.subLabel || 'ITEM'} (COPIA)` : undefined,
      fields: (sec.fields || []).map((inner, fIdx) => ({
        ...inner,
        id: `f_${Date.now()}_${fIdx}_${Math.random().toString(36).substring(2, 6)}`,
        label: `${inner.label} (Copia)`,
        options: inner.options ? [...inner.options] : undefined,
      })),
    };

    const idx = fields.findIndex((f) => f.id === sectionId);
    const next = [...fields];
    next.splice(idx + 1, 0, duplicated);
    setFields(next);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, next, formTitle));
    setSelectedFieldId(duplicated.id);
    toast.success('Sección duplicada');
  };

  const handleAddFieldToSection = (
    sectionId: string,
    type: FormCreatorFieldType = 'text',
    defaultLabel?: string
  ) => {
    const sec = fields.find((f) => f.id === sectionId);
    if (!sec) return;

    const innerFields = sec.fields || [];
    const itemConfig = AVAILABLE_FIELDS.find((af) => af.type === type);
    const label = defaultLabel || (itemConfig ? getNextFieldLabel(itemConfig, innerFields) : `Campo ${innerFields.length + 1}`);

    const newInner: FormCreatorField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label,
      type,
      required: false,
      isFullWidth: false,
      modifier: 'none',
      options: itemConfig?.defaultOptions ? [...itemConfig.defaultOptions] : undefined,
    };

    const nextFields = fields.map((f) => {
      if (f.id === sectionId) {
        return {
          ...f,
          fields: [...(f.fields || []), newInner],
        };
      }
      return f;
    });

    setFields(nextFields);
    setSelectedFieldId(newInner.id);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    toast.success(`Añadido "${label}" a la sección`);
  };

  const handleMoveInnerField = (
    sectionId: string,
    index: number,
    direction: 'up' | 'down',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const sec = fields.find((f) => f.id === sectionId);
    if (!sec || !sec.fields) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sec.fields.length) return;

    const nextInner = arrayMove(sec.fields, index, targetIndex);
    const nextFields = fields.map((f) =>
      f.id === sectionId ? { ...f, fields: nextInner } : f
    );
    setFields(nextFields);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
  };

  const handleResetStandardFormat = () => {
    const standard = compileFormToTemplateString({
      name: formTitle,
      type: 'normal',
      headerTitle: formTitle.toUpperCase(),
      fields,
    });
    setTemplateText(standard);
    toast.info('Texto de la planilla restablecido al formato estándar.');
  };

  const handleInsertSpecialTag = (tag: string) => {
    if ((canvasMode === 'result' || canvasView === 'text') && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart ?? templateText.length;
      const end = textarea.selectionEnd ?? templateText.length;
      const updated = templateText.substring(0, start) + ' ' + tag + ' ' + templateText.substring(end);
      setTemplateText(updated);
      toast.success(`Etiqueta ${tag} insertada en la planilla`);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
      }, 50);
    } else {
      setTemplateText((prev) => {
        if (prev.includes(tag)) {
          toast.info(`La etiqueta ${tag} ya está presente en el texto de la planilla`);
          return prev;
        }
        return prev.trim() ? `${prev.trimEnd()}\n${tag}\n` : tag;
      });
      navigator.clipboard.writeText(tag).catch(() => {});
      toast.success(`Etiqueta especial ${tag} añadida al texto de la planilla (se completa automáticamente)`);
    }
  };

  const handleCopySpecialTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Etiqueta ${tag} copiada al portapapeles`);
  };

  const syntaxCheck = useMemo(() => validateTemplateSyntax(templateText), [templateText]);

  const handlePublish = async () => {
    if (!formTitle.trim()) {
      toast.error('Por favor escribe un título para el formulario.');
      return;
    }

    if (fields.length === 0) {
      toast.error('Agrega al menos un campo al formulario.');
      return;
    }

    if (!syntaxCheck.valid) {
      toast.error(syntaxCheck.error || 'El formulario contiene errores de configuración.');
      return;
    }

    if (editingTemplate) {
      const updatedTemplate: Template = {
        ...editingTemplate,
        name: formTitle.trim(),
        content: templateText,
      };

      if (onUpdate) {
        onUpdate(updatedTemplate);
      } else {
        await hookUpdateTemplate(updatedTemplate);
      }

      toast.success(`¡Formulario "${updatedTemplate.name}" guardado exitosamente!`);
      onCreated?.(updatedTemplate.id);
      return;
    }

    const newTemplate: Template = {
      id: generateId(),
      workspace_id: currentWorkspace,
      name: formTitle.trim(),
      content: templateText,
      type: 'normal',
      is_active: true,
    };

    onAdd(newTemplate);
    toast.success(`¡Formulario "${newTemplate.name}" publicado exitosamente!`);
    onCreated?.(newTemplate.id);
  };

  const handleShowCanvasGeneratedReport = () => {
    const content = canvasFormRef.current?.getRenderedContent() || '';
    setPreviewReportContent(content);
    setIsPreviewReportOpen(true);
  };

  const handleShowDialogGeneratedReport = () => {
    const content = dialogFormRef.current?.getRenderedContent() || '';
    setPreviewReportContent(content);
    setIsPreviewReportOpen(true);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewReportContent);
    toast.success('Minuta copiada al portapapeles');
  };

  const handleFormSubmit = (_data: any, content: string) => {
    setPreviewReportContent(content);
    setIsPreviewReportOpen(true);
    toast.success('¡Formulario completado! Aquí está la minuta generada.');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 dark:bg-background overflow-hidden">
      {/* 1. Header */}
      <FormCreatorHeader
        onBack={onBack}
        formTitle={formTitle}
        editingTemplate={editingTemplate}
        canvasMode={canvasMode}
        onCanvasModeChange={setCanvasMode}
        onPublish={handlePublish}
      />

      {/* 2. Three-column body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left column: Campos disponibles */}
        <AvailableFieldsSidebar
          onAddField={handleAddAvailableField}
          onInsertSpecialTag={handleInsertSpecialTag}
          onCopySpecialTag={handleCopySpecialTag}
        />

        {/* Center column: Document canvas */}
        <div className="md:col-span-6 xl:col-span-6 flex flex-col min-h-0 overflow-y-auto">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex-1 flex flex-col space-y-5">
            {canvasView === 'visual' ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Title */}
                <div className="pb-4 border-b border-border/60">
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Formulario sin título"
                    className="text-2xl sm:text-3xl font-bold tracking-tight border-0 border-b border-transparent hover:border-border/60 focus-visible:border-indigo-500 focus-visible:ring-0 rounded-none px-0 py-0.5 bg-transparent placeholder:text-muted-foreground/40 transition-colors"
                  />
                </div>

                {/* Sub-view 1: Minuta Final (Template Editor identical to constructor) */}
                <div className={cn('flex-1 flex flex-col space-y-4 pt-1 min-h-[450px]', canvasMode !== 'result' && 'hidden')}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-semibold">Minuta Final</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetStandardFormat}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                        title="Restablecer al formato estándar"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Formato estándar</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(templateText);
                          toast.success('Plantilla de minuta copiada al portapapeles');
                        }}
                        className="h-8 text-xs px-3 bg-background shadow-2xs border-border/80 hover:bg-muted gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Copiar Plantilla</span>
                      </Button>
                    </div>
                  </div>

                  {/* Editor Area - Identical to constructor (TemplateBuilder) */}
                  <div className="flex-1 flex flex-col min-h-[420px] rounded-md border shadow-sm bg-background">
                    <Textarea
                      ref={textareaRef}
                      value={templateText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setTemplateText(newText);
                        try {
                          const parsed = parseTemplateToFields(newText);
                          if (parsed.length > 0) {
                            setFields(parsed);
                          }
                        } catch {
                          // Allow syntax during typing
                        }
                      }}
                      className="flex-1 w-full font-mono text-sm leading-relaxed resize-none p-4 border-0 focus-visible:ring-0 overflow-y-auto"
                      placeholder="Escribe el contenido de tu plantilla aquí..."
                    />
                  </div>
                </div>

                {/* Sub-view 2: Formulario Final */}
                <div className={cn('flex-1 space-y-4 pt-1', canvasMode !== 'form' && 'hidden')}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Formulario de Llenado</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex bg-background border rounded-lg p-0.5 shadow-2xs overflow-hidden">
                        <Button
                          type="button"
                          variant={previewStatus === 'En proceso' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-7 text-[10px] px-2.5 rounded-md"
                          onClick={() => setPreviewStatus('En proceso')}
                        >
                          En proceso
                        </Button>
                        <Button
                          type="button"
                          variant={previewStatus === 'Finalizado' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-7 text-[10px] px-2.5 rounded-md"
                          onClick={() => setPreviewStatus('Finalizado')}
                        >
                          Finalizado
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleShowCanvasGeneratedReport}
                        className="h-8 text-xs px-3 bg-background shadow-2xs border-border/80 hover:bg-muted"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        <span>Generar Minuta</span>
                      </Button>
                    </div>
                  </div>

                  {fields.length === 0 ? (
                    <div className="p-12 border border-dashed rounded-2xl text-center text-muted-foreground text-sm">
                      El formulario no tiene campos agregados aún. Vuelve a "Editor Minuta" para agregar preguntas.
                    </div>
                  ) : (
                    <Card className="border bg-card shadow-sm">
                      <CardHeader className="bg-card/50 border-b py-4">
                        <CardTitle className="text-lg font-bold">
                          {resolveTemplateTitle(formTitle || 'Nueva Plantilla', previewFormData, previewConfig) || formTitle || 'Nueva Plantilla'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <ReportForm
                          key="canvas-report-form"
                          ref={canvasFormRef}
                          template={previewTemplate}
                          config={previewConfig}
                          onSubmit={handleFormSubmit}
                          disabled={false}
                          controlledValues={previewControlledValues}
                          onDataChange={handlePreviewFormDataChange}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sub-view 3: WYSIWYG Editor */}
                <div className={cn('flex-1 flex flex-col space-y-3', canvasMode !== 'wysiwyg' && 'hidden')}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-1 flex-1 items-stretch">
                        {fields.length === 0 ? (
                          <div className="p-12 border-2 border-dashed border-border/80 rounded-2xl text-center space-y-3 bg-muted/10 my-2">
                            <div className="inline-flex p-3 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                              <FileText className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              Esta minuta no tiene campos aún
                            </p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                              Haz clic en un campo de la izquierda para comenzar a armar el documento de la minuta en tiempo real.
                            </p>
                          </div>
                        ) : (
                          fields.map((field, idx) => {
                            if (field.type === 'section') {
                              return (
                                <SortableCanvasSectionCard
                                  key={field.id}
                                  section={field}
                                  idx={idx}
                                  questionNumber={questionNumberMap.get(field.id) ?? null}
                                  totalFields={fields.length}
                                  isSelected={selectedFieldId === field.id}
                                  onSelect={() => setSelectedFieldId(field.id)}
                                  onMoveField={handleMoveField}
                                  onUpdateSection={handleUpdateSection}
                                  onDeleteSection={handleDeleteSection}
                                  onDuplicateSection={handleDuplicateSection}
                                  onAddFieldToSection={handleAddFieldToSection}
                                  selectedFieldId={selectedFieldId}
                                  onSelectField={(id) => setSelectedFieldId(id)}
                                  onMoveInnerField={handleMoveInnerField}
                                  onUpdateField={handleUpdateFieldById}
                                  onDuplicateField={handleDuplicateFieldById}
                                  onDeleteField={handleDeleteFieldById}
                                  questionNumberMap={questionNumberMap}
                                  getBadgeLabel={getBadgeLabel}
                                />
                              );
                            }

                            return (
                              <SortableCanvasFieldCard
                                key={field.id}
                                field={field}
                                idx={idx}
                                questionNumber={questionNumberMap.get(field.id) ?? null}
                                totalFields={fields.length}
                                isSelected={selectedFieldId === field.id}
                                onSelect={() => setSelectedFieldId(field.id)}
                                badgeLabel={getBadgeLabel(field.type, field.isRepeatable)}
                                onMoveField={handleMoveField}
                                onUpdateField={handleUpdateFieldById}
                                onDuplicateField={handleDuplicateFieldById}
                                onDeleteField={handleDeleteFieldById}
                              />
                            );
                          })
                        )}
                      </div>
                    </SortableContext>

                    <DragOverlay
                      dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                          styles: {
                            active: {
                              opacity: '0.4',
                            },
                          },
                        }),
                      }}
                    >
                      {activeDragField ? (
                        <CanvasFieldDragOverlay
                          field={activeDragField}
                          badgeLabel={getBadgeLabel(activeDragField.type, activeDragField.isRepeatable)}
                          width={activeDragWidth}
                          questionNumber={questionNumberMap.get(activeDragField.id) ?? null}
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>

                  {fields.length > 0 && (
                    <div className="pt-3 pb-1 border-t border-border/50 flex items-center justify-end text-2xs text-muted-foreground/70">
                      <span>{fields.length} {fields.length === 1 ? 'elemento' : 'elementos'}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <TemplateTextEditor
                templateText={templateText}
                allCurrentFields={allCurrentFields}
                onTextChange={setTemplateText}
                onResetStandardFormat={handleResetStandardFormat}
                textareaRef={textareaRef}
              />
            )}
          </div>
        </div>

        {/* Right column: Field Settings Sidebar */}
        <FieldSettingsSidebar
          canvasView={canvasView}
          allCurrentFields={allCurrentFields}
          templateText={templateText}
          onSwitchToVisual={() => setCanvasView('visual')}
          selectedField={selectedField}
          questionNumberMap={questionNumberMap}
          onUpdateSelectedField={handleUpdateSelectedField}
          onDeleteSelectedField={handleDeleteSelectedField}
          onDuplicateSection={handleDuplicateSection}
        />
      </div>

      {/* 3. Interactive Preview Dialog Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-2 pb-4 border-b">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {formTitle || 'Formulario sin título'}
              </DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShowDialogGeneratedReport}
                className="h-8 text-xs px-3 bg-background shadow-2xs gap-1.5 shrink-0"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Generar Minuta</span>
              </Button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {formDescription || 'Vista previa interactiva del formulario'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                El formulario no tiene campos agregados aún.
              </p>
            ) : (
              <ReportForm
                key="dialog-report-form"
                ref={dialogFormRef}
                template={previewTemplate}
                config={previewConfig}
                onSubmit={handleFormSubmit}
                disabled={false}
                controlledValues={previewControlledValues}
                onDataChange={handlePreviewFormDataChange}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Generated Report Preview Modal */}
      <ReportPreview
        isOpen={isPreviewReportOpen}
        onOpenChange={setIsPreviewReportOpen}
        content={previewReportContent}
        copyButtonText="Copiar Minuta"
        onCopy={handleCopyToClipboard}
        isMobile={isMobile}
        title={`Minuta: ${formTitle || 'Formulario'}`}
      />
    </div>
  );
}
