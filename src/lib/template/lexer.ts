/**
 * Template Lexer - Tokenization
 * 
 * Converts template string into a stream of tokens for parsing
 * 
 * Supported syntax:
 * - Fields: {FieldName}, {FieldName:type}, {FieldName|modifier}
 * - Repeatable fields: {FieldName}*
 * - Sections: [Label]content[/]
 * - Self-contained Sections: ["Title" {Field}]
 * - Visual Separators: [""]
 * - Repeatable sections: [Label]*content[/]
 * - Conditionals: [?{Field} op value]content[/]
 *   where op can be: =, !=, >, <, >=, <=
 * - Mapping Conditionals: [?{Field}] Key=Value [/]
 *   Implicitly defines dropdown options and report translation.
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

        // Handle escaped characters (e.g. \* means literal *, not repeatable marker)
        if (char === '\\' && (next === '*' || next === '{' || next === '[' || next === '\\')) {
            flushText();
            tokens.push({
                type: 'text',
                content: next,
                raw: char + next,
                position: position,
            });
            position += 2;
            continue;
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
    const id = content.split(/[:|]/)[0]?.trim() || '';
    if (!id) return null;

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

    // Find the MATCHING closing ] using depth counting so nested [...] blocks
    // inside self-contained sections like ["TITLE" [?...][/] text] work correctly.
    let depth = 1;
    while (pos < template.length && depth > 0) {
        const ch = template[pos];
        // Handle [[ escape — treat as literal [, do not increment depth
        if (ch === '[' && template[pos + 1] === '[') {
            content += ch;
            pos++;
        } else if (ch === '[') {
            depth++;
            content += ch;
        } else if (ch === ']') {
            depth--;
            if (depth > 0) {
                // Still inside nested block — keep the ]
                content += ch;
            }
            // depth === 0: this is OUR closing ] — don't add to content, just stop
        } else {
            content += ch;
        }
        pos++;
    }

    if (depth !== 0) {
        // No matching closing bracket found
        return null;
    }


    // Check if this is a section end marker: [/]
    if (content.trim() === '/') {
        const raw = template.substring(startPos, pos);
        return {
            type: 'section_end',
            raw,
            position: startPos,
            endPos: pos,
        };
    }

    // Capture optional * after ] for repeatable sections: [Label]*
    let isRepeatable = false;
    if (template[pos] === '*' && !content.trim().startsWith('?')) {
        isRepeatable = true;
        pos++; // include the * in the token
    }


    const raw = template.substring(startPos, pos);

    // Check if this is a conditional: [?{Field} op value] or [?{Field}] or [?Field op value] or [?Field]
    // Also support optional :show/:hide suffix: [?Field=Value:show]
    let conditionMode: 'show' | 'hide' | undefined = undefined;
    let condContent = content;
    const showHideMatch = content.match(/:(show|hide)\s*$/i);
    if (showHideMatch) {
        conditionMode = showHideMatch[1]!.toLowerCase() as 'show' | 'hide';
        condContent = content.slice(0, content.lastIndexOf(':' + showHideMatch[1]!)).trim();
    }

    const conditionalMatch = condContent.match(
        /^\?\s*(?:\{\s*)?([^\}=!<>]+?)(?:\s*\})?\s*(?:(!=|>=|<=|>|<|=)\s*(.+))?$/
    );

    if (conditionalMatch) {
        const [, fieldId, operator, value] = conditionalMatch;
        const cleanValue = value?.trim().replace(/^"|"$/g, '') || '';

        return {
            type: 'section_start',
            label: undefined,
            condition: {
                fieldId: fieldId?.trim() || '',
                operator: (operator as ConditionalExpression['operator']) || '=',
                value: cleanValue,
                conditionMode,
            },
            raw,
            position: startPos,
            endPos: pos,
        };
    }

    // Regular section: [Label] or [Label]*
    // The label itself should NOT contain *, that's now captured above.
    const label = content.trim();

    return {
        type: 'section_start',
        label: label || undefined,
        condition: undefined,
        isRepeatable,
        raw,
        position: startPos,
        endPos: pos,
    };
}



