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
        'list-row-item',
        isSelected && 'list-row-item-active'
      )}
    >
      <div className="flex w-full items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-semibold leading-tight mb-1 break-words flex items-center gap-2 text-sm",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {number !== undefined && (
              <span className="number-badge">
                {String(number).padStart(2, '0')}
              </span>
            )}
            <span className="flex-1">{report.title}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {showDate && (
              <div className="status-pill">
                {formatReportDate(report)}
              </div>
            )}
            {report.status && (
              <div className="status-pill">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    report.status === 'Finalizado'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  )}
                />
                <span>{report.status}</span>
              </div>
            )}
            {horaValue && (
              <div className="status-pill">
                <Clock className="h-3 w-3 text-muted-foreground" />
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

