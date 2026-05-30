/**
 * Template Evaluator - Condition & Modifier Evaluation
 * 
 * Evaluates conditional expressions and applies text modifiers
 */

/**
 * Evaluates a conditional expression
 * 
 * @param fieldValue - The actual value of the field
 * @param operator - The comparison operator (=, !=, >, <, >=, <=)
 * @param targetValue - The value to compare against
 * @returns True if the condition is met
 * 
 * @example
 * ```typescript
 * evaluateCondition('Robo', '=', 'Robo') // true
 * evaluateCondition(5, '>', '3') // true
 * evaluateCondition('Active', '!=', 'Inactive') // true
 * ```
 */
/**
 * Evaluates a conditional expression
 * 
 * Supports numeric and string comparisons using standard operators.
 * 
 * @param fieldValue - The actual value of the field
 * @param operator - The comparison operator (=, !=, >, <, >=, <=)
 * @param targetValue - The value to compare against
 * @returns True if the condition is met
 * 
 * @example
 * ```typescript
 * evaluateCondition('Robo', '=', 'Robo') // true
 * evaluateCondition(5, '>', '3') // true
 * evaluateCondition('Active', '!=', 'Inactive') // true
 * ```
 */
export function evaluateCondition(
    fieldValue: unknown,
    operator: string,
    targetValue: string
): boolean {
    // Treat undefined/null as empty string — a field with no value is semantically
    // equivalent to "": so `{Campo} = ""` is true and `{Campo} != ""` is false.
    if (fieldValue === undefined || fieldValue === null) {
        fieldValue = '';
    }

    // Empty arrays (e.g. multi-text field with no entries) → treat as ""
    // Non-empty arrays → join to a string for comparison ("text1,text2")
    if (Array.isArray(fieldValue)) {
        fieldValue = fieldValue.length === 0 ? '' : fieldValue.join(',');
    }

    const val = coerceForComparison(fieldValue);
    const target = coerceForComparison(targetValue);

    switch (operator) {
        case '=':
        case '==':
            if (typeof val === 'string' && typeof target === 'string') {
                return val.toLowerCase() === target.toLowerCase();
            }
            return val === target;
        case '!=':
            if (typeof val === 'string' && typeof target === 'string') {
                return val.toLowerCase() !== target.toLowerCase();
            }
            return val !== target;
        case '>':
            return val > target;
        case '<':
            return val < target;
        case '>=':
            return val >= target;
        case '<=':
            return val <= target;
        default:
            return false;
    }
}

/**
 * Applies text modifiers to a value
 * 
 * @param value - The value to modify
 * @param modifiers - Array of modifier names (upper, lower, title, etc.)
 * @returns Modified string value
 * 
 * @example
 * ```typescript
 * applyModifiers('hello world', ['upper']) // 'HELLO WORLD'
 * applyModifiers('HELLO WORLD', ['lower']) // 'hello world'
 * applyModifiers('hello world', ['title']) // 'Hello World'
 * ```
 */
export function applyModifiers(value: unknown, modifiers: string | string[]): string {
    if (value === undefined || value === null) return '';

    let result = String(value);
    const mods = Array.isArray(modifiers) ? modifiers : [modifiers];

    mods.forEach((mod) => {
        const trimmedMod = mod.trim().toLowerCase();
        if (trimmedMod === 'upper') {
            result = result.toUpperCase();
        } else if (trimmedMod === 'lower') {
            result = result.toLowerCase();
        } else if (trimmedMod === 'title') {
            result = result
                .toLowerCase()
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } else if (trimmedMod === 'capitalize') {
            result = result.charAt(0).toUpperCase() + result.slice(1);
        } else if (trimmedMod.startsWith('default(')) {
            if (!result || result.trim() === '') {
                const match = mod.match(/default\("?(.*?)"?\)/i);
                if (match && match[1]) {
                    result = match[1];
                }
            }
        }
    });

    return result;
}

/**
 * Formats a value based on its field type (Reserved for future specialized formatting)
 */
export function formatValue(value: unknown, _fieldType: string): string {
    return String(value);
}

/**
 * Coerces values for comparison (handles numeric strings)
 */
function coerceForComparison(value: unknown): string | number {
    const s = String(value).trim();
    // If it looks like a number, treat it as a number for comparison
    if (s !== '' && !isNaN(Number(s))) {
        return Number(s);
    }
    return s;
}

