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

// Parser - Field parsing and full template parsing
export { parseFieldTag, parse, parseTemplate } from './parser';
export type { ParseResult, FieldConfig } from './types';

// Validator - Syntax and semantic validation
export {
    validateSyntax,
    validateSemantics,
    validate,
    isValidFieldName,
    isValidOperatorForType,
} from './validator';
export type { ValidationResult } from './types';

// Evaluator - Conditions and modifiers
export { evaluateCondition, applyModifiers } from './evaluator';

// Renderer - Content and report rendering
export { renderContent, renderContentWithSections, renderFinalReport } from './renderer';

// Title resolution and template naming utilities
export { resolveTemplateTitle, cleanTemplateName } from './titles';
