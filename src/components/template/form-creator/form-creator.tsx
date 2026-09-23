'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Eye,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Layers,
  Sparkles,
  RotateCcw,
  Calendar,
  Clock,
  Fingerprint,
  FileText,
  Layout,
  Copy,
  Folder,
  FolderOpen,
  Save,
  Check,
  Pencil,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import type {
  Template,
  TemplateConfig,
  FieldType,
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
import {
  DndContext,
  closestCenter,
  closestCorners,
  pointerWithin,
  CollisionDetection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  FormCreatorField,
  FormCreatorFieldType,
  compileFormToTemplateString,
  compileFieldToken,
  isFieldTagInText,
  updateFieldTagInText,
  removeFieldTagFromText,
  appendFieldTagToText,
  getMissingFieldTags,
  getProtectedTagRanges,
  reorderFieldsInTemplateText,
  sanitizeFieldId,
  getAllFieldsFlat,
  parseTemplateToFields,
} from './template-compiler';

interface AvailableField {
  type: FormCreatorFieldType | 'section';
  label: string;
  badgeLabel: string;
  iconText: string;
  iconBg: string;
  iconColor: string;
  defaultLabel: string;
  defaultOptions?: string[];
  isRepeatable?: boolean;
}

const AVAILABLE_FIELDS: AvailableField[] = [
  {
    type: 'text',
    label: 'Texto corto',
    badgeLabel: 'Texto corto',
    iconText: 'Aa',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    defaultLabel: 'Pregunta',
  },
  {
    type: 'textarea',
    label: 'Texto largo',
    badgeLabel: 'Texto largo',
    iconText: '¶',
    iconBg: 'bg-violet-50 dark:bg-violet-950/60',
    iconColor: 'text-violet-600 dark:text-violet-400',
    defaultLabel: 'Descripción detallada',
  },
  {
    type: 'dropdown',
    label: 'Opción única',
    badgeLabel: 'Opción única',
    iconText: '○',
    iconBg: 'bg-teal-50 dark:bg-teal-950/60',
    iconColor: 'text-teal-600 dark:text-teal-400',
    defaultLabel: 'Selecciona una opción',
    defaultOptions: ['Opción 1', 'Opción 2'],
  },
  {
    type: 'dropdown',
    label: 'Opción múltiple',
    badgeLabel: 'Opción múltiple',
    iconText: '□',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
    defaultLabel: 'Selecciona opciones',
    defaultOptions: ['Opción A', 'Opción B', 'Opción C'],
  },
  {
    type: 'date',
    label: 'Fecha',
    badgeLabel: 'Fecha',
    iconText: '📅',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    defaultLabel: 'Fecha',
  },
  {
    type: 'time-hlv',
    label: 'Hora',
    badgeLabel: 'Hora',
    iconText: '🕒',
    iconBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    defaultLabel: 'Hora',
  },
  {
    type: 'cedula',
    label: 'Cédula / DNI',
    badgeLabel: 'Cédula',
    iconText: '🪪',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    defaultLabel: 'Número de cédula',
  },
  {
    type: 'separator',
    label: 'Separador / Divisor',
    badgeLabel: 'Separador',
    iconText: '―',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-300',
    defaultLabel: 'Separador',
  },
  {
    type: 'section',
    label: 'Sección',
    badgeLabel: 'Sección',
    iconText: '🗂️',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    defaultLabel: 'Nueva Sección',
    isRepeatable: false,
  },
  {
    type: 'section',
    label: 'Sección repetible',
    badgeLabel: 'Sección repetible',
    iconText: '≡',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    defaultLabel: 'Grupo repetible',
    isRepeatable: true,
  },
];

const INITIAL_FIELDS: FormCreatorField[] = [
  {
    id: 'f_init_1',
    label: 'Pregunta 1',
    type: 'text',
    required: false,
    isFullWidth: false,
    modifier: 'none',
  },
];

function getNextFieldLabel(
  item: AvailableField,
  currentFields: FormCreatorField[]
): string {
  const allFlat = getAllFieldsFlat(currentFields);

  if (item.type === 'separator') {
    const sepCount = currentFields.filter((f) => f.type === 'separator').length + 1;
    return sepCount === 1 ? 'Separador' : `Separador ${sepCount}`;
  }

  if (item.type === 'section') {
    const isRep = item.isRepeatable !== false;
    const secCount = currentFields.filter((f) => f.type === 'section' && (f.isRepeatable !== false) === isRep).length + 1;
    return isRep ? `Grupo repetible ${secCount}` : `Sección ${secCount}`;
  }

  if (item.type === 'text') {
    const existingNumbers = allFlat
      .map((f) => {
        const match = f.label.trim().match(/^(?:Pregunta|Nueva pregunta)\s*(\d+)$/i);
        return match && match[1] ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    let nextNum =
      existingNumbers.length > 0
        ? Math.max(...existingNumbers) + 1
        : allFlat.filter((f) => f.type !== 'separator' && f.type !== 'section').length + 1;

    while (
      allFlat.some(
        (f) => f.label.trim().toLowerCase() === `pregunta ${nextNum}`.toLowerCase()
      )
    ) {
      nextNum++;
    }
    return `Pregunta ${nextNum}`;
  }

  const baseLabel = item.defaultLabel;
  const hasExact = allFlat.some(
    (f) => f.label.trim().toLowerCase() === baseLabel.trim().toLowerCase()
  );

  if (!hasExact) {
    return baseLabel;
  }

  let counter = 2;
  while (
    allFlat.some(
      (f) => f.label.trim().toLowerCase() === `${baseLabel} ${counter}`.toLowerCase()
    )
  ) {
    counter++;
  }
  return `${baseLabel} ${counter}`;
}

export function findFieldInTree(fields: FormCreatorField[], id: string | null): FormCreatorField | null {
  if (!id) return null;
  for (const f of fields) {
    if (f.id === id) return f;
    if (f.type === 'section' && f.fields) {
      for (const inner of f.fields) {
        if (inner.id === id) return inner;
      }
    }
  }
  return null;
}

export function updateFieldInTree(
  fields: FormCreatorField[],
  id: string,
  updates: Partial<FormCreatorField>
): FormCreatorField[] {
  return fields.map((f) => {
    if (f.id === id) {
      return { ...f, ...updates };
    }
    if (f.type === 'section' && f.fields) {
      return {
        ...f,
        fields: f.fields.map((inner) =>
          inner.id === id ? { ...inner, ...updates } : inner
        ),
      };
    }
    return f;
  });
}

export function deleteFieldFromTree(
  fields: FormCreatorField[],
  id: string
): FormCreatorField[] {
  return fields
    .filter((f) => f.id !== id)
    .map((f) => {
      if (f.type === 'section' && f.fields) {
        return {
          ...f,
          fields: f.fields.filter((inner) => inner.id !== id),
        };
      }
      return f;
    });
}

export interface ItemLocation {
  container: 'root' | string; // 'root' or sectionId
  index: number;
  field: FormCreatorField;
  parentSection?: FormCreatorField;
}

export function findLocation(tree: FormCreatorField[], id: string): ItemLocation | null {
  const rootIdx = tree.findIndex((f) => f.id === id);
  if (rootIdx !== -1) {
    return { container: 'root', index: rootIdx, field: tree[rootIdx]! };
  }
  for (const sec of tree) {
    if (sec.type === 'section' && sec.fields) {
      const innerIdx = sec.fields.findIndex((inner) => inner.id === id);
      if (innerIdx !== -1) {
        return {
          container: sec.id,
          index: innerIdx,
          field: sec.fields[innerIdx]!,
          parentSection: sec,
        };
      }
    }
  }
  return null;
}

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

interface SortableCanvasFieldCardProps {
  field: FormCreatorField;
  idx: number;
  questionNumber: string | null;
  totalFields: number;
  isSelected: boolean;
  onSelect: () => void;
  badgeLabel: string;
  onMoveField: (index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  isNested?: boolean;
}

function CanvasFieldMockupBody({ field }: { field: FormCreatorField }) {
  const isSeparator = field.type === 'separator';

  if (isSeparator) {
    return (
      <div className="pt-2 pb-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-border/80" />
        {field.label &&
        field.label.trim() &&
        field.label.trim().toLowerCase() !== 'separador' &&
        field.label.trim().toLowerCase() !== 'divisor' ? (
          <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded bg-muted/60 border border-border/50">
            {field.label.trim().toUpperCase()}
          </span>
        ) : (
          <span className="text-2xs text-muted-foreground/60 italic px-2">
            Línea divisoria horizontal [""]
          </span>
        )}
        <div className="h-px flex-1 bg-border/80" />
      </div>
    );
  }

  return (
    <div className="pt-0.5">
      {field.type === 'text' && (
        <Input
          readOnly
          placeholder="Escribe una respuesta corta..."
          className="h-10 rounded-xl bg-background border-border/80 text-sm shadow-2xs pointer-events-none placeholder:text-muted-foreground/50"
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          readOnly
          rows={2}
          placeholder="Escribe una respuesta detallada o descripción..."
          className="rounded-xl bg-background border-border/80 text-sm shadow-2xs resize-none pointer-events-none min-h-[72px] placeholder:text-muted-foreground/50"
        />
      )}

      {field.type === 'date' && (
        <div className="h-10 rounded-xl border border-border/80 bg-background flex items-center justify-between px-3.5 text-sm text-muted-foreground shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-muted-foreground/70" />
            <span>dd / mm / aaaa</span>
          </div>
          <span className="text-2xs font-mono uppercase tracking-wider text-muted-foreground/50">Fecha</span>
        </div>
      )}

      {field.type === 'time-hlv' && (
        <div className="h-10 rounded-xl border border-border/80 bg-background flex items-center justify-between px-3.5 text-sm text-muted-foreground shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-muted-foreground/70" />
            <span className="font-mono">00:00</span>
          </div>
          <span className="text-2xs font-mono uppercase tracking-wider text-muted-foreground/50">Hora militar (24h)</span>
        </div>
      )}

      {field.type === 'cedula' && (
        <div className="flex items-center gap-2">
          <div className="h-10 px-3 rounded-xl border border-border/80 bg-muted/40 text-xs font-bold text-foreground flex items-center justify-center shrink-0 shadow-2xs">
            V-
          </div>
          <div className="h-10 flex-1 rounded-xl border border-border/80 bg-background px-3.5 flex items-center text-sm text-muted-foreground shadow-2xs">
            Documento de identidad (Cédula)...
          </div>
        </div>
      )}

      {field.type === 'dropdown' && (
        <div className="space-y-2">
          <div className="h-10 rounded-xl border border-border/80 bg-background px-3.5 flex items-center justify-between text-sm text-muted-foreground shadow-2xs">
            <span>{field.options && field.options.length > 0 ? `Seleccionar... (${field.options.length} opciones)` : 'Seleccione una opción...'}</span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </div>
          {field.options && field.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {field.options.map((opt, oIdx) => (
                <span
                  key={oIdx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs bg-muted/60 text-muted-foreground border border-border/50"
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableCanvasFieldCard({
  field,
  idx,
  questionNumber,
  totalFields,
  isSelected,
  onSelect,
  badgeLabel,
  onMoveField,
  isNested,
}: SortableCanvasFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isSeparator = field.type === 'separator';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'w-full rounded-2xl transition-colors cursor-pointer bg-card relative group',
        isNested ? 'p-3.5 sm:p-4 shadow-2xs' : 'p-4 sm:p-5 shadow-2xs',
        isDragging && 'opacity-35 border-2 border-dashed border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-none',
        isSelected && !isDragging
          ? 'border-2 border-indigo-500 shadow-xs ring-4 ring-indigo-500/10'
          : isSeparator && !isDragging
          ? 'border border-dashed border-border/90 hover:border-indigo-300 dark:hover:border-indigo-700/60 bg-muted/20'
          : !isDragging && 'border border-border/70 hover:border-indigo-300 dark:hover:border-indigo-700/60'
      )}
    >
      {/* Header: Drag Handle + Question Number + Label + Badges & Reorder Controls */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none rounded hover:bg-muted/60 transition-colors"
            title="Arrastrar para reordenar"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {questionNumber !== null && (
            <span
              className="flex items-center justify-center h-5.5 min-w-5.5 px-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0 select-none shadow-2xs"
              title={`Pregunta #${questionNumber}`}
            >
              {questionNumber}
            </span>
          )}

          <label className="text-sm font-semibold text-foreground flex items-center gap-1 cursor-pointer truncate">
            {isSeparator ? (
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                {field.label &&
                field.label.trim() &&
                field.label.trim().toLowerCase() !== 'separador' &&
                field.label.trim().toLowerCase() !== 'divisor'
                  ? field.label.trim().toUpperCase()
                  : 'Separador / Línea divisoria'}
              </span>
            ) : (
              <>
                <span className="truncate">{field.label || `Pregunta ${questionNumber || ''}`}</span>
                {field.required && <span className="text-destructive font-bold ml-0.5">*</span>}
              </>
            )}
          </label>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'text-2xs font-semibold px-2 py-0.5 rounded-full',
              isSeparator
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
            )}
          >
            {badgeLabel}
          </span>

          {isSelected && (
            <div className="flex items-center gap-0.5 border-l pl-1.5 ml-1">
              <button
                type="button"
                disabled={idx === 0}
                onClick={(e) => onMoveField(idx, 'up', e)}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                title="Mover arriba"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === totalFields - 1}
                onClick={(e) => onMoveField(idx, 'down', e)}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                title="Mover abajo"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body / Input Mockup */}
      <CanvasFieldMockupBody field={field} />
    </div>
  );
}

function InnerSectionDroppableZone({
  sectionId,
  children,
  isEmpty,
}: {
  sectionId: string;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-sec-${sectionId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl p-2.5 sm:p-3 transition-all space-y-3 min-h-[60px]',
        isOver
          ? 'bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/60 border-2 border-dashed border-indigo-400'
          : isEmpty
          ? 'bg-muted/20 dark:bg-muted/10 border-2 border-dashed border-border/80'
          : 'bg-muted/30 dark:bg-muted/15 border border-dashed border-border/80'
      )}
    >
      {children}
    </div>
  );
}

interface SortableCanvasSectionCardProps {
  section: FormCreatorField;
  idx: number;
  questionNumber: string | null;
  totalFields: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveField: (index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onUpdateSection: (sectionId: string, updates: Partial<FormCreatorField>) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onAddFieldToSection: (sectionId: string, type?: FormCreatorFieldType) => void;
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onMoveInnerField: (sectionId: string, index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  questionNumberMap: Map<string, string>;
  getBadgeLabel: (type: FormCreatorFieldType, isRepeatable?: boolean) => string;
}

function SortableCanvasSectionCard({
  section,
  idx,
  questionNumber,
  totalFields,
  isSelected,
  onSelect,
  onMoveField,
  onUpdateSection,
  onDeleteSection,
  onDuplicateSection,
  onAddFieldToSection,
  selectedFieldId,
  onSelectField,
  onMoveInnerField,
  questionNumberMap,
  getBadgeLabel,
}: SortableCanvasSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const innerFields = section.fields || [];
  const isRep = section.isRepeatable !== false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl transition-colors cursor-pointer bg-card relative group overflow-hidden',
        isDragging && (isRep
          ? 'opacity-35 border-2 border-dashed border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-none'
          : 'opacity-35 border-2 border-dashed border-blue-400 bg-blue-50/20 dark:bg-blue-950/20 shadow-none'),
        isSelected && !isDragging
          ? (isRep
            ? 'border-2 border-indigo-500 shadow-xs ring-4 ring-indigo-500/10'
            : 'border-2 border-blue-500 shadow-xs ring-4 ring-blue-500/10')
          : !isDragging && (isRep
            ? 'border-2 border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-2xs'
            : 'border-2 border-blue-200/80 dark:border-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs')
      )}
    >
      {/* Decorative top strip */}
      <div
        className={cn(
          'h-1.5 w-full',
          isRep
            ? 'bg-gradient-to-r from-indigo-500/60 via-indigo-600 to-indigo-500/60'
            : 'bg-gradient-to-r from-blue-500/60 via-blue-600 to-blue-500/60'
        )}
      />

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Header: Drag Handle + Number + Title Input + Repeatable Badge & Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="p-1 -ml-1 text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none rounded hover:bg-muted/60 transition-colors"
              title="Arrastrar sección para reordenar"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {questionNumber !== null && (
              <span
                className={cn(
                  'flex items-center justify-center h-5.5 min-w-5.5 px-1.5 rounded-lg border text-xs font-bold shrink-0 select-none shadow-2xs',
                  isRep
                    ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                )}
                title={`Sección #${questionNumber}`}
              >
                {questionNumber}
              </span>
            )}

            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isRep ? (
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
              <Input
                value={section.label}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isRep) {
                    const clean = sanitizeFieldId(val).toUpperCase();
                    const isPlural = clean.endsWith('S') && clean.length > 3;
                    const singular = isPlural ? clean.slice(0, -1) : clean;
                    const plural = isPlural ? clean : (clean ? `${clean}S` : 'ITEMS');
                    onUpdateSection(section.id, {
                      label: val,
                      singularTitle: singular || 'ITEM',
                      pluralTitle: plural || 'ITEMS',
                      subLabel: singular || 'ITEM',
                    });
                  } else {
                    onUpdateSection(section.id, {
                      label: val,
                    });
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                placeholder={
                  isRep
                    ? 'Título de la sección repetible (ej. Datos del Vehículo)...'
                    : 'Título de la sección (ej. Datos Generales)...'
                }
                className={cn(
                  'h-8 font-bold text-sm bg-transparent border-transparent hover:border-border/60 focus-visible:ring-0 px-1.5',
                  isRep ? 'focus-visible:border-indigo-500' : 'focus-visible:border-blue-500'
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                'text-2xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1',
                isRep
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60'
                  : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60'
              )}
            >
              <span>{isRep ? 'Sección repetible' : 'Sección'}</span>
              <span className="opacity-60">({innerFields.length})</span>
            </span>

            {isSelected && (
              <div className="flex items-center gap-0.5 border-l pl-1.5 ml-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => onMoveField(idx, 'up', e)}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  title="Mover sección arriba"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === totalFields - 1}
                  onClick={(e) => onMoveField(idx, 'down', e)}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  title="Mover sección abajo"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
              title={isExpanded ? 'Contraer sección' : 'Expandir sección'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Body (when expanded): Inner Droppable Area + Inner Sortable Context */}
        {isExpanded && (
          <div className="space-y-3 pt-1">
            <InnerSectionDroppableZone sectionId={section.id} isEmpty={innerFields.length === 0}>
              <SortableContext
                items={innerFields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {innerFields.length === 0 ? (
                  <div className="p-6 border border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl text-center space-y-1.5 bg-background/50">
                    <p className="text-xs font-semibold text-foreground/80">
                      Arrastra preguntas aquí para agruparlas en esta sección
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      O usa los botones de abajo para añadir una pregunta directamente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {innerFields.map((innerField, fIdx) => (
                      <SortableCanvasFieldCard
                        key={innerField.id}
                        field={innerField}
                        idx={fIdx}
                        questionNumber={questionNumberMap.get(innerField.id) ?? null}
                        totalFields={innerFields.length}
                        isSelected={selectedFieldId === innerField.id}
                        onSelect={() => onSelectField(innerField.id)}
                        badgeLabel={getBadgeLabel(innerField.type, innerField.isRepeatable)}
                        onMoveField={(fIndex, dir, e) => onMoveInnerField(section.id, fIndex, dir, e)}
                        isNested={true}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </InnerSectionDroppableZone>

            {/* Quick Add Questions into this Section */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50"
            >
              <span className="text-2xs text-muted-foreground font-medium mr-1">
                + Añadir campo:
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddFieldToSection(section.id, 'text')}
                className="h-7 px-2.5 text-2xs rounded-lg gap-1 border-dashed hover:border-indigo-400 hover:text-indigo-600 bg-background"
              >
                <Plus className="h-3 w-3" />
                Texto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddFieldToSection(section.id, 'dropdown')}
                className="h-7 px-2.5 text-2xs rounded-lg gap-1 border-dashed hover:border-indigo-400 hover:text-indigo-600 bg-background"
              >
                <Plus className="h-3 w-3" />
                Desplegable
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddFieldToSection(section.id, 'date')}
                className="h-7 px-2.5 text-2xs rounded-lg gap-1 border-dashed hover:border-indigo-400 hover:text-indigo-600 bg-background"
              >
                <Plus className="h-3 w-3" />
                Fecha
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddFieldToSection(section.id, 'textarea')}
                className="h-7 px-2.5 text-2xs rounded-lg gap-1 border-dashed hover:border-indigo-400 hover:text-indigo-600 bg-background"
              >
                <Plus className="h-3 w-3" />
                Párrafo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddFieldToSection(section.id, 'cedula')}
                className="h-7 px-2.5 text-2xs rounded-lg gap-1 border-dashed hover:border-indigo-400 hover:text-indigo-600 bg-background"
              >
                <Plus className="h-3 w-3" />
                Cédula
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CanvasFieldDragOverlay({
  field,
  badgeLabel,
  width,
  questionNumber,
}: {
  field: FormCreatorField;
  badgeLabel: string;
  width?: number | null;
  questionNumber?: string | null;
}) {
  const isSeparator = field.type === 'separator';
  const isSection = field.type === 'section';

  return (
    <div
      style={{ width: width ? `${width}px` : undefined }}
      className="rounded-2xl border-2 border-indigo-500 bg-card p-4 sm:p-5 shadow-2xl ring-4 ring-indigo-500/20 pointer-events-none select-none"
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 -ml-1 text-indigo-600 dark:text-indigo-400 shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>

          {!isSeparator && questionNumber !== null && questionNumber !== undefined && (
            <span className="flex items-center justify-center h-5.5 min-w-5.5 px-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0 select-none shadow-2xs">
              {questionNumber}
            </span>
          )}

          {isSection && <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}

          <span className="font-semibold text-sm text-foreground truncate">
            {isSeparator
              ? field.label &&
                field.label.trim() &&
                field.label.trim().toLowerCase() !== 'separador' &&
                field.label.trim().toLowerCase() !== 'divisor'
                ? field.label.trim().toUpperCase()
                : 'Separador / Línea divisoria'
              : field.label || `Pregunta ${questionNumber || ''}`}
          </span>
        </div>
        <span
          className={cn(
            'text-2xs font-semibold px-2 py-0.5 rounded-full shrink-0',
            isSeparator
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
          )}
        >
          {badgeLabel}
        </span>
      </div>

      {isSection ? (
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-dashed border-indigo-300 text-xs text-indigo-700 dark:text-indigo-300">
          {field.fields?.length || 0} {(field.fields?.length || 0) === 1 ? 'campo en esta sección' : 'campos en esta sección'}
        </div>
      ) : (
        <CanvasFieldMockupBody field={field} />
      )}
    </div>
  );
}

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
  const backdropRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Form Header State
  const [formTitle, setFormTitle] = useState(initialTemplate?.name || 'Formulario sin título');
  const [formDescription, setFormDescription] = useState('Agrega una descripción');

  // Fields State (all top-level questions, separators, and repeatable sections inline)
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

  // Combined flat list of all current fields (root fields + fields inside repeatable sections)
  const allCurrentFields = useMemo(() => {
    return getAllFieldsFlat(fields);
  }, [fields]);

  // Canvas View Mode: 'visual' (Cards matching user screenshot) vs 'text' (Template prose editor with locked tags)
  const [canvasView, setCanvasView] = useState<'visual' | 'text'>('visual');

  // Custom Template Text (contains the boilerplate/prose with embedded {tags})
  const [templateText, setTemplateText] = useState<string>(() => {
    if (initialTemplate?.content) {
      return initialTemplate.content;
    }
    return compileFormToTemplateString({
      name: initialTemplate?.name || 'Formulario sin título',
      type: 'normal',
      headerTitle: (initialTemplate?.name || 'Formulario sin título').toUpperCase(),
      fields: INITIAL_FIELDS,
    });
  });

  // Track template loading changes from parent prop
  const lastLoadedIdRef = useRef<string | null | undefined>(initialTemplate?.id ?? null);
  useEffect(() => {
    const nextId = initialTemplate?.id ?? null;
    if (nextId !== lastLoadedIdRef.current) {
      lastLoadedIdRef.current = nextId;
      if (initialTemplate) {
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
      } else {
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
    }
  }, [initialTemplate]);

  // Handlers to load another existing template or create a new one inside FormCreator
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

  // Debounce template content for the form preview to prevent rapid remounts and state resets
  const [debouncedContent, setDebouncedContent] = useState(templateText);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(templateText);
    }, 300);
    return () => clearTimeout(timer);
  }, [templateText]);

  // Live Interactive Preview toggle in canvas
  const [isLivePreview, setIsLivePreview] = useState(false);
  // Modal for Live Interactive Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFormData, setPreviewFormData] = useState<Record<string, any>>({});

  // Generated Report Preview Modal State
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

  // Active selected field (searches both root fields and inner fields inside sections)
  const selectedField = useMemo(() => {
    return findFieldInTree(fields, selectedFieldId);
  }, [fields, selectedFieldId]);

  // Question numbers mapping (1-indexed for root fields, 3.1 for section inner fields, skipping separators)
  const questionNumberMap = useMemo(() => {
    const map = new Map<string, string>();
    let rootCounter = 1;

    fields.forEach((f) => {
      if (f.type === 'separator') {
        return;
      }
      if (f.type === 'section') {
        const secNum = rootCounter++;
        map.set(f.id, String(secNum));
        (f.fields || []).forEach((inner, idx) => {
          if (inner.type !== 'separator') {
            map.set(inner.id, `${secNum}.${idx + 1}`);
          }
        });
        return;
      }
      map.set(f.id, String(rootCounter++));
    });

    return map;
  }, [fields]);

  // Syntax validation of the current templateText
  const syntaxCheck = useMemo(() => {
    if (!templateText.trim()) {
      return { valid: false, error: 'El texto de la plantilla no puede estar vacío.' };
    }
    return validateTemplateSyntax(templateText);
  }, [templateText]);

  // Preview Template & Config for Dialog and In-Canvas Live Preview
  const previewTemplate = useMemo<Template>(
    () => ({
      id: 'preview',
      workspace_id: currentWorkspace,
      name: formTitle || 'Vista Previa del Formulario',
      content: debouncedContent,
      type: 'normal',
      is_active: true,
    }),
    [debouncedContent, formTitle, currentWorkspace]
  );

  const previewConfig = useMemo<TemplateConfig>(() => {
    const parsed = parseTemplate(debouncedContent);
    const { sections: parsedSections, layout, fieldNames, fieldTypes, templateOptions, defaultValues } = parsed;

    const configFields: Record<string, FieldConfig> = {};
    fieldNames.forEach((fieldName: string) => {
      const typeFromTemplate = fieldTypes.get(fieldName);
      const optionsFromTemplate = templateOptions.get(fieldName);
      const defaultValue = defaultValues.get(fieldName);

      configFields[fieldName] = {
        type: typeFromTemplate || 'text',
        label: fieldName,
        default_value: defaultValue || '',
        snippet_options: optionsFromTemplate || undefined,
      };
    });

    // Enrich with visual fields rich config (both root fields and repeatable section fields)
    const allVisualFields = getAllFieldsFlat(fields);
    allVisualFields.forEach((f) => {
      if (f.type === 'separator' || f.type === 'section') return;
      const snippetOpts: SnippetOption[] = (f.options || []).map((opt) => ({
        id: generateId(),
        label: opt,
        value: opt,
      }));

      const cleanLabel = sanitizeFieldId(f.label);
      const matchedKey =
        Object.keys(configFields).find(
          (k) =>
            k.toLowerCase() === cleanLabel.toLowerCase() ||
            k.toLowerCase() === f.label.trim().toLowerCase()
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
      if (matchedKey !== cleanLabel) {
        configFields[cleanLabel] = enriched;
      }
      if (matchedKey !== f.label.trim()) {
        configFields[f.label.trim()] = enriched;
      }
    });

    return {
      sections: parsedSections,
      layout,
      fields: configFields,
    };
  }, [debouncedContent, fields]);

  // Handlers for Generated Minuta Preview
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

  // DnD Sensors & State
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    if (initialWidth) {
      setActiveDragWidth(initialWidth);
    }
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

    // 1. If active is a top-level section: it can only reorder at root level
    if (activeLoc.field.type === 'section') {
      const overLoc = findLocation(fields, overId);
      const targetRootIdx = overLoc
        ? overLoc.container === 'root'
          ? overLoc.index
          : fields.findIndex((f) => f.id === overLoc.container)
        : fields.findIndex((f) => f.id === overId);

      if (targetRootIdx !== -1 && targetRootIdx !== activeLoc.index) {
        const nextFields = arrayMove(fields, activeLoc.index, targetRootIdx);
        setFields(nextFields);
        setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
        toast.success('Sección reordenada');
      }
      return;
    }

    // 2. Active is a normal field or separator
    let targetContainer: 'root' | string = 'root';
    let targetIndex = -1;

    if (overId.startsWith('droppable-sec-')) {
      targetContainer = overId.replace('droppable-sec-', '');
      const targetSec = fields.find((f) => f.id === targetContainer);
      targetIndex = targetSec?.fields?.length ?? 0;
    } else {
      const overLoc = findLocation(fields, overId);
      if (overLoc) {
        targetContainer = overLoc.container;
        targetIndex = overLoc.index;
      } else {
        const secCard = fields.find((f) => f.id === overId && f.type === 'section');
        if (secCard) {
          targetContainer = secCard.id;
          targetIndex = secCard.fields?.length ?? 0;
        }
      }
    }

    if (targetIndex === -1 && targetContainer === 'root') {
      targetIndex = fields.findIndex((f) => f.id === overId);
    }

    if (targetIndex === -1) return;

    // Case A: Reordering within root
    if (activeLoc.container === 'root' && targetContainer === 'root') {
      if (activeLoc.index !== targetIndex) {
        const nextFields = arrayMove(fields, activeLoc.index, targetIndex);
        setFields(nextFields);
        setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
        toast.success('Orden actualizado');
      }
      return;
    }

    // Case B: Reordering within the same section
    if (activeLoc.container !== 'root' && activeLoc.container === targetContainer) {
      if (activeLoc.index !== targetIndex) {
        const nextFields = fields.map((sec) => {
          if (sec.id === activeLoc.container && sec.fields) {
            const nextInner = arrayMove(sec.fields, activeLoc.index, targetIndex);
            return { ...sec, fields: nextInner };
          }
          return sec;
        });
        setFields(nextFields);
        setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
        toast.success('Pregunta reordenada en la sección');
      }
      return;
    }

    // Case C: Moving from root INTO a section
    if (activeLoc.container === 'root' && targetContainer !== 'root') {
      const movedField = activeLoc.field;
      const nextFields = fields
        .filter((f) => f.id !== movedField.id)
        .map((sec) => {
          if (sec.id === targetContainer && sec.type === 'section') {
            const inner = [...(sec.fields || [])];
            inner.splice(targetIndex, 0, movedField);
            return { ...sec, fields: inner };
          }
          return sec;
        });
      setFields(nextFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      toast.success(`Campo "${movedField.label}" movido a la sección`);
      return;
    }

    // Case D: Moving from section OUT to root
    if (activeLoc.container !== 'root' && targetContainer === 'root') {
      const movedField = activeLoc.field;
      const strippedFields = fields.map((sec) => {
        if (sec.id === activeLoc.container && sec.fields) {
          return {
            ...sec,
            fields: sec.fields.filter((inner) => inner.id !== movedField.id),
          };
        }
        return sec;
      });
      strippedFields.splice(targetIndex, 0, movedField);
      setFields(strippedFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, strippedFields, formTitle));
      toast.success(`Campo "${movedField.label}" movido fuera de la sección`);
      return;
    }

    // Case E: Moving from Section A to Section B
    if (activeLoc.container !== 'root' && targetContainer !== 'root' && activeLoc.container !== targetContainer) {
      const movedField = activeLoc.field;
      const nextFields = fields.map((sec) => {
        if (sec.id === activeLoc.container && sec.fields) {
          return {
            ...sec,
            fields: sec.fields.filter((inner) => inner.id !== movedField.id),
          };
        }
        if (sec.id === targetContainer && sec.type === 'section') {
          const inner = [...(sec.fields || [])];
          inner.splice(targetIndex, 0, movedField);
          return { ...sec, fields: inner };
        }
        return sec;
      });
      setFields(nextFields);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      toast.success(`Campo "${movedField.label}" movido a otra sección`);
      return;
    }
  };

  // Add field from left sidebar
  const handleAddAvailableField = (item: AvailableField) => {
    if (item.type === 'separator') {
      const sepLabel = getNextFieldLabel(item, fields);
      const newSep: FormCreatorField = {
        id: `sep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: sepLabel,
        type: 'separator',
        isFullWidth: true,
      };
      const nextFields = [...fields, newSep];
      setFields(nextFields);
      setSelectedFieldId(newSep.id);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      toast.success(sepLabel === 'Separador' ? 'Separador añadido' : `${sepLabel} añadido`);
      return;
    }

    if (item.type === 'section') {
      const isRep = item.isRepeatable !== false;
      const sectionCount = fields.filter((f) => f.type === 'section' && (f.isRepeatable !== false) === isRep).length + 1;
      const title = getNextFieldLabel(item, fields);
      const singular = `ITEM ${sectionCount}`;
      const newSection: FormCreatorField = {
        id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: title,
        type: 'section',
        isRepeatable: isRep,
        singularTitle: isRep ? singular : undefined,
        pluralTitle: isRep ? `${singular}S` : undefined,
        subLabel: isRep ? singular : undefined,
        fields: [
          {
            id: `f_inner_${Date.now()}_1`,
            label: 'Pregunta 1',
            type: 'text',
            required: false,
          },
        ],
      };
      const nextFields = [...fields, newSection];
      setFields(nextFields);
      setSelectedFieldId(newSection.id);
      setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
      toast.success(isRep ? 'Sección repetible añadida' : 'Sección añadida');
      return;
    }

    const fieldLabel = getNextFieldLabel(item, fields);
    const newField: FormCreatorField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: fieldLabel,
      type: item.type,
      required: false,
      isFullWidth: item.type === 'textarea',
      modifier: 'none',
      options: item.defaultOptions ? [...item.defaultOptions] : undefined,
    };

    const nextFields = [...fields, newField];
    setFields(nextFields);
    setSelectedFieldId(newField.id);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    toast.success(`Campo "${newField.label}" agregado`);
  };

  // Update selected field properties (works for root fields, section cards, and inner fields)
  const handleUpdateSelectedField = (updates: Partial<FormCreatorField>) => {
    if (!selectedFieldId || !selectedField) return;

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

  // Delete selected field
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

  // Reorder root field
  const handleMoveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const next = arrayMove(fields, index, targetIndex);
    setFields(next);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, next, formTitle));
  };

  // Section specific handlers
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
    const targetSec = fields.find((f) => f.id === sectionId);
    if (!targetSec || targetSec.type !== 'section') return;

    const innerList = targetSec.fields || [];
    const base =
      defaultLabel ||
      (type === 'dropdown'
        ? 'Selección'
        : type === 'date'
        ? 'Fecha'
        : type === 'textarea'
        ? 'Descripción'
        : type === 'cedula'
        ? 'Cédula'
        : 'Pregunta');

    const existingLabels = new Set(innerList.map((f) => f.label.toLowerCase().trim()));
    let finalLabel = base;
    let counter = 1;
    while (existingLabels.has(finalLabel.toLowerCase().trim())) {
      counter++;
      finalLabel = `${base} ${counter}`;
    }

    const newField: FormCreatorField = {
      id: `f_inner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: finalLabel,
      type,
      required: false,
      isFullWidth: type === 'textarea',
      modifier: 'none',
      options: type === 'dropdown' ? ['Opción 1', 'Opción 2'] : undefined,
    };

    const nextFields = fields.map((f) => {
      if (f.id === sectionId && f.type === 'section') {
        return {
          ...f,
          fields: [...(f.fields || []), newField],
        };
      }
      return f;
    });

    setFields(nextFields);
    setSelectedFieldId(newField.id);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
    toast.success(`Campo "${newField.label}" añadido a la sección`);
  };

  const handleMoveInnerField = (
    sectionId: string,
    index: number,
    direction: 'up' | 'down',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const targetSec = fields.find((f) => f.id === sectionId);
    if (!targetSec || !targetSec.fields || targetIndex < 0 || targetIndex >= targetSec.fields.length) {
      return;
    }

    const nextInner = arrayMove(targetSec.fields, index, targetIndex);
    const nextFields = fields.map((f) => {
      if (f.id === sectionId) {
        return { ...f, fields: nextInner };
      }
      return f;
    });

    setFields(nextFields);
    setTemplateText((prev) => reorderFieldsInTemplateText(prev, nextFields, formTitle));
  };

  // Dropdown options management
  const handleAddOption = () => {
    if (!selectedField) return;
    const current = selectedField.options || [];
    const nextNum = current.length + 1;
    handleUpdateSelectedField({
      options: [...current, `Opción ${nextNum}`],
    });
  };

  const handleUpdateOption = (optIdx: number, val: string) => {
    if (!selectedField || !selectedField.options) return;
    const current = [...selectedField.options];
    current[optIdx] = val;
    handleUpdateSelectedField({ options: current });
  };

  const handleRemoveOption = (optIdx: number) => {
    if (!selectedField || !selectedField.options) return;
    const current = [...selectedField.options];
    current.splice(optIdx, 1);
    handleUpdateSelectedField({
      options: current.length > 0 ? current : ['Opción 1'],
    });
  };

  // TEXTAREA CHANGE HANDLER WITH LOCKED TAG PROTECTION:
  // "que en la vista del cuadro de texto salgan las etiquetas de texto {ejemplo} pero que no se puedan borrar ya que están ligadas a lo que el usuario añadió en el formulario, y que el usuario solo ajuste aquí el texto que va en la planilla por defecto"
  const handleTextChange = (newText: string) => {
    // Check if any visual field's tag was removed (including repeatable section fields)
    const missingFields = getMissingFieldTags(newText, allCurrentFields);

    if (missingFields.length > 0) {
      // Simply reject the change without appending duplicate lines
      const firstMissing = missingFields[0];
      toast.warning(
        `La etiqueta {${firstMissing ? firstMissing.label : 'campo'}} está vinculada al formulario y no se puede borrar.`,
        { duration: 2500 }
      );
      return;
    }

    setTemplateText(newText);
  };

  // PREVENT TAMPERING WITH OR DELETING PROTECTED TAGS VIA KEYBOARD
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const ranges = getProtectedTagRanges(templateText, allCurrentFields);

    // 1. Check if range selection intersects with any protected tag
    if (selectionStart !== selectionEnd) {
      const touchedTag = ranges.find(
        (r) => selectionStart < r.end && selectionEnd > r.start
      );

      if (touchedTag) {
        if (
          e.key === 'Backspace' ||
          e.key === 'Delete' ||
          (!e.ctrlKey && !e.metaKey && e.key.length === 1)
        ) {
          e.preventDefault();
          toast.warning(
            `La selección contiene la etiqueta protegida {${touchedTag.label}} y no se puede borrar.`,
            { duration: 2500 }
          );
          return;
        }
      }
    }

    // 2. Cursor is collapsed
    if (selectionStart === selectionEnd) {
      // Trying to backspace the closing brace of a tag
      if (e.key === 'Backspace') {
        const tagEndingAtCursor = ranges.find((r) => r.end === selectionStart);
        if (tagEndingAtCursor) {
          e.preventDefault();
          toast.warning(
            `La etiqueta {${tagEndingAtCursor.label}} no se puede borrar porque está vinculada a un campo.`,
            { duration: 2500 }
          );
          return;
        }
      }

      // Trying to delete the opening brace of a tag
      if (e.key === 'Delete') {
        const tagStartingAtCursor = ranges.find((r) => r.start === selectionStart);
        if (tagStartingAtCursor) {
          e.preventDefault();
          toast.warning(
            `La etiqueta {${tagStartingAtCursor.label}} no se puede borrar porque está vinculada a un campo.`,
            { duration: 2500 }
          );
          return;
        }
      }

      // Trying to edit or delete inside a tag
      const tagInside = ranges.find((r) => selectionStart > r.start && selectionStart < r.end);
      if (tagInside) {
        const navKeys = [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'Escape',
          'Tab',
        ];
        if (!navKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toast.warning(
            `No puedes modificar el interior de la etiqueta protegida {${tagInside.label}}. Para cambiar su nombre, usa los ajustes del campo.`,
            { duration: 2500 }
          );
          return;
        }
      }
    }
  };

  // Reset text to default generated format
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

  // Synchronize scrolling between textarea and highlighted backdrop
  const handleScrollSync = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Render text with colored highlights on tags {ejemplo} and separators [""]
  const renderHighlightedTemplateText = (text: string, currentFields: FormCreatorField[]) => {
    if (!text) return null;

    const tagRegex = /\{[^{}\n\r]+\}|\[""\]|\["[^"\n\r]+"\]/g;
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        elements.push(text.substring(lastIdx, match.index));
      }

      const token = match[0];
      const matchedField = currentFields.find((f) => isFieldTagInText(token, f));

      if (token.startsWith('["')) {
        elements.push(
          <mark
            key={match.index}
            className="bg-slate-500/20 dark:bg-slate-400/25 text-slate-800 dark:text-slate-200 font-bold rounded-xs p-0 m-0"
          >
            {token}
          </mark>
        );
      } else if (matchedField) {
        // Tag linked to a visual field -> Vibrant colored highlight
        elements.push(
          <mark
            key={match.index}
            className="bg-indigo-500/20 dark:bg-indigo-400/25 text-indigo-700 dark:text-indigo-300 font-bold rounded-xs p-0 m-0"
          >
            {token}
          </mark>
        );
      } else {
        // Other tags -> Amber highlight
        elements.push(
          <mark
            key={match.index}
            className="bg-amber-500/20 dark:bg-amber-400/25 text-amber-700 dark:text-amber-300 font-semibold rounded-xs p-0 m-0"
          >
            {token}
          </mark>
        );
      }

      lastIdx = match.index + token.length;
    }

    if (lastIdx < text.length) {
      elements.push(text.substring(lastIdx));
    }

    if (text.endsWith('\n')) {
      elements.push(' ');
    }

    return elements;
  };

  // Publish / Save Form
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

  const getBadgeLabel = (type: FormCreatorFieldType, isRepeatable?: boolean) => {
    if (type === 'separator') return 'Separador';
    if (type === 'section') return isRepeatable === false ? 'Sección' : 'Sección repetible';
    const found = AVAILABLE_FIELDS.find((f) => f.type === type);
    return found ? found.badgeLabel : type;
  };

  const formInitialLetter = (formTitle.trim().charAt(0) || 'F').toUpperCase();

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 dark:bg-background overflow-hidden">
      {/* 1. TOP HEADER BAR */}
      <header className="h-16 px-4 sm:px-6 border-b bg-card flex items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-xs">
        {/* Left: Back button, Avatar, Title input, and Template Selector Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
            {formInitialLetter}
          </div>

          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Formulario sin título"
            className="h-9 px-4 rounded-full border border-border/80 bg-background text-sm font-medium w-36 sm:w-56 md:w-64 shadow-2xs focus-visible:ring-1 focus-visible:ring-indigo-500"
          />

          {/* Template Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-3 text-xs gap-1.5 border-border/80 bg-background hover:bg-muted font-normal text-muted-foreground hover:text-foreground shrink-0 shadow-2xs"
                title="Cargar o cambiar formulario"
              >
                <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
                <span className="max-w-[130px] truncate hidden md:inline">
                  {editingTemplate ? editingTemplate.name : 'Cargar plantilla'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
              <DropdownMenuItem
                onClick={handleCreateNewForm}
                className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-400 gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nuevo formulario vacío</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Plantillas existentes ({allWorkspaceTemplates.length})
              </div>
              {allWorkspaceTemplates.map((t) => {
                const isCurrent = editingTemplate?.id === t.id;
                return (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => handleLoadTemplate(t)}
                    className={cn(
                      'cursor-pointer gap-2 py-2',
                      isCurrent && 'bg-indigo-50 dark:bg-indigo-950/50 font-semibold text-indigo-600 dark:text-indigo-400'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate flex-1">{t.name}</span>
                    {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}
                  </DropdownMenuItem>
                );
              })}
              {allWorkspaceTemplates.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No hay plantillas guardadas
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Tabs Diseño Visual & Texto de la Planilla */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-muted/70 dark:bg-muted/40 rounded-xl border border-border/60 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setCanvasView('visual')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
              canvasView === 'visual'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layout className="h-3.5 w-3.5" />
            <span>Diseño Visual</span>
          </button>

          <button
            type="button"
            onClick={() => setCanvasView('text')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
              canvasView === 'text'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Texto de la Planilla</span>
          </button>
        </div>

        {/* Right: Status badge, Vista previa button, Publicar / Guardar Cambios button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {editingTemplate ? (
            <div className="hidden lg:flex rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 px-3 py-1 text-xs font-medium items-center gap-1.5 select-none shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Editando Formulario</span>
            </div>
          ) : (
            <div className="hidden lg:flex rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40 px-3 py-1 text-xs font-medium items-center gap-1.5 select-none shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Borrador</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="rounded-full border border-border/80 bg-background hover:bg-muted text-xs sm:text-sm font-medium h-9 px-4 gap-1.5 shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Vista previa</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePublish}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold h-9 px-4 sm:px-5 shadow-sm active:scale-95 transition-all gap-1.5"
          >
            {editingTemplate ? (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Guardar Cambios</span>
              </>
            ) : (
              <span>Publicar</span>
            )}
          </Button>
        </div>
      </header>

      {/* 2. THREE-COLUMN BODY (Matching screenshot with Visual vs Text Switcher) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* LEFT COLUMN: CAMPOS DISPONIBLES */}
        <div className="md:col-span-3 xl:col-span-3 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
            CAMPOS DISPONIBLES
          </h3>

          <div className="space-y-2.5">
            {AVAILABLE_FIELDS.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleAddAvailableField(item)}
                className="rounded-2xl border border-border/70 bg-card hover:border-indigo-400/80 dark:hover:border-indigo-600 hover:shadow-xs p-3 flex items-center gap-3.5 cursor-pointer transition-all active:scale-[0.98] select-none group"
              >
                <div
                  className={`h-8 w-8 rounded-xl ${item.iconBg} ${item.iconColor} font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {item.iconText}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: CANVAS / FORM DOCUMENT */}
        <div className="md:col-span-6 xl:col-span-6 flex flex-col min-h-0 overflow-y-auto">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex-1 flex flex-col space-y-5">
            {/* VIEW 1: DISEÑO VISUAL */}
            {canvasView === 'visual' ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Document Top Bar: Title, Description, and Interactive Live Preview Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Formulario sin título"
                      className="text-2xl sm:text-3xl font-bold tracking-tight border-0 border-b border-transparent hover:border-border/60 focus-visible:border-indigo-500 focus-visible:ring-0 rounded-none px-0 py-0.5 bg-transparent placeholder:text-muted-foreground/40 transition-colors"
                    />
                    <Input
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Agrega una descripción para los usuarios que llenarán este formulario..."
                      className="text-xs sm:text-sm text-muted-foreground border-0 border-b border-transparent hover:border-border/60 focus-visible:border-indigo-500 focus-visible:ring-0 rounded-none px-0 py-0.5 bg-transparent placeholder:text-muted-foreground/40 transition-colors"
                    />
                  </div>

                  {/* Mode Switcher: Editor vs Formulario Final en Vivo */}
                  <div className="flex items-center gap-1 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/60 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setIsLivePreview(false)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                        !isLivePreview
                          ? 'bg-card text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Editar campos y preguntas visualmente"
                    >
                      <Layout className="h-3.5 w-3.5" />
                      <span>Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLivePreview(true)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                        isLivePreview
                          ? 'bg-card text-foreground shadow-2xs font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Ver e interactuar con el formulario final real"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Formulario Final</span>
                    </button>
                  </div>
                </div>

                {/* Sub-view 1: Live ReportForm (Formulario Final) */}
                <div className={cn('flex-1 space-y-4 pt-1', !isLivePreview && 'hidden')}>
                  {/* Live Preview Controls: Status toggle & Generar Minuta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Vista Previa</span>
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
                      El formulario no tiene campos agregados aún. Vuelve a "Editor" para agregar preguntas.
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

                {/* Sub-view 2: Visual Fields list (Editor) */}
                <div className={cn('flex-1 flex flex-col', isLivePreview && 'hidden')}>
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
                      <div className="flex flex-col gap-4 flex-1 items-stretch">
                        {fields.length === 0 ? (
                          <div className="p-12 border border-dashed rounded-2xl text-center text-muted-foreground text-sm">
                            Haz clic en un campo de la izquierda para agregarlo aquí.
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
                </div>
              </div>
            ) : (
              /* VIEW 2: TEXTO DE LA PLANILLA (Protected tags editor for default template text) */
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Text Mode Header with Standard Format Reset */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Texto por defecto de la planilla
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetStandardFormat}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
                    title="Restablecer a formato por viñetas estándar"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Formato estándar
                  </Button>
                </div>
                {/* Monospace Text Area with Synchronized Color Highlighting */}
                <div className="relative flex-1 min-h-[380px] rounded-2xl border border-border/80 bg-background overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  {/* Layer 1: Background Highlighted Text */}
                  <div
                    ref={backdropRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words select-none text-foreground"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    {renderHighlightedTemplateText(templateText, allCurrentFields)}
                  </div>

                  {/* Layer 2: Editable Transparent Textarea with Caret */}
                  <textarea
                    ref={textareaRef}
                    value={templateText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    onScroll={handleScrollSync}
                    placeholder="Escribe el texto de tu planilla aquí..."
                    spellCheck={false}
                    className="relative z-10 w-full h-full p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border-0 focus-visible:ring-0 resize-none overflow-y-auto bg-transparent text-transparent caret-foreground selection:bg-indigo-500/25 selection:text-transparent outline-none"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AJUSTES DEL CAMPO */}
        <div className="md:col-span-3 xl:col-span-3 flex flex-col min-h-0 overflow-y-auto space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
            AJUSTES DEL CAMPO
          </h3>

          {selectedField ? (
            selectedField.type === 'section' ? (
              <div className="space-y-4">
                {/* Dynamic info banner */}
                {selectedField.isRepeatable !== false ? (
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      <Layers className="h-4 w-4" />
                      <span>Sección Repetible #{questionNumberMap.get(selectedField.id) || ''}</span>
                    </div>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Los usuarios podrán pulsar "+ Añadir otro" para ingresar múltiples registros de este grupo al responder (ej. varios vehículos, acompañantes o novedades).
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      <Folder className="h-4 w-4" />
                      <span>Sección #{questionNumberMap.get(selectedField.id) || ''}</span>
                    </div>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      Agrupa y organiza las preguntas bajo un mismo bloque temático en el formulario y en el reporte generado.
                    </p>
                  </div>
                )}

                {/* Switch to toggle isRepeatable */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card">
                  <div className="space-y-0.5 pr-2">
                    <Label className="text-xs font-medium text-foreground cursor-pointer" htmlFor="switch-repeatable">
                      Sección repetible
                    </Label>
                    <p className="text-2xs text-muted-foreground">
                      Permite añadir múltiples registros al responder
                    </p>
                  </div>
                  <Switch
                    id="switch-repeatable"
                    checked={selectedField.isRepeatable !== false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const clean = sanitizeFieldId(selectedField.label).toUpperCase();
                        const isPlural = clean.endsWith('S') && clean.length > 3;
                        const singular = isPlural ? clean.slice(0, -1) : clean;
                        const plural = isPlural ? clean : (clean ? `${clean}S` : 'ITEMS');
                        handleUpdateSelectedField({
                          isRepeatable: true,
                          singularTitle: selectedField.singularTitle || singular || 'ITEM',
                          pluralTitle: selectedField.pluralTitle || plural || 'ITEMS',
                          subLabel: selectedField.subLabel || singular || 'ITEM',
                        });
                      } else {
                        handleUpdateSelectedField({
                          isRepeatable: false,
                        });
                      }
                    }}
                  />
                </div>

                {/* Título de la sección */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Título de la sección
                  </Label>
                  <Input
                    value={selectedField.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (selectedField.isRepeatable !== false) {
                        const clean = sanitizeFieldId(val).toUpperCase();
                        const isPlural = clean.endsWith('S') && clean.length > 3;
                        const singular = isPlural ? clean.slice(0, -1) : clean;
                        const plural = isPlural ? clean : (clean ? `${clean}S` : 'ITEMS');
                        handleUpdateSelectedField({
                          label: val,
                          singularTitle: singular || 'ITEM',
                          pluralTitle: plural || 'ITEMS',
                          subLabel: singular || 'ITEM',
                        });
                      } else {
                        handleUpdateSelectedField({
                          label: val,
                        });
                      }
                    }}
                    placeholder={
                      selectedField.isRepeatable !== false
                        ? 'Ej: DATOS DEL VEHÍCULO'
                        : 'Ej: DATOS GENERALES'
                    }
                    className="h-10 rounded-xl border-border/80 text-sm bg-card"
                  />
                </div>

                {/* Nombre singular y plural ONLY when repeatable */}
                {selectedField.isRepeatable !== false && (
                  <>
                    {/* Nombre singular */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Nombre singular (en reporte)
                      </Label>
                      <Input
                        value={selectedField.singularTitle || ''}
                        onChange={(e) =>
                          handleUpdateSelectedField({
                            singularTitle: e.target.value.toUpperCase(),
                            subLabel: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="VEHICULO"
                        className="h-10 rounded-xl border-border/80 text-sm bg-card uppercase"
                      />
                      <p className="text-2xs text-muted-foreground">Ej: VEHICULO 1, VEHICULO 2...</p>
                    </div>

                    {/* Nombre plural */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Nombre plural
                      </Label>
                      <Input
                        value={selectedField.pluralTitle || ''}
                        onChange={(e) =>
                          handleUpdateSelectedField({
                            pluralTitle: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="VEHICULOS"
                        className="h-10 rounded-xl border-border/80 text-sm bg-card uppercase"
                      />
                    </div>
                  </>
                )}

                {/* Duplicar sección */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateSection(selectedField.id)}
                  className="w-full text-xs rounded-xl gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicar sección completa
                </Button>

                {/* Eliminar sección */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteSelectedField}
                    className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors text-center"
                  >
                    Eliminar sección
                  </button>
                </div>
              </div>
            ) : selectedField.type === 'separator' ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border/70 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span>Separador Visual</span>
                  </div>
                  <p className="text-2xs text-muted-foreground leading-relaxed">
                    Inserta una línea divisoria horizontal en el formulario final. Si agregas un título, se mostrará como encabezado de sección.
                  </p>
                </div>

                {/* Título opcional de la sección */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Título de sección (opcional)
                  </Label>
                  <Input
                    value={
                      selectedField.label === 'Separador' || selectedField.label === 'Divisor'
                        ? ''
                        : selectedField.label
                    }
                    onChange={(e) =>
                      handleUpdateSelectedField({
                        label: e.target.value.trim() ? e.target.value : 'Separador',
                      })
                    }
                    placeholder="Ej: DATOS DEL VEHÍCULO (o vacío para solo línea)"
                    className="h-10 rounded-xl border-border/80 text-sm bg-card"
                  />
                  <span className="text-2xs text-muted-foreground block pt-0.5">
                    {selectedField.label === 'Separador' ||
                    selectedField.label === 'Divisor' ||
                    !selectedField.label.trim()
                      ? 'Actualmente: Línea divisoria simple [""]'
                      : `Actualmente: Encabezado ["${selectedField.label.trim().toUpperCase()}"]`}
                  </span>
                </div>

                {/* Eliminar separador Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleDeleteSelectedField}
                    className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors text-center"
                  >
                    Eliminar separador
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Etiqueta Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Etiqueta
                  </Label>
                  <Input
                    value={selectedField.label}
                    onChange={(e) => handleUpdateSelectedField({ label: e.target.value })}
                    placeholder={`Pregunta ${questionNumberMap.get(selectedField.id) || 1}`}
                    className="h-10 rounded-xl border-border/80 text-sm bg-card"
                  />
                </div>

                {/* Options management for Dropdown */}
                {selectedField.type === 'dropdown' && (
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-medium text-foreground">
                      Opciones de respuesta
                    </Label>
                    <div className="space-y-2">
                      {(selectedField.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => handleUpdateOption(oIdx, e.target.value)}
                            placeholder={`Opción ${oIdx + 1}`}
                            className="h-9 text-xs rounded-lg"
                          />
                          {(selectedField.options || []).length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOption(oIdx)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              title="Eliminar opción"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOption}
                        className="w-full text-xs rounded-lg gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Añadir opción
                      </Button>
                    </div>
                  </div>
                )}

                {/* Requerido Toggle Switch */}
                <div className="flex items-center justify-between py-2 border-t border-border/50">
                  <Label
                    htmlFor="field-required-toggle"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Requerido
                  </Label>
                  <Switch
                    id="field-required-toggle"
                    checked={!!selectedField.required}
                    onCheckedChange={(checked) =>
                      handleUpdateSelectedField({ required: checked })
                    }
                  />
                </div>

                {/* Ancho completo Toggle */}
                <div className="flex items-center justify-between py-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="field-fullwidth-toggle"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Ancho completo (Formulario final)
                    </Label>
                    <p className="text-2xs text-muted-foreground">
                      Ocupará ambas columnas al ser llenado por el usuario
                    </p>
                  </div>
                  <Switch
                    id="field-fullwidth-toggle"
                    checked={!!selectedField.isFullWidth}
                    onCheckedChange={(checked) =>
                      handleUpdateSelectedField({ isFullWidth: checked })
                    }
                  />
                </div>

                {/* Eliminar campo Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleDeleteSelectedField}
                    className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors text-center"
                  >
                    Eliminar campo
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="p-6 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
              Selecciona una pregunta, separador o sección en el lienzo para ajustar sus propiedades.
            </div>
          )}
        </div>
      </div>

      {/* 3. VISTA PREVIA DIALOG (Interactive preview when clicking "Vista previa") */}
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

      {/* 4. REPORTE / MINUTA GENERADA PREVIEW */}
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
