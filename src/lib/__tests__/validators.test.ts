/**
 * validators.test.ts
 * 
 * Unit tests for validator utility functions
 */

import { describe, it, expect } from 'vitest';
import { isValidJson, validateTemplateSyntax } from '../validators';

describe('validators', () => {
    describe('isValidJson', () => {
        it('should return true for valid JSON string', () => {
            const validJson = '{"name": "Test", "value": 123}';
            expect(isValidJson(validJson)).toBe(true);
        });

        it('should return true for valid JSON array', () => {
            const validJson = '[1, 2, 3, "test"]';
            expect(isValidJson(validJson)).toBe(true);
        });

        it('should return true for empty object', () => {
            expect(isValidJson('{}')).toBe(true);
        });

        it('should return true for empty array', () => {
            expect(isValidJson('[]')).toBe(true);
        });

        it('should return true for null', () => {
            expect(isValidJson('null')).toBe(true);
        });

        it('should return true for boolean values', () => {
            expect(isValidJson('true')).toBe(true);
            expect(isValidJson('false')).toBe(true);
        });

        it('should return true for number values', () => {
            expect(isValidJson('123')).toBe(true);
            expect(isValidJson('123.45')).toBe(true);
        });

        it('should return false for invalid JSON', () => {
            const invalidJson = '{name: "Test"}'; // Missing quotes
            expect(isValidJson(invalidJson)).toBe(false);
        });

        it('should return false for unclosed braces', () => {
            const invalidJson = '{"name": "Test"';
            expect(isValidJson(invalidJson)).toBe(false);
        });

        it('should return false for trailing commas', () => {
            const invalidJson = '{"name": "Test",}';
            expect(isValidJson(invalidJson)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isValidJson('')).toBe(false);
        });

        it('should return false for plain text', () => {
            expect(isValidJson('plain text')).toBe(false);
        });

        it('should handle nested complex objects', () => {
            const complexJson = '{"user":{"name":"John","age":30,"hobbies":["reading","coding"]}}';
            expect(isValidJson(complexJson)).toBe(true);
        });
    });

    describe('validateTemplateSyntax', () => {
        describe('Valid Templates', () => {
            it('should validate template with balanced braces', () => {
                const template = '{Nombre} {Apellido}';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true);
                expect(result.error).toBeUndefined();
            });

            it('should validate template with balanced brackets', () => {
                const template = '["Sección 1"] Contenido ["Sección 2"]';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true);
            });

            it('should validate template with balanced conditionals', () => {
                const template = '[?{Campo}=valor] Contenido [/]';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true);
            });

            it('should validate empty template', () => {
                const result = validateTemplateSyntax('');
                expect(result.valid).toBe(true);
            });

            it('should validate template with no special characters', () => {
                const template = 'Plain text template';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true);
            });

            it('should validate complex template with all features', () => {
                const template = `
          {Fecha} {Hora}
          ["Sección 1"]
            {Campo1} {Campo2}
          ["Sección 2"]
            {Campo3}
          [?{Status}=activo]
            Contenido condicional
          [/]
        `;
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true);
            });
        });

        describe('Invalid Templates - Unbalanced Braces', () => {
            it('should detect missing closing brace', () => {
                const template = '{Nombre} {Apellido';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Llaves de campos');
            });

            it('should detect missing opening brace', () => {
                const template = 'Nombre} {Apellido}';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Llaves de campos');
            });

            it('should detect multiple missing braces', () => {
                const template = '{{Nombre} {Apellido';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
            });
        });

        describe('Invalid Templates - Unbalanced Brackets', () => {
            it('should detect missing closing bracket', () => {
                const template = '["Sección 1" Contenido';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Corchetes de secciones');
            });

            it('should detect missing opening bracket', () => {
                const template = '"Sección 1"] Contenido';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Corchetes de secciones');
            });

            it('should detect multiple missing brackets', () => {
                const template = '[["Sección"] Contenido';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
            });
        });

        describe('Invalid Templates - Unbalanced Conditionals', () => {
            it('should detect missing closing [/]', () => {
                const template = '[?{Campo}=valor] Contenido';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Secciones condicionales');
            });

            it('should detect extra closing [/]', () => {
                const template = 'Contenido [/]';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Secciones condicionales');
            });

            it('should detect multiple missing conditionals', () => {
                const template = '[?{A}=1] [?{B}=2] Text [/]';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
            });
        });

        describe('Edge Cases', () => {
            it('should handle escaped backslashes', () => {
                const template = '{Campo\\{test\\}}';
                // Validator counts literal braces: 2 { and 2 }
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true); // Balanced
            });

            it('should handle braces in quoted strings', () => {
                const template = '{"Título con {llaves}"}';
                const result = validateTemplateSyntax(template);
                // 3 open { and 3 close } - balanced
                expect(result.valid).toBe(true);
            });

            it('should handle very long templates', () => {
                const template = Array(100).fill('{Campo} ').join('');
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(true);
            });

            it('should handle templates with only opening markers', () => {
                const template = '{ [ [?{';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
            });

            it('should handle templates with only closing markers', () => {
                const template = '} ] [/]';
                const result = validateTemplateSyntax(template);
                expect(result.valid).toBe(false);
            });
        });
    });
});
