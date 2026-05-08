/**
 * statistics-utils.test.ts
 * 
 * Unit tests for statistics utility functions
 */

import { describe, it, expect } from 'vitest';
import { obtenerCategoriasReporte, calcularEstadisticasMensuales } from '../estadisticas-utils';
import type { Report, Template, TemplateConfig } from '@/lib/types';

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

            // Matches primary but none of the OR conditions -> fail
            const report1 = createMockReport({ form_data: { type: 'emergency', priority: 'low' } });
            expect(obtenerCategoriasReporte(report1, template)).not.toContain('1.2 LLAMADAS DE EMERGENCIAS');

            // Matches primary and one of the OR conditions -> success
            const report2 = createMockReport({ form_data: { type: 'emergency', priority: 'high' } });
            expect(obtenerCategoriasReporte(report2, template)).toContain('1.2 LLAMADAS DE EMERGENCIAS');

            // Matches primary and another OR condition -> success
            const report3 = createMockReport({ form_data: { type: 'emergency', priority: 'critical' } });
            expect(obtenerCategoriasReporte(report3, template)).toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should handle complex rules with both conditions (AND) and orConditions (OR)', () => {
            const template = createMockTemplate({
                statistics_rules: [
                    { 
                        field_id: 'a', 
                        operator: '=', 
                        condition: '1', 
                        category: 'CAT',
                        conditions: [
                            { field_id: 'b', operator: '=', condition: '2' }
                        ],
                        or_conditions: [
                            { field_id: 'c', operator: '=', condition: '3' },
                            { field_id: 'd', operator: '=', condition: '4' }
                        ]
                    },
                ],
            });

            // a=1, b=2, c=3 (matches primary, AND, and one OR) -> success
            const r1 = createMockReport({ form_data: { a: '1', b: '2', c: '3' } });
            expect(obtenerCategoriasReporte(r1, template)).toContain('CAT');

            // a=1, b=1, c=3 (fails AND) -> fail
            const r2 = createMockReport({ form_data: { a: '1', b: '1', c: '3' } });
            expect(obtenerCategoriasReporte(r2, template)).not.toContain('CAT');

            // a=1, b=2, c=1 (fails OR) -> fail
            const r3 = createMockReport({ form_data: { a: '1', b: '2', c: '1' } });
            expect(obtenerCategoriasReporte(r3, template)).not.toContain('CAT');
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



