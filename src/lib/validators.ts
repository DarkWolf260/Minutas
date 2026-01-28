/**
 * Validation utilities for JSON and template syntax
 */

/**
 * Validates if a string is valid JSON.
 * 
 * @param str - String to validate
 * @returns True if the string is valid JSON, false otherwise
 * 
 * @example
 * ```typescript
 * isValidJson('{"name": "Juan"}');  // true
 * isValidJson('{invalid}');         // false
 * isValidJson('');                  // false
 * ```
 */
export function isValidJson(str: string): boolean {
  if (!str || str.trim() === '') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Performs basic syntax validation on template content.
 * Checks for balanced braces, brackets, and conditional markers.
 * 
 * @param content - Template content to validate
 * @returns Validation result with status and optional error message
 * 
 * @example
 * ```typescript
 * const template = '{Fecha} {Hora} [?{Status}=activo] Content [/]';
 * const result = validateTemplateSyntax(template);
 * if (!result.valid) {
 *   console.error('Template error:', result.error);
 * }
 * ```
 * 
 * @remarks
 * Validates:
 * - Balanced braces `{}` for fields
 * - Balanced brackets `[]` for sections and conditionals
 * - Matching conditional markers `[?{...}]` with `[/]`
 */
export function validateTemplateSyntax(content: string): { valid: boolean; error?: string } {
  // Count braces
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    return {
      valid: false,
      error: 'Llaves de campos { } no están balanceadas.',
    };
  }

  // Count brackets
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    return {
      valid: false,
      error: 'Corchetes de secciones [ ] no están balanceados.',
    };
  }

  // Count conditional markers
  const openCond = (content.match(/\[\?\{/g) || []).length;
  const closeCond = (content.match(/\[\/\s*\]/g) || []).length;

  if (openCond !== closeCond) {
    return {
      valid: false,
      error: 'Secciones condicionales [?{...}] no están cerradas correctamente con [/].',
    };
  }

  return { valid: true };
}
