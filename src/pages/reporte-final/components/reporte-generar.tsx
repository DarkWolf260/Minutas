import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { TimeHlvInput } from '@/components/ui/custom/time-hlv-input';
import { PlusCircle, Trash2, TrendingUp, History, Clock, Pencil, Save, X, Eye, FileEdit, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NovedadManual } from '@/hooks/reporte-final/use-manual-novedades';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import type { UseReporteFinalReturn } from '@/hooks/reporte-final';

export interface ReporteGenerarProps {
  hook: Pick<
    UseReporteFinalReturn,
    | 'estaCargado'
    | 'reportesFinalizados'
    | 'estadisticasLocal'
    | 'setEstadisticasLocal'
    | 'manejarCalcularEstadisticas'
    | 'periodoStats'
    | 'novedadesManualesOrdenadas'
    | 'idEditandoManual'
    | 'nuevaNovedadFecha'
    | 'setNuevaNovedadFecha'
    | 'nuevaNovedadHora'
    | 'setNuevaNovedadHora'
    | 'nuevaNovedadTexto'
    | 'setNuevaNovedadTexto'
    | 'manejarAgregarNovedadManual'
    | 'manejarEditarNovedadManual'
    | 'manejarCancelarEdicion'
    | 'manejarEliminarNovedadManual'
  >;
}

export function ReporteGenerar({ hook }: ReporteGenerarProps) {
  const [esDialogOpenEliminar, setEsDialogOpenEliminar] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState<string | null>(null);
  const [vistaStats, setVistaStats] = useState<'visual' | 'texto'>('visual');

  const {
    estaCargado,
    reportesFinalizados,
    estadisticasLocal,
    setEstadisticasLocal,
    manejarCalcularEstadisticas,
    periodoStats,
    novedadesManualesOrdenadas,
    idEditandoManual,
    nuevaNovedadFecha,
    setNuevaNovedadFecha,
    nuevaNovedadHora,
    setNuevaNovedadHora,
    nuevaNovedadTexto,
    setNuevaNovedadTexto,
    manejarAgregarNovedadManual,
    manejarEditarNovedadManual,
    manejarCancelarEdicion,
    manejarEliminarNovedadManual
  } = hook;

  const totalStatsCount = useMemo(() => {
    if (!periodoStats) return 0;
    return Array.from(periodoStats.totalStats.values()).reduce((sum, n) => sum + n, 0);
  }, [periodoStats]);

  const getDayCount = (statsMap: Map<string, number>) => {
    return Array.from(statsMap.values()).reduce((sum, n) => sum + n, 0);
  };

  if (!estaCargado) {
    return (
      <div className="space-y-8 flex-1">
        <Skeleton className="h-[100px] w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 flex-1 flex flex-col md:min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 md:min-h-0">
        {/* Estadísticas Card */}
        <Card className="flex flex-col border-muted/50 shadow-sm hover:border-primary/20 transition-all duration-300 md:min-h-0">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">Estadísticas</CardTitle>
                    {periodoStats && (
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 border-orange-500/30 text-orange-600 bg-orange-500/5">
                        {periodoStats.isMultiDay ? '48 Horas' : '24 Horas'}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">Resumen numérico y desglose de operatividad</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center p-0.5 bg-muted rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => setVistaStats('visual')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                      vistaStats === 'visual'
                        ? "bg-background text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    Resumen
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaStats('texto')}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                      vistaStats === 'texto'
                        ? "bg-background text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileEdit className="h-3 w-3" />
                    Texto
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={manejarCalcularEstadisticas}
                  title="Calcular y sincronizar estadísticas para el reporte"
                  className="h-8 text-xs font-bold gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col gap-4 md:min-h-0">
            {/* KPI Cards Breakdown */}
            {periodoStats && periodoStats.isMultiDay ? (
              <div className="grid grid-cols-3 gap-2.5">
                {periodoStats.days.map((dayGroup, idx) => {
                  const count = getDayCount(dayGroup.stats);
                  const isDay1 = idx === 0;
                  const isDay2 = idx === 1;
                  const isCierre = idx === 2;

                  return (
                    <div
                      key={dayGroup.dayNumber}
                      className={cn(
                        "p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-200",
                        isDay1 && "bg-orange-500/5 border-orange-500/20",
                        isDay2 && "bg-blue-500/5 border-blue-500/20",
                        isCierre && "bg-purple-500/5 border-purple-500/20"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider",
                            isDay1 && "text-orange-600",
                            isDay2 && "text-blue-600",
                            isCierre && "text-purple-600"
                          )}>
                            {dayGroup.label || dayGroup.dateStr}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          {isDay1 ? 'Inicio - 23:59' : isCierre ? '00:00 - Entrega' : '00:00 - 23:59'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-black tracking-tight text-foreground">{count}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">nov.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">Guardia Ordinaria (24 Horas)</span>
                  <p className="text-[11px] text-muted-foreground">Estadísticas consolidadas del período activo</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-foreground">{totalStatsCount}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">novedades</span>
                </div>
              </div>
            )}

            {/* Total Indicator Pill */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 rounded-lg text-xs font-medium border border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                Total Guardia ({periodoStats?.durationHours || 24} Horas):
              </span>
              <span className="font-bold text-foreground">
                {totalStatsCount} eventos estadísticos
              </span>
            </div>

            {/* Content Switcher: Visual vs Textarea */}
            {vistaStats === 'visual' ? (
              <ScrollArea className="flex-1 md:min-h-0 min-h-[220px] rounded-xl border border-muted/50 bg-background p-3">
                {periodoStats && periodoStats.totalStats.size > 0 ? (
                  <div className="space-y-4">
                    {periodoStats.days.map((day) => (
                      <div key={day.dayNumber} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b pb-1">
                          <span>{day.label}</span>
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {getDayCount(day.stats)}
                          </Badge>
                        </div>
                        {day.stats.size === 0 ? (
                          <p className="text-[11px] text-muted-foreground italic pl-2">Sin novedades estadísticas</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-1 pl-1">
                            {Array.from(day.stats.entries())
                              .filter(([_, count]) => count > 0)
                              .sort((a, b) => b[1] - a[1])
                              .map(([cat, count]) => (
                                <div key={cat} className="flex items-center justify-between py-0.5 text-xs">
                                  <span className="text-muted-foreground truncate pr-2 font-medium">
                                    {cat.replace(/^[\d.]+\s*/, '')}
                                  </span>
                                  <span className="font-mono font-bold text-foreground shrink-0">
                                    {count < 10 ? `0${count}` : count}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-medium">No se han registrado novedades estadísticas en esta guardia.</p>
                  </div>
                )}
              </ScrollArea>
            ) : (
              <div className="space-y-2 flex-1 flex flex-col md:min-h-0">
                <ScrollArea className="flex-1 md:min-h-0 min-h-[220px] rounded-xl border-muted/50 bg-background focus-within:ring-2 focus-within:ring-orange-500/30 transition-all">
                  <Textarea
                    id="stats"
                    placeholder="Las estadísticas se generarán automáticamente al presionar 'Actualizar'..."
                    className="min-h-[220px] h-full w-full font-mono text-xs leading-relaxed resize-none border-none focus-visible:ring-0 shadow-none bg-transparent p-3"
                    value={estadisticasLocal}
                    onChange={(e) => setEstadisticasLocal(e.target.value)}
                  />
                </ScrollArea>
                <div className="p-2.5 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                  <p className="text-[11px] text-muted-foreground italic flex items-start gap-2">
                    <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                    Nota: Puede editar libremente este formato antes de generar el reporte de cierre.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Novedades Manuales Card */}
        <Card className="flex flex-col border-muted/50 shadow-sm hover:border-primary/20 transition-all duration-300 md:min-h-0">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <History className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Novedades Manuales</CardTitle>
                <CardDescription className="text-xs">Eventos de apertura, cierre y notas especiales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-6 md:min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl border border-muted/50">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fecha</Label>
                <DatePicker
                  value={format(nuevaNovedadFecha, 'yyyy-MM-dd')}
                  onChange={(val: string) => setNuevaNovedadFecha(new Date(val + 'T00:00:00'))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hora</Label>
                <TimeHlvInput
                  value={nuevaNovedadHora}
                  onChange={setNuevaNovedadHora}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descripción del Evento</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ej: Se inicia la guardia preventiva..."
                    className="h-10 min-h-[40px] py-2 resize-none border border-muted/50 focus-visible:ring-primary/30"
                    value={nuevaNovedadTexto}
                    onChange={(e) => setNuevaNovedadTexto(e.target.value)}
                  />
                  <Button
                    onClick={manejarAgregarNovedadManual}
                    className="h-10 px-4 font-bold shadow-sm"
                    variant={idEditandoManual ? "default" : "secondary"}
                    aria-label={idEditandoManual ? "Guardar cambios de novedad manual" : "Agregar novedad manual"}
                    title={idEditandoManual ? "Guardar cambios" : "Agregar novedad manual"}
                  >
                    {idEditandoManual ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                  </Button>
                  {idEditandoManual && (
                    <Button
                      variant="ghost"
                      onClick={manejarCancelarEdicion}
                      className="h-10 w-10 p-0 text-muted-foreground"
                      aria-label="Cancelar edición"
                      title="Cancelar edición"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 md:min-h-0 pr-4 -mr-4">
              <div className="space-y-3">
                {novedadesManualesOrdenadas.map((novedad: NovedadManual) => (
                  <div
                    key={novedad.id}
                    className={`group flex items-start gap-4 p-3 rounded-xl border border-muted/50 transition-all duration-200 hover:shadow-md ${idEditandoManual === novedad.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/30 bg-background'}`}
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                      <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                        {novedad.time}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {format(new Date(novedad.date), 'dd/MM', { locale: es })}
                      </span>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed font-medium">
                      {novedad.text}
                    </p>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => manejarEditarNovedadManual(novedad)}
                        aria-label="Editar novedad"
                        title="Editar novedad"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setIdParaEliminar(novedad.id);
                          setEsDialogOpenEliminar(true);
                        }}
                        aria-label="Eliminar novedad"
                        title="Eliminar novedad"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {novedadesManualesOrdenadas.length === 0 && (
                  <div className="text-center py-12 border-muted/50 border-dashed rounded-2xl bg-muted/10">
                    <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No hay novedades manuales agregadas.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={esDialogOpenEliminar}
        onOpenChange={setEsDialogOpenEliminar}
        title="¿Eliminar novedad manual?"
        message="Esta acción no se puede deshacer. La novedad se eliminará permanentemente."
        onConfirm={() => {
          if (idParaEliminar) {
            manejarEliminarNovedadManual(idParaEliminar);
            setIdParaEliminar(null);
          }
        }}
      />
    </div>
  );
}
