/**
 * Template Lexer - Tokenization
 * 
 * Converts template string into a stream of tokens for parsing
 * 
 * Supported syntax:
 * - Fields: {FieldName}, {FieldName:type}, {FieldName|modifier}
 * - Repeatable fields: {FieldName}*
 * - Sections: [Label]content[/]
 * - Repeatable sections: [Label]*content[/]
 * - Conditionals: [?{Field} op value]content[/]
 *   where op can be: =, !=, >, <, >=, <=
 */

import type { Token, ConditionalExpression } from './types';

/**
 * Tokenizes a template string into a structured token stream
 * 
 * @param template - The template string to tokenize
 * @returns Array of tokens representing the template structure
 * 
 * @example
 * ```typescript
 * const tokens = tokenize('Hello {Name}, today is {Fecha:date}');
 * // Returns: [
 * //   { type: 'text', content: 'Hello ', position: 0 },
 * //   { type: 'field', id: 'Name', raw: '{Name}', position: 6 },
 * //   { type: 'text', content: ', today is ', position: 12 },
 * //   { type: 'field', id: 'Fecha', raw: '{Fecha:date}', position: 24 }
 * // ]
 * ```
 */
export function tokenize(template: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let currentText = '';

    const flushText = () => {
        if (currentText) {
            tokens.push({
                type: 'text',
                content: currentText,
                raw: currentText,
                position: position - currentText.length,
            });
            currentText = '';
        }
    };

    while (position < template.length) {
        const char = template[position];
        const next = template[position + 1];

        // Check for field start: { (but not {{ for escaping)
        if (char === '{' && next !== '{') {
            flushText();
            const fieldToken = extractFieldToken(template, position);
            if (fieldToken) {
                tokens.push(fieldToken);
                position = fieldToken.endPos;
                continue;
            }
        }

        // Check for section/conditional start: [
        if (char === '[' && next !== '[') {
            flushText();
            const sectionToken = extractSectionToken(template, position);
            if (sectionToken) {
                tokens.push(sectionToken);
                position = sectionToken.endPos;
                continue;
            }
        }

        // Regular text
        currentText += char;
        position++;
    }

    flushText();
    return tokens;
}

/**
 * Extracts a field token from the template
 * Returns the token and the position after the closing brace
 */
function extractFieldToken(
    template: string,
    startPos: number
): (Token & { endPos: number }) | null {
    let pos = startPos + 1; // Skip opening {
    let depth = 1;
    let content = '';

    // Find matching closing brace
    while (pos < template.length && depth > 0) {
        const char = template[pos];
        if (char === '{') depth++;
        if (char === '}') depth--;

        if (depth > 0) {
            content += char;
        }
        pos++;
    }

    if (depth !== 0) {
        // Unbalanced braces - treat as text
        return null;
    }

    // Check for repeatable marker: *
    let finalPos = pos;
    if (template[pos] === '*') {
        finalPos++;
    }
    const raw = template.substring(startPos, finalPos);

    // Extract just the field ID (before : or |)
    const id = content.split(/[:|]/)[0]?.trim() || content.trim();

    return {
        type: 'field',
        id,
        raw,
        position: startPos,
        endPos: finalPos,
    };
}

/**
 * Extracts a section or conditional token from the template
 * Returns the token and the position after the closing bracket
 */
function extractSectionToken(
    template: string,
    startPos: number
): (Token & { endPos: number }) | null {
    let pos = startPos + 1; // Skip opening [
    let content = '';

    // Find closing ]
    while (pos < template.length && template[pos] !== ']') {
        content += template[pos];
        pos++;
    }

    if (pos >= template.length) {
        // No closing bracket found
        return null;
    }

    pos++; // Skip closing ]
    const raw = template.substring(startPos, pos);

    // Check if this is a section end marker: [/]
    if (content.trim() === '/') {
        return {
            type: 'section_end',
            raw,
            position: startPos,
            endPos: pos,
        };
    }

    // Check if this is a conditional: [?{Field} op value]
    const conditionalMatch = content.match(
        /^\?\s*\{\s*([^\}]+)\s*\}\s*(!=|>=|<=|>|<|=)\s*(.+)$/
    );

    if (conditionalMatch) {
        const [, fieldId, operator, value] = conditionalMatch;
        const cleanValue = value?.trim().replace(/^"|"$/g, '') || '';

        return {
            type: 'section_start',
            label: undefined,
            condition: {
                fieldId: fieldId?.trim() || '',
                operator: operator as ConditionalExpression['operator'],
                value: cleanValue,
            },
            raw,
            position: startPos,
            endPos: pos,
        };
    }

    // Regular section: [Label] or [Label]*
    const label = content.replace(/\*$/, '').trim();
    const isRepeatable = content.endsWith('*');

    return {
        type: 'section_start',
        label: label || undefined,
        condition: undefined,
        raw,
        position: startPos,
        endPos: pos,
    };
}


/**
 * Checks if a character is a special template character
 */
function isSpecialChar(char: string): boolean {
    return char === '{' || char === '}' || char === '[' || char === ']';
}

/**
 * Escapes special characters in regex
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
