'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { parseTemplate, renderFinalReport } from '@/lib/template-parser';
import type { TemplateConfig, SectionConfig, FieldType, SnippetOption } from '@/types';

interface TemplatePreviewProps {
    templateContent: string;
}

function generateMockData(
    sections: SectionConfig[],
    fieldNames: Set<string>,
    fieldTypes: Map<string, FieldType>,
    templateOptions: Map<string, SnippetOption[]>
) {
    const data: Record<string, any> = {};
    const predefinedValues: Record<string, string> = {
        Usuario: 'Usuario Demo',
        Fecha: new Date().toLocaleDateString('es-VE'),
    };

    // Generate mock data for each field
    fieldNames.forEach(fieldName => {
        if (predefinedValues[fieldName]) {
            return; // Skip predefined values
        }

        const fieldType = fieldTypes.get(fieldName);

        switch (fieldType) {
            case 'date':
                data[fieldName] = new Date().toISOString().split('T')[0];
                break;
            case 'time-hlv':
                const now = new Date();
                data[fieldName] = now.toLocaleTimeString('es-VE', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
                break;
            case 'dropdown':
                const options = templateOptions.get(fieldName);
                data[fieldName] = options?.[0]?.label || 'Opción 1';
                break;
            case 'number':
                data[fieldName] = '42';
                break;
            case 'textarea':
                data[fieldName] = 'Descripción detallada de ejemplo para el campo de texto largo.';
                break;
            default:
                data[fieldName] = `Ejemplo ${fieldName}`;
        }
    });

    // Generate mock data for sections
    sections.forEach(section => {
        if (section.isRepeatable) {
            const itemData: Record<string, string> = {};
            section.fieldIds.forEach((fieldId: string) => {
                const fieldType = fieldTypes.get(fieldId);
                switch (fieldType) {
                    case 'text':
                    default:
                        itemData[fieldId] = `Dato ${fieldId}`;
                }
            });

            // Generate 2 example items for repeatable sections
            data[section.id] = [
                { ...itemData },
                { ...itemData }
            ];
        }
    });

    return { data, predefinedValues };
}

export function TemplatePreview({ templateContent }: TemplatePreviewProps) {
    const result = useMemo(() => {
        if (!templateContent || templateContent.trim() === '') {
            return { errors: [], rendered: 'Plantilla vacía. Escriba contenido para ver la vista previa.' };
        }

        const parsed = parseTemplate(templateContent);

        if (parsed.errors.length > 0) {
            return { errors: parsed.errors, rendered: null };
        }

        // Build config from parsed data
        const config: TemplateConfig = {
            sections: parsed.sections,
            layout: parsed.layout,
            fields: {}
        };

        // Build fields config
        parsed.fieldNames.forEach(fieldName => {
            config.fields[fieldName] = {
                type: parsed.fieldTypes.get(fieldName) || 'text',
                label: fieldName,
            };

            const options = parsed.templateOptions.get(fieldName);
            if (options) {
                config.fields[fieldName].snippetOptions = options;
            }
        });

        const { data, predefinedValues } = generateMockData(
            parsed.sections,
            parsed.fieldNames,
            parsed.fieldTypes,
            parsed.templateOptions
        );

        try {
            const rendered = renderFinalReport(templateContent, data, config, predefinedValues);
            return { errors: [], rendered };
        } catch (error) {
            return {
                errors: [`Error al renderizar: ${error instanceof Error ? error.message : 'Error desconocido'}`],
                rendered: null
            };
        }
    }, [templateContent]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
                {result.errors.length > 0 ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <p className="font-semibold mb-2">Errores detectados:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                {result.errors.map((err, i) => (
                                    <li key={i} className="text-sm">{err}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="bg-muted rounded-lg p-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                            {result.rendered}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
