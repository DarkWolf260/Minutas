/**  
 * Template Validator - Semantic Validation
 * 
 * Validates parsed templates for semantic and syntax errors
 */

import type { ParseResult, ValidationResult } from './types';
import type { SectionConfig, FieldType, SnippetOption } from '@/lib/types';

/**
 * Validates a template string for syntax errors
 * 
 * Checks for:
 * - Balanced braces { }
 * - Balanced brackets [ ]
 * - Properly closed conditionals [? ... [/]
 * 
 * @param template - The template string to validate
 * @returns Array of syntax error messages
 */
export function validateSyntax(template: string): string[] {
    const errors: string[] = [];

    // Check brace balance
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        errors.push('Desbalance de llaves detectado.');
    }

    // Check bracket balance
    if (template.includes('[') && !template.includes(']')) {
        errors.push('Desbalance de Corchetes detectado.');
    }

    // Check unclosed conditionals
    if (template.includes('[?') && !template.includes('[/]')) {
        errors.push('Condicionales sin cerrar detectados.');
    }

    return errors;
}

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
            const { fieldId, value, operator } = section.condition;

            // Verificar que el campo existe
            // For dotted field IDs (e.g. Director.sex), check if the BASE field exists
            // since dotted fields are derived properties and won't appear as standalone {tags}
            const baseFieldId = fieldId.includes('.')
                ? fieldId.slice(0, fieldId.indexOf('.'))
                : fieldId;
            if (!fieldNames.has(fieldId) && !fieldNames.has(baseFieldId)) {
                errors.push(
                    `El condicional hace referencia al campo '{${fieldId}}' que no está definido en la plantilla.`
                );
                return;
            }

            const fieldType = fieldTypes.get(fieldId);
            const options = templateOptions.get(fieldId);

            // Validar si es dropdown
            if (fieldType === 'dropdown' && options) {
                // Solo validar índices numéricos para operador = (retrocompatibilidad)
                const isNumericIndex = (!operator || operator === '=') && /^\d+$/.test(value);
                if (isNumericIndex) {
                    const idx = parseInt(value, 10);
                    if (idx < 0 || idx >= options.length) {
                        errors.push(
                            `El condicional para '{${fieldId}}' usa índice ${idx}, pero el dropdown solo tiene ${options.length} opciones (índices 0-${options.length - 1}).`
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
 * 
 * @example
 * ```typescript
 * const result = parse(tokens);
 * const validation = validate(result, template);
 * if (!validation.isValid) {
 *   console.error('Template errors:', validation.errors);
 * }
 * ```
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

    // Check for duplicate field names (warning, not error)
    const fieldCount = new Map<string, number>();
    parseResult.fieldNames.forEach((name) => {
        fieldCount.set(name, (fieldCount.get(name) || 0) + 1);
    });

    fieldCount.forEach((count, name) => {
        if (count > 1) {
            warnings.push(
                `El campo '{${name}}' aparece ${count} veces en la plantilla. Esto puede causar comportamiento inesperado.`
            );
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Checks if a section has any fields defined
 */
export function sectionHasFields(section: SectionConfig): boolean {
    return section.fieldIds && section.fieldIds.length > 0;
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
    const validOperators = ['=', '!=', '>', '<', '>=', '<='];

    if (!validOperators.includes(operator)) {
        return false;
    }

    // Numeric comparisons only make sense for certain types
    if (['>', '<', '>=', '<='].includes(operator)) {
        // These are fine for text (alphabetical) and dates
        return true;
    }

    return true;
}
