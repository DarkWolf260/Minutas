'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useTemplates } from '@/hooks/use-templates';
import { parseTemplate } from '@/lib/template-parser';
import { Save, HelpCircle, X, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateTemplateSyntax } from '@/lib/validators';
import { ReportForm, ReportFormRef } from '@/components/report/report-form';
import type { Template, TemplateConfig, StatisticRule } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TemplateBuilderProps {
    onOpenInfoDialog: () => void;
    initialTemplate?: Template | null;
    onUpdate?: (id: string, updates: Partial<Template>) => void;
    onCancel?: () => void;
}

export function TemplateBuilder({ onOpenInfoDialog, initialTemplate, onUpdate, onCancel }: TemplateBuilderProps) {
    const [templateContent, setTemplateContent] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [statisticsCategory, setStatisticsCategory] = useState('');
    const [statisticsRules, setStatisticsRules] = useState<StatisticRule[]>([]);

    // New state for report preview
    const formRef = useRef<ReportFormRef>(null);
    const [previewReportContent, setPreviewReportContent] = useState('');
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

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

    const { definitions } = useFieldDefinitions();
    const { addTemplate } = useTemplates();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Creates a temporary template object for the preview
    const previewTemplate = useMemo<Template>(() => ({
        id: 'preview',
        name: templateName || 'Vista Previa',
        content: templateContent,
        type: 'normal',
        isActive: true,
        statisticsCategory: statisticsCategory,
        statisticsRules: statisticsRules
    }), [templateContent, templateName, statisticsCategory, statisticsRules]);

    // Creates a temporary config for the preview
    const previewConfig = useMemo<TemplateConfig>(() => {
        const { sections, layout, fieldNames, fieldTypes, templateOptions } = parseTemplate(templateContent);

        // Basic config construction similar to ReportForm's internal logic, 
        // but we rely on ReportForm to do the heavy lifting of merging with definitions.
        // Pass minimal config.
        return {
            sections,
            layout,
            fields: {} // Validation and types will be handled by ReportForm's parser
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
                statisticsRules: statisticsRules
            });
            toast.success('Plantilla actualizada correctamente');
            if (onCancel) onCancel();
        } else {
            const newTemplate: Template = {
                id: `template_${Date.now()}`,
                name: templateName,
                content: templateContent,
                type: 'normal',
                isActive: true,
                statisticsCategory: statisticsCategory.trim() || undefined,
                statisticsRules: statisticsRules
            };
            addTemplate(newTemplate);
            setTemplateName('');
            setTemplateContent('');
            setStatisticsCategory('');
            setStatisticsRules([]);
        }
    };

    const handlePreviewReport = () => {
        if (formRef.current) {
            const content = formRef.current.getRenderedContent();
            setPreviewReportContent(content);
            setIsPreviewDialogOpen(true);
        }
    };

    const globalTags = Object.keys(definitions).map(key => definitions[key]);

    const commonSnippets = [
        { name: 'Sección Simple', value: '["Título de la sección" {Campo1} {Campo2}]' },
        { name: 'Sección Repetible', value: '["Título de la sección"]* {Campo}' },
        { name: 'S. Avanzada', value: '[singular="DATOS DEL LESIONADO" plural="DATOS DE LOS LESIONADOS" sub="Lesionado"]*\n- Nombre: {Nombre}\n- Cédula: {Cédula}\n' },
        { name: 'Separador', value: '[""]' },
        { name: 'Fecha', value: '{Fecha:date}' },
        { name: 'Hora HLV', value: '{Hora:time-hlv}' },
        { name: 'Dropdown', value: '{Motivo:dropdown(Opción A=Valor A|Opción B=Valor B)}' },
        { name: 'Área de Texto', value: '{Observaciones:textarea}' },
    ];

    const parseFieldNames = (content: string) => {
        // Simple regex to extract field names {FieldName} or {FieldName:type}
        const matches = content.match(/\{([a-zA-Z0-9_\u00C0-\u00FF\s]+)(:[^}]+)?\}/g);
        if (!matches) return [];
        return matches.map(m => {
            const clean = m.replace('{', '').replace('}', '');
            return clean.split(':')[0].trim();
        }).filter((v, i, a) => a.indexOf(v) === i); // Unique
    };

    const availableFields = useMemo(() => parseFieldNames(templateContent), [templateContent]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <Card className="flex flex-col h-full border-muted-foreground/20 shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{isEditing ? 'Editar Plantilla' : 'Constructor de Plantilla'}</CardTitle>
                            <CardDescription>
                                {isEditing
                                    ? 'Modifica el contenido de la plantilla.'
                                    : 'Escribe tu plantilla y usa los botones para añadir etiquetas y secciones.'}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {isEditing && (
                                <Button variant="ghost" size="sm" onClick={onCancel} title="Cancelar Edición">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={onOpenInfoDialog}>
                                <HelpCircle className="mr-2 h-4 w-4" />
                                Guía
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 pt-4 overflow-hidden">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                        <Input
                            id="template-name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Ej: Reporte de Accidente Vial"
                            className="font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stats-category">Categoría Estadística Por Defecto</Label>
                        <Input
                            id="stats-category"
                            value={statisticsCategory}
                            onChange={(e) => setStatisticsCategory(e.target.value)}
                            placeholder="Ej: ATENCIONES PREHOSPITALARIAS"
                            title="Categoría por defecto si no se cumplen reglas específicas"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Categoría base. Puedes añadir excepciones abajo.
                        </p>
                    </div>

                    <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-semibold uppercase">Reglas Condicionales</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => setStatisticsRules([...statisticsRules, { fieldId: '', condition: 'equals', value: '', category: '' }])}
                            >
                                <Plus className="h-3 w-3 mr-1" /> Regla
                            </Button>
                        </div>

                        {statisticsRules.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No hay reglas definidas.</p>
                        ) : (
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {statisticsRules.map((rule, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-background p-1 rounded border">
                                        <div className="w-1/4 min-w-[80px]">
                                            <Select
                                                value={rule.fieldId}
                                                onValueChange={(val) => {
                                                    const newRules = [...statisticsRules];
                                                    newRules[idx].fieldId = val;
                                                    setStatisticsRules(newRules);
                                                }}
                                            >
                                                <SelectTrigger className="h-7 text-xs">
                                                    <SelectValue placeholder="Campo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableFields.map(f => (
                                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-[20px] flex justify-center text-xs text-muted-foreground font-bold">=</div>
                                        <Input
                                            className="h-7 text-xs flex-1 min-w-[80px]"
                                            placeholder="Valor (Ej: Atendido)"
                                            value={rule.value}
                                            onChange={(e) => {
                                                const newRules = [...statisticsRules];
                                                newRules[idx].value = e.target.value;
                                                setStatisticsRules(newRules);
                                            }}
                                        />
                                        <div className="w-[15px] flex justify-center text-xs text-muted-foreground">→</div>
                                        <Input
                                            className="h-7 text-xs flex-1 min-w-[100px]"
                                            placeholder="Categoría Resultado"
                                            value={rule.category}
                                            onChange={(e) => {
                                                const newRules = [...statisticsRules];
                                                newRules[idx].category = e.target.value;
                                                setStatisticsRules(newRules);
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                setStatisticsRules(statisticsRules.filter((_, i) => i !== idx));
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Etiquetas Globales</Label>
                        <ScrollArea className="h-12 w-full whitespace-nowrap">
                            <div className="flex w-max space-x-2 pb-2">
                                {globalTags.map(tag => (
                                    <Button key={tag.label} size="sm" variant="secondary" className="h-7 text-xs" onClick={() => insertText(`{${tag.label}}`)}>
                                        {tag.label}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Fragmentos Útiles</Label>
                        <div className="flex flex-wrap gap-2">
                            {commonSnippets.map(snippet => (
                                <Button key={snippet.name} size="sm" variant="outline" className="h-7 text-xs bg-background" onClick={() => insertText(snippet.value)}>
                                    {snippet.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 relative rounded-md border shadow-sm">
                        <Textarea
                            ref={textareaRef}
                            value={templateContent}
                            onChange={(e) => setTemplateContent(e.target.value)}
                            className="absolute inset-0 h-full w-full font-mono text-sm leading-relaxed resize-none p-4 border-0 focus-visible:ring-0"
                            placeholder="Escribe aquí tu plantilla. Ejemplo: Siendo las {Hora}, se reporta novedad..."
                        />
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex gap-2">
                            {isEditing && (
                                <Button variant="outline" className="flex-1" onClick={onCancel}>
                                    Cancelar
                                </Button>
                            )}
                            <Button onClick={handleSave} className="flex-1">
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? 'Actualizar Plantilla' : 'Guardar Nueva Plantilla'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col h-full border-muted-foreground/20 shadow-md bg-muted/10">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Vista Previa en Vivo</CardTitle>
                            <CardDescription>Así se verá exactamente el formulario para el usuario.</CardDescription>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handlePreviewReport}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Reporte Generado
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto p-4 sm:p-6">
                        <div className="max-w-3xl mx-auto pointer-events-none opacity-90 select-none">
                            {/* Pointer events none effectively makes it read-only/preview-only implicitly, 
                                though we might want to let them click to see dropdowns work etc. 
                                Let's remove pointer-events-none to allow interaction testing. */}
                            <div className="pointer-events-auto opacity-100">
                                <ReportForm
                                    ref={formRef}
                                    template={previewTemplate}
                                    config={previewConfig}
                                    onSubmit={() => { }} // No-op
                                    disabled={false} // Enable interaction
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Vista Previa del Reporte Final</DialogTitle>
                        <DialogDescription>
                            Esta es una simulación de cómo se verá el texto generado basado en los datos actuales del formulario de prueba.
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
