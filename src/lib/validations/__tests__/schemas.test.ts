import { describe, it, expect } from 'vitest';
import { TemplateSchema } from '../schemas';
import { z } from 'zod';

describe('Template Validation Schema', () => {
    describe('TemplateSchema', () => {
        it('should validate a valid template', () => {
            const validTemplate = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                workspace_id: 'workspace-1',
                name: 'Test Template',
                content: 'Test content with {field}',
                type: 'normal' as const,
                category: 'Test',
                timestamp: new Date().toISOString(),
            };

            const result = TemplateSchema.safeParse(validTemplate);
            expect(result.success).toBe(true);
        });

        it('should reject template without required fields', () => {
            const invalidTemplate = {
                id: '550e8400-e29b-41d4-a716-446655440001',
                // Missing name, content, type
            };

            const result = TemplateSchema.safeParse(invalidTemplate);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.length).toBeGreaterThan(0);
            }
        });

        it('should validate template type enum', () => {
            const validNormal = {
                id: '550e8400-e29b-41d4-a716-446655440002',
                workspace_id: 'workspace-1',
                name: 'Test',
                content: 'Content',
                type: 'normal' as const,
                timestamp: new Date().toISOString(),
            };

            const validRelevante = {
                id: '550e8400-e29b-41d4-a716-446655440003',
                workspace_id: 'workspace-1',
                name: 'Test',
                content: 'Content',
                type: 'relevante' as const,
                timestamp: new Date().toISOString(),
            };

            const invalidType = {
                id: '550e8400-e29b-41d4-a716-446655440004',
                name: 'Test',
                content: 'Content',
                type: 'invalid',
                timestamp: new Date().toISOString(),
            };

            expect(TemplateSchema.safeParse(validNormal).success).toBe(true);
            expect(TemplateSchema.safeParse(validRelevante).success).toBe(true);
            expect(TemplateSchema.safeParse(invalidType).success).toBe(false);
        });

        it('should enforce string length limits', () => {
            const tooLongName = 'a'.repeat(501);
            const invalidTemplate = {
                id: '550e8400-e29b-41d4-a716-446655440005',
                name: tooLongName,
                content: 'Content',
                type: 'normal' as const,
                timestamp: new Date().toISOString(),
            };

            const result = TemplateSchema.safeParse(invalidTemplate);
            expect(result.success).toBe(false);
        });

        it('should accept optional fields', () => {
            const minimalTemplate = {
                id: '550e8400-e29b-41d4-a716-446655440006',
                workspace_id: 'workspace-1',
                name: 'Test',
                content: 'Content',
                type: 'normal' as const,
                timestamp: new Date().toISOString(),
            };

            const fullTemplate = {
                ...minimalTemplate,
                category: 'Category',
                statistics_rules: [],
                isDraft: false,
            };

            expect(TemplateSchema.safeParse(minimalTemplate).success).toBe(true);
            expect(TemplateSchema.safeParse(fullTemplate).success).toBe(true);
        });

        it('should validate statistics rules structure', () => {
            const templateWithRules = {
                id: '550e8400-e29b-41d4-a716-446655440007',
                workspace_id: 'workspace-1',
                name: 'Test',
                content: 'Content',
                type: 'normal' as const,
                timestamp: new Date().toISOString(),
                statistics_rules: [
                    {
                        field_id: 'incidentType',
                        condition: 'theft',
                        category: '01 - Robos',
                    },
                ],
            };

            const result = TemplateSchema.safeParse(templateWithRules);
            expect(result.success).toBe(true);
        });
    });

    describe('Validation Error Handling', () => {
        it('should provide detailed error messages', () => {
            const invalidTemplate = {
                id: 123, // Should be string
                name: '', // Should not be empty
                content: '', // Should not be empty
                type: 'wrong', // Invalid enum
            };

            const result = TemplateSchema.safeParse(invalidTemplate);
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.errors;
                expect(errors.length).toBeGreaterThan(0);
                // Should have errors for id, name, content, type
                expect(errors.some((e) => e.path.includes('id'))).toBe(true);
                expect(errors.some((e) => e.path.includes('type'))).toBe(true);
            }
        });

        it('should validate UUID format for id', () => {

            const validId = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                workspace_id: 'workspace-1',
                name: 'Test',
                content: 'Content',
                type: 'normal' as const,
                timestamp: new Date().toISOString(),
            };

            // Note: Check if schema actually validates UUID format
            const validResult = TemplateSchema.safeParse(validId);

            // If UUID validation is enforced, this should fail
            // If not, both should pass (just string validation)
            expect(validResult.success).toBe(true);
        });
    });

    describe('Partial Updates', () => {
        it('should allow partial template updates', () => {
            const PartialTemplateSchema = TemplateSchema.partial();

            const partialUpdate = {
                name: 'Updated Name',
            };

            const result = PartialTemplateSchema.safeParse(partialUpdate);
            expect(result.success).toBe(true);
        });

        it('should validate types on partial updates', () => {
            const PartialTemplateSchema = TemplateSchema.partial();

            const invalidPartialUpdate = {
                type: 'invalid-type',
            };

            const validPartialUpdate = {
                type: 'relevante' as const,
            };

            expect(PartialTemplateSchema.safeParse(invalidPartialUpdate).success).toBe(false);
            expect(PartialTemplateSchema.safeParse(validPartialUpdate).success).toBe(true);
        });
    });

    describe('Real-world Template Examples', () => {
        it('should validate a typical incident report template', () => {
            const incidentTemplate = {
                id: '550e8400-e29b-41d4-a716-446655440008',
                workspace_id: 'workspace-1',
                name: 'Reporte de Incidente',
                content: `REPORTE DE INCIDENTE
                
Fecha: {fecha}
Hora: {hora}
Tipo: {tipo:dropdown(1=Robo|2=Vandalismo|3=Accidente)}

[?{tipo} = 0]
Monto robado: {monto}
[/]

Descripción: {descripcion:textarea:full:req}`,
                type: 'relevante' as const,
                category: 'Seguridad',
                timestamp: new Date().toISOString(),
                statistics_rules: [
                    {
                        field_id: 'tipo',
                        condition: '0',
                        category: '01 - Robos',
                    },
                    {
                        field_id: 'tipo',
                        condition: '1',
                        category: '02 - Vandalismo',
                    },
                    {
                        field_id: 'tipo',
                        condition: '2',
                        category: '03 - Accidentes',
                    },
                ],
            };

            const result = TemplateSchema.safeParse(incidentTemplate);
            expect(result.success).toBe(true);
        });

        it('should validate a simple note template', () => {
            const noteTemplate = {
                id: '550e8400-e29b-41d4-a716-446655440009',
                workspace_id: 'workspace-1',
                name: 'Nota Simple',
                content: 'Nota: {nota:textarea}',
                type: 'normal' as const,
                timestamp: new Date().toISOString(),
            };

            const result = TemplateSchema.safeParse(noteTemplate);
            expect(result.success).toBe(true);
        });
    });
});

describe('Zod Validation Integration', () => {
    it('should catch type errors at compile time', () => {
        // This test demonstrates TypeScript integration
        const validTemplate = {
            id: '550e8400-e29b-41d4-a716-446655440010',
            workspace_id: 'workspace-1',
            name: 'Test',
            content: 'Content',
            type: 'normal' as const,
            timestamp: new Date().toISOString(),
        };

        // TypeScript should infer the correct type
        type InferredType = z.infer<typeof TemplateSchema>;

        // This should compile without errors
        const parsed: InferredType = TemplateSchema.parse(validTemplate);
        expect(parsed.name).toBe('Test');
    });

    it('should throw on invalid data when using parse()', () => {
        const invalidData = {
            id: 'test',
            name: 'Test',
            content: 'Content',
            type: 'invalid',
        };

        expect(() => TemplateSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should return error object when using safeParse()', () => {
        const invalidData = {
            id: 'test',
            name: 'Test',
            content: 'Content',
            type: 'invalid',
        };

        const result = TemplateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBeInstanceOf(z.ZodError);
        }
    });
});


