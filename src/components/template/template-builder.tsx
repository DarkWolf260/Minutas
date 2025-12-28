
'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useTemplates } from '@/hooks/use-templates';
import { parseTemplate } from '@/lib/template-parser';
import { cn } from '@/lib/utils';
import { Save, HelpCircle, AlertTriangle } from 'lucide-react';
import type { SnippetOption, SectionConfig } from '@/types';
import { toast } from 'sonner';
import { validateTemplateSyntax } from '@/lib/validators';

const PreviewFieldEditor = ({ fieldId, config }: { fieldId: string, config: any }) => {
    const typeDisplay: Record<string, string> = {
        'text': 'Texto',
        'textarea': 'Área de Texto',
        'date': 'Fecha',
        'predefined': 'Predefinido',
        'time-hlv': 'Hora (HLV)',
        'multi-text': 'Texto Múltiple',
        'dropdown': 'Dropdown',
    };

    const displayType = typeDisplay[config.type] || 'Texto';
    const hasOptions = config.type === 'dropdown' && Array.isArray(config.snippetOptions) && config.snippetOptions.length > 0;

    return (
        <Card className="p-0 bg-muted/50 overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-3">
                <Label className="font-mono text-sm font-semibold flex-grow truncate" title={fieldId}>
                    {config.label || fieldId}
                </Label>
                <Badge variant="outline">{displayType}</Badge>
            </div>
            {hasOptions && (
                <div className="border-t border-border px-3 pb-3 pt-2 space-y-1">
                    {config.snippetOptions?.map((opt: SnippetOption) => (
                        <div key={opt.id} className="text-xs text-muted-foreground p-1.5 rounded-sm bg-background grid grid-cols-2 items-start gap-2">
                            <p className="font-medium text-foreground/80 break-words">{opt.label}</p>
                            <p className="italic text-right break-words">"{opt.value}"</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

function FormPreview({ layout, sections, fields }: { layout: string[], sections: SectionConfig[], fields: any }) {
    if (layout.length === 0) {
        return (
            <div className="flex h-full items-center justify-center min-h-[200px] border-2 border-dashed rounded-lg p-4">
                <p className="text-muted-foreground text-center">La vista previa del formulario aparecerá aquí.</p>
            </div>
        );
    }

    const sectionsById = useMemo(() => sections.reduce((acc, section) => {
        acc[section.id] = section;
        return acc;
    }, {} as Record<string, SectionConfig>), [sections]);

    const addedTopLevelFields = new Set<string>();

    return (
        <div className="space-y-4 p-1 rounded-md bg-muted/30">
            {layout.map((itemId, index) => {
                if (itemId.startsWith('section_')) {
                    const section = sectionsById[itemId];
                    if (!section) return null;
                    return (
                        <Card key={section.id} className={cn("bg-background overflow-hidden shadow-sm", section.condition && "border-primary/50")}>
                            <CardHeader className="p-4 bg-muted/60">
                                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                                    {section.label}
                                    {section.isRepeatable && <Badge variant="outline">Repetible</Badge>}
                                    {section.condition && <Badge variant="secondary">Condicional</Badge>}
                                </CardTitle>
                                {section.condition && (
                                    <CardDescription className="pt-1 !mt-1 text-xs">
                                        Se muestra si '{section.condition.fieldId}' es '{section.condition.value}'
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                {section.fieldIds.map((fieldId: string) => {
                                    const fieldConfig = fields[fieldId];
                                    if (!fieldConfig) return null;
                                    return <PreviewFieldEditor key={fieldId} fieldId={fieldId} config={fieldConfig} />;
                                })}
                                {section.fieldIds.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">Esta sección no tiene campos.</p>}
                            </CardContent>
                        </Card>
                    );
                } else if (itemId === 'section_separator') {
                    return <div key={`sep-${index}`} className="h-px bg-foreground/20 my-4" />;
                }
                else {
                    const fieldId = itemId;
                    const fieldConfig = fields[fieldId];
                    const isAssigned = sections.some(s => s.fieldIds.includes(fieldId));
                    if (!fieldConfig || isAssigned || addedTopLevelFields.has(fieldId)) return null;

                    addedTopLevelFields.add(fieldId);

                    return <PreviewFieldEditor key={fieldId} fieldId={fieldId} config={fieldConfig} />;
                }
            })}
        </div>
    );
}

export function TemplateBuilder({ onOpenInfoDialog }: { onOpenInfoDialog: () => void }) {
    const [templateContent, setTemplateContent] = useState('');
    const [templateName, setTemplateName] = useState('');

    const { definitions } = useFieldDefinitions();
    const { addTemplate } = useTemplates();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const parsedResult = useMemo(() => parseTemplate(templateContent), [templateContent]);
    const { sections, layout, fieldNames, fieldTypes, templateOptions } = parsedResult;

    // Create mock field configs for preview
    const fieldsForPreview = useMemo(() => {
        const result: Record<string, any> = {};
        fieldNames.forEach(name => {
            const globalDef = definitions[name];
            const typeFromTemplate = fieldTypes.get(name);

            result[name] = {
                label: name,
                type: typeFromTemplate || globalDef?.type || 'text',
                snippetOptions: templateOptions.get(name) || [],
            };
        });
        return result;
    }, [fieldNames, fieldTypes, templateOptions, definitions]);

    const insertText = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;

        const newText = `${currentText.substring(0, start)}${text}${currentText.substring(end)}`;
        setTemplateContent(newText);

        // This makes sure the state update is processed before we focus and set cursor
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

        const newTemplate = {
            id: `template_${Date.now()}`,
            name: templateName,
            content: templateContent,
            type: 'normal' as 'normal',
            isActive: true,
        };

        addTemplate(newTemplate);
        // addTemplate ya muestra un toast de éxito, así que solo limpiamos
        setTemplateName('');
        setTemplateContent('');
    };

    const globalTags = Object.keys(definitions).map(key => definitions[key]);

    const commonSnippets = [
        { name: 'Sección Simple', value: '["Título de la sección" {Campo1} {Campo2}]' },
        { name: 'Sección Repetible', value: '["Título de la sección"]* {Campo}' },
        { name: 'Sección Avanzada', value: '[singular="DATOS DEL LESIONADO" plural="DATOS DE LOS LESIONADOS" sub="Lesionado"]*\n- Nombre: {Nombre}\n- Cédula: {Cédula}\n' },
        { name: 'Separador', value: '[""]' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Constructor de Plantilla</CardTitle>
                            <CardDescription>Escribe tu plantilla y usa los botones para añadir etiquetas y secciones.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={onOpenInfoDialog}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Guía de Sintaxis
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label>Etiquetas Globales</Label>
                        <div className="flex flex-wrap gap-1">
                            {globalTags.map(tag => (
                                <Button key={tag.label} size="sm" variant="outline" onClick={() => insertText(`{${tag.label}}`)}>
                                    {tag.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Fragmentos Comunes</Label>
                        <div className="flex flex-wrap gap-1">
                            {commonSnippets.map(snippet => (
                                <Button key={snippet.name} size="sm" variant="outline" onClick={() => insertText(snippet.value)}>
                                    {snippet.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Textarea
                        ref={textareaRef}
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        className="flex-1 font-mono text-sm leading-relaxed"
                        placeholder="Escribe aquí tu plantilla. Ejemplo: Siendo las {Hora}, se reporta novedad..."

                    />
                    <div className="flex items-end gap-2 pt-4 border-t">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="template-name">Nombre de la Nueva Plantilla</Label>
                            <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ej: Reporte de Accidente Vial" />
                        </div>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" /> Guardar Plantilla
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Vista Previa del Formulario</CardTitle>
                    <CardDescription>Así se verá el formulario generado a partir de tu plantilla.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <ScrollArea className="h-full pr-4">
                        <FormPreview layout={layout} sections={sections} fields={fieldsForPreview} />
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
