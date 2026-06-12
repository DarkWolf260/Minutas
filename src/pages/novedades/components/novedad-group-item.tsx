import React from 'react';
import { ChevronDown, ChevronRight, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/lib/types';
import { NovedadItem } from './novedad-item';

interface NovedadGroupItemProps {
  id: string;
  templateName: string;
  timeRange: string;
  reports: Report[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  idReporteSeleccionado: string | null;
  creandoReporte: any;
  manejarSeleccionarReporte: (id: string | null, isBack?: boolean) => void;
  reportNumbers?: Map<string, number>;
  templateId?: string;
  isPinned?: boolean;
  onTogglePin?: (templateId: string, e: React.MouseEvent) => void;
  showDate?: boolean;
}

export const NovedadGroupItem = React.memo(({
  id,
  templateName,
  timeRange,
  reports,
  isExpanded,
  onToggleExpand,
  idReporteSeleccionado,
  creandoReporte,
  manejarSeleccionarReporte,
  reportNumbers,
  templateId,
  isPinned,
  onTogglePin,
  showDate
}: NovedadGroupItemProps) => {
  const count = reports.length;
  
  // Check if any report in this group is currently selected
  const hasSelectedChild = reports.some(r => r.id === idReporteSeleccionado && !creandoReporte);
  const displayName = templateName.replace(/\{.*?\}/g, '').trim();

  return (
    <div className="space-y-1">
      {/* Group Header Card */}
      <button
        onClick={() => onToggleExpand(id)}
        className={cn(
          'w-full rounded-2xl p-3 text-left transition-all duration-200 group border border-transparent flex items-center justify-between gap-3',
          hasSelectedChild 
            ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/20' 
            : 'bg-muted/10 hover:bg-muted/30'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold text-xs">
            {count}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-foreground truncate">
              {displayName}
            </p>
            {timeRange && (
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {timeRange}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onTogglePin && templateId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(templateId, e);
              }}
              className={cn(
                "p-1 rounded hover:bg-muted/80 transition-colors duration-150",
                isPinned 
                  ? "text-primary hover:text-primary/80" 
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
              title={isPinned ? "Desanclar grupo" : "Anclar grupo"}
            >
              <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
            </button>
          )}
          <div className="text-muted-foreground/60 group-hover:text-foreground transition-colors duration-200 p-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {/* Group Children (Nested and indented list) */}
      {isExpanded && (
        <div className="pl-4 border-l border-border/60 ml-4 space-y-1 pt-0.5 pb-1 animate-in slide-in-from-top-2 fade-in duration-200">
          {reports.map((report) => (
            <NovedadItem
              key={report.id}
              report={report}
              isSelected={idReporteSeleccionado === report.id && !creandoReporte}
              onSelect={manejarSeleccionarReporte}
              number={reportNumbers?.get(report.id)}
              showDate={showDate}
            />
          ))}
        </div>
      )}
    </div>
  );
});

NovedadGroupItem.displayName = 'NovedadGroupItem';
