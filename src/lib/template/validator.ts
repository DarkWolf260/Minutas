/**  
 * Template Validator - Semantic Validation
 * 
 * Validates parsed templates for semantic and syntax errors
 */

import type { ParseResult, ValidationResult } from './types';
import type { SectionConfig, FieldType, SnippetOption } from '@/lib/types';

import { tokenize } from './lexer';

const VALID_OPERATORS = new Set(['=', '!=', '>', '<', '>=', '<=']);

/**
 * Validates a template string for syntax errors
 * 
 * Checks for:
 * - Balanced braces { }
 * - Properly closed ::: blocks
 * 
 * @param template - The template string to validate
 * @returns Array of syntax error messages
 */
export function validateSyntax(template: string): string[] {
    const errors: string[] = [];

    // Check brace balance in single pass, respecting escapes (\\{, \\}, {{, }})
    let openBraces = 0;
    let closeBraces = 0;
    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        const next = template[i + 1];

        // Skip escaped braces
        if (char === '\\' && (next === '{' || next === '}')) {
            i++;
            continue;
        }

        // Skip double braces (literal escaped braces {{ or }})
        if (char === '{' && next === '{') {
            i++;
            continue;
        }
        if (char === '}' && next === '}') {
            i++;
            continue;
        }

        if (char === '{') openBraces++;
        else if (char === '}') closeBraces++;
    }
    if (openBraces !== closeBraces) {
        errors.push('Desbalance de llaves detectado.');
    }

    // Check unclosed or orphan ::: blocks
    try {
        const tokens = tokenize(template);
        let openBlocks = 0;
        for (const t of tokens) {
            if (t.type === 'section_start' && !t.is_self_contained) {
                openBlocks++;
            } else if (t.type === 'section_end' && t.raw !== '') {
                openBlocks--;
            }
        }
        if (openBlocks > 0) {
            errors.push('Bloques ::: sin cerrar detectados.');
        } else if (openBlocks < 0) {
            errors.push('Cierres de bloque ::: huérfanos o adicionales detectados.');
        }
    } catch {
        // Tokenize error fallback
    }

    return errors;
}

const PREDEFINED_FIELD_NAMES = new Set([
    'fecha',
    'hora',
    'municipio',
    'estado',
    'redan',
    'zoedan',
    'usuario',
    'guardia',
    'grupo',
    'active_guard_id',
    'director',
    'analista',
    'reporta',
    'estatus',
    'status',
]);

/**
 * Validates semantic aspects of a parsed template
 * 
 * Checks for:
 * - Field references in conditionals that don't exist
 * - Invalid dropdown indices
 * - Other logical inconsistencies
 * 
 * @param sections - Parsed sections
 * @param fieldNames - Set of all field names in template
 * @param fieldTypes - Map of field types
 * @param templateOptions - Map of dropdown options
 * @returns Array of semantic error messages
 */
export function validateSemantics(
    sections: SectionConfig[],
    fieldNames: Set<string>,
    fieldTypes: Map<string, FieldType>,
    templateOptions: Map<string, SnippetOption[]>
): string[] {
    const errors: string[] = [];

    sections.forEach((section) => {
        if (section.condition) {
            const { field_id, value, operator } = section.condition;

            // Verificar que el campo existe
            // For dotted field IDs (e.g. Director.sex), check if the BASE field exists
            // since dotted fields are derived properties and won't appear as standalone {tags}
            const basefield_id = field_id.includes('.')
                ? field_id.slice(0, field_id.indexOf('.'))
                : field_id;
            const isPredefined = PREDEFINED_FIELD_NAMES.has(basefield_id.toLowerCase());
            if (!fieldNames.has(field_id) && !fieldNames.has(basefield_id) && !isPredefined) {
                errors.push(
                    `El condicional hace referencia al campo '{${field_id}}' que no está definido en la plantilla.`
                );
                return;
            }

            const fieldType = fieldTypes.get(field_id);
            const options = templateOptions.get(field_id);

            // Validar si es dropdown
            if (fieldType === 'dropdown' && options) {
                // Solo validar índices numéricos para operador = (retrocompatibilidad)
                const isNumericIndex = (!operator || operator === '=') && /^\d+$/.test(value);
                if (isNumericIndex) {
                    const idx = parseInt(value, 10);
                    if (idx < 0 || idx >= options.length) {
                        errors.push(
                            `El condicional para '{${field_id}}' usa índice ${idx}, pero el dropdown solo tiene ${options.length} opciones (índices 0-${options.length - 1}).`
                        );
                    }
                }
            }
        }
    });

    return errors;
}

/**
 * Validates a parsed template for all types of errors
 * 
 * @param parseResult - The parsed template to validate
 * @param originalTemplate - Original template string for syntax validation
 * @returns Validation result with errors and warnings
 */
export function validate(
    parseResult: ParseResult,
    originalTemplate?: string
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Syntax validation if original template provided
    if (originalTemplate) {
        errors.push(...validateSyntax(originalTemplate));
    }

    // Semantic validation
    errors.push(
        ...validateSemantics(
            parseResult.sections,
            parseResult.fieldNames,
            parseResult.fieldTypes,
            parseResult.templateOptions
        )
    );

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}


/**
 * Checks if a field name is valid (not empty, no special chars)
 */
export function isValidFieldName(fieldName: string): boolean {
    if (!fieldName || fieldName.trim() === '') {
        return false;
    }

    // Field names should not contain template syntax characters
    if (fieldName.includes('{') || fieldName.includes('}') ||
        fieldName.includes('[') || fieldName.includes(']')) {
        return false;
    }

    return true;
}

/**
 * Validates that operator is valid for given field type
 */
export function isValidOperatorForType(
    operator: string,
    _fieldType: FieldType
): boolean {
    return VALID_OPERATORS.has(operator);
}

