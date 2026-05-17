import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { TimeHlvInput } from '@/components/ui/custom/time-hlv-input';
import { PlusCircle, Trash2, TrendingUp, History, ClipboardCheck, Clock, Pencil, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { NovedadManual } from '@/hooks/reporte-final/use-manual-novedades';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';

interface ReporteGenerarProps {
  hook: any;
}

export function ReporteGenerar({ hook }: ReporteGenerarProps) {
  const [esDialogOpenEliminar, setEsDialogOpenEliminar] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState<string | null>(null);

  const {
    estaCargado,
    reportesFinalizados,
    estadisticasLocal,
    setEstadisticasLocal,
    manejarCalcularEstadisticas,
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
      <Alert className="bg-primary/5 border-primary/20 shadow-sm animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <AlertTitle className="text-primary font-bold">Estado de la Guardia</AlertTitle>
            <AlertDescription className="text-primary/80 font-medium">
              Hay <span className="font-bold underline decoration-2">{reportesFinalizados.length} novedades</span> finalizadas listas para procesar.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 md:min-h-0">
        <Card className="flex flex-col border-muted/50 shadow-sm hover:border-primary/20 transition-all duration-300 md:min-h-0">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Estadísticas</CardTitle>
                  <CardDescription className="text-xs">Resumen numérico de la operatividad</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={manejarCalcularEstadisticas}
                className="h-8 text-xs font-bold gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-4 md:min-h-0">
            <div className="space-y-2 flex-1 flex flex-col md:min-h-0">
              <Label htmlFor="stats" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contenido Estadístico
              </Label>
              <ScrollArea className="flex-1 md:min-h-0 min-h-[300px] rounded-xl border-muted/50 bg-background focus-within:ring-2 focus-within:ring-orange-500/30 transition-all">
                <Textarea
                  id="stats"
                  placeholder="Las estadísticas se generarán automáticamente al presionar 'Actualizar'..."
                  className="min-h-[300px] h-full w-full font-mono text-sm resize-none border-none focus-visible:ring-0 shadow-none bg-transparent p-4"
                  value={estadisticasLocal}
                  onChange={(e) => setEstadisticasLocal(e.target.value)}
                />
              </ScrollArea>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
              <p className="text-[11px] text-muted-foreground italic flex items-start gap-2">
                <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                Nota: Puede editar manualmente este campo antes de generar el reporte final si necesita realizar ajustes específicos.
              </p>
            </div>
          </CardContent>
        </Card>

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
                  >
                    {idEditandoManual ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                  </Button>
                  {idEditandoManual && (
                    <Button
                      variant="ghost"
                      onClick={manejarCancelarEdicion}
                      className="h-10 w-10 p-0 text-muted-foreground"
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
