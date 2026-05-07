import { describe, it, expect } from 'vitest';
import { parseTemplate, renderFinalReport } from '../../template-parser';
import type { TemplateConfig, SnippetOption, FieldType, SectionConfig } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildConfig(templateContent: string): TemplateConfig {
    const parsed = parseTemplate(templateContent);
    const config: TemplateConfig = {
        sections: parsed.sections,
        layout: parsed.layout,
        fields: {},
    };
    parsed.fieldNames.forEach((name: string) => {
        config.fields[name] = {
            type: parsed.fieldTypes.get(name) || 'text',
            label: name,
        };
        const opts = parsed.templateOptions.get(name);
        if (opts) config.fields[name].snippetOptions = opts;
    });
    return config;
}

function render(template: string, data: Record<string, unknown>, predefined: Record<string, string> = {}): string {
    const config = buildConfig(template);
    return renderFinalReport(template, data as never, config, predefined);
}

function generateMockData(
    sections: import('@/lib/types').SectionConfig[],
    fieldNames: Set<string>,
    fieldTypes: Map<string, FieldType>,
    templateOptions: Map<string, SnippetOption[]>
) {
    const data: Record<string, unknown> = {};
    fieldNames.forEach((fieldName: string) => {
        const fieldType = fieldTypes.get(fieldName);
        switch (fieldType) {
            case 'date':
                data[fieldName] = new Date().toISOString().split('T')[0];
                break;
            case 'time-hlv':
                data[fieldName] = '14:30';
                break;
            case 'dropdown':
                data[fieldName] = templateOptions.get(fieldName)?.[0]?.label || 'Opción 1';
                break;
            case 'textarea':
                data[fieldName] = 'Descripción de ejemplo.';
                break;
            default:
                data[fieldName] = `Ejemplo ${fieldName}`;
        }
    });
    sections.forEach((section: SectionConfig) => {
        if (section.isRepeatable) {
            const itemData: Record<string, string> = {};
            section.field_ids.forEach((field_id: string) => {
                itemData[field_id] = `Dato ${field_id}`;
            });
            data[section.id] = [{ ...itemData }, { ...itemData }];
        }
    });
    return data;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Template Renderer - Secciones Repetibles', () => {
    it('should render a simple repeatable field {campo}*', () => {
        const template = 'NOVEDADES:\n{novedad}*';
        const parsed = parseTemplate(template);

        console.log('Sections:', JSON.stringify(parsed.sections, null, 2));
        console.log('Layout:', parsed.layout);

        const data = generateMockData(parsed.sections, parsed.fieldNames, parsed.fieldTypes, parsed.templateOptions);
        console.log('Mock data:', JSON.stringify(data, null, 2));

        const config = buildConfig(template);
        const result = renderFinalReport(template, data as never, config, {});
        console.log('Result:', result);

        expect(result).toContain('Dato novedad');
    });

    it('should render a repeatable section with [Label]*...[/]', () => {
        const template = '[Novedades]*\n{descripcion}\n[/]';
        const parsed = parseTemplate(template);

        console.log('Sections:', JSON.stringify(parsed.sections, null, 2));
        const data = generateMockData(parsed.sections, parsed.fieldNames, parsed.fieldTypes, parsed.templateOptions);
        console.log('Mock data:', JSON.stringify(data, null, 2));

        const config = buildConfig(template);
        const result = renderFinalReport(template, data as never, config, {});
        console.log('Result:', result);

        expect(result).toContain('Dato descripcion');
    });

    it('should render a repeatable section with singular/plural attributes', () => {
        const template = '[singular="Novedad" plural="Novedades" sub="NOVEDAD"]*\n{descripcion}\n[/]';
        const parsed = parseTemplate(template);

        console.log('Sections:', JSON.stringify(parsed.sections, null, 2));
        const data = generateMockData(parsed.sections, parsed.fieldNames, parsed.fieldTypes, parsed.templateOptions);
        console.log('Mock data:', JSON.stringify(data, null, 2));

        const config = buildConfig(template);
        const result = renderFinalReport(template, data as never, config, {});
        console.log('Result:', result);

        expect(result).toContain('Dato descripcion');
    });

    it('should correctly parse and render the Destino repeatable textarea field', () => {
        const template = '["INFORMACIÓN GEOGRÁFICA"\n- *UBICACIÓN:* {Ubicación:textarea:req}\n- *DESTINO:* {Destino:textarea:req}*\n]';
        const parsed = parseTemplate(template);
        
        expect(parsed.fieldNames.has('Ubicación')).toBe(true);
        expect(parsed.fieldNames.has('Destino')).toBe(true);
        expect(parsed.fieldTypes.get('Ubicación')).toBe('textarea');
        expect(parsed.fieldTypes.get('Destino')).toBe('textarea');
        
        const destinoSection = parsed.sections.find((s: SectionConfig) => s.field_ids.includes('Destino') && s.isRepeatable);
        expect(destinoSection).toBeDefined();
        
        const data: Record<string, unknown> = {
            'Ubicación': 'Av. Principal',
            [destinoSection!.id]: [
                { 'Destino': 'Hospital Central' },
                { 'Destino': 'Clínica Sucre' }
            ]
        };

        const config = buildConfig(template);
        const result = renderFinalReport(template, data as never, config, {});
        
        expect(result).toContain('Av. Principal');
        expect(result).toContain('Hospital Central');
        expect(result).toContain('Clínica Sucre');
    });
});

describe('Template Renderer - Secciones Auto-Contenidas', () => {
    it('should render a self-contained section ["Título" {campo}]', () => {
        const template = 'Texto antes\n["Título de sección" {campo}]\nTexto después';
        const data = { campo: 'valor de prueba' };

        const result = render(template, data);
        console.log('Secciones auto-contenidas result:', result);

        expect(result).toContain('valor de prueba');
    });

    it('should render multiple fields in a self-contained section', () => {
        const template = '["Info" {nombre} - {cargo}]';
        const data = { nombre: 'Juan Pérez', cargo: 'Inspector' };

        const result = render(template, data);
        console.log('Multi-field self-contained result:', result);

        expect(result).toContain('Juan Pérez');
        expect(result).toContain('Inspector');
    });

    it('should render repeatable self-contained section without leaving a trailing asterix', () => {
        const template = '["Título de ejemplo" {campo1} {campo2}]*';
        const parsed = parseTemplate(template);

        const data: Record<string, unknown> = {
            [parsed.sections[0]!.id]: [
                { campo1: 'respuesta1', campo2: 'respuesta2' },
                { campo1: 'respuesta3', campo2: 'respuesta4' }
            ]
        };

        const config = buildConfig(template);
        const result = renderFinalReport(template, data as never, config, {});
        console.log('Repeatable self-contained result:', result);

        expect(result).toContain('respuesta1 respuesta2');
        expect(result).toContain('respuesta3 respuesta4');
        expect(result).not.toContain('respuesta4*'); // Should not leave trailing *
    });
});

describe('Template Renderer - Condicionales con Campos', () => {
    it('should render field inside a top-level conditional section', () => {
        const template = 'Tipo: {tipo}\n[?{tipo} = Robo]\nMonto: {monto}\n[/]';
        const data = { tipo: 'Robo', monto: '500 USD' };
        const result = render(template, data);
        console.log('Conditional field result:', result);
        expect(result).toContain('500 USD');
    });

    it('should NOT render content when condition is false', () => {
        const template = 'Tipo: {tipo}\n[?{tipo} = Robo]\nMonto: {monto}\n[/]';
        const data = { tipo: 'Accidente', monto: '500 USD' };
        const result = render(template, data);
        expect(result).not.toContain('500 USD');
        expect(result).not.toContain('Monto:');
    });

    it('DIAGNOSTIC: sections for nested conditional dropdown', () => {
        const template = [
            '{Vía de información}',
            '[?{¿Quien informó?}]',
            'Personal=el personal de la institución',
            'Funcionario=el funcionario externo',
            '[/]',
            '[?{Vía de información} = Llamada]',
            '{¿Quien informó?}',
            '[/]',
        ].join('\n');

        const parsed = parseTemplate(template);
        console.log('fieldNames:', [...parsed.fieldNames]);
        console.log('layout:', parsed.layout);
        console.log('sections:', JSON.stringify(parsed.sections.map((s: any) => ({
            id: s.id, condition: s.condition, field_ids: s.field_ids, isMapping: s.isMapping
        })), null, 2));
        console.log('templateOptions ¿Quien informó?:', parsed.templateOptions.get('¿Quien informó?'));

        expect(parsed.fieldNames.has('¿Quien informó?')).toBe(true);
        expect(parsed.templateOptions.get('¿Quien informó?')).toBeDefined();

        const condSection = parsed.sections.find((s: any) => s.condition?.value === 'Llamada');
        console.log('condSection:', condSection);
        expect(condSection).toBeDefined();
        expect(condSection?.field_ids).toContain('¿Quien informó?');
    });
});

