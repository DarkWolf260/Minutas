/**
 * Diagnostic test that mimics exactly what template-preview.tsx does,
 * so we can trace why sections don't render in the browser preview.
 */
import { describe, it, expect } from 'vitest';
import { parseTemplate, renderFinalReport } from '../../template-parser';
import type { TemplateConfig, SectionConfig, FieldType, SnippetOption } from '@/lib/types';

function generateMockData(
    sections: SectionConfig[],
    fieldNames: Set<string>,
    fieldTypes: Map<string, FieldType>,
    templateOptions: Map<string, SnippetOption[]>
) {
    const data: Record<string, unknown> = {};
    const predefinedValues: Record<string, string> = {
        Usuario: 'Usuario Demo',
        Fecha: new Date().toLocaleDateString('es-VE'),
    };

    fieldNames.forEach((fieldName) => {
        if (predefinedValues[fieldName]) return;
        const fieldType = fieldTypes.get(fieldName);
        switch (fieldType) {
            case 'date':
                data[fieldName] = new Date().toISOString().split('T')[0];
                break;
            case 'dropdown':
                data[fieldName] = templateOptions.get(fieldName)?.[0]?.label || 'Opción 1';
                break;
            default:
                data[fieldName] = `Ejemplo ${fieldName}`;
        }
    });

    sections.forEach((section) => {
        if (section.isRepeatable) {
            const itemData: Record<string, string> = {};
            section.field_ids.forEach((field_id) => {
                itemData[field_id] = `Dato ${field_id}`;
            });
            data[section.id] = [{ ...itemData }, { ...itemData }];
        }
    });

    return { data, predefinedValues };
}

function previewRender(templateContent: string): string {
    const parsed = parseTemplate(templateContent);
    if (parsed.errors.length > 0) {
        return `ERRORS: ${parsed.errors.join(', ')}`;
    }

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
        if (options) config.fields[fieldName].snippetOptions = options;
    });

    const { data, predefinedValues } = generateMockData(
        parsed.sections,
        parsed.fieldNames,
        parsed.fieldTypes,
        parsed.templateOptions
    );

    return renderFinalReport(templateContent, data as never, config, predefinedValues);
}

describe('Template Preview - Secciones', () => {
    it('renders a normal section [Label]{field}[/]', () => {
        const template = '[Novedades]\n{descripcion}\n[/]';
        const result = previewRender(template);
        console.log('Normal section result:', result);
        expect(result).toContain('Ejemplo descripcion');
    });

    it('renders a quoted section ["Label"]{field}[/]', () => {
        const template = '["Novedades"]\n{descripcion}\n[/]';
        const result = previewRender(template);
        console.log('Quoted section result:', result);
        expect(result).toContain('Ejemplo descripcion');
    });

    it('renders a quoted repeatable section ["Label"]*{field}[/]', () => {
        const template = '["Novedades"]*\n{descripcion}\n[/]';
        const parsed = parseTemplate(template);
        console.log('Parsed sections:', JSON.stringify(parsed.sections, null, 2));
        const result = previewRender(template);
        console.log('Quoted repeatable result:', result);
        expect(result).toContain('Dato descripcion');
    });

    it('renders a self-contained section ["Title" {field}]', () => {
        const template = '["Inspector" {nombre}]';
        const result = previewRender(template);
        console.log('Self-contained result:', result);
        expect(result).toContain('Ejemplo nombre');
    });
});

