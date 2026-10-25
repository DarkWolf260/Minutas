import React from 'react';
import { Upload, CloudDownload, FileText, AlertTriangle, Pencil, CloudUpload, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, getTemplateIcon } from '@/lib/utils';
import { parseTemplate } from '@/lib/template-parser';
import type { Template } from '@/lib/types';
import type { UsePlantillasReturn } from '@/hooks/plantillas';

export interface PlantillasSidebarProps {
  hook: Pick<
    UsePlantillasReturn,
    | 'idPlantillaSeleccionada'
    | 'setIdPlantillaSeleccionada'
    | 'templates'
    | 'manejarClickSubirLocal'
    | 'inputArchivoRef'
    | 'manejarCambioArchivo'
    | 'manejarClickEditarEnBuilder'
    | 'estaAutenticado'
    | 'isAdmin'
    | 'isCloud'
    | 'manejarSubirANube'
    | 'estaSubiendo'
    | 'manejarClickEliminar'
    | 'sincronizarDesdeNube'
    | 'estaSincronizando'
    | 'manejarDescargarTodasTXT'
    | 'manejarDescargarBackupJSON'
    | 'manejarDescargarPlantilla'
  >;
}

export const PlantillasSidebar = ({ hook }: PlantillasSidebarProps) => {
  const { 
    idPlantillaSeleccionada, 
    setIdPlantillaSeleccionada, 
    templates, 
    manejarClickSubirLocal,
    inputArchivoRef,
    manejarCambioArchivo,
    manejarClickEditarEnBuilder,
    estaAutenticado,
    isAdmin,
    isCloud,
    manejarSubirANube,
    estaSubiendo,
    manejarClickEliminar,
    sincronizarDesdeNube,
    estaSincronizando,
    manejarDescargarTodasTXT,
    manejarDescargarBackupJSON,
    manejarDescargarPlantilla,
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
        <div className="grid grid-cols-3 gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full text-[11px] h-9 px-1.5" size="sm" disabled={isCloud && !isAdmin}>
                <Upload className="mr-1 h-3.5 w-3.5 shrink-0" />
                Subir...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={manejarClickSubirLocal} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Archivos .txt (Varios)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={manejarClickSubirLocal} className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                <span>Copia de seguridad (.json)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full text-[11px] h-9 px-1.5" size="sm" variant="outline" disabled={templates.length === 0}>
                <CloudDownload className="mr-1 h-3.5 w-3.5 shrink-0" />
                Descargar...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={manejarDescargarTodasTXT} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Individuales (.txt)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={manejarDescargarBackupJSON} className="cursor-pointer">
                <CloudDownload className="mr-2 h-4 w-4" />
                <span>Copia de seguridad (.json)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            className="w-full text-[11px] h-9 px-1.5" 
            size="sm" 
            variant="secondary"
            onClick={sincronizarDesdeNube}
            disabled={estaSincronizando}
          >
            <CloudDownload className={cn("mr-1 h-3.5 w-3.5 shrink-0", estaSincronizando && "animate-spin")} />
            Sincronizar
          </Button>
        </div>
        <input
          type="file"
          ref={inputArchivoRef}
          onChange={manejarCambioArchivo}
          className="hidden"
          accept=".txt,.json"
          multiple
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
                      'group w-full grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-xl p-2 text-left transition-all border outline-none min-w-0 overflow-hidden shrink-0',
                      idPlantillaSeleccionada === template.id
                        ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-2xs'
                        : 'border-transparent hover:bg-muted/50'
                    )}
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer min-w-0 pl-1"
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
                      {!(isCloud && !isAdmin) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => manejarClickEditarEnBuilder(e, template)}
                              aria-label="Editar plantilla en Constructor"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar plantilla (Constructor)</p></TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => manejarDescargarPlantilla(e, template)}
                            aria-label="Descargar plantilla"
                          >
                            <CloudDownload className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Descargar (.txt)</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                              "transition-colors",
                              estaAutenticado && isAdmin ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => manejarSubirANube(e, template)}
                            disabled={estaSubiendo || !isAdmin}
                            aria-label="Subir a la nube"
                          >
                            <CloudUpload className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {!estaAutenticado 
                              ? 'Inicia sesión para subir' 
                              : !isAdmin 
                                ? 'Solo los administradores pueden subir plantillas' 
                                : 'Subir a la Comunidad'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {!(isCloud && !isAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Más opciones"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem 
                              className="cursor-pointer gap-2"
                              onClick={(e) => manejarClickEditarEnBuilder(e, template)}
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>Editar en Constructor</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                              onClick={(e: React.MouseEvent) => manejarClickEliminar(e, template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Eliminar plantilla</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
              {templates.length === 0 && (
                <div className="empty-state-container py-12">
                  <div className="empty-state-icon-box">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="empty-state-title">Sin plantillas</h3>
                  <p className="empty-state-desc">
                    No has subido ninguna plantilla de reporte todavía.
                  </p>
                </div>
              )}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </div>
    </aside>
  );
};
