'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Eye } from 'lucide-react';
import { parseTemplate, renderFinalReport } from '@/lib/template-parser';
import type { TemplateConfig, SectionConfig, FieldType, SnippetOption } from '@/lib/types';

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

  // For :show conditional sections, satisfy their condition in mock data
  // so the content appears in the rendered preview
  sections.forEach((section) => {
    if (section.condition && section.condition.condition_mode === 'show') {
      const { field_id, value } = section.condition;
      data[field_id] = value;
    }
  });

  // Generate mock data for each field
  fieldNames.forEach((fieldName) => {
    if (predefinedValues[fieldName] || data[fieldName] !== undefined) {
      return; // Skip predefined and already-set conditional fields
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
          minute: '2-digit',
        });
        break;
      case 'dropdown':
        const options = templateOptions.get(fieldName);
        data[fieldName] = options?.[0]?.label || 'Opción 1';
        break;
      case 'textarea':
        data[fieldName] = 'Descripción detallada de ejemplo para el campo de texto largo.';
        break;
      default:
        data[fieldName] = `Ejemplo ${fieldName}`;
    }
  });

  // Generate mock data for repeatable sections
  sections.forEach((section) => {
    if (section.is_repeatable) {
      const itemData: Record<string, string> = {};
      section.field_ids.forEach((field_id: string) => {
        const fieldType = fieldTypes.get(field_id);
        switch (fieldType) {
          case 'text':
          default:
            itemData[field_id] = `Dato ${field_id}`;
        }
      });
      data[section.id] = [{ ...itemData }, { ...itemData }];
    }
  });

  return { data, predefinedValues };
}

export function TemplatePreview({ templateContent }: TemplatePreviewProps) {
  const result = useMemo(() => {
    if (!templateContent || templateContent.trim() === '') {
      return {
        errors: [],
        rendered: 'Plantilla vacía. Escriba contenido para ver la vista previa.',
        showSections: [] as { field_id: string; value: string }[],
      };
    }

    const parsed = parseTemplate(templateContent);

    if (parsed.errors.length > 0) {
      return { errors: parsed.errors, rendered: null, showSections: [] };
    }

    // Collect :show conditional sections for the visual indicator
    const showSections = parsed.sections
      .filter(s => s.condition?.condition_mode === 'show')
      .map(s => ({ field_id: s.condition!.field_id, value: s.condition!.value }));

    // Build config from parsed data
    const config: TemplateConfig = {
      sections: parsed.sections,
      layout: parsed.layout,
      fields: {},
    };

    parsed.fieldNames.forEach((fieldName) => {
      config.fields[fieldName] = {
        type: parsed.fieldTypes.get(fieldName) || 'text',
        label: fieldName,
      };
      const options = parsed.templateOptions.get(fieldName);
      if (options) {
        config.fields[fieldName].snippet_options = options;
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
      return { errors: [], rendered, showSections };
    } catch (error) {
      return {
        errors: [
          `Error al renderizar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        ],
        rendered: null,
        showSections: [],
      };
    }
  }, [templateContent]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Vista Previa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Errores detectados:</p>
              <ul className="list-disc pl-4 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-sm">
                    {err}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Indicador para secciones :show — siempre visibles en el formulario */}
            {result.showSections && result.showSections.length > 0 && (
              <div className="relative rounded-lg border border-dashed border-muted-foreground/40 px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-background px-2">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Siempre visibles en el formulario
                  </span>
                </div>
                {result.showSections.map((s, i) => (
                  <span key={i} className="text-[11px] text-muted-foreground font-mono">
                    <span className="text-foreground font-semibold">{s.field_id}</span>
                    {' = '}
                    <span className="text-foreground font-semibold">{s.value}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="bg-muted rounded-lg p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm">{result.rendered}</pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

