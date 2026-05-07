'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

import { parseTemplate } from '@/lib/template-parser';
import { Save, HelpCircle, X, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { validateTemplateSyntax } from '@/lib/validators';
import { ReportForm, ReportFormRef } from '@/components/report/report-form';
import type { Template, TemplateConfig } from '@/lib/types';
import { ReportPreview } from '@/components/report/report-preview';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils/id';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useIsMobile } from '@/hooks/use-mobile';

interface TemplateBuilderProps {
  onOpenInfoDialog: () => void;
  initialTemplate?: Template | null;
  onUpdate?: (id: string, updates: Partial<Template>) => void;
  onAdd?: (newTemplate: Template) => void;
  onCancel?: () => void;
}

export function TemplateBuilder({
  onOpenInfoDialog,
  initialTemplate,
  onUpdate,
  onAdd,
  onCancel,
}: TemplateBuilderProps) {
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const { currentWorkspace } = useWorkspaceManager();
  const isMobile = useIsMobile();

  // New state for report preview
  const formRef = useRef<ReportFormRef>(null);
  const [previewReportContent, setPreviewReportContent] = useState('');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [previewStatus, setPreviewStatus] = useState<'En proceso' | 'Finalizado'>('En proceso');

  // Si estamos editando, usamos el ID de la plantilla original
  const isEditing = !!initialTemplate;

  useEffect(() => {
    if (initialTemplate) {
      setTemplateContent(initialTemplate.content);
      setTemplateName(initialTemplate.name);
    } else {
      setTemplateContent('');
      setTemplateName('');
    }
  }, [initialTemplate]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Creates a temporary template object for the preview
  const previewTemplate = useMemo<Template>(
    () => ({
      id: 'preview',
      workspace_id: currentWorkspace,
      name: templateName || 'Vista Previa',
      content: templateContent,
      type: 'normal',
      isActive: true,
      statisticsCategory: initialTemplate?.statisticsCategory,
      statistics_rules: initialTemplate?.statistics_rules,
    }),
    [templateContent, templateName, initialTemplate, currentWorkspace]
  );

  // Creates a temporary config for the preview
  const previewConfig = useMemo<TemplateConfig>(() => {
    const { sections, layout, defaultValues } = parseTemplate(templateContent);

    // Populate preview config fields with default values
    const fields: Record<string, any> = {};
    if (defaultValues) {
      defaultValues.forEach((value: string, key: string) => {
        fields[key] = { defaultValue: value };
      });
    }

    return {
      sections,
      layout,
      fields,
    };
  }, [templateContent]);


  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error('Por favor, dale un nombre a la plantilla.');
      return;
    }
    if (!templateContent.trim()) {
      toast.error('La plantilla no puede estar vacía.');
      return;
    }

    const syntaxCheck = validateTemplateSyntax(templateContent);
    if (!syntaxCheck.valid) {
      toast.error(`Error de sintaxis: ${syntaxCheck.error}`);
      return;
    }

    if (isEditing && initialTemplate && onUpdate) {
      onUpdate(initialTemplate.id, {
        name: templateName,
        content: templateContent,
      });
      toast.success('Plantilla actualizada correctamente');
      if (onCancel) onCancel();
    } else if (onAdd) {
      const newTemplate: Template = {
        id: generateId('template'),
        workspace_id: currentWorkspace,
        name: templateName,
        content: templateContent,
        type: 'normal',
        isActive: true,
      };
      onAdd(newTemplate);
      setTemplateName('');
      setTemplateContent('');
      toast.success('Plantilla creada correctamente');
    }
  };

  const handlePreviewReport = () => {
    if (formRef.current) {
      const content = formRef.current.getRenderedContent();
      setPreviewReportContent(content);
      setIsPreviewDialogOpen(true);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewReportContent);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Mobile View Toggle */}
      <div className="lg:hidden flex p-2 gap-2 bg-muted/20 border-b">
        <Button
          variant={mobileView === 'editor' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 h-8 text-xs font-semibold"
          onClick={() => setMobileView('editor')}
        >
          Editor
        </Button>
        <Button
          variant={mobileView === 'preview' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 h-8 text-xs font-semibold"
          onClick={() => setMobileView('preview')}
        >
          Vista Previa Formulario
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0 overflow-hidden p-0 lg:p-0">
        <Card
          className={cn(
            'flex flex-col h-full border-muted-foreground/20 shadow-md min-h-0 overflow-hidden',
            mobileView !== 'editor' && 'hidden lg:flex'
          )}
        >
          <CardHeader className="bg-muted/30 py-2.5 px-3 sm:py-3 sm:px-4">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">
                  {isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenInfoDialog}
                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    title="Cancelar"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={handleSave} size="sm" className="h-8 px-2 sm:px-3 hidden sm:flex">
                  <Save className="sm:mr-2 h-4 w-4" />
                  <span>Guardar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
            {/* Header Fields Section - Fixed at top */}
            <div className="flex flex-col gap-4 shrink-0">
              <div className="space-y-1">
                <Label htmlFor="template-name" className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">
                  Nombre de la Plantilla
                </Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Reporte de Guardia"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Editor Area - This fills the rest of the vertical space */}
            <div className="flex-1 flex flex-col min-h-0 rounded-md border shadow-sm bg-background">
              <Textarea
                ref={textareaRef}
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="flex-1 w-full font-mono text-sm leading-relaxed resize-none p-4 border-0 focus-visible:ring-0 overflow-y-auto"
                placeholder="Escribe el contenido de tu plantilla aquí..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel (Card 2) */}
        <div
          className={cn(
            'flex flex-col h-full border rounded-xl shadow-lg bg-background overflow-hidden min-h-0',
            mobileView !== 'preview' && 'hidden lg:flex'
          )}
        >
          {/* Header styled like ReportGenerator */}
          <header className="flex-none flex items-center justify-between border-b p-4 bg-muted/40 z-20 shadow-sm">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Vista Previa
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-background border rounded-lg p-0.5 shadow-sm overflow-hidden">
                <Button 
                  variant={previewStatus === 'En proceso' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 text-[10px] px-2 rounded-md"
                  onClick={() => setPreviewStatus('En proceso')}
                >
                  En proceso
                </Button>
                <Button 
                  variant={previewStatus === 'Finalizado' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 text-[10px] px-2 rounded-md"
                  onClick={() => setPreviewStatus('Finalizado')}
                >
                  Finalizado
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewReport}
                className="h-8 text-xs bg-background shadow-sm"
              >
                <FileText className="mr-2 h-3 w-3" />
                Generar Texto
              </Button>
            </div>
          </header>

          <CardContent className="flex-1 p-0 overflow-hidden relative min-h-0 flex flex-col bg-muted/10">
            <ScrollArea className="flex-1 w-full" type="always">
              <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-8 pb-20">
                <Card className="border bg-card shadow-sm">
                  <CardHeader className="bg-card/50 border-b py-4">
                    <CardTitle className="text-lg font-bold">{templateName || 'Nueva Plantilla'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ReportForm
                      key={`preview-${templateContent.length}-${previewStatus}`}
                      ref={formRef}
                      template={previewTemplate}
                      config={previewConfig}
                      onSubmit={() => { }}
                      disabled={false}
                      controlledValues={{
                        Estatus: previewStatus,
                        Enc: '(E)' // Default preview value for Chief Encargado
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </CardContent>
        </div>
      </div>

      {/* Mobile Preview & Actions Button (Floating) */}
      <div className="lg:hidden fixed bottom-24 right-6 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <Button
          onClick={handlePreviewReport}
          className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl h-14 w-14 bg-slate-500 hover:bg-slate-600 text-white hover:scale-105 active:scale-95 transition-all duration-300 border border-slate-400/20"
          size="icon"
          title="Ver Vista Previa del Reporte"
        >
          <Eye className="h-7 w-7" />
        </Button>
        <Button
          onClick={handleSave}
          className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95 transition-all duration-300 border border-blue-500/20"
          size="icon"
          title="Guardar Plantilla"
        >
          <Save className="h-7 w-7" />
        </Button>
      </div>

      {/* Shared Preview Component for Report Content */}
      <ReportPreview
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        content={previewReportContent}
        copyButtonText="Copiar"
        onCopy={handleCopyToClipboard}
        isMobile={isMobile}
        title="Vista Previa del Reporte"
      />
    </div>
  );
}


