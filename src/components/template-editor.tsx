
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
}: {
    fieldId: string;
    fieldConfig: FieldConfig;
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
    const displayType = typeDisplay[finalType] || 'Texto';
    const hasOptions = finalType === 'dropdown' && Array.isArray(fieldConfig.snippetOptions) && fieldConfig.snippetOptions.length > 0;

    return (
        <Card className="bg-muted/50">
            <div className="flex items-center justify-between gap-4 p-3">
                <Label className="font-mono text-sm font-semibold flex-grow truncate" title={fieldId}>
                    {fieldConfig.label || fieldId}
                </Label>
                <Badge variant="outline">{displayType}</Badge>
            </div>
            {hasOptions && (
                 <div className="border-t border-border px-3 pb-3 pt-2 space-y-1">
                    {fieldConfig.snippetOptions?.map(opt => (
                        <div key={opt.id} className="text-xs text-muted-foreground p-1.5 rounded-sm bg-background grid grid-cols-2 items-start gap-2">
                           <p className="font-medium text-foreground/80 break-words">{opt.label}</p>
                           <p className="italic text-right break-words">"{opt.value}"</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
});


export function TemplateEditor({ template, config, onConfigChange, onTemplateChange }: {template: Template, config: TemplateConfig, onConfigChange: (config: TemplateConfig) => void, onTemplateChange: (template: Template) => void}) {
    const { definitions } = useFieldDefinitions();
    const [localTemplate, setLocalTemplate] = useState<Template>(template);
    const [localConfig, setLocalConfig] = useState<TemplateConfig>(() => JSON.parse(JSON.stringify({ ...initialConfig, ...(config || {}) })));
    const [optionsDefinedInTemplate, setOptionsDefinedInTemplate] = useState(new Map<string, boolean>());
    const [hasChanges, setHasChanges] = useState(false);
    
    useEffect(() => {
        setLocalTemplate(template);
        const { sections, layout, fieldNames, fieldTypes, templateOptions } = parseTemplate(template.content);

        const newConfig: TemplateConfig = {
            fields: {},
            sections,
            layout
        };
        
        let timeHlvFieldInConfig: string | null = null;
        
        const existingConfigFields = config?.fields || {};
        if (config && config.fields) {
            timeHlvFieldInConfig = Object.keys(config.fields).find(k => config.fields[k]?.type === 'time-hlv') || null;
        }

        fieldNames.forEach(fieldId => {
            const oldFieldConfig = existingConfigFields[fieldId];
            const globalDef = definitions[fieldId];
            const typeFromTemplate = fieldTypes.get(fieldId);
            
            newConfig.fields[fieldId] = { ...(globalDef || { type: 'text', label: fieldId }), ...(oldFieldConfig || {}) };
            newConfig.fields[fieldId].label = fieldId;
            
            if (templateOptions.has(fieldId)) {
                newConfig.fields[fieldId].snippetOptions = templateOptions.get(fieldId);
            }

            if (typeFromTemplate) {
                newConfig.fields[fieldId].type = typeFromTemplate;
            } else if (fieldId.toLowerCase() === 'fecha') {
                newConfig.fields[fieldId].type = 'date';
            } else if (fieldId.toLowerCase() === 'hora') {
                if (!timeHlvFieldInConfig) {
                    newConfig.fields[fieldId].type = 'time-hlv';
                    timeHlvFieldInConfig = fieldId;
                } else if (timeHlvFieldInConfig !== fieldId && newConfig.fields[fieldId].type === 'time-hlv') {
                    newConfig.fields[fieldId].type = 'text';
                }
            }
        });
        
        setOptionsDefinedInTemplate(new Map(Array.from(templateOptions.keys()).map(k => [k, true])));
        setLocalConfig(newConfig);
        setHasChanges(false);
    }, [template, config, definitions]);

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
                            {(localConfig.layout || []).map((itemId, index) => {
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
                                                {section.fieldIds.map((fieldId) => {
                                                    const fieldConfig = localConfig.fields[fieldId];
                                                    if (!fieldConfig) return null;
                                                    const globalDefinition = definitions[fieldId];
                                                    const finalType = fieldConfig.type || globalDefinition?.type || 'text';

                                                    return (
                                                        <React.Fragment key={fieldId}>
                                                            <FieldEditor
                                                                fieldId={fieldId}
                                                                fieldConfig={fieldConfig}
                                                            />
                                                            {finalType === 'dropdown' && (
                                                                <>
                                                                    <TargetFieldEditor
                                                                        fieldId={fieldId}
                                                                        config={fieldConfig}
                                                                        allFields={localConfig.fields}
                                                                        onConfigChange={handleFieldChange}
                                                                        siblingFieldIds={section.fieldIds}
                                                                    />
                                                                    {!optionsDefinedInTemplate.get(fieldId) && (
                                                                        <SnippetOptionEditor
                                                                            config={fieldConfig}
                                                                            onUpdate={(newConfig) => handleFieldChange(fieldId, newConfig)}
                                                                        />
                                                                    )}
                                                                </>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {section.fieldIds.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">Esta sección no tiene campos definidos en la plantilla.</p>}
                                            </CardContent>
                                        </Card>
                                    );
                                } else if (itemId === 'section_separator') {
                                    return <div key={`sep-${index}`} className="h-px bg-foreground/20 my-4" />;
                                }
                                else {
                                    const fieldId = itemId;
                                    const fieldConfig = localConfig.fields[fieldId];
                                    if (!fieldConfig || fieldConfig.type === 'predefined') return null;
                                    
                                    const isAssigned = (localConfig.sections || []).some(s => s.fieldIds.includes(fieldId));
                                    if (isAssigned || addedTopLevelFields.has(fieldId)) return null;

                                    addedTopLevelFields.add(fieldId);

                                    const globalDefinition = definitions[fieldId];
                                    const finalType = fieldConfig.type || globalDefinition?.type || 'text';
                                    
                                    return (
                                        <React.Fragment key={fieldId}>
                                            <FieldEditor
                                                fieldId={fieldId}
                                                fieldConfig={fieldConfig}
                                            />
                                            {finalType === 'dropdown' && (
                                                <>
                                                    <TargetFieldEditor
                                                        fieldId={fieldId}
                                                        config={fieldConfig}
                                                        allFields={localConfig.fields}
                                                        onConfigChange={handleFieldChange}
                                                        siblingFieldIds={Array.from(addedTopLevelFields)}
                                                    />
                                                    {!optionsDefinedInTemplate.get(fieldId) && (
                                                        <SnippetOptionEditor
                                                            config={fieldConfig}
                                                            onUpdate={(newConfig) => handleFieldChange(fieldId, newConfig)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </React.Fragment>
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
