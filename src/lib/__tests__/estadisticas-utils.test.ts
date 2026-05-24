/**
 * statistics-utils.test.ts
 * 
 * Unit tests for statistics utility functions
 */

import { describe, it, expect } from 'vitest';
import { obtenerCategoriasReporte, calcularEstadisticasMensuales } from '../estadisticas-utils';
import type { Report, Template, TemplateConfig, Address } from '@/lib/types';

// Mock data factories
function createMockReport(overrides: Partial<Report> = {}): Report {
    return {
        id: 'report-1',
        workspace_id: 'workspace-1',
        template_id: 'template-1',
        title: 'Test Report',
        content: 'Test content',
        is_relevant: true,
        form_data: {},
        status: 'Finalizado',
        timestamp: new Date(2026, 0, 15, 10, 30).toISOString(), // Jan 15, 2026
        ...overrides,
    };
}

function createMockTemplate(overrides: Partial<Template> = {}): Template {
    return {
        id: 'template-1',
        workspace_id: 'workspace-1',
        name: 'Test Template',
        content: '{Field1}',
        type: 'normal',
        is_active: true,
        ...overrides,
    };
}

function createMockConfig(overrides: Partial<TemplateConfig> = {}): TemplateConfig {
    return {
        fields: {},
        sections: [],
        layout: [],
        ...overrides,
    };
}

describe('statistics-utils', () => {
    describe('getReportCategories', () => {
        it('should return empty array when template is undefined', () => {
            const report = createMockReport();
            const result = obtenerCategoriasReporte(report, undefined);
            expect(result).toEqual([]);
        });

        it('should return empty array when template has no category or rules', () => {
            const report = createMockReport();
            const template = createMockTemplate();
            const result = obtenerCategoriasReporte(report, template);
            expect(result).toEqual([]);
        });

        it('should return default category when no rules match', () => {
            const report = createMockReport();
            const template = createMockTemplate({
                statistics_category: '1.2 LLAMADAS DE EMERGENCIAS',
            });
            const result = obtenerCategoriasReporte(report, template);
            expect(result).toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should include both default category and matching rules', () => {
            const report = createMockReport({
                form_data: { tipo: 'hurto' },
            });
            const template = createMockTemplate({
                statistics_category: '5 ATENCIONES AL PÚBLICO',
                statistics_rules: [
                    { field_id: 'tipo', condition: 'hurto', category: '5.1 ATENCIONES PREHOSPITALARIAS' },
                ],
            });
            const result = obtenerCategoriasReporte(report, template);
            expect(result).toContain('5 ATENCIONES AL PÚBLICO');
            expect(result).toContain('5.1 ATENCIONES PREHOSPITALARIAS');
        });

        it('should match conditional rule case-insensitively', () => {
            const report = createMockReport({
                form_data: { tipo: 'HURTO' },
            });
            const template = createMockTemplate({
                statistics_rules: [
                    { field_id: 'tipo', condition: 'hurto', category: '1.2 LLAMADAS DE EMERGENCIAS' },
                ],
            });
            const result = obtenerCategoriasReporte(report, template);
            expect(result).toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should handle missing form_data field gracefully', () => {
            const report = createMockReport({
                form_data: {},
            });
            const template = createMockTemplate({
                statistics_category: '1 REPORTES DEL VEN 9-1-1',
                statistics_rules: [
                    { field_id: 'nonexistent', condition: 'value', category: '1.2 LLAMADAS DE EMERGENCIAS' },
                ],
            });
            const result = obtenerCategoriasReporte(report, template);
            expect(result).toContain('1 REPORTES DEL VEN 9-1-1');
            expect(result).not.toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should resolve dropdown labels correctly for rules', () => {
            const report = createMockReport({
                form_data: { tipo_aph: 'residencia' },
            });
            const template = createMockTemplate({
                statistics_rules: [
                    { field_id: 'Tipo de APH', operator: '=', condition: 'Residencia', category: '5.3 EN RESIDENCIA' },
                ],
            });
            const config = createMockConfig({
                fields: {
                    'tipo_aph': { 
                        label: 'Tipo de APH', 
                        type: 'dropdown',
                        snippet_options: [
                            { id: 'opt-1', value: 'residencia', label: 'Residencia' }
                        ]
                    }
                }
            });
            const result = obtenerCategoriasReporte(report, template, config);
            expect(result).toContain('5.3 EN RESIDENCIA');
        });

        it('should handle multi-value fields correctly', () => {
            const report = createMockReport({
                form_data: { symptoms: ['fever', 'cough'] },
            });
            const template = createMockTemplate({
                statistics_rules: [
                    { field_id: 'symptoms', operator: '=', condition: 'fever', category: '5.1 ATENCIONES PREHOSPITALARIAS' },
                    { field_id: 'symptoms', operator: '=', condition: 'cough', category: '5.2 EN TRASLADOS' },
                ],
            });
            const result = obtenerCategoriasReporte(report, template);
            expect(result).toContain('5.1 ATENCIONES PREHOSPITALARIAS');
            expect(result).toContain('5.2 EN TRASLADOS');
        });

        it('should not double count when rule and general category are the same', () => {
            const report = createMockReport({
                form_data: { destiny: 'Guanta' },
            });
            const template = createMockTemplate({
                statistics_category: '6.2 TRASLADOS EXTRAURBANOS',
                statistics_rules: [
                    { field_id: 'destiny', operator: '=', condition: 'Guanta', category: '6.2 TRASLADOS EXTRAURBANOS' },
                ],
            });
            const result = obtenerCategoriasReporte(report, template);
            // Should only contain ONE instance of 6.2
            const count = result.filter(c => c === '6.2 TRASLADOS EXTRAURBANOS').length;
            expect(count).toBe(1);
        });

        it('should handle orConditions (at least one must match)', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    { 
                        field_id: 'type', 
                        operator: '=', 
                        condition: 'emergency', 
                        category: '1.2 LLAMADAS DE EMERGENCIAS',
                        or_conditions: [
                            { field_id: 'priority', operator: '=', condition: 'high' },
                            { field_id: 'priority', operator: '=', condition: 'critical' }
                        ]
                    },
                ],
            });

            // Matches primary but none of the OR conditions -> success (because of OR)
            const report1 = createMockReport({ form_data: { type: 'emergency', priority: 'low' } });
            expect(obtenerCategoriasReporte(report1, template)).toContain('1.2 LLAMADAS DE EMERGENCIAS');

            // Matches one of the OR conditions but not primary -> success (because of OR)
            const report2 = createMockReport({ form_data: { type: 'inquiry', priority: 'high' } });
            expect(obtenerCategoriasReporte(report2, template)).toContain('1.2 LLAMADAS DE EMERGENCIAS');

            // Matches neither -> fail
            const report3 = createMockReport({ form_data: { type: 'inquiry', priority: 'low' } });
            expect(obtenerCategoriasReporte(report3, template)).not.toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should handle complex rules with both conditions (AND) and orConditions (OR)', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    { 
                        field_id: 'c', 
                        operator: '=', 
                        condition: '3', 
                        category: 'CAT',
                        or_conditions: [
                            { field_id: 'd', operator: '=', condition: '4' }
                        ],
                        conditions: [
                            { field_id: 'a', operator: '=', condition: '1' },
                            { field_id: 'b', operator: '=', condition: '2' }
                        ]
                    },
                ],
            });

            // c=3, d=1, a=1, b=2 (matches primary, fails OR but primary is true, matches both ANDs) -> success
            const r1 = createMockReport({ form_data: { c: '3', d: '1', a: '1', b: '2' } });
            expect(obtenerCategoriasReporte(r1, template)).toContain('CAT');

            // c=1, d=4, a=1, b=2 (fails primary, matches OR, matches both ANDs) -> success
            const r2 = createMockReport({ form_data: { c: '1', d: '4', a: '1', b: '2' } });
            expect(obtenerCategoriasReporte(r2, template)).toContain('CAT');

            // c=3, d=1, a=1, b=1 (matches primary, fails one AND) -> fail
            const r3 = createMockReport({ form_data: { c: '3', d: '1', a: '1', b: '1' } });
            expect(obtenerCategoriasReporte(r3, template)).not.toContain('CAT');

            // c=1, d=1, a=1, b=2 (fails both primary and OR) -> fail
            const r4 = createMockReport({ form_data: { c: '1', d: '1', a: '1', b: '2' } });
            expect(obtenerCategoriasReporte(r4, template)).not.toContain('CAT');
        });

        it('should resolve predefinedValues (such as {Municipio}) in primary condition, AND, and OR conditions', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    {
                        field_id: 'Ubicación',
                        operator: 'not_contains',
                        condition: '{Municipio}',
                        category: '6.2 TRASLADOS EXTRAURBANOS',
                        or_conditions: [
                            { field_id: 'Destino (1)', operator: 'not_contains', condition: '{Municipio}' }
                        ]
                    }
                ]
            });

            // If Ubicación is 'Sotillo' and Municipio is 'Guanta', it should match extraurban.
            const report = createMockReport({
                form_data: {
                    'Ubicación': 'Municipio Juan Antonio Sotillo, parroquia Puerto La Cruz',
                    'section_1': [
                        { 'Destino': 'Municipio Juan Antonio Sotillo, parroquia Puerto La Cruz' }
                    ]
                }
            });

            const config = createMockConfig({
                fields: {
                    'Ubicación': { label: 'Ubicación', type: 'text' },
                    'Destino': { label: 'Destino', type: 'text' }
                }
            });

            const predefinedValues = { 'municipio': 'Guanta' };

            const result = obtenerCategoriasReporte(report, template, config, predefinedValues);
            expect(result).toContain('6.2 TRASLADOS EXTRAURBANOS');
        });

        it('should resolve predefinedValues in the primary condition when there are no OR conditions', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    {
                        field_id: 'Ubicación',
                        operator: 'not_contains',
                        condition: '{Municipio}',
                        category: '6.2 TRASLADOS EXTRAURBANOS'
                    }
                ]
            });

            // Ubicación contains 'Municipio' but does not contain 'Guanta'
            const report = createMockReport({
                form_data: {
                    'Ubicación': 'Municipio Juan Antonio Sotillo, parroquia Puerto La Cruz'
                }
            });

            const config = createMockConfig({
                fields: {
                    'Ubicación': { label: 'Ubicación', type: 'text' }
                }
            });

            const predefinedValues = { 'municipio': 'Guanta' };

            const result = obtenerCategoriasReporte(report, template, config, predefinedValues);
            expect(result).toContain('6.2 TRASLADOS EXTRAURBANOS');
        });

        it('should correctly evaluate sequential route legs using Destino* compared directly to {Destino*}', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    {
                        field_id: 'Destino*',
                        operator: '!=',
                        condition: '{Destino*}',
                        category: '6.2 TRASLADOS EXTRAURBANOS'
                    }
                ]
            });

            // Ubicación = Sotillo
            // Destinos: [ Sotillo, Guanta ]
            // Segments:
            // 1. Sotillo -> Sotillo (matching, so not != -> no match)
            // 2. Sotillo -> Guanta (Sotillo != Guanta -> matches extraurban!)
            const report = createMockReport({
                form_data: {
                    'Ubicación': 'Sotillo',
                    'section_1': [
                        { 'Destino': 'Sotillo' },
                        { 'Destino': 'Guanta' }
                    ]
                }
            });

            const config = createMockConfig({
                fields: {
                    'Ubicación': { label: 'Ubicación', type: 'text' },
                    'Destino': { label: 'Destino', type: 'text' }
                }
            });

            const result = obtenerCategoriasReporte(report, template, config);
            expect(result.filter(c => c === '6.2 TRASLADOS EXTRAURBANOS').length).toBe(1);
        });

        it('should evaluate sequential route legs using Destino* compared to {Municipio} with positive operator (=)', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    {
                        field_id: 'Destino*',
                        operator: '=',
                        condition: '{Municipio}',
                        category: '6.1 TRASLADOS URBANOS'
                    }
                ]
            });

            // Ubicación = Bolívar
            // Destinos: [ Bolívar, Sotillo, Bolívar, Bolívar ]
            // Legs evaluated (startIdx = 1):
            // Leg 1: Bolívar -> Sotillo (Bolívar == Bolívar && Sotillo == Bolívar -> False)
            // Leg 2: Sotillo -> Bolívar (Sotillo == Bolívar && Bolívar == Bolívar -> False)
            // Leg 3: Bolívar -> Bolívar (Bolívar == Bolívar && Bolívar == Bolívar -> True -> 1 match!)
            const report = createMockReport({
                form_data: {
                    'Ubicación': 'Bolívar',
                    'section_1': [
                        { 'Destino': 'Bolívar' },
                        { 'Destino': 'Sotillo' },
                        { 'Destino': 'Bolívar' },
                        { 'Destino': 'Bolívar' }
                    ]
                }
            });

            const config = createMockConfig({
                fields: {
                    'Ubicación': { label: 'Ubicación', type: 'text' },
                    'Destino': { label: 'Destino', type: 'text' }
                }
            });

            const predefinedValues = { 'municipio': 'Bolívar' };

            const result = obtenerCategoriasReporte(report, template, config, predefinedValues);
            expect(result.filter(c => c === '6.1 TRASLADOS URBANOS').length).toBe(1);
        });

        it('should evaluate sequential route legs using Destino* compared to {Municipio} with negative operator (!=)', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    {
                        field_id: 'Destino*',
                        operator: '!=',
                        condition: '{Municipio}',
                        category: '6.2 TRASLADOS EXTRAURBANOS'
                    }
                ]
            });

            // Ubicación = Bolívar
            // Destinos: [ Bolívar, Sotillo, Bolívar, Bolívar ]
            // Legs evaluated (startIdx = 1):
            // Leg 1: Bolívar -> Sotillo (Bolívar != Bolívar || Sotillo != Bolívar -> True -> Match 1)
            // Leg 2: Sotillo -> Bolívar (Sotillo != Bolívar || Bolívar != Bolívar -> True -> Match 2)
            // Leg 3: Bolívar -> Bolívar (Bolívar != Bolívar || Bolívar != Bolívar -> False)
            // Expected matches: 2
            const report = createMockReport({
                form_data: {
                    'Ubicación': 'Bolívar',
                    'section_1': [
                        { 'Destino': 'Bolívar' },
                        { 'Destino': 'Sotillo' },
                        { 'Destino': 'Bolívar' },
                        { 'Destino': 'Bolívar' }
                    ]
                }
            });

            const config = createMockConfig({
                fields: {
                    'Ubicación': { label: 'Ubicación', type: 'text' },
                    'Destino': { label: 'Destino', type: 'text' }
                }
            });

            const predefinedValues = { 'municipio': 'Bolívar' };

            const result = obtenerCategoriasReporte(report, template, config, predefinedValues);
            expect(result.filter(c => c === '6.2 TRASLADOS EXTRAURBANOS').length).toBe(2);
        });

        describe('Automatic Transfer Category Inference (6.3-6.10)', () => {
            const mockAddresses: Address[] = [
                {
                    id: 'addr-hospital',
                    workspace_id: 'workspace-1',
                    name: 'Hospital Central',
                    municipality: 'Bolívar',
                    parish: 'El Carmen',
                    sector: 'Centro',
                    street: 'Av. Principal',
                    houseNumber: '12',
                    peaceQuadrant: 'QP-01',
                    locationType: 'centro_asistencial'
                },
                {
                    id: 'addr-casa',
                    workspace_id: 'workspace-1',
                    name: 'Casa Familia Perez',
                    municipality: 'Bolívar',
                    parish: 'El Carmen',
                    sector: 'Barrio Lindo',
                    street: 'Calle 3',
                    houseNumber: '45',
                    peaceQuadrant: 'QP-02',
                    locationType: 'residencia'
                }
            ];

            it('should infer 6.4 when transferring from hospital to residence using directory lookup', () => {
                const template = createMockTemplate();
                const report = createMockReport({
                    form_data: {
                        'Ubicación': 'Municipio Bolívar, parroquia El Carmen, sector Centro, calle Av. Principal 12, Hospital Central, Cuadrante de Paz QP-01',
                        'section_1': [
                            { 'Destino': 'Municipio Bolívar, parroquia El Carmen, sector Barrio Lindo, calle Calle 3 45, Casa Familia Perez, Cuadrante de Paz QP-02' }
                        ]
                    }
                });

                const config = createMockConfig({
                    fields: {
                        'Ubicación': { label: 'Ubicación', type: 'text' },
                        'Destino': { label: 'Destino', type: 'text' }
                    }
                });

                const result = obtenerCategoriasReporte(report, template, config, {}, mockAddresses);
                expect(result).toContain('6.4 DE CENTROS ASISTENCIALES A RESIDENCIAS');
            });

            it('should infer 6.6 when using manually entered type fallback in form_data', () => {
                const template = createMockTemplate();
                const report = createMockReport({
                    form_data: {
                        'Ubicación': 'Calle Cualquiera',
                        'ubicacion_tipo': 'lugar_publico',
                        'section_1': [
                            { 'Destino': 'Hospital Desconocido' }
                        ],
                        'destino_tipo': 'centro_asistencial'
                    }
                });

                const config = createMockConfig({
                    fields: {
                        'Ubicación': { label: 'Ubicación', type: 'text' },
                        'Destino': { label: 'Destino', type: 'text' }
                    }
                });

                const result = obtenerCategoriasReporte(report, template, config, {}, []);
                expect(result).toContain('6.6 DE VÍA A CENTROS ASISTENCIALES');
            });

            it('should evaluate multi-leg route segments individually', () => {
                const template = createMockTemplate();
                const report = createMockReport({
                    form_data: {
                        'Ubicación': 'Municipio Bolívar, parroquia El Carmen, sector Centro, calle Av. Principal 12, Hospital Central, Cuadrante de Paz QP-01',
                        'section_1': [
                            { 'Destino': 'Municipio Bolívar, parroquia El Carmen, sector Centro, calle Av. Principal 12, Hospital Central, Cuadrante de Paz QP-01' },
                            { 'Destino': 'Municipio Bolívar, parroquia El Carmen, sector Barrio Lindo, calle Calle 3 45, Casa Familia Perez, Cuadrante de Paz QP-02' }
                        ]
                    }
                });

                const config = createMockConfig({
                    fields: {
                        'Ubicación': { label: 'Ubicación', type: 'text' },
                        'Destino': { label: 'Destino', type: 'text' }
                    }
                });

                const result = obtenerCategoriasReporte(report, template, config, {}, mockAddresses);
                expect(result).toContain('6.3 DE CENTROS ASISTENCIALES A CENTROS ASISTENCIALES');
                expect(result).toContain('6.4 DE CENTROS ASISTENCIALES A RESIDENCIAS');
            });

            it('should count multiple legs of the same category multiple times', () => {
                const template = createMockTemplate();
                const report = createMockReport({
                    form_data: {
                        'Ubicación': 'Municipio Bolívar, parroquia El Carmen, sector Centro, calle Av. Principal 12, Hospital Central, Cuadrante de Paz QP-01',
                        'section_1': [
                            { 'Destino': 'Municipio Bolívar, parroquia El Carmen, sector Centro, calle Av. Principal 12, Hospital Central, Cuadrante de Paz QP-01' },
                            { 'Destino': 'Municipio Bolívar, parroquia El Carmen, sector Centro, calle Av. Principal 12, Hospital Central, Cuadrante de Paz QP-01' }
                        ]
                    }
                });

                const config = createMockConfig({
                    fields: {
                        'Ubicación': { label: 'Ubicación', type: 'text' },
                        'Destino': { label: 'Destino', type: 'text' }
                    }
                });

                const result = obtenerCategoriasReporte(report, template, config, {}, mockAddresses);
                const count63 = result.filter(c => c === '6.3 DE CENTROS ASISTENCIALES A CENTROS ASISTENCIALES').length;
                expect(count63).toBe(2);
            });
        });

        describe('Apoyo institucional filtering', () => {
            it('should discard everything except 8.2 APOYOS INSTITUCIONALES when all individual toggles are enabled', () => {
                const report = createMockReport({
                    content: 'Some text (Apoyo institucional) here',
                    form_data: { tipo: 'hurto' }
                });
                const template = createMockTemplate({
                    statistics_category: '5 ATENCIONES AL PÚBLICO',
                    statistics_sub_categories: ['8.1 APOYOS SOCIALES'],
                    statistics_rules: [
                        { field_id: 'tipo', condition: 'hurto', category: '5.1 ATENCIONES PREHOSPITALARIAS', disable_on_apoyo: true },
                    ],
                    disable_main_stat_on_apoyo: true,
                    disabled_sub_categories_on_apoyo: ['8.1 APOYOS SOCIALES']
                });
                
                const result = obtenerCategoriasReporte(report, template);
                
                expect(result).toEqual(['8.2 APOYOS INSTITUCIONALES']);
            });

            it('should discard main category but keep subcategories and rules when they are individually enabled', () => {
                const report = createMockReport({
                    content: 'Some text (Apoyo institucional) here',
                    form_data: { tipo: 'hurto' }
                });
                const template = createMockTemplate({
                    statistics_category: '5 ATENCIONES AL PÚBLICO',
                    statistics_sub_categories: ['8.1 APOYOS SOCIALES'],
                    statistics_rules: [
                        { field_id: 'tipo', condition: 'hurto', category: '5.1 ATENCIONES PREHOSPITALARIAS', disable_on_apoyo: false },
                    ],
                    disable_main_stat_on_apoyo: true,
                    disabled_sub_categories_on_apoyo: []
                });
                
                const result = obtenerCategoriasReporte(report, template);
                
                expect(result).not.toContain('5 ATENCIONES AL PÚBLICO');
                expect(result).toContain('8.1 APOYOS SOCIALES');
                expect(result).toContain('5.1 ATENCIONES PREHOSPITALARIAS');
                expect(result).toContain('8.2 APOYOS INSTITUCIONALES');
            });

            it('should keep main category but discard subcategories and rules when they are individually disabled', () => {
                const report = createMockReport({
                    content: 'Some text (Apoyo institucional) here',
                    form_data: { tipo: 'hurto' }
                });
                const template = createMockTemplate({
                    statistics_category: '5 ATENCIONES AL PÚBLICO',
                    statistics_sub_categories: ['8.1 APOYOS SOCIALES'],
                    statistics_rules: [
                        { field_id: 'tipo', condition: 'hurto', category: '5.1 ATENCIONES PREHOSPITALARIAS', disable_on_apoyo: true },
                    ],
                    disable_main_stat_on_apoyo: false,
                    disabled_sub_categories_on_apoyo: ['8.1 APOYOS SOCIALES']
                });
                
                const result = obtenerCategoriasReporte(report, template);
                
                expect(result).toContain('5 ATENCIONES AL PÚBLICO');
                expect(result).not.toContain('8.1 APOYOS SOCIALES');
                expect(result).not.toContain('5.1 ATENCIONES PREHOSPITALARIAS');
                expect(result).toContain('8.2 APOYOS INSTITUCIONALES');
            });

            it('should load support deactivation options from __meta__ rule in statistics_rules', () => {
                const report = createMockReport({
                    content: 'Some text (Apoyo institucional) here',
                    form_data: { tipo: 'hurto' }
                });
                const template = createMockTemplate({
                    statistics_category: '5 ATENCIONES AL PÚBLICO',
                    statistics_sub_categories: ['8.1 APOYOS SOCIALES'],
                    statistics_rules: [
                        { field_id: 'tipo', condition: 'hurto', category: '5.1 ATENCIONES PREHOSPITALARIAS', disable_on_apoyo: true },
                        { field_id: '__meta__', disable_main_stat_on_apoyo: true, disabled_sub_categories_on_apoyo: ['8.1 APOYOS SOCIALES'] } as any
                    ]
                });
                
                const result = obtenerCategoriasReporte(report, template);
                
                expect(result).toEqual(['8.2 APOYOS INSTITUCIONALES']);
            });
        });
    });

    describe('calculateMonthlyStats', () => {
        const testMonth = 0; // January
        const testYear = 2026;

        it('should accumulate multiple categories for a single report', () => {
            const template = createMockTemplate({
                id: 't1',
                statistics_category: '5 ATENCIONES AL PÚBLICO',
                statistics_rules: [
                    { field_id: 'tipo', condition: 'x', category: '5.1 ATENCIONES PREHOSPITALARIAS' },
                ],
            });
            const reports = [
                createMockReport({
                    template_id: 't1',
                    timestamp: new Date(2026, 0, 5, 10, 0).toISOString(), // 10:00 -> Day 5
                    form_data: { tipo: 'x' }
                }),
            ];
            const result = calcularEstadisticasMensuales(reports, [template], {}, testMonth, testYear);

            expect(result.get('5 ATENCIONES AL PÚBLICO')!.get(5)).toBe(1);
            expect(result.get('5.1 ATENCIONES PREHOSPITALARIAS')!.get(5)).toBe(1);
        });

        it('should correctly attribute reports based on mode', () => {
            const template = createMockTemplate({ 
                id: 't1',
                statistics_category: '1 REPORTES DEL VEN 9-1-1'
            });

            const reports = [
                // Jan 5, 02:00
                createMockReport({
                    id: 'r1',
                    template_id: 't1',
                    timestamp: new Date(2026, 0, 5, 2, 0).toISOString(),
                }),
            ];

            // 1. Statistical Mode: Jan 5 02:00 -> Logical Day 4
            const statStats = calcularEstadisticasMensuales(reports, [template], {}, 0, 2026, 'statistical');
            expect(statStats.get('1 REPORTES DEL VEN 9-1-1')!.get(4)).toBe(1);
            expect(statStats.get('1 REPORTES DEL VEN 9-1-1')!.get(5)).toBeUndefined();

            // 2. Standard Mode: Jan 5 02:00 -> Day 5
            const standardStats = calcularEstadisticasMensuales(reports, [template], {}, 0, 2026, 'standard');
            expect(standardStats.get('1 REPORTES DEL VEN 9-1-1')!.get(5)).toBe(1);
            expect(standardStats.get('1 REPORTES DEL VEN 9-1-1')!.get(4)).toBeUndefined();
        });

        it('should prioritize logical date from form_data over timestamp', () => {
            const template = createMockTemplate({ 
                id: 't1',
                statistics_category: '5.1 ATENCIONES PREHOSPITALARIAS'
            });
            const reports = [
                createMockReport({
                    id: 'r1',
                    template_id: 't1',
                    timestamp: new Date(2026, 0, 10, 10, 0).toISOString(), // Jan 10
                    form_data: { fecha: '05/01/2026', hora: '12:00' } // Jan 5
                }),
            ];

            const stats = calcularEstadisticasMensuales(reports, [template], {}, 0, 2026);
            expect(stats.get('5.1 ATENCIONES PREHOSPITALARIAS')!.get(5)).toBe(1);
            expect(stats.get('5.1 ATENCIONES PREHOSPITALARIAS')!.get(10)).toBeUndefined();
        });
    });
});
