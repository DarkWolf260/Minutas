import React from 'react';
import { Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AVAILABLE_FIELDS,
  SPECIAL_SYSTEM_TAGS,
  type AvailableField,
} from '../form-creator-constants';

interface AvailableFieldsSidebarProps {
  onAddField: (item: AvailableField) => void;
  onInsertSpecialTag: (tag: string) => void;
  onCopySpecialTag: (tag: string) => void;
}

export function AvailableFieldsSidebar({
  onAddField,
  onInsertSpecialTag,
  onCopySpecialTag,
}: AvailableFieldsSidebarProps) {
  return (
    <div className="md:col-span-3 xl:col-span-3 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3">
      {/* Sección: Campos Disponibles */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
          CAMPOS DISPONIBLES
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">
          {AVAILABLE_FIELDS.length} tipos
        </span>
      </div>

      <div className="space-y-1">
        {AVAILABLE_FIELDS.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onAddField(item)}
            className="rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] select-none group h-9"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`h-6 w-6 rounded-lg ${item.iconBg} ${item.iconColor} font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
              >
                {item.icon ?? item.iconText}
              </div>
              <span className="text-xs font-medium text-foreground truncate">
                {item.label}
              </span>
            </div>

            <Plus className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        ))}
      </div>

      {/* Sección: Etiquetas Especiales del Sistema */}
      <div className="pt-3 mt-1 border-t border-border/60 space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
            ETIQUETAS DEL SISTEMA
          </h3>
          <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            Auto
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground px-1 leading-tight">
          Variables automáticas para la minuta final.
        </p>

        <div className="space-y-1">
          {SPECIAL_SYSTEM_TAGS.map((tag) => (
            <div
              key={tag.tag}
              onClick={() => onInsertSpecialTag(tag.tag)}
              className="rounded-xl border border-border/60 bg-card hover:border-emerald-400/80 dark:hover:border-emerald-600 hover:bg-emerald-50/20 px-2 py-1 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] select-none group h-8"
              title={`Clic para insertar ${tag.tag} en la plantilla`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-5 px-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                  {tag.badge}
                </span>
                <span className="text-xs font-medium text-foreground truncate">
                  {tag.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60 hidden xl:inline truncate">
                  {tag.tag}
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground/50 group-hover:text-emerald-600 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopySpecialTag(tag.tag);
                }}
                title="Copiar etiqueta"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
