'use client';

import { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  Download,
  Pencil,
  ChevronLeft,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { parseTemplate } from '@/lib/template-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TemplateBuilder } from '@/components/template/template-builder';
import { Badge } from '@/components/ui/badge';
import { generateId } from '@/lib/utils/id';
import { useWorkspaceManager } from '@/lib/db/db-context';

export default function PlantillasPage() {
  const {
    templates,
    addTemplate,
    removeTemplate,
    updateTemplate,
    configs,
    updateTemplateConfig,
    toggleTemplateActive,
    clearAllTemplates,
  } = useTemplates();
  const { currentWorkspace } = useWorkspaceManager();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newTemplate: Template = {
          id: generateId('template'),
          workspaceId: currentWorkspace,
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
    setActiveTab('builder');
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
    const currentTemplate = templates.find((t) => t.id === id);
    if (currentTemplate) {
      updateTemplate({ ...currentTemplate, ...updates });
    }
    setEditingTemplate(null);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-4 w-full border-b bg-card sm:bg-transparent sm:border-0 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">Plantillas</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona y construye plantillas para reportes internos.
              </p>
            </div>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="editor" className="flex-1 sm:flex-initial">
                Gestionar
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex-1 sm:flex-initial">
                Constructor
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent
          value="editor"
          className="flex-1 h-full min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="flex flex-1 min-h-0 overflow-hidden h-full sm:p-4 sm:pt-0 gap-6">
            <aside
              className={cn(
                'h-full w-full sm:w-96 flex-col bg-card flex sm:rounded-lg border sm:shadow-sm shrink-0 min-h-0 relative overflow-hidden',
                selectedTemplateId ? 'hidden sm:flex' : 'flex'
              )}
            >
              <CardHeader className="p-4 sm:p-6 shrink-0">
                <CardTitle>Plantillas</CardTitle>
                <CardDescription>Sube y gestiona tus plantillas de reportes.</CardDescription>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 shrink-0">
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
              <div className="flex-1 relative min-h-0 w-full overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <TooltipProvider>
                    <div className="space-y-1 p-4 pt-0 pb-20 sm:pb-4 min-w-0 w-full">
                      {templates.map((template, index) => {
                        const { layout, fieldNames, errors } = parseTemplate(template.content);
                        const isValid =
                          (layout.length > 0 || fieldNames.size > 0) && errors.length === 0;

                        return (
                          <div
                            key={`${template.id}-${index}`}
                            className={cn(
                              'group w-full flex items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-muted min-w-0 overflow-hidden flex-shrink-0',
                              selectedTemplateId === template.id && 'bg-muted shadow-sm'
                            )}
                          >
                            <div
                              className="flex items-center gap-2 flex-1 cursor-pointer min-w-0 overflow-hidden mr-2"
                              onClick={() => setSelectedTemplateId(template.id)}
                            >
                              <FileText
                                className={cn(
                                  'h-4 w-4 text-primary shrink-0',
                                  !isValid && 'text-destructive'
                                )}
                              />
                              <span className="flex-1 font-medium truncate text-xs sm:text-sm">{template.name}</span>
                              {!isValid && (
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => handleEditContentClick(e, template)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar Contenido</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => handleDownloadTemplate(e, template)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Exportar</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center mx-1">
                                    <Switch
                                      checked={template.isActive && isValid}
                                      onCheckedChange={() => toggleTemplateActive(template.id)}
                                      disabled={!isValid}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {isValid ? (
                                    <p>Activar/Desactivar</p>
                                  ) : (
                                    <div className="text-xs">
                                      <p className="font-semibold mb-1 text-destructive">Inválida:</p>
                                      <p>{errors[0] || "Contenido no reconocido."}</p>
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
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar</p>
                                </TooltipContent>
                              </Tooltip>
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
                </div>
              </div>
            </aside>

            <main
              className={cn(
                'flex-1 h-full min-h-0 relative',
                !selectedTemplateId ? 'hidden sm:block' : 'block'
              )}
            >
              {selectedTemplateId && (
                <div className="sm:hidden border-b p-4 bg-card flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTemplateId(null)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                  <span className="font-bold truncate max-w-[150px]">{selectedTemplate?.name}</span>
                </div>
              )}
              {selectedTemplate ? (
                <div className="absolute inset-0 p-4 sm:p-0">
                   <ScrollArea className="h-full w-full" type="always">
                     <div className="p-1">
                       <TemplateEditor
                        key={selectedTemplate.id}
                        template={selectedTemplate}
                        config={
                          (configs[selectedTemplate.id] || {
                            fields: {},
                            sections: [],
                            layout: [],
                          }) as any
                        }
                        onConfigChange={(config) => updateTemplateConfig(selectedTemplate.id, config)}
                        onTemplateChange={updateTemplate}
                      />
                    </div>
                  </ScrollArea>
                </div>
              ) : (
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
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent
          value="builder"
          className="flex-1 min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 px-4 sm:px-6 lg:px-10 pb-6">
              <TemplateBuilder
                onOpenInfoDialog={() => setIsInfoDialogOpen(true)}
                initialTemplate={editingTemplate}
                onUpdate={handleUpdateTemplateContent}
                onAdd={addTemplate}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              {templateToDelete === 'ALL'
                ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODAS las plantillas.'
                : 'Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Guía de Plantillas</DialogTitle>
            <DialogDescription>
              Aprende a usar la sintaxis para crear formularios dinámicos.
            </DialogDescription>
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
                    <p className="text-sm text-muted-foreground mb-2">
                      Puedes forzar el tipo de entrada:
                    </p>
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
    </div>
  );
}
