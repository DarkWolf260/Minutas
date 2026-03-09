'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

import { parseTemplate } from '@/lib/template-parser';
import { Save, HelpCircle, X, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateTemplateSyntax } from '@/lib/validators';
import { ReportForm, ReportFormRef } from '@/components/report/report-form';
import type { Template, TemplateConfig, StatisticRule } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils/id';

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
  const [statisticsCategory, setStatisticsCategory] = useState('');
  const [statisticsRules, setStatisticsRules] = useState<StatisticRule[]>([]);

  // New state for report preview
  const formRef = useRef<ReportFormRef>(null);
  const [previewReportContent, setPreviewReportContent] = useState('');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Si estamos editando, usamos el ID de la plantilla original
  const isEditing = !!initialTemplate;

  useEffect(() => {
    if (initialTemplate) {
      setTemplateContent(initialTemplate.content);
      setTemplateName(initialTemplate.name);
      setStatisticsCategory(initialTemplate.statisticsCategory || '');
      setStatisticsRules(initialTemplate.statisticsRules || []);
    } else {
      setTemplateContent('');
      setTemplateName('');
      setStatisticsCategory('');
      setStatisticsRules([]);
    }
  }, [initialTemplate]);

  // State for UI toggles
  const [showRules, setShowRules] = useState(false);

  const { definitions } = useFieldDefinitions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Creates a temporary template object for the preview
  const previewTemplate = useMemo<Template>(
    () => ({
      id: 'preview',
      name: templateName || 'Vista Previa',
      content: templateContent,
      type: 'normal',
      isActive: true,
      statisticsCategory: statisticsCategory,
      statisticsRules: statisticsRules,
    }),
    [templateContent, templateName, statisticsCategory, statisticsRules]
  );

  // Creates a temporary config for the preview
  const previewConfig = useMemo<TemplateConfig>(() => {
    const { sections, layout, defaultValues } = parseTemplate(templateContent);

    // Populate preview config fields with default values
    const fields: Record<string, any> = {};
    if (defaultValues) {
      defaultValues.forEach((value, key) => {
        fields[key] = { defaultValue: value };
      });
    }

    return {
      sections,
      layout,
      fields,
    };
  }, [templateContent]);

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const newText = `${currentText.substring(0, start)}${text}${currentText.substring(end)}`;
    setTemplateContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

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
        statisticsCategory: statisticsCategory.trim() || undefined,
        statisticsRules: statisticsRules,
      });
      toast.success('Plantilla actualizada correctamente');
      if (onCancel) onCancel();
    } else if (onAdd) {
      const newTemplate: Template = {
        id: generateId('template'),
        name: templateName,
        content: templateContent,
        type: 'normal',
        isActive: true,
        statisticsCategory: statisticsCategory.trim() || undefined,
        statisticsRules: statisticsRules,
      };
      onAdd(newTemplate);
      setTemplateName('');
      setTemplateContent('');
      setStatisticsCategory('');
      setStatisticsRules([]);
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

  const globalTags = Object.keys(definitions).map((key) => definitions[key]);

  const commonSnippets = [
    { name: 'Sección', value: '["Título" {Campo}]' },
    { name: 'S. Repet', value: '["Título"]* {Campo}' },
    { name: 'S. Cond', value: '[?Campo=Val]\n["Título"]\n{Campo}\n[/]\n' },
    { name: 'Fecha', value: '{Fecha}' },
    { name: 'Hora', value: '{Hora}' },
    { name: 'Lista', value: '{Campo:dropdown(A=1|B=2)}' },
  ];

  const parseFieldNames = (content: string) => {
    const matches = content.match(/\{([a-zA-Z0-9_\u00C0-\u00FF\s]+)(:[^}]+)?\}/g);
    if (!matches) return [];
    return matches
      .map((m) => {
        const clean = m.replace('{', '').replace('}', '');
        return (clean.split(':')[0] || '').trim();
      })
      .filter((v, i, a) => a.indexOf(v) === i);
  };

  const availableFields = useMemo(() => parseFieldNames(templateContent), [templateContent]);

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
              {/* Compact Header Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="template-name" className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">
                    Nombre
                  </Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Nombre de la plantilla"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="stats-category" className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">
                    Categoría Estadística (Defecto)
                  </Label>
                  <Input
                    id="stats-category"
                    value={statisticsCategory}
                    onChange={(e) => setStatisticsCategory(e.target.value)}
                    placeholder="Ej: SIN NOVEDAD"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Collapsible Rules Section */}
              <div className="border rounded-md bg-muted/20">
                <button
                  type="button"
                  onClick={() => setShowRules(!showRules)}
                  className="w-full flex items-center justify-between p-2 text-xs font-semibold hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      Reglas Condicionales{' '}
                      {statisticsRules.length > 0 && `(${statisticsRules.length})`}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {showRules ? 'Ocultar' : 'Mostrar/Editar'}
                  </div>
                </button>

                {showRules && (
                  <div className="p-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Reglas automáticas basadas en valores de campos.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() =>
                          setStatisticsRules([
                            ...statisticsRules,
                            { fieldId: '', condition: '', category: '' },
                          ])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Nueva Regla
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {statisticsRules.length === 0 && (
                        <p className="text-xs text-center text-muted-foreground py-2">Sin reglas.</p>
                      )}
                      {statisticsRules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex gap-1 items-center bg-background p-1.5 rounded border"
                        >
                          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-1 items-center flex-1 min-w-0">
                            <Select
                              value={rule.fieldId}
                              onValueChange={(val) => {
                                setStatisticsRules(prev => prev.map((r, i) =>
                                  i === idx ? { ...r, fieldId: val } : r
                                ));
                              }}
                            >
                              <SelectTrigger className="h-7 text-[10px] sm:text-xs">
                                <SelectValue placeholder="Campo" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFields.map((f) => (
                                  <SelectItem key={f} value={f}>
                                    {f}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold">=</span>
                              <Input
                                className="h-7 text-[10px] sm:text-xs min-w-0 flex-1"
                                placeholder="Valor"
                                value={rule.condition}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStatisticsRules(prev => prev.map((r, i) =>
                                    i === idx ? { ...r, condition: val } : r
                                  ));
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1 col-span-2 sm:flex-1">
                              <span className="text-[10px]">→</span>
                              <Input
                                className="h-7 text-[10px] sm:text-xs min-w-0 flex-1"
                                placeholder="Categoría"
                                value={rule.category}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStatisticsRules(prev => prev.map((r, i) =>
                                    i === idx ? { ...r, category: val } : r
                                  ));
                                }}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() =>
                              setStatisticsRules(statisticsRules.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unified Toolbar - Sticky above editor */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-muted/30 rounded-md border text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="hidden sm:inline font-semibold text-muted-foreground ml-1 shrink-0">Insertar:</span>
                <Select onValueChange={(val) => insertText(`{${val}}`)}>
                  <SelectTrigger className="h-8 sm:h-7 text-xs flex-1 sm:w-[130px] bg-background border-dashed">
                    <SelectValue placeholder="Etiqueta Global" />
                  </SelectTrigger>
                  <SelectContent>
                    {globalTags.map((tag, i) => (
                      <SelectItem key={tag?.label || i} value={tag?.label || ''}>
                        {tag?.label || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:block w-px h-4 bg-border mx-1" />

              <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex items-center gap-1 pb-0.5">
                  {commonSnippets.map((snippet) => (
                    <Button
                      key={snippet.name}
                      size="sm"
                      variant="ghost"
                      className="h-8 sm:h-7 px-2.5 text-xs bg-background/50 sm:bg-transparent hover:bg-background border border-transparent hover:border-border whitespace-nowrap shrink-0"
                      onClick={() => insertText(snippet.value)}
                      title={`Insertar: ${snippet.value}`}
                    >
                      {snippet.name}
                    </Button>
                  ))}
                </div>
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
        <Card
          className={cn(
            'flex flex-col h-full border-muted-foreground/20 shadow-md bg-muted/10',
            mobileView !== 'preview' && 'hidden lg:flex'
          )}
        >
          <CardHeader className="bg-muted/30 py-3 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Vista Previa</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreviewReport}
                className="h-8 text-xs"
              >
                <FileText className="mr-2 h-3 w-3" />
                Generar Texto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <div className="absolute inset-0 overflow-auto p-4">
              <div className="max-w-3xl mx-auto">
                <ReportForm
                  ref={formRef}
                  template={previewTemplate}
                  config={previewConfig}
                  onSubmit={() => { }}
                  disabled={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Preview & Actions Button (Floating) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button
          onClick={handlePreviewReport}
          className="shadow-xl rounded-full h-12 w-12 bg-primary text-primary-foreground hover:scale-105 transition-transform"
          size="icon"
          title="Ver Vista Previa del Reporte"
        >
          <FileText className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleSave}
          className="shadow-xl rounded-full h-12 w-12 bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform"
          size="icon"
          title="Guardar Plantilla"
        >
          <Save className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Vista Previa del Reporte</DialogTitle>
            <DialogDescription>
              Esta es una representación de cómo se verá el reporte final con el contenido actual.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/20 p-4 rounded-md border mt-2">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {previewReportContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
