
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Template, TemplateConfig, FieldConfig, SectionConfig, FieldType } from '@/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseTemplate } from '@/lib/template-parser';

const initialConfig: TemplateConfig = {
    fields: {},
    sections: [],
    layout: [],
};

const FieldEditor = React.memo(function FieldEditor({
    fieldId,
    fieldConfig,
    isPredefined,
    onFieldChange,
    isTimeHlvDisabled,
}: {
    fieldId: string;
    fieldConfig: FieldConfig;
    isPredefined: boolean;
    onFieldChange: (fieldId: string, newConfig: Partial<FieldConfig>) => void;
    isTimeHlvDisabled?: boolean;
}) {
    const handleTypeChange = (value: FieldType) => {
        onFieldChange(fieldId, { type: value });
    };

    return (
        <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between gap-4">
                <Label className="font-mono text-sm font-semibold flex-grow truncate" title={fieldId}>
                    {fieldConfig.label || fieldId}
                </Label>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                     <Select
                        value={fieldConfig.type || 'text'}
                        onValueChange={handleTypeChange}
                        disabled={isPredefined}
                    >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="textarea">Área de Texto</SelectItem>
                            <SelectItem value="date">Fecha</SelectItem>
                            {fieldConfig.type === 'time-hlv' || !isTimeHlvDisabled ? (
                                <SelectItem value="time-hlv">Hora (HLV)</SelectItem>
                            ) : null}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
});


export function TemplateEditor({ template, config, onConfigChange, onTemplateChange }: {template: Template, config: TemplateConfig, onConfigChange: (config: TemplateConfig) => void, onTemplateChange: (template: Template) => void}) {
    const { definitions } = useFieldDefinitions();
    const [localTemplate, setLocalTemplate] = useState<Template>(template);
    const [localConfig, setLocalConfig] = useState<TemplateConfig>(() => JSON.parse(JSON.stringify({ ...initialConfig, ...(config || {}) })));
    const [hasChanges, setHasChanges] = useState(false);
    
    useEffect(() => {
        setLocalTemplate(template);
        const { sections, layout, fieldNames } = parseTemplate(template.content);

        const newConfig: TemplateConfig = {
            fields: {},
            sections,
            layout
        };
        
        let timeHlvFieldInConfig: string | null = null;
        
        if (config && config.fields) {
            timeHlvFieldInConfig = Object.keys(config.fields).find(k => config.fields[k]?.type === 'time-hlv') || null;
        }

        fieldNames.forEach(fieldId => {
            const oldFieldConfig = (config?.fields || {})[fieldId];
            
            newConfig.fields[fieldId] = oldFieldConfig ? { ...oldFieldConfig } : { type: 'text', label: fieldId };
            newConfig.fields[fieldId].label = fieldId;

            if (definitions[fieldId]) {
                newConfig.fields[fieldId].type = definitions[fieldId].type;
            } 
            else if (fieldId.toLowerCase() === 'fecha') {
                newConfig.fields[fieldId].type = 'date';
            }
            else if (fieldId.toLowerCase() === 'hora') {
                if (!timeHlvFieldInConfig) {
                    newConfig.fields[fieldId].type = 'time-hlv';
                    timeHlvFieldInConfig = fieldId;
                } else if (timeHlvFieldInConfig !== fieldId && newConfig.fields[fieldId].type === 'time-hlv') {
                    newConfig.fields[fieldId].type = 'text';
                }
            }
        });
        
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
    
    const sectionsMap = useMemo(() => new Map(localConfig.sections.map(s => [s.id, s])), [localConfig.sections]);

    const timeHlvFieldId = useMemo(() => {
        for (const fieldId in localConfig.fields) {
            if (localConfig.fields[fieldId]?.type === 'time-hlv') {
                return fieldId;
            }
        }
        return null;
    }, [localConfig.fields]);


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
                                    const section = sectionsMap.get(itemId);
                                    if (!section) return null;
                                    return (
                                        <Card key={section.id} className="bg-background overflow-hidden shadow-sm">
                                            <CardHeader className="p-4 bg-muted/60">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {section.label}
                                                    {section.isRepeatable && <span className="text-xs font-normal text-primary py-0.5 px-2 rounded-full bg-primary/10">Repetible</span>}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-2">
                                                {section.fieldIds.map((fieldId) => {
                                                    const fieldConfig = localConfig.fields[fieldId];
                                                    if (!fieldConfig) return null;
                                                    return (
                                                        <FieldEditor
                                                            key={fieldId}
                                                            fieldId={fieldId}
                                                            fieldConfig={fieldConfig}
                                                            isPredefined={!!definitions[fieldId]}
                                                            onFieldChange={handleFieldChange}
                                                            isTimeHlvDisabled={!!timeHlvFieldId && timeHlvFieldId !== fieldId}
                                                        />
                                                    );
                                                })}
                                                {section.fieldIds.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">Esta sección no tiene campos definidos en la plantilla.</p>}
                                            </CardContent>
                                        </Card>
                                    );
                                } else {
                                    const fieldId = itemId;
                                    const fieldConfig = localConfig.fields[fieldId];
                                    if (!fieldConfig || fieldConfig.type === 'predefined') return null;
                                    
                                    return (
                                         <FieldEditor
                                            key={fieldId}
                                            fieldId={fieldId}
                                            fieldConfig={fieldConfig}
                                            isPredefined={!!definitions[fieldId]}
                                            onFieldChange={handleFieldChange}
                                            isTimeHlvDisabled={!!timeHlvFieldId && timeHlvFieldId !== fieldId}
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
