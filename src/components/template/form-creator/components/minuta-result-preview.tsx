import React from 'react';
import { Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MinutaResultPreviewProps {
  simulatedMinutaContent: string;
  previewStatus: 'En proceso' | 'Finalizado';
  onStatusChange: (status: 'En proceso' | 'Finalizado') => void;
  onReturnToEditor: () => void;
  className?: string;
}

export function MinutaResultPreview({
  simulatedMinutaContent,
  previewStatus,
  onStatusChange,
  onReturnToEditor,
  className,
}: MinutaResultPreviewProps) {
  const handleCopySimulatedMinuta = () => {
    navigator.clipboard.writeText(simulatedMinutaContent);
    toast.success('Minuta copiada al portapapeles');
  };

  return (
    <div className={cn('space-y-4 pt-1', className)}>
      {/* Live Minuta Result Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Resultado Final del Documento
          </span>
          <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
            En vivo
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-background border rounded-lg p-0.5 shadow-2xs overflow-hidden">
            <Button
              type="button"
              variant={previewStatus === 'En proceso' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-[10px] px-2.5 rounded-md"
              onClick={() => onStatusChange('En proceso')}
            >
              En proceso
            </Button>
            <Button
              type="button"
              variant={previewStatus === 'Finalizado' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-[10px] px-2.5 rounded-md"
              onClick={() => onStatusChange('Finalizado')}
            >
              Finalizado
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopySimulatedMinuta}
            className="h-8 text-xs px-3 bg-background shadow-2xs border-border/80 hover:bg-muted gap-1.5"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Copiar Minuta</span>
          </Button>
        </div>
      </div>

      {/* Rendered Monospace Report Sheet */}
      <div className="rounded-2xl border border-border/80 bg-background/80 dark:bg-zinc-950/60 p-5 sm:p-6 shadow-inner font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
        {simulatedMinutaContent}
      </div>

      {/* Footer info bar */}
      <div className="flex items-center justify-between text-2xs text-muted-foreground px-1">
        <span>
          {simulatedMinutaContent.split('\n').length} líneas • {simulatedMinutaContent.length} caracteres
        </span>
        <button
          type="button"
          onClick={onReturnToEditor}
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          ← Volver al Editor Minuta para modificar campos
        </button>
      </div>
    </div>
  );
}
