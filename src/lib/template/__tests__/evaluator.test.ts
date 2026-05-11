import { describe, it, expect } from 'vitest';
import { evaluateCondition, applyModifiers } from '../evaluator';

describe('Template Evaluator', () => {
    describe('evaluateCondition', () => {
        it('should handle equality (=)', () => {
            expect(evaluateCondition('test', '=', 'test')).toBe(true);
            expect(evaluateCondition('test', '=', 'other')).toBe(false);
            expect(evaluateCondition(123, '=', '123')).toBe(true);
        });

        it('should handle inequality (!=)', () => {
            expect(evaluateCondition('test', '!=', 'other')).toBe(true);
            expect(evaluateCondition('test', '!=', 'test')).toBe(false);
        });

        it('should handle comparison (>, <, >=, <=)', () => {
            expect(evaluateCondition(10, '>', '5')).toBe(true);
            expect(evaluateCondition(10, '>', '15')).toBe(false);
            expect(evaluateCondition('10', '>=', '10')).toBe(true);
            expect(evaluateCondition(5, '<', '10')).toBe(true);
            expect(evaluateCondition(10, '<=', '10')).toBe(true);
        });

        it('should handle numeric strings correctly', () => {
            // Both are coerced to numbers for comparison if they look like numbers
            expect(evaluateCondition('100', '>', '20')).toBe(true);
            expect(evaluateCondition('9', '>', '10')).toBe(false);
        });

        it('should handle null/undefined values', () => {
            expect(evaluateCondition(null, '=', '')).toBe(true);
            expect(evaluateCondition(undefined, '!=', 'anything')).toBe(true);
        });
    });

    describe('applyModifiers', () => {
        it('should handle upper case', () => {
            expect(applyModifiers('hello', 'upper')).toBe('HELLO');
        });

        it('should handle lower case', () => {
            expect(applyModifiers('HELLO', 'lower')).toBe('hello');
        });

        it('should handle title case', () => {
            expect(applyModifiers('hello world', 'title')).toBe('Hello World');
            expect(applyModifiers('HELLO WORLD', 'title')).toBe('Hello World');
        });

        it('should handle multiple modifiers', () => {
            expect(applyModifiers('  hello  ', ['upper'])).toBe('  HELLO  ');
            // Modifiers are applied in sequence
            expect(applyModifiers('hello world', ['upper', 'lower'])).toBe('hello world');
        });

        it('should handle null/undefined values', () => {
            expect(applyModifiers(null, 'upper')).toBe('');
            expect(applyModifiers(undefined, 'lower')).toBe('');
        });

        it('should trim modifiers', () => {
            expect(applyModifiers('hello', ' upper ')).toBe('HELLO');
        });
    });
});
