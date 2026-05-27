import { describe, it, expect } from 'vitest';
import { parseTemplate, resolveTemplateTitle } from '../template-parser';

describe('Template Parser', () => {
    describe('Basic Field Parsing', () => {
        it('should parse simple text fields', () => {
            const template = 'Nombre: {nombre}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames).toContain('nombre');
            expect(result.fieldTypes.get('nombre')).toBe('text');
        });

        it('should parse multiple fields', () => {
            const template = 'Nombre: {nombre}, Apellido: {apellido}, Edad: {edad}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames).toContain('nombre');
            expect(result.fieldNames).toContain('apellido');
            expect(result.fieldNames).toContain('edad');
        });

        it('should automatically detect time-hlv fields', () => {
            const template = 'Hora: {hora}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('hora')).toBe('time-hlv');
        });

        it('should automatically detect date fields', () => {
            const template = 'Fecha: {fecha}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('fecha')).toBe('date');
        });
    });

    describe('Field Type Modifiers', () => {
        it('should parse textarea type', () => {
            const template = 'Descripción: {descripcion:textarea}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('descripcion')).toBe('textarea');
        });

        it('should parse multi-text type', () => {
            const template = 'Items: {items:multi-text}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('items')).toBe('multi-text');
        });

        it('should parse semantic type', () => {
            const template = 'Concepto: {concepto:semantic}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('concepto')).toBe('semantic');
        });

        it('should parse dropdown with inline options', () => {
            const template = 'Estado: {estado:dropdown(A=Activo|I=Inactivo)}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('estado')).toBe('dropdown');

            const estadoOptions = result.templateOptions.get('estado');
            expect(estadoOptions).toBeDefined();
            expect(estadoOptions).toHaveLength(2);
            expect(estadoOptions?.[0]?.label).toBe('A');
            expect(estadoOptions?.[0]?.value).toBe('Activo');
        });
    });

    describe('Field Modifiers', () => {
        it('should parse full width modifier', () => {
            const template = 'Campo: {campo:full}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldWidths.get('campo')).toBe(true);
        });

        it('should parse required modifier', () => {
            const template = 'Campo: {campo:req}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.requiredFields.get('campo')).toBe(true);
        });

        it('should parse text transformation modifiers', () => {
            const template = 'Upper: {upper:upper}, Lower: {lower:lower}, Title: {title:title}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldModifiers.get('upper')).toContain('upper');
            expect(result.fieldModifiers.get('lower')).toContain('lower');
            expect(result.fieldModifiers.get('title')).toContain('title');
        });

        it('should parse combined modifiers', () => {
            const template = 'Campo: {campo:textarea:full:req}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldTypes.get('campo')).toBe('textarea');
            expect(result.fieldWidths.get('campo')).toBe(true);
            expect(result.requiredFields.get('campo')).toBe(true);
        });
    });

    describe('Conditional Sections', () => {
        it('should parse advanced conditional with curly braces and operator', () => {
            const template = `Tipo: {tipo:dropdown(A=Opción A|B=Opción B)}
[?{tipo} = 0]
Contenido para opción A
[/]`;
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            // Should have at least one section
            expect(result.sections.length).toBeGreaterThanOrEqual(1);
            // Find the conditional section
            const conditionalSection = result.sections.find((s) => s.condition);
            expect(conditionalSection).toBeDefined();
            expect(conditionalSection?.condition?.field_id).toBe('tipo');
            expect(conditionalSection?.condition?.operator).toBe('=');
            expect(conditionalSection?.condition?.value).toBe('0');
        });

        it('should parse multiple conditional sections with different operators', () => {
            const template = `Tipo: {tipo:dropdown(A=Opción A|B=Opción B)}
[?{tipo} = 0]
Contenido A
[/]
[?{tipo} != 0]
Contenido B
[/]`;
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            // Should have multiple sections
            expect(result.sections.length).toBeGreaterThanOrEqual(2);
            const conditionalSections = result.sections.filter((s) => s.condition);
            expect(conditionalSections.length).toBeGreaterThanOrEqual(2);

            // Check operators
            const equalsCond = conditionalSections.find((s) => s.condition?.operator === '=');
            const notEqualsCond = conditionalSections.find((s) => s.condition?.operator === '!=');
            expect(equalsCond).toBeDefined();
            expect(notEqualsCond).toBeDefined();
        });

        it('should parse conditional with comparison operators', () => {
            const template = `Edad: {edad}
[?{edad} >= 18]
Es mayor de edad
[/]
[?{edad} < 18]
Es menor de edad
[/]`;
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            const conditionalSections = result.sections.filter((s) => s.condition);
            expect(conditionalSections.length).toBeGreaterThanOrEqual(2);

            // Check for >= and < operators
            const greaterOrEqual = conditionalSections.find((s) => s.condition?.operator === '>=');
            const lessThan = conditionalSections.find((s) => s.condition?.operator === '<');
            expect(greaterOrEqual).toBeDefined();
            expect(lessThan).toBeDefined();
        });

        it('should parse conditional with quoted string values', () => {
            const template = `Estado: {estado}
[?{estado} = "activo"]
Sistema activo
[/]`;
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            const conditionalSection = result.sections.find((s) => s.condition);
            expect(conditionalSection).toBeDefined();
            expect(conditionalSection?.condition?.value).toBe('activo'); // Quotes should be stripped
        });
    });

    describe('Syntax Validation', () => {
        it('should detect unbalanced braces', () => {
            const template = 'Campo: {campo';
            const result = parseTemplate(template);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('llaves');
        });

        it('should detect unbalanced brackets', () => {
            const template = '[?{campo} = valor';
            const result = parseTemplate(template);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Corchetes');
        });

        it('should detect unclosed conditionals', () => {
            const template = '[?{campo} = valor]Contenido';
            const result = parseTemplate(template);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Condicionales sin cerrar');
        });
    });

    describe('Complex Templates', () => {
        it('should parse a comprehensive template', () => {
            const template = `REPORTE DE INCIDENTE

Fecha: {fecha}
Hora: {hora}
Tipo: {tipo:dropdown(1=Robo|2=Vandalismo|3=Otro)}

[?{tipo} = 0]
DETALLES DE ROBO
Monto: {monto}
[/]

[?{tipo} = 1]
DETALLES DE VANDALISMO
Área afectada: {area:textarea:full}
[/]

Descripción General: {descripcion:textarea:full:req}
Reportado por: {reportante:upper}`;

            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames).toContain('fecha');
            expect(result.fieldNames).toContain('hora');
            expect(result.fieldNames).toContain('tipo');
            expect(result.fieldNames).toContain('descripcion');
            expect(result.fieldTypes.get('fecha')).toBe('date');
            expect(result.fieldTypes.get('hora')).toBe('time-hlv');
            expect(result.fieldTypes.get('tipo')).toBe('dropdown');
            expect(result.fieldTypes.get('descripcion')).toBe('textarea');
            expect(result.requiredFields.get('descripcion')).toBe(true);
            expect(result.fieldWidths.get('descripcion')).toBe(true);
            expect(result.fieldModifiers.get('reportante')).toContain('upper');
            // Should have main section + conditional sections
            expect(result.sections.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty template', () => {
            const result = parseTemplate('');

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames.size).toBe(0);
        });

        it('should handle template with no fields', () => {
            const template = 'Este es un reporte sin campos dinámicos.';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames.size).toBe(0);
        });

        it('should handle duplicate field names', () => {
            const template = 'Campo 1: {campo}, Campo 2: {campo}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames.size).toBe(1);
            expect(result.fieldNames).toContain('campo');
        });

        it('should handle fields with same name but different types', () => {
            const template = 'Campo 1: {campo:text}, Campo 2: {campo:textarea}';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            // Should use more specific type (textarea) over text
            expect(result.fieldTypes.get('campo')).toBe('textarea');
        });
    });

    describe('Repeatable Sections', () => {
        it('should parse repeatable multi-text fields', () => {
            const template = 'Novedades: {novedades:multi-text}*';
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            expect(result.fieldNames).toContain('novedades');
            // Should create a repeatable section
            const repeatableSection = result.sections.find((s) => s.is_repeatable);
            expect(repeatableSection).toBeDefined();
            expect(repeatableSection?.field_ids).toContain('novedades');
        });

        it('should parse repeatable sections with labels', () => {
            const template = `[singular="Novedad" plural="Novedades"]{descripcion:textarea}*[/]`;
            const result = parseTemplate(template);

            expect(result.errors).toHaveLength(0);
            const repeatableSection = result.sections.find((s) => s.is_repeatable);
            expect(repeatableSection).toBeDefined();
        });
    });

    describe('resolveTemplateTitle', () => {
        const mockFieldsConfig = {
            fields: {
                'Tipo de accidente': {
                    id: 'Tipo de accidente',
                    label: 'Tipo de accidente',
                    type: 'dropdown',
                    snippet_options: [
                        { id: 'opt1', label: 'Colisión', value: 'tipo colisión' },
                        { id: 'opt2', label: 'Vuelco', value: 'tipo vuelco' }
                    ]
                }
            }
        };

        it('should resolve simple placeholder without config', () => {
            const resolved = resolveTemplateTitle('Accidente {Tipo de accidente}', {
                'Tipo de accidente': 'Colisión'
            });
            expect(resolved).toBe('Accidente Colisión');
        });

        it('should resolve option label with config by default', () => {
            const resolved = resolveTemplateTitle('Accidente {Tipo de accidente}', {
                'Tipo de accidente': 'Colisión'
            }, mockFieldsConfig as any);
            expect(resolved).toBe('Accidente Colisión');
        });

        it('should resolve option value using :value modifier', () => {
            const resolved = resolveTemplateTitle('Accidente {Tipo de accidente:value}', {
                'Tipo de accidente': 'Colisión'
            }, mockFieldsConfig as any);
            expect(resolved).toBe('Accidente tipo colisión');
        });

        it('should apply casing modifiers', () => {
            const resolved = resolveTemplateTitle('Accidente {Tipo de accidente:value|upper}', {
                'Tipo de accidente': 'Colisión'
            }, mockFieldsConfig as any);
            expect(resolved).toBe('Accidente TIPO COLISIÓN');
        });

        it('should resolve option value using :val modifier', () => {
            const resolved = resolveTemplateTitle('Accidente {Tipo de accidente:val}', {
                'Tipo de accidente': 'Colisión'
            }, mockFieldsConfig as any);
            expect(resolved).toBe('Accidente tipo colisión');
        });
    });
});

