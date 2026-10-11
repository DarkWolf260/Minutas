import React from 'react';
import {
  ArrowLeft,
  Layout,
  FileText,
  Eye,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types';

interface FormCreatorHeaderProps {
  onBack?: () => void;
  formTitle?: string;
  editingTemplate: Template | null;
  canvasMode: 'wysiwyg' | 'result' | 'form';
  onCanvasModeChange: (mode: 'wysiwyg' | 'result' | 'form') => void;
  onPublish: () => void;
}

export function FormCreatorHeader({
  onBack,
  editingTemplate,
  canvasMode,
  onCanvasModeChange,
  onPublish,
}: FormCreatorHeaderProps) {
  return (
    <header className="h-16 px-4 sm:px-6 border-b bg-card flex items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-xs relative">
      {/* Left: Back button */}
      <div className="flex items-center gap-2 shrink-0 z-20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
          title="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Center: Tabs del Creador de Formularios - Absolute center to ensure they stay rock-solid fixed */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 p-1 bg-muted/70 dark:bg-muted/40 rounded-xl border border-border/60 shadow-2xs z-10">
        <button
          type="button"
          onClick={() => onCanvasModeChange('wysiwyg')}
          className={cn(
            'px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
            canvasMode === 'wysiwyg'
              ? 'bg-card text-foreground shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Editor interactivo: edita la minuta con campos incrustados"
        >
          <Layout className="h-3.5 w-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Editor Minuta</span>
          <span className="sm:hidden">Editor</span>
        </button>

        <button
          type="button"
          onClick={() => onCanvasModeChange('result')}
          className={cn(
            'px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
            canvasMode === 'result'
              ? 'bg-card text-foreground shadow-2xs font-semibold text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Ver la plantilla de la minuta final"
        >
          <FileText className="h-3.5 w-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Minuta Final</span>
          <span className="sm:hidden">Minuta</span>
        </button>

        <button
          type="button"
          onClick={() => onCanvasModeChange('form')}
          className={cn(
            'px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
            canvasMode === 'form'
              ? 'bg-card text-foreground shadow-2xs font-semibold text-blue-600 dark:text-blue-400'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Probar llenado en el formulario final de usuario"
        >
          <Eye className="h-3.5 w-3.5 text-blue-500" />
          <span className="hidden sm:inline">Formulario</span>
          <span className="sm:hidden">Formulario</span>
        </button>
      </div>

      {/* Right: Status badge & Standard Publicar button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto z-20">
        {editingTemplate ? (
          <div className="hidden lg:flex rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 px-3 py-1 text-xs font-medium items-center gap-1.5 select-none shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Editando</span>
          </div>
        ) : (
          <div className="hidden lg:flex rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40 px-3 py-1 text-xs font-medium items-center gap-1.5 select-none shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Borrador</span>
          </div>
        )}

        <Button
          type="button"
          onClick={onPublish}
          className="gap-2 shadow-sm font-semibold"
        >
          {editingTemplate ? (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar Cambios</span>
            </>
          ) : (
            <span>Publicar</span>
          )}
        </Button>
      </div>
    </header>
  );
}
