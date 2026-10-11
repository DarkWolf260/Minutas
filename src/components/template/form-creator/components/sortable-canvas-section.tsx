import React, { useState } from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Layers,
  Folder,
} from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FormCreatorField, FormCreatorFieldType } from '../template-compiler';
import { sanitizeFieldId } from '../template-compiler';
import { SortableCanvasFieldCard } from './sortable-canvas-field';

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
        'rounded-xl p-2.5 sm:p-3 transition-all space-y-2 min-h-[60px]',
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

export interface SortableCanvasSectionCardProps {
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
  onAddFieldToSection?: (sectionId: string, type?: FormCreatorFieldType) => void;
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onMoveInnerField: (sectionId: string, index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onUpdateField?: (fieldId: string, updates: Partial<FormCreatorField>) => void;
  onDuplicateField?: (fieldId: string) => void;
  onDeleteField?: (fieldId: string) => void;
  questionNumberMap: Map<string, string>;
  getBadgeLabel: (type: FormCreatorFieldType, isRepeatable?: boolean) => string;
}

export function SortableCanvasSectionCard({
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
  onUpdateField,
  onDuplicateField,
  onDeleteField,
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
        'w-full rounded-2xl transition-colors cursor-pointer bg-card relative group overflow-hidden my-1',
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

            {/* Quick Actions (Move Up/Down, Duplicate, Delete) */}
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSection(section.id);
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
                title="Duplicar sección"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection(section.id);
                }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
                title="Eliminar sección"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

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
                  </div>
                ) : (
                  <div className="space-y-1">
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
                        onUpdateField={onUpdateField}
                        onDuplicateField={onDuplicateField}
                        onDeleteField={onDeleteField}
                        isNested={true}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </InnerSectionDroppableZone>
          </div>
        )}
      </div>
    </div>
  );
}
