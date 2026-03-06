/**
 * statistics-utils.test.ts
 * 
 * Unit tests for statistics utility functions
 */

import { describe, it, expect } from 'vitest';
import { getReportCategory, calculateMonthlyStats } from '../statistics-utils';
import type { Report, Template, TemplateConfig } from '@/types';

// Mock data factories
function createMockReport(overrides: Partial<Report> = {}): Report {
    return {
        id: 'report-1',
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
        name: 'Test Template',
        content: '{Field1}',
        type: 'normal',
        isActive: true,
        ...overrides,
    };
}



describe('statistics-utils', () => {
    describe('getReportCategory', () => {
        it('should return null when template is undefined', () => {
            const report = createMockReport();
            const result = getReportCategory(report, undefined);
            expect(result).toBeNull();
        });

        it('should return null when template has no category or rules', () => {
            const report = createMockReport();
            const template = createMockTemplate();
            const result = getReportCategory(report, template);
            expect(result).toBeNull();
        });

        it('should return default category when no rules match', () => {
            const report = createMockReport();
            const template = createMockTemplate({
                statisticsCategory: '1.3 ROBOS',
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.3 ROBOS');
        });

        it('should normalize category to uppercase and trim', () => {
            const report = createMockReport();
            const template = createMockTemplate({
                statisticsCategory: '  1.3 robos  ',
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.3 ROBOS');
        });

        it('should prioritize conditional rules over default category', () => {
            const report = createMockReport({
                formData: { tipo: 'hurto' },
            });
            const template = createMockTemplate({
                statisticsCategory: '1.3 ROBOS',
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'hurto', category: '1.2 HURTOS' },
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.2 HURTOS');
        });

        it('should match conditional rule case-insensitively', () => {
            const report = createMockReport({
                formData: { tipo: 'HURTO' },
            });
            const template = createMockTemplate({
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'hurto', category: '1.2 HURTOS' },
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.2 HURTOS');
        });

        it('should trim whitespace in condition matching', () => {
            const report = createMockReport({
                formData: { tipo: '  hurto  ' },
            });
            const template = createMockTemplate({
                statisticsRules: [
                    { fieldId: 'tipo', condition: '  hurto  ', category: '1.2 HURTOS' },
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.2 HURTOS');
        });

        it('should use first matching rule when multiple rules defined', () => {
            const report = createMockReport({
                formData: { tipo: 'robo' },
            });
            const template = createMockTemplate({
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'robo', category: '1.3 ROBOS' },
                    { fieldId: 'tipo', condition: 'robo', category: '1.4 OTHER' }, // Should not be used
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.3 ROBOS');
        });

        it('should return default category when no rules match', () => {
            const report = createMockReport({
                formData: { tipo: 'accidente' },
            });
            const template = createMockTemplate({
                statisticsCategory: '2.1 ACCIDENTES',
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'robo', category: '1.3 ROBOS' },
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('2.1 ACCIDENTES');
        });

        it('should handle missing formData field gracefully', () => {
            const report = createMockReport({
                formData: {},
            });
            const template = createMockTemplate({
                statisticsCategory: '1.0 DEFAULT',
                statisticsRules: [
                    { fieldId: 'nonexistent', condition: 'value', category: '1.1 OTHER' },
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.0 DEFAULT');
        });

        it('should handle null/undefined values in formData', () => {
            const report = createMockReport({
                formData: { tipo: null },
            });
            const template = createMockTemplate({
                statisticsCategory: '1.0 DEFAULT',
                statisticsRules: [
                    { fieldId: 'tipo', condition: 'robo', category: '1.3 ROBOS' },
                ],
            });
            const result = getReportCategory(report, template);
            expect(result).toBe('1.0 DEFAULT');
        });
    });

    describe('calculateMonthlyStats', () => {
        const testMonth = 0; // January
        const testYear = 2026;

        it('should return empty stats for no reports', () => {
            const result = calculateMonthlyStats([], [], {}, testMonth, testYear);
            expect(result).toBeInstanceOf(Map);
            // Should have default categories initialized
            expect(result.size).toBeGreaterThan(0);
        });

        it('should filter reports by month and year', () => {
            const reports = [
                createMockReport({ timestamp: new Date(2026, 0, 5).toISOString() }), // Jan 2026 - included
                createMockReport({ timestamp: new Date(2026, 1, 5).toISOString() }), // Feb 2026 - excluded
                createMockReport({ timestamp: new Date(2025, 0, 5).toISOString() }), // Jan 2025 - excluded
            ];
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const testCat = result.get('1.0 TEST');
            expect(testCat).toBeDefined();
            expect(testCat!.get(5)).toBe(1); // Only 1 report on day 5
        });

        it('should only count Finalizado reports', () => {
            const reports = [
                createMockReport({ status: 'Finalizado', timestamp: new Date(2026, 0, 5).toISOString() }),
                createMockReport({ status: 'En proceso', timestamp: new Date(2026, 0, 5).toISOString() }),
                createMockReport({ status: undefined, timestamp: new Date(2026, 0, 5).toISOString() }),
            ];
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const testCat = result.get('1.0 TEST');
            expect(testCat!.get(5)).toBe(1); // Only 1 Finalizado report
        });

        it('should count reports by day correctly', () => {
            const reports = [
                createMockReport({ timestamp: new Date(2026, 0, 5).toISOString() }),
                createMockReport({ timestamp: new Date(2026, 0, 5).toISOString() }),
                createMockReport({ timestamp: new Date(2026, 0, 10).toISOString() }),
            ];
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const testCat = result.get('1.0 TEST');
            expect(testCat!.get(5)).toBe(2); // 2 reports on day 5
            expect(testCat!.get(10)).toBe(1); // 1 report on day 10
        });

        it('should handle DD/MM/YYYY timestamp format', () => {
            const reports = [
                createMockReport({ timestamp: '15/01/2026' }), // Venezuelan format
            ];
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const testCat = result.get('1.0 TEST');
            expect(testCat!.get(15)).toBe(1);
        });

        it('should handle DD/MM/YYYY HH:MM timestamp format', () => {
            const reports = [
                createMockReport({ timestamp: '15/01/2026, 14:30' }), // Venezuelan format with time
            ];
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const testCat = result.get('1.0 TEST');
            expect(testCat!.get(15)).toBe(1);
        });

        it('should skip reports with invalid timestamps', () => {
            const reports = [
                createMockReport({ timestamp: 'invalid-date' }),
                createMockReport({ timestamp: '' }),
                createMockReport({ timestamp: undefined as any }),
            ];
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const testCat = result.get('1.0 TEST');
            expect(testCat?.size || 0).toBe(0); // No valid dates
        });

        it('should categorize reports correctly based on template', () => {
            const templates = [
                createMockTemplate({ id: 't1', statisticsCategory: '1.1 CATEGORY_A' }),
                createMockTemplate({ id: 't2', statisticsCategory: '1.2 CATEGORY_B' }),
            ];
            const reports = [
                createMockReport({ templateId: 't1', timestamp: new Date(2026, 0, 5).toISOString() }),
                createMockReport({ templateId: 't2', timestamp: new Date(2026, 0, 5).toISOString() }),
            ];
            const result = calculateMonthlyStats(reports, templates, {}, testMonth, testYear);

            expect(result.get('1.1 CATEGORY_A')!.get(5)).toBe(1);
            expect(result.get('1.2 CATEGORY_B')!.get(5)).toBe(1);
        });

        it('should count repeatable section items', () => {
            const config: TemplateConfig = {
                fields: {},
                layout: [],
                sections: [
                    {
                        id: 'section1',
                        label: 'Test Section',
                        isRepeatable: true,
                        statisticsCategory: '2.1 REPEATABLE',
                        fieldIds: [],
                    },
                ],
            };
            const reports = [
                createMockReport({
                    templateId: 'template1',
                    timestamp: new Date(2026, 0, 10).toISOString(),
                    formData: {
                        section1: [{ item: '1' }, { item: '2' }, { item: '3' }], // 3 items
                    },
                }),
            ];
            const template = createMockTemplate({ id: 'template1' });
            const result = calculateMonthlyStats(reports, [template], { template1: config }, testMonth, testYear);

            const cat = result.get('2.1 REPEATABLE');
            expect(cat!.get(10)).toBe(3); // 3 items counted
        });

        it('should count non-repeatable sections as 1 when present', () => {
            const config: TemplateConfig = {
                fields: {},
                layout: [],
                sections: [
                    {
                        id: 'section1',
                        label: 'Test Section',
                        isRepeatable: false,
                        statisticsCategory: '2.2 NON_REPEATABLE',
                        fieldIds: [],
                    },
                ],
            };
            const reports = [
                createMockReport({
                    templateId: 'template1',
                    timestamp: new Date(2026, 0, 10).toISOString(),
                    formData: {
                        section1: { field: 'value' },
                    },
                }),
            ];
            const template = createMockTemplate({ id: 'template1' });
            const result = calculateMonthlyStats(reports, [template], { template1: config }, testMonth, testYear);

            const cat = result.get('2.2 NON_REPEATABLE');
            expect(cat!.get(10)).toBe(1); // 1 count for presence
        });

        it('should not count empty sections', () => {
            const config: TemplateConfig = {
                fields: {},
                layout: [],
                sections: [
                    {
                        id: 'section1',
                        label: 'Test Section',
                        isRepeatable: true,
                        statisticsCategory: '2.1 TEST',
                        fieldIds: [],
                    },
                ],
            };
            const reports = [
                createMockReport({
                    templateId: 'template1',
                    timestamp: new Date(2026, 0, 10).toISOString(),
                    formData: {
                        section1: [], // Empty array
                    },
                }),
            ];
            const template = createMockTemplate({ id: 'template1' });
            const result = calculateMonthlyStats(reports, [template], { template1: config }, testMonth, testYear);

            const cat = result.get('2.1 TEST');
            expect(cat!.get(10)).toBeUndefined(); // No count
        });

        it('should aggregate multiple reports into same category and day', () => {
            const template = createMockTemplate({ statisticsCategory: '1.0 TEST' });
            const reports = [
                createMockReport({ timestamp: new Date(2026, 0, 15).toISOString() }),
                createMockReport({ timestamp: new Date(2026, 0, 15).toISOString() }),
                createMockReport({ timestamp: new Date(2026, 0, 15).toISOString() }),
            ];
            const result = calculateMonthlyStats(reports, [template], {}, testMonth, testYear);

            const cat = result.get('1.0 TEST');
            expect(cat!.get(15)).toBe(3);
        });
    });
});
