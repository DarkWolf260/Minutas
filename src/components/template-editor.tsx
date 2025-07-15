
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Template, TemplateConfig, FieldConfig, SectionConfig, FieldType, SnippetOption } from '@/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseTemplate } from '@/lib/template-parser';
import { Textarea } from './ui/textarea';
import { SnippetOptionEditor } from './snippet-option-editor';
import { Badge } from '@/components/ui/badge';

const initialConfig: TemplateConfig = {
    fields: {},
    sections: [],
    layout: [],
};

const TargetFieldEditor = ({
    fieldId,
    config,
    allFields,
    onConfigChange,
    siblingFieldIds
}: {
    fieldId: string;
    config: FieldConfig;
    allFields: Record<string, FieldConfig>;
    onConfigChange: (fieldId: string, newConfig: Partial<FieldConfig>) => void;
    siblingFieldIds: string[];
}) => {
    const textareaFields = useMemo(() => {
        return siblingFieldIds
            .filter(id => allFields[id]?.type === 'textarea' && id !== fieldId);
    }, [siblingFieldIds, allFields, fieldId]);

    const handleTargetChange = (newTarget: string) => {
        onConfigChange(fieldId, { targetField: newTarget });
    };

    return (
        <div className="p-3 pl-10 border-l-2 ml-4 mt-2 border-dashed bg-muted/30 rounded-r-md space-y-2">
            <div className="space-y-2">
                <Label>Campo de Destino del Texto</Label>
                <Select value={config.targetField} onValueChange={handleTargetChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un campo..." /></SelectTrigger>
                    <SelectContent>
                        {textareaFields.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Elige el campo (debe ser Área de Texto y estar en la misma sección) donde se insertará el texto.</p>
            </div>
        </div>
    );
}

const FieldEditor = React.memo(function FieldEditor({
    fieldId,
    fieldConfig,
    allFields,
    onConfigChange,
    siblingFieldIds,
    optionsDefinedInTemplate
}: {
    fieldId: string;
    fieldConfig: FieldConfig;
    allFields: Record<string, FieldConfig>;
    onConfigChange: (fieldId: string, newConfig: Partial<FieldConfig>) => void;
    siblingFieldIds: string[];
    optionsDefinedInTemplate: boolean;
}) {
    const { definitions } = useFieldDefinitions();

    const typeDisplay: Record<string, string> = {
        'text': 'Texto',
        'textarea': 'Área de Texto',
        'date': 'Fecha',
        'predefined': 'Predefinido',
        'time-hlv': 'Hora (HLV)',
        'multi-text': 'Texto Múltiple',
        'dropdown': 'Dropdown',
    };

    const globalDefinition = definitions[fieldId];
    const finalType = fieldConfig.type || globalDefinition?.type || 'text';
    const isTypeDefinedInTemplate = !!parseTemplate(`{${fieldId}:${finalType}}`).fieldTypes.get(fieldId);

    return (
        <Card className="bg-muted/50">
            <div className="flex items-center justify-between gap-4 p-3">
                <Label className="font-mono text-sm font-semibold flex-grow truncate" title={fieldId}>
                    {fieldConfig.label || fieldId}
                </Label>
                 <Select
                    value={finalType}
                    onValueChange={(value) => onConfigChange(fieldId, { type: value as FieldType })}
                    disabled={isTypeDefinedInTemplate}
                >
                    <SelectTrigger className="w-[150px] bg-background h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Área de Texto</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="time-hlv">Hora (HLV)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             {finalType === 'dropdown' && (
                <>
                    <TargetFieldEditor
                        fieldId={fieldId}
                        config={fieldConfig}
                        allFields={allFields}
                        onConfigChange={onConfigChange}
                        siblingFieldIds={siblingFieldIds}
                    />
                    {!optionsDefinedInTemplate && (
                        <SnippetOptionEditor
                            config={fieldConfig}
                            onUpdate={(newConfig) => onConfigChange(fieldId, newConfig)}
                        />
                    )}
                </>
            )}
        </Card>
    );
});


export function TemplateEditor({ template, config, onConfigChange, onTemplateChange }: {template: Template, config: TemplateConfig, onConfigChange: (config: TemplateConfig) => void, onTemplateChange: (template: Template) => void}) {
    const [localTemplate, setLocalTemplate] = useState<Template>(template);
    const [localConfig, setLocalConfig] = useState<TemplateConfig>(() => JSON.parse(JSON.stringify({ ...initialConfig, ...(config || {}) })));
    const [optionsDefinedInTemplate, setOptionsDefinedInTemplate] = useState(new Map<string, boolean>());
    const [hasChanges, setHasChanges] = useState(false);
    
    useEffect(() => {
        setLocalTemplate(template);
        setLocalConfig(config);
        
        const { templateOptions } = parseTemplate(template.content);
        setOptionsDefinedInTemplate(new Map(Array.from(templateOptions.keys()).map(k => [k, true])));
        
        setHasChanges(false);
    }, [template, config]);

    const handleSaveChanges = () => {
        onConfigChange(localConfig);
        onTemplateChange(localTemplate);
        setHasChanges(false);
    };

    const handleFieldChange = useCallback((fieldId: string, newConfig: Partial<FieldConfig>) => {
        setLocalConfig(prev => {
            const updatedFields = { ...prev.fields };
            
            updatedFields[fieldId] = { ...(updatedFields[fieldId] || { label: fieldId }), ...newConfig };

            if (newConfig.type === 'time-hlv') {
                Object.keys(updatedFields).forEach(fId => {
                    if (fId !== fieldId && updatedFields[fId].type === 'time-hlv') {
                        updatedFields[fId].type = 'text';
                    }
                });
            }

            return { ...prev, fields: updatedFields };
        });
        setHasChanges(true);
    }, []);
    
    const sectionsById = useMemo(() => 
        (localConfig.sections || []).reduce((acc, section) => {
            acc[section.id] = section;
            return acc;
        }, {} as Record<string, SectionConfig>),
    [localConfig.sections]);

    const addedTopLevelFields = useMemo(() => new Set<string>(), []);

    return (
        <Card className="h-full flex flex-col shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Editor de Plantilla: {localTemplate.name}</CardTitle>
                    <CardDescription>Configura los tipos de campo. La estructura se define en el archivo .txt.</CardDescription>
                </div>
                <Button onClick={handleSaveChanges} disabled={!hasChanges}>
                   {hasChanges ? 'Guardar Cambios' : 'Guardado'}
                </Button>
            </CardHeader>
            <ScrollArea className="flex-1 w-full">
                <CardContent className="pt-2">
                     <div className="space-y-2 mb-6">
                        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                        <Input id="template-name" value={localTemplate.name} onChange={(e) => { setLocalTemplate(p => ({...p, name: e.target.value})); setHasChanges(true); }} />
                    </div>
                    
                    <div className="border-t pt-6">
                         <h3 className="font-semibold text-lg mb-4">Estructura del Formulario</h3>
                         
                         <div className="space-y-4 p-1 rounded-md bg-muted/30">
                            {(localConfig.layout || []).map((itemId) => {
                                if (itemId.startsWith('section_')) {
                                    const section = sectionsById[itemId];
                                    if (!section) return null;
                                    return (
                                        <Card key={section.id} className="bg-background overflow-hidden shadow-sm">
                                            <CardHeader className="p-4 bg-muted/60">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {section.label}
                                                    {section.isRepeatable && <Badge variant="outline">Repetible</Badge>}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-2">
                                                {section.layout?.map(fieldId => {
                                                    const fieldConfig = localConfig.fields[fieldId];
                                                    if (!fieldConfig) return null;
                                                    
                                                    return (
                                                         <FieldEditor
                                                            key={fieldId}
                                                            fieldId={fieldId}
                                                            fieldConfig={fieldConfig}
                                                            allFields={localConfig.fields}
                                                            onConfigChange={handleFieldChange}
                                                            siblingFieldIds={section.fieldIds}
                                                            optionsDefinedInTemplate={optionsDefinedInTemplate.get(fieldId) || false}
                                                        />
                                                    )
                                                })}
                                                {section.fieldIds.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">Esta sección no tiene campos definidos en la plantilla.</p>}
                                            </CardContent>
                                        </Card>
                                    );
                                } else if (itemId === 'section_separator') {
                                    return <div key={itemId} className="h-px bg-foreground/20 my-4" />;
                                }
                                else {
                                    const fieldId = itemId;
                                    const fieldConfig = localConfig.fields[fieldId];
                                    if (!fieldConfig || fieldConfig.type === 'predefined') return null;
                                    
                                    addedTopLevelFields.add(fieldId);
                                    
                                    return (
                                         <FieldEditor
                                            key={fieldId}
                                            fieldId={fieldId}
                                            fieldConfig={fieldConfig}
                                            allFields={localConfig.fields}
                                            onConfigChange={handleFieldChange}
                                            siblingFieldIds={Array.from(addedTopLevelFields)}
                                            optionsDefinedInTemplate={optionsDefinedInTemplate.get(fieldId) || false}
                                        />
                                    );
                                }
                            })}
                            {(localConfig.layout || []).length === 0 && (
                                <div className="text-center p-6 border-2 border-dashed rounded-md">
                                    <p className="text-muted-foreground">No se detectaron campos o secciones en la plantilla.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Verifica la sintaxis <code>{`{campo}`}</code> o <code>["Sección"...]</code> en tu archivo.</p>
                                </div>
                            )}
                            </div>
                    </div>
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
