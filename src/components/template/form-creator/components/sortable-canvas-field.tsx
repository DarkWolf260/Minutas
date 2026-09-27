import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { FormCreatorField } from '../template-compiler';
import { getFieldPillDisplay } from '../form-creator-constants';

export interface SortableCanvasFieldCardProps {
  field: FormCreatorField;
  idx: number;
  questionNumber: string | null;
  totalFields: number;
  isSelected: boolean;
  onSelect: () => void;
  badgeLabel: string;
  onMoveField: (index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onUpdateField?: (fieldId: string, updates: Partial<FormCreatorField>) => void;
  onDuplicateField?: (fieldId: string) => void;
  onDeleteField?: (fieldId: string) => void;
  isNested?: boolean;
}

export function SortableCanvasFieldCard({
  field,
  idx,
  questionNumber,
  totalFields,
  isSelected,
  onSelect,
  badgeLabel,
  onMoveField,
  onUpdateField,
  onDuplicateField,
  onDeleteField,
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
  const isTitledSeparator =
    isSeparator &&
    field.label &&
    field.label.trim() &&
    field.label.trim().toLowerCase() !== 'separador' &&
    field.label.trim().toLowerCase() !== 'divisor';

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [localLabel, setLocalLabel] = useState(field.label);

  useEffect(() => {
    setLocalLabel(field.label);
  }, [field.label]);

  const handleLabelCommit = () => {
    setIsEditingLabel(false);
    if (localLabel.trim() && localLabel.trim() !== field.label) {
      onUpdateField?.(field.id, { label: localLabel.trim() });
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelCommit();
    } else if (e.key === 'Escape') {
      setLocalLabel(field.label);
      setIsEditingLabel(false);
    }
  };

  if (isSeparator) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={cn(
          'w-full py-2 px-3 rounded-xl transition-all cursor-pointer group relative my-1',
          isDragging && 'opacity-30 border border-dashed border-indigo-400 bg-indigo-50/20',
          isSelected && !isDragging
            ? 'bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/50 border border-indigo-300 dark:border-indigo-700'
            : 'hover:bg-muted/40 border border-transparent hover:border-border/60'
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 text-muted-foreground/30 group-hover:text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none rounded transition-colors"
            title="Arrastrar separador"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          <div className="h-px flex-1 bg-border/80" />

          {isEditingLabel ? (
            <input
              type="text"
              autoFocus
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={handleLabelCommit}
              onKeyDown={handleLabelKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-background border border-indigo-500 shadow-2xs text-center outline-none min-w-[140px]"
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                setIsEditingLabel(true);
              }}
              title="Clic para editar título del separador"
              className={cn(
                'text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded transition-all',
                isTitledSeparator
                  ? 'text-foreground bg-muted/80 border border-border hover:border-indigo-400'
                  : 'text-muted-foreground/70 italic text-[11px] hover:text-foreground'
              )}
            >
              {isTitledSeparator ? `["${field.label.trim().toUpperCase()}"]` : '─── LÍNEA DIVISORIA [""] ───'}
            </button>
          )}

          <div className="h-px flex-1 bg-border/80" />

          {/* Quick Actions on Hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
            {onDuplicateField && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateField(field.id);
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                title="Duplicar separador"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
            {onDeleteField && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteField(field.id);
                }}
                className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                title="Eliminar separador"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const pill = getFieldPillDisplay(field);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'w-full rounded-xl transition-all cursor-pointer relative group font-mono text-sm leading-relaxed',
        isNested ? 'py-1.5 px-2.5 my-0.5' : 'py-2 px-3 sm:px-4 my-1',
        isDragging && 'opacity-30 border-2 border-dashed border-indigo-400 bg-indigo-50/20 shadow-none',
        isSelected && !isDragging
          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500 border border-indigo-400 dark:border-indigo-600 shadow-sm'
          : !isDragging && 'hover:bg-muted/40 border border-transparent hover:border-border/60'
      )}
    >
      <div className="flex items-start sm:items-center justify-between gap-2">
        {/* Left Side: Drag Handle + Number + "- *" + Editable Label + ":*" + Value Pill */}
        <div className="flex items-center flex-wrap gap-1.5 min-w-0 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 text-muted-foreground/30 group-hover:text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none rounded transition-colors"
            title="Arrastrar para reordenar línea"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          {/* Question / Line Indicator badge */}
          {questionNumber !== null && (
            <span
              className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0 select-none border border-border/50"
              title={`Campo #${questionNumber}`}
            >
              #{questionNumber}
            </span>
          )}

          {/* Official Minuta Bullet Prefix: "- *" */}
          <span className="font-bold text-muted-foreground/80 select-none shrink-0 font-mono text-xs sm:text-sm">
            - *
          </span>

          {/* Editable Label */}
          {isEditingLabel ? (
            <input
              type="text"
              autoFocus
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={handleLabelCommit}
              onKeyDown={handleLabelKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="font-bold uppercase tracking-wider text-xs sm:text-sm px-1.5 py-0.5 rounded bg-background border border-indigo-500 shadow-2xs outline-none min-w-[80px]"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                setIsEditingLabel(true);
              }}
              title="Haz clic para editar la etiqueta del reporte"
              className="font-bold uppercase tracking-wider text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-text text-xs sm:text-sm transition-colors"
            >
              {field.label ? field.label.trim().toUpperCase() : 'CAMPO'}
            </span>
          )}

          {/* Official Minuta Colon Postfix: ":*" */}
          <span className="font-bold text-muted-foreground/80 select-none shrink-0 font-mono text-xs sm:text-sm">
            :*
          </span>

          {field.required && (
            <span className="text-destructive font-bold text-xs select-none" title="Campo obligatorio">
              *
            </span>
          )}

          {/* Embedded Interactive Field Value Pill */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-sans transition-all border shadow-2xs cursor-pointer select-none max-w-full break-words whitespace-pre-wrap',
              pill.hasCustomValue
                ? 'bg-background dark:bg-card border-indigo-300 dark:border-indigo-700/80 text-foreground font-medium'
                : 'bg-muted/50 dark:bg-muted/30 border-border/70 text-muted-foreground italic',
              isSelected && 'ring-2 ring-indigo-500/30 border-indigo-500 dark:border-indigo-500 bg-background'
            )}
            title={pill.hasCustomValue ? `Valor por defecto: "${field.defaultValue}" (clic para editar ajustes)` : 'Clic para editar ajustes del campo'}
          >
            {pill.icon && pill.icon}

            <span className="break-words whitespace-pre-wrap">
              {pill.text}
            </span>

            {field.type === 'dropdown' && field.options && field.options.length > 0 && (
              <span className="text-[10px] font-mono px-1 rounded-none bg-muted text-muted-foreground shrink-0 ml-1">
                {field.options.length} opt
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Controls & Badges */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Badge Label */}
          <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground hidden sm:inline-block border border-border/50">
            {badgeLabel}
          </span>

          {/* Quick Line Actions (Move, Duplicate, Delete) */}
          <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={idx === 0}
              onClick={(e) => onMoveField(idx, 'up', e)}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors rounded hover:bg-muted"
              title="Mover arriba"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={idx === totalFields - 1}
              onClick={(e) => onMoveField(idx, 'down', e)}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors rounded hover:bg-muted"
              title="Mover abajo"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {onDuplicateField && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateField(field.id);
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
                title="Duplicar campo"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            {onDeleteField && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteField(field.id);
                }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
                title="Eliminar campo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
