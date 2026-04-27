'use client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  Pencil,
  ChevronLeft,
  CloudDownload,
  CloudUpload,
  LogOut,
} from 'lucide-react';
import { LoginDialog } from '@/components/auth/login-dialog';
import type { Template } from '@/lib/types';
import { TemplateEditor } from '@/components/template/template-editor';
import { CloudTemplatesDialog } from '@/components/template/cloud-templates-dialog';
import { cn, getTemplateIcon } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { parseTemplate } from '@/lib/template-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TemplateBuilder } from '@/components/template/template-builder';
import { usePlantillas } from '@/hooks/use-plantillas';

export default function PlantillasPage() {
  const hook = usePlantillas();
  const { 
    tabActiva, 
    setTabActiva, 
    estaAutenticado, 
    usuario, 
    cerrarSesion, 
    idPlantillaSeleccionada,
    plantillaSeleccionada,
    plantillaEditando,
    manejarActualizarContenidoPlantilla,
    addTemplate,
    manejarCancelarEdicion,
    setEsDialogOpenInfo
  } = hook;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <Tabs
        value={tabActiva}
        onValueChange={setTabActiva}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-4 w-full border-b bg-card sm:bg-transparent sm:border-0 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to="/settings" className="shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex flex-col gap-1 sm:gap-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Plantillas</h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight sm:leading-normal">
                  Gestiona y construye plantillas para reportes internos.
                </p>
              </div>
            </div>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="editor" className="flex-1 sm:flex-initial">
                Gestionar
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex-1 sm:flex-initial">
                Constructor
              </TabsTrigger>
            </TabsList>
            
            {estaAutenticado && (
              <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-primary/10 transition-all hover:bg-muted animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-primary uppercase leading-tight">Admin Nube</span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">{usuario?.email}</span>
                </div>
                <div className="h-4 w-[1px] bg-border mx-1" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => cerrarSesion()}
                  title="Cerrar sesión de nube"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <TabsContent
          value="editor"
          className="flex-1 h-full min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
        >
          <div className="flex flex-1 min-h-0 overflow-hidden h-full sm:p-4 sm:pt-0 gap-6">
            <SidebarPlantillas hook={hook} />

            <main
              className={cn(
                'flex-1 h-full min-h-0 min-w-0 relative',
                !idPlantillaSeleccionada ? 'hidden sm:block' : 'block'
              )}
            >
              <CabeceraMovil hook={hook} />
              
              {plantillaSeleccionada ? (
                <div className="absolute inset-0 p-4 sm:p-0">
                   <ScrollArea className="h-full w-full" type="always">
                     <div className="p-1">
                       <TemplateEditor
                        key={plantillaSeleccionada.id}
                        template={plantillaSeleccionada}
                        config={
                          (hook.configs[plantillaSeleccionada.id] || {
                            fields: {},
                            sections: [],
                            layout: [],
                          }) as any
                        }
                        onConfigChange={(config) => hook.updateTemplateConfig(plantillaSeleccionada.id, config)}
                        onTemplateChange={hook.updateTemplate}
                      />
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <VistaVacia />
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent
          value="builder"
          className="flex-1 min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
        >
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 px-4 sm:px-6 lg:px-10 pb-32">
              <TemplateBuilder
                onOpenInfoDialog={() => setEsDialogOpenInfo(true)}
                initialTemplate={plantillaEditando}
                onUpdate={manejarActualizarContenidoPlantilla}
                onAdd={addTemplate}
                onCancel={manejarCancelarEdicion}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ModalesPlantillas hook={hook} />
      <GuiaPlantillas hook={hook} />
    </div>
  );
}

function SidebarPlantillas({ hook }: { hook: any }) {
  const { 
    idPlantillaSeleccionada, 
    setIdPlantillaSeleccionada, 
    templates, 
    manejarClickSubirLocal,
    inputArchivoRef,
    manejarCambioArchivo,
    setEsDialogOpenNube,
    manejarClickEditarContenido,
    estaAutenticado,
    manejarSubirANube,
    estaSubiendo,
    manejarClickEliminar
  } = hook;

  return (
    <aside
      className={cn(
        'h-full w-full sm:w-96 flex-col bg-card flex sm:rounded-lg border sm:shadow-sm shrink-0 min-h-0 relative overflow-hidden overflow-x-hidden',
        idPlantillaSeleccionada ? 'hidden sm:flex' : 'flex'
      )}
    >
      <CardHeader className="p-4 sm:p-6 shrink-0">
        <CardTitle>Plantillas</CardTitle>
        <CardDescription>Sube y gestiona tus plantillas de reportes.</CardDescription>
      </CardHeader>
      <div className="p-4 pt-0 space-y-2 shrink-0">
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
          <Button className="w-full text-xs h-9" size="sm" onClick={manejarClickSubirLocal}>
            <Upload className="mr-2 h-4 w-4" />
            Local (.txt)
          </Button>
          <Button 
            className="w-full text-xs h-9" 
            size="sm" 
            variant="secondary"
            onClick={() => setEsDialogOpenNube(true)}
          >
            <CloudDownload className="mr-2 h-4 w-4" />
            Desde Nube
          </Button>
        </div>
        <input
          type="file"
          ref={inputArchivoRef}
          onChange={manejarCambioArchivo}
          className="hidden"
          accept=".txt"
        />
      </div>
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full w-full overflow-hidden" type="always">
          <TooltipProvider>
            <div className="space-y-1 p-4 pt-0 pb-20 sm:pb-4 min-w-0 w-full overflow-x-hidden">
              {templates.map((template: Template, index: number) => {
                const { layout, fieldNames, errors } = parseTemplate(template.content);
                const isValid = (layout.length > 0 || fieldNames.size > 0) && errors.length === 0;

                return (
                  <div
                    key={`${template.id}-${index}`}
                    className={cn(
                      'group w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg p-2 text-left transition-all hover:bg-accent/50 border border-transparent min-w-0 overflow-hidden shrink-0',
                      idPlantillaSeleccionada === template.id && 'bg-accent border-accent-foreground/10 shadow-sm'
                    )}
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer min-w-0"
                      onClick={() => setIdPlantillaSeleccionada(template.id)}
                    >
                      {(() => {
                        const Icon = getTemplateIcon(template.name);
                        return (
                          <Icon
                            className={cn(
                              'h-4 w-4 text-primary shrink-0',
                              !isValid && 'text-destructive'
                            )}
                          />
                        );
                      })()}
                    </div>
                    
                    <div 
                      className="min-w-0 cursor-pointer overflow-hidden"
                      onClick={() => setIdPlantillaSeleccionada(template.id)}
                    >
                      <p className="font-medium truncate text-xs sm:text-sm leading-tight text-foreground/90">
                        {template.name}
                      </p>
                      {!isValid && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-[9px] text-destructive uppercase font-bold">Error de sintaxis</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80"
                            onClick={(e) => manejarClickEditarContenido(e, template)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 transition-colors",
                              estaAutenticado ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                            )}
                            onClick={(e) => manejarSubirANube(e, template)}
                            disabled={estaSubiendo}
                          >
                            <CloudUpload className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{estaAutenticado ? 'Subir a la Comunidad' : 'Inicia sesión para subir'}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={(e: React.MouseEvent) => manejarClickEliminar(e, template.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              {templates.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 opacity-20" />
                  No has subido ninguna plantilla.
                </div>
              )}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </div>
    </aside>
  );
}

function CabeceraMovil({ hook }: { hook: any }) {
  const { idPlantillaSeleccionada, setIdPlantillaSeleccionada, plantillaSeleccionada } = hook;
  if (!idPlantillaSeleccionada) return null;
  
  return (
    <div className="sm:hidden border-b p-4 bg-card flex items-center justify-between h-16 shrink-0">
      <Button variant="ghost" size="sm" onClick={() => setIdPlantillaSeleccionada(null)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <span className="font-bold truncate max-w-[150px]">{plantillaSeleccionada?.name}</span>
    </div>
  );
}

function VistaVacia() {
  return (
    <Card className="h-full flex items-center justify-center sm:rounded-lg border-2 border-dashed">
      <CardContent className="text-center space-y-4 p-12">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Sin selección</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mt-2">
            Selecciona una plantilla de la lista o sube una nueva para comenzar a configurar sus campos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ModalesPlantillas({ hook }: { hook: any }) {
  const { 
    plantillaAEliminar, 
    setPlantillaAEliminar, 
    manejarConfirmarEliminacion,
    esDialogOpenNube,
    setEsDialogOpenNube,
    esDialogOpenLogin,
    setEsDialogOpenLogin,
    plantillaParaSubir,
    setPlantillaParaSubir,
    subirAPlantillaNube
  } = hook;

  return (
    <>
      <ConfirmDialog
        open={!!plantillaAEliminar}
        onOpenChange={(open) => !open && setPlantillaAEliminar(null)}
        onConfirm={manejarConfirmarEliminacion}
        title="¿Eliminar plantilla?"
        message={plantillaAEliminar === 'ALL'
          ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODAS las plantillas.'
          : 'Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.'}
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      <CloudTemplatesDialog 
        open={esDialogOpenNube} 
        onOpenChange={setEsDialogOpenNube} 
      />
      <LoginDialog
        open={esDialogOpenLogin}
        onOpenChange={setEsDialogOpenLogin}
        onSuccess={() => {
          if (plantillaParaSubir) {
            subirAPlantillaNube(plantillaParaSubir);
            setPlantillaParaSubir(null);
          }
        }}
      />
    </>
  );
}

function GuiaPlantillas({ hook }: { hook: any }) {
  const { esDialogOpenInfo, setEsDialogOpenInfo } = hook;

  return (
    <Dialog open={esDialogOpenInfo} onOpenChange={setEsDialogOpenInfo}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Guía de Plantillas</DialogTitle>
          <DialogDescription>Aprende a usar la sintaxis para crear formularios dinámicos.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-0" type="always">
          <div className="p-6 pt-2 space-y-6">
            <div className="space-y-4">
               <div>
                  <h4 className="font-bold text-base mb-2">1. Campos Básicos</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Usa llaves para definir variables: <code>{`{Nombre del Campo}`}</code>.
                  </p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs">
                    El incidente ocurrió en {`{Lugar}`} a las {`{Hora}`}.
                  </div>
               </div>

               <div>
                  <h4 className="font-bold text-base mb-2">2. Secciones</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Usa corchetes para agrupar: <code>[&quot;Nombre Sección&quot;]</code>.
                  </p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs">
                    [&quot;Datos del Vehículo&quot; {`{Placa}`} {`{Color}`}]
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    * Añade un asterisco al final para secciones repetibles: <code>[&quot;Título&quot;]*</code>
                  </p>
               </div>

               <div className="border-t pt-4">
                  <h4 className="font-bold text-base mb-2">3. Tipos de Datos</h4>
                  <p className="text-sm text-muted-foreground mb-2">Puedes forzar el tipo de entrada:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs font-mono">
                    <li>{`{Descripción:textarea}`}</li>
                    <li>{`{Fecha:date}`}</li>
                    <li>{`{Ubicación:dropdown(Pto 1|Pto 2)}`}</li>
                  </ul>
               </div>

               <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-bold text-primary text-sm mb-1">💡 Pro Tip</h4>
                  <p className="text-xs text-muted-foreground">
                    Si dejas una sección vacía como <code>[&quot;&quot;]</code> creará un separador visual en el reporte final.
                  </p>
               </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t">
          <DialogClose asChild>
            <Button className="w-full sm:w-auto">Entendido</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
