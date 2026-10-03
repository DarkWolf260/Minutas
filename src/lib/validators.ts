/**
 * Validation utilities for JSON and template syntax
 */

import { validateSyntax } from '@/lib/template';

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
 * Validates the basic syntax of a template string.
 *
 * @param content - The template string to validate
 * @returns Object indicating if the template is valid and an optional error message
 */
export function validateTemplateSyntax(content: string): { valid: boolean; error?: string } {
  const errors = validateSyntax(content);
  if (errors.length > 0) {
    return {
      valid: false,
      error: errors[0],
    };
  }
  return { valid: true };
}
