/**
 * Template Lexer - Tokenization
 * 
 * Converts template strings into a stream of tokens for parsing.
 * 
 * Supported syntax:
 * - Fields: {FieldName}, {FieldName:type}, {FieldName|modifier}, {FieldName:type:req:full}
 * - Repeatable fields: {FieldName}*
 * - Sections:
 *     ::: DATOS GENERALES :::
 *     - *FECHA:* {Fecha}
 *     :::
 * - Repeatable sections:
 *     ::: section Novedades* :::
 *     - *DESCRIPCIÓN:* {descripcion:textarea}
 *     :::
 *   or with singular/item label:
 *     ::: section Novedades | Novedad* :::
 *     :::
 * - Visual Separators:
 *     ::: separator :::
 *     ::: separator: TITULO :::
 *     ::: --- :::
 * - Conditionals (inline and multiline blocks):
 *     ::: if Estatus == "En proceso": *PRELIMINAR* :::
 *     ::: if Estatus == "Finalizado" :::
 *     Contenido...
 *     :::
 * - Mapping Blocks:
 *     ::: map Tipo :::
 *     Robo=Se registró un evento de robo...
 *     :::
 */

import type { Token, ConditionalExpression } from './types';

/**
 * Tokenizes a template string into a structured token stream
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

        // Check for ::: directives (sections, conditionals, separators, mapping)
        if (char === ':' && template.slice(position, position + 3) === ':::') {
            flushText();
            const directiveResult = extractTripleColonToken(template, position);
            if (directiveResult) {
                tokens.push(...directiveResult.tokens);
                position = directiveResult.endPos;
                continue;
            }
        }

        // Handle escaped characters (e.g. \* means literal *, \: means literal :)
        if (char === '\\' && (next === '*' || next === '{' || next === ':' || next === '\\')) {
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
 * Extracts a field token from the template {FieldName:...}
 */
function extractFieldToken(
    template: string,
    startPos: number
): (Token & { endPos: number }) | null {
    let pos = startPos + 1; // Skip opening {
    let depth = 1;
    let content = '';

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
 * Extracts directives and block markers enclosed by :::
 */
function extractTripleColonToken(
    template: string,
    startPos: number
): { tokens: Token[]; endPos: number } | null {
    const afterThreeColons = startPos + 3;

    // Check rest of the line
    const nextNewline = template.indexOf('\n', afterThreeColons);
    const lineEnd = nextNewline !== -1 ? nextNewline : template.length;
    const lineRest = template.slice(afterThreeColons, lineEnd);
    const nextTripleColonOnLine = lineRest.indexOf(':::');

    // Case 1: Standalone ::: on a line (Closing tag for open block)
    if (lineRest.trim() === '') {
        const endPos = nextNewline !== -1 ? nextNewline + 1 : template.length;
        return {
            tokens: [
                {
                    type: 'section_end',
                    raw: template.slice(startPos, endPos),
                    position: startPos,
                },
            ],
            endPos,
        };
    }

    // Case 1b: Closing ::: immediately followed by >> summary end marker
    if (lineRest.trim() === '>>') {
        const endPos = startPos + 3;
        return {
            tokens: [
                {
                    type: 'section_end',
                    raw: template.slice(startPos, endPos),
                    position: startPos,
                },
            ],
            endPos,
        };
    }

    // Case 2: Directive closed on the same line (::: <content> :::)
    if (nextTripleColonOnLine !== -1) {
        const inside = lineRest.slice(0, nextTripleColonOnLine);
        const fullEndPos = afterThreeColons + nextTripleColonOnLine + 3;
        let endPos = fullEndPos;

        // If the directive occupied the whole line, consume the trailing newline
        const afterClosing = template.slice(fullEndPos, lineEnd);
        if (afterClosing.trim() === '' && nextNewline !== -1) {
            endPos = nextNewline + 1;
        }

        return parseDirectiveContent(inside, template.slice(startPos, endPos), startPos, endPos, fullEndPos);
    }

    // Case 3: Line starts with ::: <content> without trailing ::: on the same line
    const inside = lineRest.trim();
    const lowerInside = inside.toLowerCase();
    const isDirectiveKeyword =
        lowerInside.startsWith('if ') ||
        lowerInside.startsWith('if:') ||
        lowerInside.startsWith('section ') ||
        lowerInside.startsWith('map ') ||
        lowerInside.startsWith('map:') ||
        lowerInside.startsWith('separator') ||
        inside === '---';

    if (isDirectiveKeyword) {
        const endPos = nextNewline !== -1 ? nextNewline + 1 : template.length;
        return parseDirectiveContent(inside, template.slice(startPos, endPos), startPos, endPos, endPos);
    }

    // Otherwise, this ::: is a closing tag (section_end), and any following text is regular content
    return {
        tokens: [
            {
                type: 'section_end',
                raw: template.slice(startPos, startPos + 3),
                position: startPos,
            },
        ],
        endPos: startPos + 3,
    };
}


/**
 * Parses directive content inside ::: ... :::
 */
function parseDirectiveContent(
    content: string,
    raw: string,
    startPos: number,
    endPos: number,
    fullTokenEndPos: number
): { tokens: Token[]; endPos: number } | null {
    const trimmed = content.trim();
    if (!trimmed) {
        // Empty ::: ::: -> treated as separator
        return {
            tokens: [
                {
                    type: 'section_start',
                    label: '',
                    is_separator: true,
                    is_self_contained: true,
                    raw,
                    position: startPos,
                },
                {
                    type: 'section_end',
                    raw: '',
                    position: endPos,
                },
            ],
            endPos,
        };
    }

    // Separators: ::: separator :::, ::: --- :::, ::: separator: Titulo :::
    const lowerTrimmed = trimmed.toLowerCase();
    if (lowerTrimmed === 'separator' || trimmed === '---') {
        return {
            tokens: [
                {
                    type: 'section_start',
                    label: '',
                    is_separator: true,
                    is_self_contained: true,
                    raw,
                    position: startPos,
                },
                {
                    type: 'section_end',
                    raw: '',
                    position: endPos,
                },
            ],
            endPos,
        };
    }

    if (lowerTrimmed.startsWith('separator:') || lowerTrimmed.startsWith('separator ')) {
        const title = trimmed.slice(trimmed.indexOf(':') > -1 ? trimmed.indexOf(':') + 1 : 10).trim();
        return {
            tokens: [
                {
                    type: 'section_start',
                    label: title,
                    is_separator: true,
                    is_self_contained: true,
                    raw,
                    position: startPos,
                },
                {
                    type: 'section_end',
                    raw: '',
                    position: endPos,
                },
            ],
            endPos,
        };
    }

    // Conditionals: ::: if <condition> ::: or ::: if <condition>: <inlineBody> :::
    const trimmedStart = content.trimStart();
    const lowerTrimmedStart = trimmedStart.toLowerCase();
    if (lowerTrimmedStart.startsWith('if ') || lowerTrimmedStart.startsWith('if:')) {
        const rest = trimmedStart.slice(2).trimStart();
        const { conditionPart, inlineBody } = splitConditionAndBody(rest);
        const condition = parseConditionString(conditionPart) || {
            field_id: conditionPart,
            operator: '=',
            value: '',
        };

        if (inlineBody !== undefined) {
            // Inline conditional: ::: if condition: body :::
            const innerTokens = tokenize(inlineBody);
            return {
                tokens: [
                    {
                        type: 'section_start',
                        condition,
                        is_self_contained: true,
                        raw,
                        position: startPos,
                    },
                    ...innerTokens,
                    {
                        type: 'section_end',
                        raw: '',
                        position: fullTokenEndPos,
                    },
                ],
                endPos: fullTokenEndPos,
            };
        }

        // Multiline conditional block start: ::: if condition :::
        return {
            tokens: [
                {
                    type: 'section_start',
                    condition,
                    raw,
                    position: startPos,
                },
            ],
            endPos,
        };
    }

    // Mapping blocks: ::: map <Field> :::
    if (lowerTrimmed.startsWith('map ') || lowerTrimmed.startsWith('map:')) {
        const fieldId = trimmed.slice(trimmed.indexOf(':') > -1 ? trimmed.indexOf(':') + 1 : 4).trim();
        return {
            tokens: [
                {
                    type: 'section_start',
                    label: `map_${fieldId}`,
                    is_mapping: true,
                    condition: {
                        field_id: fieldId,
                        operator: '=',
                        value: '',
                        is_implicit: true,
                    },
                    raw,
                    position: startPos,
                },
            ],
            endPos,
        };
    }

    // Repeatable section: ::: section <Title>* ::: or ::: <Title>* ::: or ::: section <Plural> | <Singular>* ::: or ::: section <Plural> | <Singular> | <Sub>* :::
    const isRepeatable = trimmed.endsWith('*');
    if (isRepeatable) {
        let clean = trimmed.slice(0, -1).trim();
        if (clean.toLowerCase().startsWith('section ')) {
            clean = clean.slice(8).trim();
        }

        const parts = clean.split('|').map((p) => p.trim()).filter(Boolean);

        let pluralTitle = 'ITEMS';
        let singularTitle = 'ITEM';
        let repeatable_item_label = 'ITEM';

        if (parts.length >= 3) {
            // 3 parts: [Plural, Singular, SubLabel] or [Singular, Plural, SubLabel]
            const p0 = parts[0] ?? '';
            const p1 = parts[1] ?? '';
            const sub = parts[2] ?? '';

            const p0Upper = p0.toUpperCase();
            const p1Upper = p1.toUpperCase();

            const p0HasSingularArticle =
                p0Upper.includes(' DEL ') || p0Upper.includes(' DE LA ') || p0Upper.includes(' EL ') || p0Upper.includes(' LA ');
            const p1HasPluralArticle =
                p1Upper.includes(' DE LOS ') || p1Upper.includes(' DE LAS ') || p1Upper.includes(' LOS ') || p1Upper.includes(' LAS ');

            const p1IsPlural = !p0Upper.endsWith('S') && p1Upper.endsWith('S');

            if (p0HasSingularArticle && p1HasPluralArticle) {
                singularTitle = p0;
                pluralTitle = p1;
            } else if (p1HasPluralArticle && !p0Upper.includes(' DE LOS ') && !p0Upper.includes(' DE LAS ')) {
                singularTitle = p0;
                pluralTitle = p1;
            } else if (p1IsPlural && !p0Upper.includes(' DE LOS ') && !p0Upper.includes(' DE LAS ')) {
                singularTitle = p0;
                pluralTitle = p1;
            } else {
                pluralTitle = p0;
                singularTitle = p1;
            }
            repeatable_item_label = sub;
        } else if (parts.length === 2) {
            const p0 = parts[0] ?? '';
            const p1 = parts[1] ?? '';
            pluralTitle = p0;
            singularTitle = p1;
            repeatable_item_label = p1;

            // Smart singular derivation if p0 is a phrase like "DATOS DE LOS PACIENTES" and p1 is sub-label "PACIENTE"
            const p0Upper = p0.toUpperCase();
            if (p0Upper.includes(' DE LOS ') || p0Upper.includes(' DE LAS ')) {
                const inferred = p0
                    .replace(/\bDE LOS\b/gi, 'DEL')
                    .replace(/\bDE LAS\b/gi, 'DE LA')
                    .replace(new RegExp(`${p1}S\\b`, 'i'), p1);
                singularTitle = inferred;
            }
        } else if (parts.length === 1) {
            const p0 = parts[0] ?? '';
            pluralTitle = p0;
            singularTitle = p0;
            repeatable_item_label = p0;
        }

        return {
            tokens: [
                {
                    type: 'section_start',
                    label: pluralTitle || 'ITEMS',
                    is_repeatable: true,
                    plural_title: pluralTitle || 'ITEMS',
                    singular_title: singularTitle || pluralTitle || 'ITEM',
                    repeatable_item_label: repeatable_item_label || singularTitle || pluralTitle || 'ITEM',
                    raw,
                    position: startPos,
                },
            ],
            endPos,
        };
    }

    // Normal section: ::: <Title> ::: or ::: section <Title> :::
    let sectionTitle = trimmed;
    if (sectionTitle.toLowerCase().startsWith('section ')) {
        sectionTitle = sectionTitle.slice(8).trim();
    }

    return {
        tokens: [
            {
                type: 'section_start',
                label: sectionTitle || 'SECCIÓN',
                is_repeatable: false,
                raw,
                position: startPos,
            },
        ],
        endPos,
    };
}

/**
 * Splits `condition: inlineBody` respecting quotes
 */
function splitConditionAndBody(str: string): { conditionPart: string; inlineBody?: string } {
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (!inQuotes && (c === '"' || c === "'")) {
            inQuotes = true;
            quoteChar = c;
        } else if (inQuotes && c === quoteChar) {
            inQuotes = false;
        } else if (!inQuotes && c === ':') {
            const afterColon = str.slice(i + 1);
            const afterColonTrimmed = afterColon.trim().toLowerCase();
            // Check for :show or :hide flags on the condition itself
            if (afterColonTrimmed.startsWith('show:') || afterColonTrimmed.startsWith('hide:')) {
                continue;
            }
            if (afterColonTrimmed === 'show' || afterColonTrimmed === 'hide') {
                return { conditionPart: str.trim(), inlineBody: undefined };
            }

            const conditionPart = str.slice(0, i).trim();
            let inlineBody = str.slice(i + 1);
            if (inlineBody.startsWith(' ')) {
                inlineBody = inlineBody.slice(1);
            }
            return { conditionPart, inlineBody };
        }
    }

    return { conditionPart: str.trim(), inlineBody: undefined };
}

/**
 * Parses condition strings such as:
 * - `Estatus == "En proceso"`
 * - `tipo != "Robo"`
 * - `edad >= 18`
 * - `Director.sex = F`
 * - `Observaciones != ""`
 * - `Observaciones` (truthy check)
 */
export function parseConditionString(condStr: string): ConditionalExpression | null {
    let mode: 'show' | 'hide' | undefined = undefined;
    let str = condStr.trim();

    // Check optional :show or :hide suffix
    const modeMatch = str.match(/:(show|hide)\s*$/i);
    if (modeMatch) {
        mode = modeMatch[1]!.toLowerCase() as 'show' | 'hide';
        str = str.slice(0, str.lastIndexOf(':' + modeMatch[1]!)).trim();
    }

    // Match: left operator right
    const match = str.match(
        /^(?:\{\s*)?([a-zA-Z0-9_.\s\-¿?áéíóúÁÉÍÓÚñÑ]+?)(?:\s*\})?\s*(==|!=|>=|<=|>|<|=)\s*(.+)$/
    );

    if (match) {
        const field_id = match[1]!.trim();
        const rawOp = match[2]!.trim();
        const operator = (rawOp === '==' ? '=' : rawOp) as ConditionalExpression['operator'];
        let val = match[3]!.trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return {
            field_id,
            operator,
            value: val,
            condition_mode: mode,
            is_implicit: false,
        };
    }

    // Single field presence check (truthy / not empty)
    const singleField = str.replace(/[{}]/g, '').trim();
    if (singleField) {
        return {
            field_id: singleField,
            operator: '!=',
            value: '',
            condition_mode: mode,
            is_implicit: true,
        };
    }

    return null;
}
