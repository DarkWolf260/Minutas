/**
 * Template Engine - Public API
 * 
 * Modular template parsing, validation, and rendering system
 */

// Core types
export * from './types';

// Lexer - Tokenization
export { tokenize } from './lexer';
export type { Token } from './types';

// Parser - Field parsing
export { parseFieldTag, parse } from './parser';
export type { ParseResult, FieldConfig } from './types';

// Validator - Syntax and semantic validation
export {
    validateSyntax,
    validateSemantics,
    validate,
    isValidFieldName,
    isValidOperatorForType,
    sectionHasFields
} from './validator';
export type { ValidationResult } from './types';

// Evaluator - Conditions and modifiers
export { evaluateCondition, applyModifiers } from './evaluator';

// For backwards compatibility, also export from old parser
export { parseTemplate, renderContent } from '../template-parser';
