import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { TimeHlvInput } from '@/components/ui/custom/time-hlv-input';
import { PlusCircle, Trash2, FileText, TrendingUp, Users, X, ChevronLeft, Eye, RotateCcw, History, ClipboardCheck, Calendar, Clock, Pencil, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { useReporteFinal, NovedadManual } from '@/hooks/use-reporte-final';

export default function ReporteFinalPage() {
  const isMobile = useIsMobile();
  const hook = useReporteFinal();

  const {
    tabActiva,
    setTabActiva,
    estaCargado,
    manejarGenerarReporte
  } = hook;

  return (
    <div className="flex flex-col min-h-screen md:h-full bg-background overflow-y-auto md:overflow-hidden relative">
      {/* Botón flotante móvil para generar reporte */}
      {tabActiva === 'generate' && (
        <div className="sm:hidden fixed bottom-24 right-6 z-[60] animate-in fade-in zoom-in duration-300 ease-out">
          <Button
            onClick={manejarGenerarReporte}
            disabled={!estaCargado}
            size="icon"
            className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary-foreground/10 hover:scale-105 active:scale-95 transition-all duration-300"
            title="Generar Reporte Final"
          >
            <FileText className="h-7 w-7" />
          </Button>
        </div>
      )}

      <Tabs value={tabActiva} onValueChange={setTabActiva} className="flex-1 flex flex-col md:overflow-hidden">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-32 sm:pb-10 flex flex-col md:flex-1 md:min-h-0">
            <HeaderSeccion hook={hook} isMobile={isMobile} />

            <TabsContent 
              value="generate" 
              className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 ease-in-out"
            >
              <ContenidoGenerar hook={hook} />
            </TabsContent>

            <TabsContent 
              value="history" 
              className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-right-4 duration-500 ease-in-out"
            >
              <ContenidoHistorial hook={hook} />
            </TabsContent>
        </div>
      </Tabs>

      <ModalResultado hook={hook} />
      <ModalVistaReporte hook={hook} isMobile={isMobile} />
      <ConfirmDialog
        open={hook.esDialogOpenConfirmarGuardar}
        onOpenChange={hook.setEsDialogOpenConfirmarGuardar}
        onConfirm={hook.manejarFinalizarYGuardar}
        title="¿Cerrar y Limpiar Guardia?"
        message="Al archivar este reporte, se limpiarán permanentemente todas las novedades de la sesión actual para iniciar una nueva guardia. Esta acción no se puede deshacer."
        confirmText="Sí, finalizar y limpiar"
        variant="destructive"
      />
      
      <ConfirmDialog
        open={hook.esDialogOpenConfirmarEliminar}
        onOpenChange={hook.setEsDialogOpenConfirmarEliminar}
        onConfirm={hook.manejarConfirmarEliminacionHistorial}
        title="¿Eliminar del Historial?"
        message="Esta acción eliminará permanentemente el reporte archivado del historial local. No se puede deshacer."
        confirmText="Sí, eliminar reporte"
        variant="destructive"
      />
    </div>
  );
}

function HeaderSeccion({ hook, isMobile }: { hook: any, isMobile: boolean }) {
  const { 
    tabActiva, 
    reportesGuardadosOrdenados, 
    manejarCorregirFechasHistorial, 
    manejarGenerarReporte, 
    estaCargado 
  } = hook;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
      <div className="flex items-center gap-4">
        <Link to="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Cierre</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y consulta los reportes de cierre de guardia.
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
        <TabsList className="grid w-[240px] grid-cols-2 shadow-sm">
          <TabsTrigger value="generate">Generar</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
      
        {tabActiva === 'history' && reportesGuardadosOrdenados.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={manejarCorregirFechasHistorial}
            className="text-[10px] font-bold uppercase tracking-wider h-8 border-primary/20 text-primary hover:bg-primary/5 ml-2"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Sincronizar Fechas
          </Button>
        )}

        {tabActiva === 'generate' && !isMobile && estaCargado && (
          <Button 
            onClick={manejarGenerarReporte} 
            size="sm"
            className="hidden sm:flex gap-2 shadow-sm font-bold ml-2"
          >
            <FileText className="h-4 w-4" />
            Generar Reporte Final
          </Button>
        )}
      </div>
    </div>
  );
}

function ContenidoGenerar({ hook }: { hook: any }) {
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
        <Card className="flex flex-col border-2 shadow-sm hover:border-primary/20 transition-all duration-300 md:min-h-0">
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
                <RotateCcw className="h-3.5 w-3.5" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-4 md:min-h-0">
            <div className="space-y-2 flex-1 flex flex-col md:min-h-0">
              <Label htmlFor="stats" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contenido Estadístico
              </Label>
              <Textarea
                id="stats"
                placeholder="Las estadísticas se generarán automáticamente al presionar 'Actualizar'..."
                className="flex-1 font-mono text-sm resize-none border-2 focus-visible:ring-orange-500/30 min-h-[200px]"
                value={estadisticasLocal}
                onChange={(e) => setEstadisticasLocal(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
              <p className="text-[11px] text-muted-foreground italic flex items-start gap-2">
                <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                Nota: Puede editar manualmente este campo antes de generar el reporte final si necesita realizar ajustes específicos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-2 shadow-sm hover:border-primary/20 transition-all duration-300 md:min-h-0">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl border-2 border-primary/5">
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
                    className="h-10 min-h-[40px] py-2 resize-none border-2 focus-visible:ring-primary/30"
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
                    className={`group flex items-start gap-4 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${idEditandoManual === novedad.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/30 bg-background'}`}
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
                        onClick={() => manejarEliminarNovedadManual(novedad.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {novedadesManualesOrdenadas.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10">
                    <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No hay novedades manuales agregadas.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContenidoHistorial({ hook }: { hook: any }) {
  const {
    estaCargado,
    reportesGuardadosOrdenados,
    manejarVerReporteGuardado,
    manejarEliminarReporteGuardado
  } = hook;

  if (!estaCargado) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[180px] w-full rounded-2xl" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col md:min-h-0">
      {reportesGuardadosOrdenados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {reportesGuardadosOrdenados.map((report: any) => (
            <Card
              key={report.id}
              className="group cursor-pointer hover:border-primary/40 hover:shadow-xl transition-all duration-300 rounded-2xl border-2 overflow-hidden bg-background relative"
              onClick={() => manejarVerReporteGuardado(report.id)}
            >
              <div className="absolute top-0 right-0 p-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  onClick={(e) => manejarEliminarReporteGuardado(report.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-3 bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {format(new Date(report.date), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <CardTitle className="text-base line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
                  {report.summary}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 border-t bg-background">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Grupo {report.guardGroup}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{format(new Date(report.generatedAt), 'HH:mm')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-4 border-dashed rounded-3xl bg-muted/5 max-w-2xl mx-auto w-full">
          <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
            <History className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <h3 className="text-xl font-bold mb-2">No hay reportes archivados</h3>
          <p className="text-muted-foreground max-w-xs">
            Los reportes finales que generes y guardes aparecerán en esta sección cronológicamente.
          </p>
        </div>
      )}
    </div>
  );
}

function ModalResultado({ hook }: { hook: any }) {
  const {
    esDialogOpenResultado,
    setEsDialogOpenResultado,
    reporteGenerado,
    textoBotonCopiar,
    manejarCopiarAlPortapapeles,
    setEsDialogOpenConfirmarGuardar
  } = hook;

  return (
    <Dialog open={esDialogOpenResultado} onOpenChange={setEsDialogOpenResultado}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 border-none rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Reporte Final Generado</DialogTitle>
                <DialogDescription>Previsualización del reporte consolidado de la guardia</DialogDescription>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted-foreground/10 h-10 w-10">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 bg-muted/5">
          <Textarea
            readOnly
            className="w-full h-full font-mono text-sm leading-relaxed p-6 rounded-2xl border-2 focus-visible:ring-0 bg-background shadow-inner resize-none min-h-[300px]"
            value={reporteGenerado}
          />
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 text-xs text-muted-foreground font-medium hidden sm:block">
            Este contenido está formateado para ser compartido directamente en plataformas de mensajería.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={manejarCopiarAlPortapapeles}
              className="flex-1 sm:flex-none h-11 px-8 font-bold border-2 rounded-xl"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              {textoBotonCopiar}
            </Button>
            <Button
              onClick={() => setEsDialogOpenConfirmarGuardar(true)}
              className="flex-1 sm:flex-none h-11 px-8 font-bold shadow-lg shadow-primary/20 rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              Finalizar y Archivar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModalVistaReporte({ hook, isMobile }: { hook: any, isMobile: boolean }) {
  const {
    esDialogOpenVista,
    setEsDialogOpenVista,
    reporteGuardadoSeleccionado,
    textoBotonCopiar,
    manejarCopiarReporte
  } = hook;


  if (isMobile) {
    return (
      <Sheet open={esDialogOpenVista} onOpenChange={setEsDialogOpenVista}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-6 flex flex-col">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-xl font-bold line-clamp-1">{reporteGuardadoSeleccionado?.summary}</SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              <Badge variant="outline" className="font-bold">Grupo {reporteGuardadoSeleccionado?.guardGroup}</Badge>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                {reporteGuardadoSeleccionado && format(new Date(reporteGuardadoSeleccionado.date), 'dd/MM/yyyy', { locale: es })}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden py-6">
            <div className="h-full border-2 rounded-2xl overflow-hidden bg-muted/5 shadow-inner">
              <Textarea
                readOnly
                className="w-full h-full font-mono text-xs leading-relaxed p-6 border-none bg-transparent resize-none focus-visible:ring-0"
                value={reporteGuardadoSeleccionado?.content}
              />
            </div>
          </div>

          <SheetFooter className="pt-4 border-t">
            <Button
              onClick={manejarCopiarReporte}
              className="w-full h-12 font-bold rounded-xl"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              {textoBotonCopiar}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={esDialogOpenVista} onOpenChange={setEsDialogOpenVista}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-8 rounded-[2rem]">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <History className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{reporteGuardadoSeleccionado?.summary}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-0.5">
                  <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                    Grupo {reporteGuardadoSeleccionado?.guardGroup}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {reporteGuardadoSeleccionado && format(new Date(reporteGuardadoSeleccionado.date), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-6 px-2">
          <div className="h-full border-2 rounded-2xl overflow-hidden bg-muted/5 shadow-inner">
            <Textarea
              readOnly
              className="w-full h-full font-mono text-xs leading-relaxed p-6 border-none bg-transparent resize-none focus-visible:ring-0"
              value={reporteGuardadoSeleccionado?.content}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button
            onClick={manejarCopiarReporte}
            className="h-11 px-8 font-bold rounded-xl shadow-lg shadow-primary/10"
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {textoBotonCopiar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

