import React from 'react';
import { GripVertical, Layers } from 'lucide-react';
import type { FormCreatorField } from '../template-compiler';
import { getFieldPillDisplay } from '../form-creator-constants';

interface CanvasFieldDragOverlayProps {
  field: FormCreatorField;
  badgeLabel: string;
  width?: number | null;
  questionNumber?: string | null;
}

export function CanvasFieldDragOverlay({
  field,
  badgeLabel,
  width,
  questionNumber,
}: CanvasFieldDragOverlayProps) {
  const isSeparator = field.type === 'separator';
  const isSection = field.type === 'section';
  const pill = !isSeparator && !isSection ? getFieldPillDisplay(field) : null;

  return (
    <div
      style={{ width: width ? `${width}px` : undefined }}
      className="rounded-xl border-2 border-indigo-500 bg-background/95 backdrop-blur-sm p-3 shadow-2xl ring-4 ring-indigo-500/20 pointer-events-none select-none font-mono text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <GripVertical className="h-4 w-4 text-indigo-500 shrink-0" />
          {isSeparator ? (
            <span className="font-bold text-muted-foreground uppercase text-xs">
              ─── {field.label?.trim() ? `["${field.label.toUpperCase()}"]` : '[""]'} ───
            </span>
          ) : isSection ? (
            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-xs flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              [{field.label?.trim() ? field.label.toUpperCase() : 'SECCIÓN'}]
            </span>
          ) : (
            <>
              {questionNumber && (
                <span className="text-[10px] font-sans font-bold px-1.5 rounded bg-muted text-muted-foreground">
                  #{questionNumber}
                </span>
              )}
              <span className="text-muted-foreground/80 font-bold text-xs">- *</span>
              <span className="font-bold text-foreground uppercase text-xs">{field.label || 'CAMPO'}</span>
              <span className="text-muted-foreground/80 font-bold text-xs">:*</span>
              {pill && (
                <span className="text-xs font-sans px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  {pill.icon}
                  <span className="truncate max-w-[120px]">{pill.text}</span>
                </span>
              )}
            </>
          )}
        </div>
        <span className="text-2xs font-sans font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}
