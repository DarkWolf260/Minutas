/**
 * Template Engine - Shared Types
 * 
 * Type definitions shared across all template modules
 */

import { FieldType, SectionConfig, SnippetOption } from '@/lib/types';

// Re-export types from main types file for convenience
export type { FieldType, SectionConfig, SnippetOption };

/**
 * Token types for lexer
 */
export type Token =
    | { type: 'text'; content: string; raw: string; position: number }
    | { type: 'field'; id: string; raw: string; position: number }
    | { type: 'section_start'; label?: string; condition?: ConditionalExpression; is_repeatable?: boolean; raw: string; position: number }
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
 * Field configuration after parsing
 */
export interface FieldConfig {
    id: string;
    type: FieldType;
    label: string;
    modifiers: string[];
    is_full_width: boolean;
    is_required: boolean;
    options?: SnippetOption[];
}

/**
 * Parse result from parser
 */
export interface ParseResult {
    sections: SectionConfig[];
    fields: Map<string, FieldConfig>;
    layout: string[];
    fieldNames: Set<string>;
    fieldTypes: Map<string, FieldType>;
    templateOptions: Map<string, SnippetOption[]>;
}

/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Render options
 */
export interface RenderOptions {
    predefinedValues?: Record<string, string>;
    dynamicValues?: Record<string, string>;
    summaryOnly?: boolean;
}

