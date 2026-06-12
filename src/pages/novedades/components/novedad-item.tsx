import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/lib/types';
import { findValueInform_data, getReportDateTime } from '@/lib/report-sorter';

interface NovedadItemProps {
  report: Report;
  isSelected: boolean;
  onSelect: (id: string) => void;
  number?: number;
  showDate?: boolean;
}

const formatReportDate = (report: Report): string => {
  const date = getReportDateTime(report);
  if (!date || isNaN(date.getTime())) return '';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  if (key === toKey(today)) return 'Hoy';
  if (key === toKey(yesterday)) return 'Ayer';
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
};

export const NovedadItem = React.memo(({ report, isSelected, onSelect, number, showDate }: NovedadItemProps) => {
  const horaValue = findValueInform_data(report.form_data, 'Hora');

  return (
    <button
      onClick={() => onSelect(report.id)}
      className={cn(
        'w-full rounded-2xl p-3.5 text-left transition-all duration-200 group border border-transparent',
        isSelected
          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm'
          : 'hover:bg-muted/50'
      )}
    >
      <div className="flex w-full items-start gap-3.5">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-semibold leading-tight mb-1 break-words flex items-center gap-2",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {number !== undefined && (
              <span className="px-1.5 py-0.5 rounded-md select-none shrink-0 font-sans text-xs shadow-sm leading-none border border-primary/20 bg-primary/10 text-primary">
                {String(number).padStart(2, '0')}
              </span>
            )}
            <span className="flex-1">{report.title}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/80">
            {showDate && (
              <div className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {formatReportDate(report)}
              </div>
            )}
            {report.status && (
              <div className="flex items-center gap-1.5 bg-muted/30 px-1.5 py-0.5 rounded">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    report.status === 'Finalizado'
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                      : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                  )}
                />
                <span className="font-bold text-[10px] uppercase tracking-tighter">{report.status}</span>
              </div>
            )}
            {horaValue && (
              <div className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                <Clock className="h-3 w-3 text-muted-foreground/50" />
                <span>{String(horaValue)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
});

NovedadItem.displayName = 'NovedadItem';

