import React, { useMemo } from 'react';
import { PlusCircle, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoGuardBanner } from '@/components/guards/guard-selector';
import { cn } from '@/lib/utils';
import { NovedadItem } from './novedad-item';
import { NovedadFilters } from './novedad-filters';
import { getReportDateTime } from '@/lib/report-sorter';
import type { Report } from '@/lib/types';

interface NovedadSidebarProps {
  hook: any;
  isMobile: boolean;
}

/** Returns a human-friendly label for a given YYYY-MM-DD key. */
function formatDayLabel(dateKey: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Parse the date key locally so timezone doesn't shift the day
  const date = new Date(dateKey + 'T00:00:00');
  const formatted = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (dateKey === toKey(today)) return `Hoy — ${formatted}`;
  if (dateKey === toKey(yesterday)) return `Ayer — ${formatted}`;
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Groups reports by the calendar day of the event (Fecha from form_data).
 * Falls back to the report's timestamp field if form_data has no Fecha.
 * The direction controls whether groups are sorted newest-first ('desc') or oldest-first ('asc').
 */
function groupReportsByDay(
  reports: Report[],
  direction: 'asc' | 'desc' = 'desc'
): { dateKey: string; label: string; reports: Report[] }[] {
  const map = new Map<string, Report[]>();

  for (const report of reports) {
    // Primary: use getReportDateTime which reads Fecha + Hora from form_data
    const eventDate = getReportDateTime(report);
    let key: string;

    if (eventDate && !isNaN(eventDate.getTime())) {
      key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    } else {
      // Fallback: use the report's creation timestamp
      const fallback = report.timestamp ? new Date(report.timestamp) : new Date();
      key = `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
    }

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(report);
  }

  // Sort groups according to direction
  return Array.from(map.entries())
    .sort(([a], [b]) => direction === 'desc' ? (a < b ? 1 : a > b ? -1 : 0) : (a < b ? -1 : a > b ? 1 : 0))
    .map(([dateKey, reps]) => ({
      dateKey,
      label: formatDayLabel(dateKey),
      reports: reps,
    }));
}

export const NovedadSidebar = ({ hook, isMobile }: NovedadSidebarProps) => {
  const {
    idReporteSeleccionado,
    creandoReporte,
    guardiaAbierta,
    setEsDialogOpenCrear,
    busqueda,
    setBusqueda,
    ordenamiento,
    setOrdenamiento,
    reportesFiltrados,
    manejarSeleccionarReporte,
    manejarExportarTodasWord,
  } = hook;

  const groups = useMemo(() => groupReportsByDay(reportesFiltrados, ordenamiento), [reportesFiltrados, ordenamiento]);

  return (
    <aside
      id="novedades-sidebar"
      className={cn(
        'h-full w-full sm:w-80 lg:w-96 flex-col border-r bg-card flex gap-0 animate-in fade-in slide-in-from-left-4 duration-300 sm:animate-none',
        idReporteSeleccionado || creandoReporte ? 'hidden sm:flex' : 'flex'
      )}
    >
      <div className="flex items-center justify-between border-b p-3 sm:p-4 min-h-[60px] sm:min-h-[73px]">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">Novedades</h2>
        <Button
          size="sm"
          onClick={() => setEsDialogOpenCrear(true)}
          disabled={!guardiaAbierta}
          className="shadow-sm gap-2 h-8 sm:h-9 text-xs sm:text-sm"
        >
          <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Nuevo
        </Button>
      </div>

      <NovedadFilters
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        ordenamiento={ordenamiento}
        setOrdenamiento={setOrdenamiento}
        manejarExportarTodasWord={manejarExportarTodasWord}
      />

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full" type="always">
          <div className={cn(
            'p-3 pt-3 sm:pb-3',
            reportesFiltrados.length > 0 ? 'pb-32' : 'pb-6'
          )}>
            {groups.length > 0 ? (
              <div className="space-y-5">
                {groups.map((group, groupIndex) => (
                  <div
                    key={group.dateKey}
                    className="animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both"
                    style={{ animationDelay: `${groupIndex * 60}ms` }}
                  >
                    {/* Day separator header */}
                    <div className="flex items-center gap-2 px-1 mb-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-[10px] text-muted-foreground/40 shrink-0 font-medium">
                        {group.reports.length}
                      </span>
                    </div>

                    {/* Reports for that day */}
                    <div className="space-y-1">
                      {group.reports.map((report: Report, itemIndex) => (
                        <div
                          key={report.id}
                          className="animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both"
                          style={{ animationDelay: `${groupIndex * 60 + itemIndex * 35}ms` }}
                        >
                          <NovedadItem
                            report={report}
                            isSelected={idReporteSeleccionado === report.id && !creandoReporte}
                            onSelect={manejarSeleccionarReporte}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 sm:py-12 px-4 text-center animate-in fade-in duration-500 w-full">
                {!guardiaAbierta && isMobile ? (
                  <NoGuardBanner
                    message="Para registrar novedades primero debes abrir una nueva guardia."
                    allowOpenHere
                  />
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-muted-foreground/10 opacity-60">
                      <Search className="h-7 w-7 opacity-20" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground/70 tracking-tight">Sin resultados</h3>
                      <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                        No se encontraron reportes registrados.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};
