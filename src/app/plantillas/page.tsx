
'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Trash2, HelpCircle, PlusCircle, AlertTriangle, Download, Pencil } from 'lucide-react';
import { useTemplates } from '@/hooks/use-templates';
import type { Template } from '@/types';
import { TemplateEditor } from '@/components/template/template-editor';
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

import { parseTemplate } from '@/lib/template-parser';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TemplateBuilder } from '@/components/template/template-builder';
import { Badge } from '@/components/ui/badge';


export default function PlantillasPage() {
  const { templates, addTemplate, removeTemplate, updateTemplate, configs, updateTemplateConfig, toggleTemplateActive, clearAllTemplates } = useTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState("builder");
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

  const handleDeleteClick = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setTemplateToDelete(templateId);
  };

  const handleDownloadTemplate = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    const blob = new Blob([template.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${template.name}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditContentClick = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setActiveTab("builder");
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

  const handleUpdateTemplateContent = (id: string, updates: Partial<Template>) => {
    const currentTemplate = templates.find(t => t.id === id);
    if (currentTemplate) {
      updateTemplate({ ...currentTemplate, ...updates });
    }
    setEditingTemplate(null);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    // Optional: switch back to list if desired, but maybe user wants to create new one?
    // let's stay in builder but reset
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;

  return (
    <>
      <div className="h-screen flex flex-col bg-muted/30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
          <TabsList className="self-center sm:self-start mb-4">
            <TabsTrigger value="builder">Constructor</TabsTrigger>
            <TabsTrigger value="editor">Gestionar Plantillas</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="flex-1 flex-grow overflow-hidden">
            <TemplateBuilder
              onOpenInfoDialog={() => setIsInfoDialogOpen(true)}
              initialTemplate={editingTemplate}
              onUpdate={handleUpdateTemplateContent}
              onCancel={handleCancelEdit}
            />
          </TabsContent>

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
                        const { layout, fieldNames, errors } = parseTemplate(template.content);
                        const isValid = (layout.length > 0 || fieldNames.size > 0) && errors.length === 0;

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
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => handleEditContentClick(e, template)}
                                    aria-label={`Editar contenido de ${template.name}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar Contenido</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => handleDownloadTemplate(e, template)}
                                    aria-label={`Exportar plantilla ${template.name}`}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Exportar</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <Switch
                                      checked={template.isActive && isValid}
                                      onCheckedChange={() => toggleTemplateActive(template.id)}
                                      disabled={!isValid}
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label={`Activar/Desactivar plantilla ${template.name}`}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {isValid ? (
                                    <p>Activar/Desactivar</p>
                                  ) : (
                                    <div className="text-xs">
                                      <p className="font-semibold mb-1">Plantilla inválida:</p>
                                      <ul className="list-disc pl-3 space-y-1">
                                        {errors.length > 0 ? (
                                          errors.slice(0, 3).map((err, i) => (
                                            <li key={i}>{err}</li>
                                          ))
                                        ) : (
                                          <li>La plantilla está vacía o mal formada.</li>
                                        )}
                                        {errors.length > 3 && <li>...y {errors.length - 3} más.</li>}
                                      </ul>
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={(e) => handleDeleteClick(e, template.id)}
                                    aria-label={`Eliminar plantilla ${template.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Eliminar</p></TooltipContent>
                              </Tooltip>
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
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center space-y-4 p-12">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay plantilla seleccionada</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Selecciona una plantilla de la lista o sube una nueva para comenzar.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </main>
            </div>
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
                  <p className="text-muted-foreground">Añade un asterisco <code>*</code> después de la sección para que los usuarios puedan añadir múltiples entradas de esa sección (como una lista de vehículos o personal).</p>
                  <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
                    <p>["Vehículos Involucrados"]* {`{Placa}`} {`{Modelo}`}</p>
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
                {`[singular="DATOS DEL LESIONADO" plural="DATOS DE LOS LESIONADOS" sub="Lesionado"]*
- Nombre y Apellido: {Nombre y apellido}
- Cédula: {Cédula}
`}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>Así funciona cada parte:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li><code>singular="..."</code>: Título principal si hay <strong>un solo</strong> elemento. Se formatea como: `- *TÍTULO*`.</li>
                <li><code>plural="..."</code>: Título principal si hay <strong>más de un</strong> elemento.</li>
                <li><code>sub="..."</code>: Subtítulo para <strong>cada</strong> elemento individual. Si se define, se numera automáticamente (ej. `- *Lesionado #01*`). Si se omite, no se añade ningún subtítulo por elemento.</li>
                <li>Si no se añaden elementos, toda la sección (títulos y contenido) se ocultará del reporte final.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-base mb-2">4. Avanzado: Especificar Tipos y Opciones</h4>
              <p>Puedes definir el tipo y las opciones de un campo directamente en la plantilla para mayor control.</p>
              <ul className="list-disc list-inside mt-2 space-y-4 text-sm text-muted-foreground">
                <li>
                  <strong>Tipos de Campo</strong>: Usa la sintaxis <code>{`{NombreCampo:tipo}`}</code>.
                  <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                    <li><code>{`{Descripción:textarea}`}</code></li>
                    <li><code>{`{Fecha de Cierre:date}`}</code></li>
                    <li><code>{`{Hora de Llamada:time-hlv}`}</code></li>
                    <li><code>{`{Motivo:dropdown}`}</code></li>
                  </ul>
                  <p className="mt-2">Tipos disponibles: <code>text</code>, <code>textarea</code>, <code>date</code>, <code>time-hlv</code>, <code>dropdown</code>.</p>
                </li>
                <li>
                  <strong>Opciones para Dropdown</strong>: Define las opciones directamente en la plantilla.
                  <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
                    {`{Motivo:dropdown(Llamada Radio=Se recibe llamada vía radio...|Llamada Telefónica=Se recibe llamada telefónica...)}`}
                  </div>
                  <p className="mt-2">Usa <code>( )</code> después de <code>:dropdown</code>. Separa el nombre de la opción y su valor con <code>=</code>. Separa cada par de opciones con <code>|</code>. El sistema usará el primer <code>=</code> como separador, permitiendo que el valor contenga caracteres <code>=</code>.</p>
                </li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                Si defines el tipo o las opciones aquí, las configuraciones correspondientes en el editor de plantillas se desactivarán para evitar conflictos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-base mb-2">5. Secciones Condicionales <Badge variant="destructive">En Desarrollo</Badge></h4>
              <p>Puedes mostrar u ocultar una sección entera basándote en la opción seleccionada en un dropdown. Esto es ideal para formularios que cambian según la selección del usuario.</p>
              <p className="text-muted-foreground mt-2">Usa la sintaxis <code>[?{`{NombreDelDropdown}`}=Índice] ... [/]</code>, donde el índice empieza en 0.</p>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
                {`{Tipo de Atención:dropdown(En sitio=Se atendió en el sitio|Traslado=Se realizó traslado)}

[?{Tipo de Atención}=0]
    ["Datos de Atención en Sitio"]
    {Detalles del sitio}
[/]

[?{Tipo de Atención}=1]
    ["Datos del Traslado"]
    {Unidad de Traslado}
    {Destino}
[/]
`}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>Así funciona:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li><code>[?</code>: Inicia una sección condicional.</li>
                <li><code>{`{NombreDelDropdown}`}=0</code>: La condición. El bloque solo se mostrará si se selecciona la <strong>primera opción</strong> ("En sitio") del dropdown.</li>
                <li>El contenido dentro puede ser cualquier otra sección o campo.</li>
                <li><code>[/]</code>: Cierra el bloque condicional.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-base mb-2">6. Ejemplo Completo de Plantilla</h4>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap">
                {`Siendo las {Hora:time-hlv}, se reporta novedad en {Lugar}.
El motivo fue {Motivo:dropdown(Accidente Leve=Un accidente leve.|Incendio=Un incendio de vegetación.)}

[""]

["Datos de la Unidad" {Unidad a Cargo} {PAB}]

["Descripción de la Novedad"]*
{Descripción:textarea}

[singular="LESIONADO" plural="LESIONADOS" sub="Lesionado"]*
- Nombre: {Nombre}
- Cédula: {Cédula}

[""]

El reporte fue cerrado por {Funcionario a Cargo}.`}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-base mb-2">7. Automatización de Estadísticas (Reglas Condicionales)</h4>
              <p>Además de la categoría por defecto, puedes configurar reglas para que el reporte se clasifique automáticamente según el contenido.</p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>Cómo funciona:</strong> El sistema evalúa el valor de un campo específico. Si coincide con tu regla, suma a la categoría que definas en lugar de la categoría por defecto.
                </li>
                <li>
                  <strong>Configuración:</strong> En el panel "Editar Plantilla" (o al crear una nueva):
                  <ol className="list-decimal list-inside pl-4 mt-1 space-y-1">
                    <li>Haz clic en <span className="inline-flex items-center justify-center border rounded px-1 h-5 text-xs bg-muted">+ Regla</span>.</li>
                    <li>Selecciona el <strong>Campo</strong> que determinará la estadística (ej: <code>Motivo</code>).</li>
                    <li>Escribe el <strong>Valor</strong> exacto que debe tener (ej: <code>Falsa Alarma</code>).</li>
                    <li>Escribe la <strong>Categoría Resultado</strong> donde se debe sumar (ej: <code>LLAMADA DE EMERGENCIA - FALSA ALARMA</code>).</li>
                  </ol>
                </li>
              </ul>
            </div>
            <div className="border-t pt-4 space-y-4">
              <div>
                <h4 className="font-semibold text-base mb-2">Paso Final: Configuración</h4>
                <p>
                  Una vez que subas tu plantilla, selecciónala en la lista. En el panel de la derecha podrás configurar cualquier detalle que no hayas especificado en el archivo `.txt`, como el "campo de destino" para los dropdowns.
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
