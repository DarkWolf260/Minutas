/**
 * report-sorter.test.ts
 * 
 * Unit tests for report sorting utility functions
 */

import { describe, it, expect } from 'vitest';
import { findValueInform_data, sortReports } from '../report-sorter';
import type { Report } from '@/lib/types';

// Helper to create mock reports
function createMockReport(overrides: Partial<Report> = {}): Report {
    return {
        id: `report-${Date.now()}`,
        workspace_id: 'workspace-1',
        template_id: 'template-1',
        title: 'Test Report',
        content: 'Test content',
        is_relevant: true,
        timestamp: new Date().toISOString(),
        status: 'Finalizado',
        form_data: {},
        ...overrides,
    };
}

describe('report-sorter', () => {
    describe('findValueInform_data', () => {
        it('should find top-level field (case-insensitive)', () => {
            const form_data = { Fecha: '2026-01-27', Hora: '14:30' };
            expect(findValueInform_data(form_data, 'Fecha')).toBe('2026-01-27');
            expect(findValueInform_data(form_data, 'fecha')).toBe('2026-01-27');
            expect(findValueInform_data(form_data, 'FECHA')).toBe('2026-01-27');
        });

        it('should find nested field in section', () => {
            const form_data = {
                section1: {
                    Campo1: 'Valor1',
                    Campo2: 'Valor2',
                },
            };
            expect(findValueInform_data(form_data, 'Campo1')).toBe('Valor1');
        });

        it('should prioritize top-level over nested', () => {
            const form_data = {
                Campo: 'Top',
                section1: {
                    Campo: 'Nested',
                },
            };
            expect(findValueInform_data(form_data, 'Campo')).toBe('Top');
        });

        it('should return null for missing field', () => {
            const form_data = { Fecha: '2026-01-27' };
            expect(findValueInform_data(form_data, 'NoExiste')).toBeNull();
        });

        it('should return null for undefined form_data', () => {
            expect(findValueInform_data(undefined, 'Fecha')).toBeNull();
        });

        it('should handle empty form_data', () => {
            expect(findValueInform_data({}, 'Fecha')).toBeNull();
        });

        it('should not search in arrays', () => {
            const form_data = {
                items: [{ field: 'value' }],
            };
            expect(findValueInform_data(form_data, 'field')).toBeNull();
        });

        it('should handle multiple nested levels', () => {
            const form_data = {
                section1: {
                    subsection: {
                        // This won't be found - only 1 level deep
                        DeepField: 'value',
                    },
                    ShallowField: 'found',
                },
            };
            expect(findValueInform_data(form_data, 'ShallowField')).toBe('found');
            expect(findValueInform_data(form_data, 'DeepField')).toBeNull();
        });
    });

    describe('sortReports', () => {
        describe('Basic Sorting', () => {
            it('should sort reports by date/time in ascending order', () => {
                const reports = [
                    createMockReport({
                        id: '3',
                        form_data: { Fecha: '2026-01-27', Hora: '14:00' },
                    }),
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-26', Hora: '12:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('1'); // 01/25 10:00
                expect(sorted[1]?.id).toBe('2'); // 01/26 12:00
                expect(sorted[2]?.id).toBe('3'); // 01/27 14:00
            });

            it('should sort reports in descending order', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                    createMockReport({
                        id: '3',
                        form_data: { Fecha: '2026-01-27', Hora: '14:00' },
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-26', Hora: '12:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'desc');

                expect(sorted[0]?.id).toBe('3'); // 01/27 14:00
                expect(sorted[1]?.id).toBe('2'); // 01/26 12:00
                expect(sorted[2]?.id).toBe('1'); // 01/25 10:00
            });

            it('should default to ascending order', () => {
                const reports = [
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-27', Hora: '14:00' },
                    }),
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports); // No direction specified

                expect(sorted[0]?.id).toBe('1');
                expect(sorted[1]?.id).toBe('2');
            });
        });

        describe('Same Date, Different Times', () => {
            it('should sort by time when dates are the same', () => {
                const reports = [
                    createMockReport({
                        id: '3',
                        form_data: { Fecha: '2026-01-27', Hora: '14:00' },
                    }),
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-27', Hora: '08:00' },
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-27', Hora: '12:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('1'); // 08:00
                expect(sorted[1]?.id).toBe('2'); // 12:00
                expect(sorted[2]?.id).toBe('3'); // 14:00
            });
        });

        describe('Missing or Invalid Date/Time', () => {
            it('should put reports with valid dates before those without', () => {
                const reports = [
                    createMockReport({ id: '2' }), // No fecha/hora
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('1'); // Has date
                expect(sorted[1]?.id).toBe('2'); // No date
            });

            it('should handle missing Fecha field', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Hora: '10:00' }, // Missing Fecha
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('2'); // Has both
                expect(sorted[1]?.id).toBe('1'); // Missing Fecha
            });

            it('should handle missing Hora field', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25' }, // Missing Hora
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('2'); // Has both
                expect(sorted[1]?.id).toBe('1'); // Missing Hora
            });

            it('should handle invalid date format', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: 'invalid', Hora: '10:00' },
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('2'); // Valid
                expect(sorted[1]?.id).toBe('1'); // Invalid
            });

            it('should handle invalid time format', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: 'invalid' },
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('2'); // Valid
                expect(sorted[1]?.id).toBe('1'); // Invalid
            });

            it('should handle hours > 23', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '25:00' }, // Invalid hour
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('2');
                expect(sorted[1]?.id).toBe('1');
            });

            it('should handle minutes > 59', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:60' }, // Invalid minutes
                    }),
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('2');
                expect(sorted[1]?.id).toBe('1');
            });
        });

        describe('Fallback to ID Sorting', () => {
            it('should sort by ID when both reports have no date/time', () => {
                const reports = [
                    createMockReport({ id: 'report-300', form_data: {} }),
                    createMockReport({ id: 'report-100', form_data: {} }),
                    createMockReport({ id: 'report-200', form_data: {} }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('report-100');
                expect(sorted[1]?.id).toBe('report-200');
                expect(sorted[2]?.id).toBe('report-300');
            });

            it('should sort by ID in descending order when no dates', () => {
                const reports = [
                    createMockReport({ id: 'report-100', form_data: {} }),
                    createMockReport({ id: 'report-300', form_data: {} }),
                ];

                const sorted = sortReports(reports, 'desc');

                expect(sorted[0]?.id).toBe('report-300');
                expect(sorted[1]?.id).toBe('report-100');
            });

            it('should use ID when dates/times are identical', () => {
                const reports = [
                    createMockReport({
                        id: 'report-200',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                    createMockReport({
                        id: 'report-100',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted[0]?.id).toBe('report-100');
                expect(sorted[1]?.id).toBe('report-200');
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty array', () => {
                const sorted = sortReports([], 'asc');
                expect(sorted).toEqual([]);
            });

            it('should handle single report', () => {
                const reports = [
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const sorted = sortReports(reports, 'asc');

                expect(sorted).toHaveLength(1);
                expect(sorted[0]?.id).toBe('1');
            });

            it('should not mutate original array', () => {
                const reports = [
                    createMockReport({
                        id: '2',
                        form_data: { Fecha: '2026-01-27', Hora: '14:00' },
                    }),
                    createMockReport({
                        id: '1',
                        form_data: { Fecha: '2026-01-25', Hora: '10:00' },
                    }),
                ];

                const original = [...reports];
                sortReports(reports, 'asc');

                expect(reports).toEqual(original); // Should not mutate
            });
        });
    });
});


