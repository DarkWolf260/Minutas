
'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Trash2, HelpCircle, PlusCircle, AlertTriangle } from 'lucide-react';
import { useTemplates } from '@/hooks/use-templates';
import type { Template } from '@/types';
import { TemplateEditor } from '@/components/template-editor';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalTagsManager } from '@/components/global-tags-manager';
import { parseTemplate } from '@/lib/template-parser';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function PlantillasPage() {
    const { templates, addTemplate, removeTemplate, updateTemplate, configs, updateTemplateConfig, toggleTemplateActive, clearAllTemplates } = useTemplates();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const newTemplate: Template = {
                    id: `template_${Date.now()}`,
                    name: file.name.replace(/\.txt$/, ''),
                    content,
                    type: 'normal',
                };
                addTemplate(newTemplate);
            };
            reader.readAsText(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleDeleteClick = (templateId: string) => {
        setTemplateToDelete(templateId);
    };
    
    const handleConfirmDelete = () => {
        if (!templateToDelete) return;
        
        if (templateToDelete === 'ALL') {
            clearAllTemplates();
            setSelectedTemplateId(null);
        } else {
            if (selectedTemplateId === templateToDelete) {
                setSelectedTemplateId(null);
            }
            removeTemplate(templateToDelete);
        }
        setTemplateToDelete(null);
    };

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;
    
    return (
      <>
        <div className="h-screen flex flex-col bg-muted/30">
           <Tabs defaultValue="editor" className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
                <TabsList className="self-center sm:self-start mb-4">
                    <TabsTrigger value="editor">Editor de Plantillas</TabsTrigger>
                    <TabsTrigger value="etiquetas">Etiquetas Globales</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="flex-1 flex-grow overflow-hidden">
                    <div className="flex h-full gap-6">
                      <aside className="w-96 flex-col bg-card flex rounded-lg border shadow-sm">
                        <CardHeader>
                          <CardTitle>Plantillas</CardTitle>
                          <CardDescription>
                            Sube y gestiona tus plantillas de reportes.
                          </CardDescription>
                        </CardHeader>
                        <div className="p-4 pt-0 space-y-2">
                          <Button className="w-full" onClick={handleUploadClick}>
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Plantilla (.txt)
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => setIsInfoDialogOpen(true)}>
                              <HelpCircle className="mr-2 h-4 w-4" />
                              Cómo crear plantillas
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".txt"
                          />
                        </div>
                        <ScrollArea className="flex-1">
                          <TooltipProvider>
                            <div className="space-y-1 p-4 pt-0">
                              {templates.map((template, index) => {
                                const { layout, fieldNames } = parseTemplate(template.content);
                                const isValid = layout.length > 0 || fieldNames.size > 0;

                                return (
                                <div
                                  key={`${template.id}-${index}`}
                                  className={cn(
                                    'group w-full flex items-center justify-between rounded-md p-3 text-left transition-colors hover:bg-muted',
                                    selectedTemplateId === template.id && 'bg-muted'
                                  )}
                                >
                                  <div
                                    className="flex items-center gap-3 flex-grow cursor-pointer"
                                    onClick={() => setSelectedTemplateId(template.id)}
                                  >
                                    <FileText className={cn("h-4 w-4 text-primary", !isValid && "text-destructive")} />
                                    <span className="flex-1 font-medium">{template.name}</span>
                                    {!isValid && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {/* Wrapper div for tooltip on disabled element */}
                                        <div className="flex items-center">
                                          <Switch
                                            checked={template.isActive && isValid}
                                            onCheckedChange={() => toggleTemplateActive(template.id)}
                                            disabled={!isValid}
                                            aria-label={`Activar/Desactivar plantilla ${template.name}`}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      {!isValid && (
                                        <TooltipContent>
                                          <p>Esta plantilla tiene errores o está vacía y no puede ser activada.</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => handleDeleteClick(template.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                )
                              })}
                              {templates.length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No has subido ninguna plantilla.
                                </div>
                              )}
                            </div>
                          </TooltipProvider>
                        </ScrollArea>
                        {templates.length > 0 && (
                          <div className="border-t p-3">
                            <Button
                              variant="destructive"
                              className="w-full"
                              onClick={() => setTemplateToDelete('ALL')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Limpiar Todo
                            </Button>
                          </div>
                        )}
                      </aside>

                      <main className="flex-1">
                        {selectedTemplate ? (
                          <TemplateEditor
                            key={selectedTemplate.id}
                            template={selectedTemplate}
                            config={configs[selectedTemplate.id] || {}}
                            onConfigChange={(config) => updateTemplateConfig(selectedTemplate.id, config)}
                            onTemplateChange={updateTemplate}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card shadow-lg">
                            <div className="text-center">
                              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                              <h3 className="mt-4 text-lg font-semibold">
                                Selecciona una plantilla
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Elige una plantilla de la lista para verla y editar su configuración.
                              </p>
                            </div>
                          </div>
                        )}
                      </main>
                    </div>
                </TabsContent>

                <TabsContent value="etiquetas" className="flex-1 overflow-y-auto">
                    <GlobalTagsManager />
                </TabsContent>
            </Tabs>
        </div>

        <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {templateToDelete === 'ALL'
                            ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODAS las plantillas y sus configuraciones.'
                            : 'Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.'
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>
                        Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Guía para Crear Plantillas de Texto</DialogTitle>
                    <DialogDescription>
                        Usa esta sintaxis en tus archivos `.txt` para crear formularios dinámicos y flexibles.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 text-sm max-h-[70vh] overflow-y-auto pr-4">
                    <div>
                        <h4 className="font-semibold text-base mb-2">1. Lo Básico: Campos de Formulario</h4>
                        <p>Para definir un campo que el usuario deberá rellenar, enciérralo entre llaves <code>{`{ }`}</code>. Cada campo que definas se convertirá en un elemento del formulario (un campo de texto, un selector de fecha, etc.).</p>
                         <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
                           <p>Siendo las {`{Hora}`}, se presentó una novedad en {`{Lugar}`}.</p>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-base mb-2">2. Organizando con Secciones</h4>
                        <p>Puedes agrupar campos y organizar la estructura de tu formulario y reporte usando secciones. Se definen con corchetes <code>[ ]</code>.</p>
                        
                        <div className="mt-4 space-y-4">
                            <div>
                                <h5 className="font-medium mb-1">a) Sección Simple (Título y Campos)</h5>
                                <p className="text-muted-foreground">Úsala para agrupar campos bajo un mismo título.</p>
                                <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
                                   <p>["Datos de la Unidad" {`{Unidad a Cargo}`} {`{PAB}`}]</p>
                                </div>
                                <p className='mt-2 text-xs text-muted-foreground'><strong>Tip:</strong> Si omites los campos y dejas solo el título, <code>["Título Informativo"]</code>, la sección actuará como un simple encabezado en el formulario y en el reporte final (ej: <span className="font-mono">- *Título Informativo*</span>).</p>
                            </div>

                            <div>
                                <h5 className="font-medium mb-1">b) Sección Repetible (Listas)</h5>
                                <p className="text-muted-foreground">Añade un asterisco <code>*</code> después del título para que los usuarios puedan añadir múltiples entradas de esa sección (como una lista de vehículos o personal).</p>
                                <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
                                   <p>["Vehículos Involucrados"* {`{Placa}`} {`{Modelo}`}]</p>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-medium mb-1">c) Separador Visual</h5>
                                <p className="text-muted-foreground">Para crear una línea de separación en el formulario y un espacio en el reporte, usa comillas vacías.</p>
                                <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
                                   <p>[""]</p>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-base mb-2">3. Avanzado: Secciones Repetibles con Títulos Inteligentes</h4>
                        <p>Esta es la forma más potente de crear secciones repetibles, ideal para cuando el título debe cambiar según la cantidad de elementos (ej. "1 Lesionado" vs. "Múltiples Lesionados").</p>
                        <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
{`[singular="DATOS DEL LESIONADO" plural="DATOS DE LOS LESIONADOS" sub="Lesionado"
- Nombre y Apellido: {Nombre y apellido}
- Cédula: {Cédula}
]`}
                        </div>
                        <p className='mt-2 text-sm text-muted-foreground'>Así funciona cada parte:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                            <li><code>singular="..."</code>: Título principal si hay <strong>un solo</strong> elemento. Se formatea como: `- *TÍTULO*`.</li>
                            <li><code>plural="..."</code>: Título principal si hay <strong>más de un</strong> elemento.</li>
                            <li><code>sub="..."</code>: Subtítulo para <strong>cada</strong> elemento individual. Se numera automáticamente (ej. `- *Lesionado #01*`).</li>
                            <li>Si no se añaden elementos, toda la sección (títulos y contenido) se ocultará del reporte final.</li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-base mb-2">4. Ejemplo Completo de Plantilla</h4>
                        <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
{`Siendo las {Hora}, se reporta novedad en {Lugar}.

[""]

["Datos de la Unidad" {Unidad a Cargo} {PAB}]

["Descripción de la Novedad"]
{Descripción}

[singular="LESIONADO" plural="LESIONADOS" sub="Lesionado"
- Nombre: {Nombre}
- Cédula: {Cédula}
]

[""]

El reporte fue cerrado por {Funcionario a Cargo}.`}
                        </div>
                    </div>
                    <div className="border-t pt-4 space-y-4">
                        <div>
                           <h4 className="font-semibold text-base mb-2">Paso Final: Configuración</h4>
                            <p>
                                Una vez que subas tu plantilla, selecciónala en la lista. En el panel de la derecha podrás <strong>configurar el tipo de cada campo</strong> (Texto, Área de texto, Fecha, etc.) para que el formulario se ajuste a tus necesidades.
                            </p>
                        </div>
                         <div>
                           <h4 className="font-semibold text-base mb-2">Más Información</h4>
                           <p className="text-muted-foreground">
                                Para una explicación detallada sobre cómo la aplicación guarda los datos y renderiza los reportes, consulta la página de <Link href="/documentation" className="text-primary underline hover:text-primary/80" onClick={() => setIsInfoDialogOpen(false)}>Documentación</Link>.
                           </p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Entendido</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}
