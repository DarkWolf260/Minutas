/**
 * Template Engine - Shared Types
 * 
 * Type definitions shared across all template modules
 */

import type { FieldType, SectionConfig, SnippetOption, FieldConfig, TemplateParserResult } from '@/lib/types';

// Re-export types from main types file for convenience
export type { FieldType, SectionConfig, SnippetOption, FieldConfig, TemplateParserResult };

/**
 * Token types for lexer
 */
export type Token =
    | { type: 'text'; content: string; raw: string; position: number }
    | { type: 'field'; id: string; raw: string; position: number }
    | {
        type: 'section_start';
        label?: string;
        condition?: ConditionalExpression;
        is_repeatable?: boolean;
        singular_title?: string;
        plural_title?: string;
        repeatable_item_label?: string;
        is_separator?: boolean;
        is_mapping?: boolean;
        is_self_contained?: boolean;
        raw: string;
        position: number;
    }
    | { type: 'section_end'; raw: string; position: number };

/**
 * Conditional expression structure
 */
export interface ConditionalExpression {
    field_id: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: string;
    condition_mode?: 'show' | 'hide';
    is_implicit?: boolean;
}

/**
 * Parse result type alias for backwards compatibility
 */
export type ParseResult = TemplateParserResult;

/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
