/**
 * statistics-utils.test.ts
 * 
 * Unit tests for statistics utility functions
 */

import { describe, it, expect } from 'vitest';
import { getReportCategories, calculateMonthlyStats } from '../statistics-utils';
import type { Report, Template, TemplateConfig } from '@/lib/types';

// Mock data factories
function createMockReport(overrides: Partial<Report> = {}): Report {
    return {
        id: 'report-1',
        workspaceId: 'workspace-1',
        templateId: 'template-1',
        title: 'Test Report',
        content: 'Test content',
        isRelevant: true,
        formData: {},
        status: 'Finalizado',
        timestamp: new Date(2026, 0, 15, 10, 30).toISOString(), // Jan 15, 2026
        ...overrides,
    };
}

function createMockTemplate(overrides: Partial<Template> = {}): Template {
    return {
        id: 'template-1',
        workspaceId: 'workspace-1',
        name: 'Test Template',
        content: '{Field1}',
        type: 'normal',
        isActive: true,
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
            const result = getReportCategories(report, undefined);
            expect(result).toEqual([]);
        });

        it('should return empty array when template has no category or rules', () => {
            const report = createMockReport();
            const template = createMockTemplate();
            const result = getReportCategories(report, template);
            expect(result).toEqual([]);
        });

        it('should return default category when no rules match', () => {
            const report = createMockReport();
            const template = createMockTemplate({
                statisticsCategory: '1.2 LLAMADAS DE EMERGENCIAS',
            });
            const result = getReportCategories(report, template);
            expect(result).toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should include both default category and matching rules', () => {
            const report = createMockReport({
                formData: { tipo: 'hurto' },
            });
            const template = createMockTemplate({
                statisticsCategory: '5 ATENCIONES AL PÚBLICO',
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'hurto', category: '5.1 ATENCIONES PREHOSPITALARIAS' },
                ],
            });
            const result = getReportCategories(report, template);
            expect(result).toContain('5 ATENCIONES AL PÚBLICO');
            expect(result).toContain('5.1 ATENCIONES PREHOSPITALARIAS');
        });

        it('should match conditional rule case-insensitively', () => {
            const report = createMockReport({
                formData: { tipo: 'HURTO' },
            });
            const template = createMockTemplate({
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'hurto', category: '1.2 LLAMADAS DE EMERGENCIAS' },
                ],
            });
            const result = getReportCategories(report, template);
            expect(result).toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should handle missing formData field gracefully', () => {
            const report = createMockReport({
                formData: {},
            });
            const template = createMockTemplate({
                statisticsCategory: '1 REPORTES DEL VEN 9-1-1',
                statisticsRules: [
                    { fieldId: 'nonexistent', condition: 'value', category: '1.2 LLAMADAS DE EMERGENCIAS' },
                ],
            });
            const result = getReportCategories(report, template);
            expect(result).toContain('1 REPORTES DEL VEN 9-1-1');
            expect(result).not.toContain('1.2 LLAMADAS DE EMERGENCIAS');
        });

        it('should resolve dropdown labels correctly for rules', () => {
            const report = createMockReport({
                formData: { tipo_aph: 'residencia' },
            });
            const template = createMockTemplate({
                statisticsRules: [
                    { fieldId: 'Tipo de APH', operator: '=', condition: 'Residencia', category: '5.3 EN RESIDENCIA' },
                ],
            });
            const config = createMockConfig({
                fields: {
                    'tipo_aph': { 
                        label: 'Tipo de APH', 
                        type: 'dropdown',
                        snippetOptions: [
                            { id: 'opt-1', value: 'residencia', label: 'Residencia' }
                        ]
                    }
                }
            });
            const result = getReportCategories(report, template, config);
            expect(result).toContain('5.3 EN RESIDENCIA');
        });

        it('should handle multi-value fields correctly', () => {
            const report = createMockReport({
                formData: { symptoms: ['fever', 'cough'] },
            });
            const template = createMockTemplate({
                statisticsRules: [
                    { fieldId: 'symptoms', operator: '=', condition: 'fever', category: '5.1 ATENCIONES PREHOSPITALARIAS' },
                    { fieldId: 'symptoms', operator: '=', condition: 'cough', category: '5.2 EN TRASLADOS' },
                ],
            });
            const result = getReportCategories(report, template);
            expect(result).toContain('5.1 ATENCIONES PREHOSPITALARIAS');
            expect(result).toContain('5.2 EN TRASLADOS');
        });

        it('should not double count when rule and general category are the same', () => {
            const report = createMockReport({
                formData: { destiny: 'Guanta' },
            });
            const template = createMockTemplate({
                statisticsCategory: '6.2 TRASLADOS EXTRAURBANOS',
                statisticsRules: [
                    { fieldId: 'destiny', operator: '=', condition: 'Guanta', category: '6.2 TRASLADOS EXTRAURBANOS' },
                ],
            });
            const result = getReportCategories(report, template);
            // Should only contain ONE instance of 6.2
            const count = result.filter(c => c === '6.2 TRASLADOS EXTRAURBANOS').length;
            expect(count).toBe(1);
        });
    });

    describe('calculateMonthlyStats', () => {
        const testMonth = 0; // January
        const testYear = 2026;

        it('should accumulate multiple categories for a single report', () => {
            const template = createMockTemplate({
                id: 't1',
                statisticsCategory: '5 ATENCIONES AL PÚBLICO',
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'x', category: '5.1 ATENCIONES PREHOSPITALARIAS' },
                ],
            });
            const reports = [
                createMockReport({
                    templateId: 't1',
                    timestamp: new Date(2026, 0, 5, 10, 0).toISOString(), // 10:00 -> Day 5
                    formData: { tipo: 'x' }
                }),
            ];
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            expect(result.get('5 ATENCIONES AL PÚBLICO')!.get(5)).toBe(1);
            expect(result.get('5.1 ATENCIONES PREHOSPITALARIAS')!.get(5)).toBe(1);
        });

        it('should correctly attribute reports based on mode', () => {
            const template = createMockTemplate({ 
                id: 't1',
                statisticsCategory: '1 REPORTES DEL VEN 9-1-1'
            });

            const reports = [
                // Jan 5, 02:00
                createMockReport({
                    id: 'r1',
                    templateId: 't1',
                    timestamp: new Date(2026, 0, 5, 2, 0).toISOString(),
                }),
            ];

            // 1. Statistical Mode: Jan 5 02:00 -> Logical Day 4
            const statStats = calculateMonthlyStats(reports, [template], {}, 0, 2026, 'statistical');
            expect(statStats.get('1 REPORTES DEL VEN 9-1-1')!.get(4)).toBe(1);
            expect(statStats.get('1 REPORTES DEL VEN 9-1-1')!.get(5)).toBeUndefined();

            // 2. Standard Mode: Jan 5 02:00 -> Day 5
            const standardStats = calculateMonthlyStats(reports, [template], {}, 0, 2026, 'standard');
            expect(standardStats.get('1 REPORTES DEL VEN 9-1-1')!.get(5)).toBe(1);
            expect(standardStats.get('1 REPORTES DEL VEN 9-1-1')!.get(4)).toBeUndefined();
        });

        it('should prioritize logical date from formData over timestamp', () => {
            const template = createMockTemplate({ 
                id: 't1',
                statisticsCategory: '5.1 ATENCIONES PREHOSPITALARIAS'
            });
            const reports = [
                createMockReport({
                    id: 'r1',
                    templateId: 't1',
                    timestamp: new Date(2026, 0, 10, 10, 0).toISOString(), // Jan 10
                    formData: { fecha: '05/01/2026', hora: '12:00' } // Jan 5
                }),
            ];

            const stats = calculateMonthlyStats(reports, [template], {}, 0, 2026);
            expect(stats.get('5.1 ATENCIONES PREHOSPITALARIAS')!.get(5)).toBe(1);
            expect(stats.get('5.1 ATENCIONES PREHOSPITALARIAS')!.get(10)).toBeUndefined();
        });
    });
});
