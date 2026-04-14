/**
 * Template Renderer - Content Rendering
 *
 * Handles rendering of templates with data substitution
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TemplateParserResult, SectionConfig, FieldConfig, FieldType, SnippetOption, FormDataRecord, FormDataValue } from '@/lib/types';
import { formatStaffMember, formatStaffReporta } from '../formatters';
/** Inline type for semantic resolution results (previously in integration-engine.ts) */
export interface ResolutionResult {
    concept: string;
    value: string;
    source: string;
}

/** Inline stub: resolves a semantic concept to its string value */
function resolveSemanticConcept(concept: string): ResolutionResult {
    return { concept, value: concept, source: 'inline' };
}
import { evaluateCondition, applyModifiers as applyTextModifier } from './evaluator';
import { parseFieldTag } from './parser';
import { logger } from '../logger';

/** Internal config shape used during rendering (combines parsed template + field definitions) */
interface TemplateRenderConfig {
    fields: Record<string, FieldConfig>;
    sections: SectionConfig[];
    layout: string[];
    templateOptions: Map<string, SnippetOption[]>;
    fieldModifiers: Map<string, string[]>;
}

/**
 * Renders template content with data substitution
 * 
 * Logic flow:
 * 1. Pass 1: Scan for mapping conditionals [?{Field}] Key=Value [/]
 *    - These are definition-only blocks (don't produce output).
 *    - Used to build a translation map for {Field} tags.
 * 2. Pass 2: Global substitution
 *    - {Field} tags: Use the translation map from Pass 1 if a match is found.
 *    - Standard Conditionals: Evaluation strictly for visibility logic.
 *    - Mapping Blocks: Removed (return empty string) to avoid duplication.
 * 
 * @param content - Template content string
 * @param data - Data object for substitution
 * @param config - Parsed template configuration
 * @returns Rendered string
 */
export function renderContent(
    content: string,
    data: unknown,
    config: TemplateParserResult
): string {
    if (!content) return '';
    const localData = (data || {}) as FormDataRecord;

    // First pass: collect all mapping results for fields
    const mappingResults: Record<string, string> = {};
    const mappingRegex = /\[\?\s*\{[\s\S]+?\}\s*(?:(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?))?\s*\]([\s\S]*?)\[\/\s*\]/g;

    let mappingMatch;
    while ((mappingMatch = mappingRegex.exec(content)) !== null) {
        const block = mappingMatch[0];
        const innerContent = mappingMatch[1];
        const condMatch = block.match(/^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(?:(!=|>=|<=|>|<|=)\s*("(.*?)"|(\S+?)))?\s*\]/);

        if (condMatch && condMatch[1]) {
            const condFieldId = condMatch[1].trim();
            const operator = condMatch[2];
            
            // Re-use findValueForField for robust case-insensitive lookup
            const actualValue = findValueForField(
                condFieldId, 
                localData, 
                config.sections || [], 
                {}, 
                {}
            );
            
            const options = config.templateOptions.get(condFieldId);

            if (!operator) {
                let keyToCompare = actualValue;
                if (options && typeof actualValue === 'string') {
                    const opt = options.find((o: SnippetOption) => o.value === actualValue || o.label === actualValue);
                    if (opt) keyToCompare = opt.label;
                }

                const lines = (innerContent || '').split('\n');
                for (const line of lines) {
                    const eqIdx = line.indexOf('=');
                    if (eqIdx > -1) {
                        const key = line.substring(0, eqIdx).trim();
                        const val = line.substring(eqIdx + 1).trim();
                        if (evaluateCondition(keyToCompare, '=', key)) {
                            mappingResults[condFieldId] = val;
                            break;
                        }
                    }
                }
            }
        }
    }

    const blockRegex =
        /(\{[^{}]+?\}|\[\?\s*\{[^{}]+?\}\s*(?:(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?))?\s*\][\s\S]*?\[\/\s*\])/g;

    return content.replace(blockRegex, (block) => {
        if (block.startsWith('{')) {
            const tag = block.slice(1, -1);
            const { fieldId, modifiers } = parseFieldTag(tag, new Map());

            // If we have a mapping result for this field, use it
            let val = mappingResults[fieldId] !== undefined ? mappingResults[fieldId] : localData[fieldId];

            // If not already mapped, handle standard dropdown value conversion
            if (mappingResults[fieldId] === undefined) {
                const options = config.templateOptions.get(fieldId);
                if (options && typeof val === 'string' && /^\d+$/.test(val)) {
                    const idx = parseInt(val, 10);
                    if (options[idx]) val = options[idx].value;
                }
            }

            // Unir modificadores de la etiqueta con los modificadores detectados globalmente
            const globalModifiers = config.fieldModifiers.get(fieldId) || [];
            const allModifiers = [...globalModifiers, ...modifiers];

            return applyTextModifier(val, allModifiers);
        } else if (block.startsWith('[?')) {
            const condMatch = block.match(
                /^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(?:(!=|>=|<=|>|<|=)\s*("(.*?)"|(\S+?)))?\s*\]([\s\S]*?)\[\/\s*\]$/
            );
            if (condMatch && condMatch[1] && condMatch[6]) {
                const operator = condMatch[2];
                if (operator) {
                    // Standard condition
                    const condFieldId = condMatch[1].trim();
                    const targetValue = condMatch[4] || condMatch[5] || '';
                    const innerContent = condMatch[6];
                    const actualValue = localData[condFieldId];

                    let valToCompare = actualValue;
                    const options = config.templateOptions.get(condFieldId);
                    if (options && /^\d+$/.test(String(actualValue))) {
                        const idx = parseInt(String(actualValue), 10);
                        const opt = options[idx];
                        if (opt) valToCompare = opt.value;
                    }

                    if (evaluateCondition(valToCompare, operator, targetValue)) {
                        return renderContent(innerContent, data, config);
                    }
                } else {
                    // Mapping conditional is now handled by the {Field} tag
                    // We return empty string here so the definition doesn't print itself.
                    return '';
                }
            }
            return '';
        }
        return block;
    });
}

/**
 * Helper: Escapes special regex characters
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper: Determines if a section is "virtual" (just a placeholder for a field)
 */
function isVirtualSection(content: string): boolean {
    if (!content) return false;
    const trimmed = content.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
}

/**
 * Resolves a dot-notation property from a resolved field value.
 * e.g. "Director.sex" resolves "Director" first, then reads `.sex` from the first StaffMember.
 * Supported properties: sex, name, cargo, rank, cedula, titulo, roleId, observations, id
 */
function resolvePropertyAccess(fieldId: string, baseValue: FormDataValue): FormDataValue {
    const dotIndex = fieldId.indexOf('.');
    if (dotIndex === -1) return undefined;
    const prop = fieldId.slice(dotIndex + 1).trim();
    if (!prop) return undefined;

    // Array of objects (e.g. StaffMember[]) — read from first element
    if (Array.isArray(baseValue) && baseValue.length > 0) {
        const first = baseValue[0] as Record<string, unknown>;
        if (first && typeof first === 'object') {
            const val = first[prop] ?? first[prop.toLowerCase()];
            return val as FormDataValue;
        }
    }
    // Plain object
    if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
        const obj = baseValue as Record<string, unknown>;
        const val = obj[prop] ?? obj[prop.toLowerCase()];
        return val as FormDataValue;
    }
    return undefined;
}

/**
 * Helper: Finds value for a field with fallback logic
 */
function findValueForField(
    fieldId: string,
    data: FormDataRecord,
    sections: SectionConfig[],
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    itemData?: FormDataRecord
): FormDataValue {
    // Dot-notation property access: {Director.sex}, {Reporta.cargo}, etc.
    if (fieldId.includes('.')) {
        const baseFieldId = fieldId.slice(0, fieldId.indexOf('.'));
        const baseValue = findValueForField(baseFieldId, data, sections, predefinedValues, dynamicPredefinedValues, itemData);
        // If the base field was found (even as empty array), attempt property resolution
        if (baseValue !== undefined) {
            return resolvePropertyAccess(fieldId, baseValue);
        }
        return undefined;
    }

    const lowerCaseFieldId = fieldId.toLowerCase();


    // 1. Check dynamic predefined values
    if (dynamicPredefinedValues[fieldId] !== undefined) return dynamicPredefinedValues[fieldId];
    const foundKeyInDynamic = Object.keys(dynamicPredefinedValues).find(
        (k) => k.toLowerCase() === lowerCaseFieldId
    );
    if (foundKeyInDynamic) return dynamicPredefinedValues[foundKeyInDynamic];

    // 2. Check item data (for repeatable sections)
    if (itemData && itemData[fieldId] !== undefined) return itemData[fieldId];
    if (itemData) {
        const foundKeyInItem = Object.keys(itemData).find(
            (k) => k.toLowerCase() === lowerCaseFieldId
        );
        if (foundKeyInItem) return itemData[foundKeyInItem];
    }

    // 3. Check root data
    if (data[fieldId] !== undefined) return data[fieldId];
    const foundKeyInRoot = Object.keys(data).find((k) => k.toLowerCase() === lowerCaseFieldId);
    if (foundKeyInRoot) return data[foundKeyInRoot];

    // 4. Check non-repeatable section data
    for (const section of sections.filter((s) => !s.isRepeatable && s.id in data)) {
        const sectionData = data[section.id];
        if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
            const dataObj = sectionData as Record<string, any>;
            if (dataObj[fieldId] !== undefined) return dataObj[fieldId];
            const foundKeyInSection = Object.keys(dataObj).find(
                (k) => k.toLowerCase() === lowerCaseFieldId
            );
            if (foundKeyInSection) return dataObj[foundKeyInSection];
        }
    }

    // 5. Check predefined values
    if (predefinedValues[fieldId] !== undefined) return predefinedValues[fieldId];
    const foundKeyInPredefined = Object.keys(predefinedValues).find(
        (k) => k.toLowerCase() === lowerCaseFieldId
    );
    if (foundKeyInPredefined) return predefinedValues[foundKeyInPredefined];

    return undefined;
}

/**
 * Helper: Renders a value based on its type and field config
 */
function renderValue(
    value: FormDataValue,
    fieldId: string,
    fields: Record<string, FieldConfig>,
    config: TemplateRenderConfig,
    data?: FormDataRecord
): string {
    if (value === undefined || value === null) return '';

    const fieldConfig = fields[fieldId];

    // Dropdown rendering
    if (fieldConfig?.type === 'dropdown' && typeof value === 'string') {
        if (fieldConfig.targetField) return '';
        const allOptions = [
            ...(fieldConfig.snippetOptions || []),
            ...(config.templateOptions?.get(fieldId) || []),
        ];
        const selectedOption = allOptions.find((opt: SnippetOption) => opt && opt.label === value);
        if (selectedOption && typeof selectedOption === 'object' && 'value' in selectedOption) {
            const resolved = String(selectedOption.value);
            // If the mapped value contains {field} references, expand them with context data
            if (resolved.includes('{') && data) {
                return resolved.replace(/\{([\s\S]+?)(?::[^}]*)?\}/g, (_, fieldRef: string) => {
                    const key = fieldRef.trim();
                    const found = Object.keys(data).find((k) => k.toLowerCase() === key.toLowerCase());
                    return found ? String(data[found] ?? '') : '';
                });
            }
            return resolved;
        }
        return String(value);
    }

    // Date rendering
    if (
        fieldConfig?.type === 'date' &&
        typeof value === 'string' &&
        value.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
        try {
            const date = new Date(value + 'T00:00:00');
            if (isNaN(date.getTime())) return value;

            const formattedDate = format(date, 'dd/MMMM/yyyy', { locale: es });
            const parts = formattedDate.split('/');
            const monthName = parts[1];
            if (parts.length === 3 && monthName) {
                parts[1] = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                return parts.join('/');
            }
            return formattedDate;
        } catch {
            return value;
        }
    }

    // Array rendering
    if (Array.isArray(value)) {
        if (value.length > 0) {
            if (typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
                const isReporta = fieldId.toLowerCase() === 'reporta';
                if (isReporta) {
                    return value.map((member) => formatStaffReporta(member as import('@/lib/types').StaffMember)).join(' / ');
                }
                const showCedula = fieldId.toLowerCase() === 'analista';
                return value.map((member) => formatStaffMember(member as import('@/lib/types').StaffMember, showCedula)).join(' / ');
            }
        }
        return value.join(' / ');
    }

    // Semantic field rendering
    if (fieldConfig?.type === 'semantic') {
        const result = resolveSemanticConcept(fieldId);
        return String(result.value);
    }

    // Apply text modifiers
    const modifiers = config.fieldModifiers?.get(fieldId) || [];
    return applyTextModifier(String(value), modifiers);
}

/**
 * Helper: Checks if a value has content
 */
function hasContent(value: FormDataValue): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
}

/**
 * Helper: Checks if a section has any values
 */
function sectionHasValues(
    section: SectionConfig,
    data: FormDataRecord,
    sections: SectionConfig[],
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    dataContext?: FormDataRecord
): boolean {
    const checkFieldsForContent = (fieldIds: string[], context: FormDataRecord): boolean => {
        return fieldIds.some((fieldId) => {
            const value = findValueForField(
                fieldId,
                data,
                sections,
                predefinedValues,
                dynamicPredefinedValues,
                context
            );
            return hasContent(value);
        });
    };

    const checkSectionRecursive = (s: SectionConfig, context: FormDataRecord): boolean => {
        if (s.hasStaticContent && s.condition) return true;

        if (s.isRepeatable) {
            const sectionData = context[s.id] as FormDataValue[];
            if (!Array.isArray(sectionData) || sectionData.length === 0) return false;
            return sectionData.some(
                (item) =>
                    checkFieldsForContent(s.fieldIds, item as FormDataRecord) ||
                    (s.layout || []).some(
                        (id) =>
                            (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) &&
                            checkSectionRecursive(sections.find((sec) => sec.id === id)!, item as FormDataRecord)
                    )
            );
        } else {
            const nestedContext = (context[s.id] || context) as FormDataRecord;
            return (
                checkFieldsForContent(s.fieldIds, nestedContext) ||
                (s.layout || []).some(
                    (id) =>
                        (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) &&
                        checkSectionRecursive(sections.find((sec) => sec.id === id)!, nestedContext)
                )
            );
        }
    };

    const context = dataContext || (data[section.id] ? data[section.id] as FormDataRecord : data);
    return checkSectionRecursive(section, context);
}

/**
 * Renders a section recursively with its nested content
 */
function renderSection(
    sectionId: string,
    data: FormDataRecord,
    sections: SectionConfig[],
    fields: Record<string, FieldConfig>,
    config: TemplateRenderConfig,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    currentData: FormDataRecord,
    mappingResults: Record<string, string> = {}
): string {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    // Evaluate condition if present
    if (section.condition) {
        let valToCompare = findValueForField(
            section.condition.fieldId,
            data,
            sections,
            predefinedValues,
            dynamicPredefinedValues,
            currentData
        );

        // Resolve dropdown labels for comparison
        const options = config.templateOptions?.get(section.condition.fieldId);
        if (options && valToCompare !== undefined && valToCompare !== null) {
            const valStr = String(valToCompare);
            const opt = options.find(o => 
                String(o.value) === valStr || 
                String(o.label) === valStr
            );
            
            if (opt) {
                // Determine if we should compare against label or value
                const targetValue = section.condition.value;
                if (String(opt.label) === targetValue) {
                    valToCompare = opt.label;
                } else if (String(opt.value) === targetValue) {
                    valToCompare = opt.value;
                } else {
                    // Fallback to label for documented behavior
                    valToCompare = opt.label;
                }
            }
        }

        if (section.isMapping) {
            // We just perform the evaluation to ensure logic works if needed,
            // but we return empty string because {Tag} will handle the actual output.
            return '';
        }

        if (!evaluateCondition(valToCompare, section.condition.operator || '=', section.condition.value)) {
            return '';
        }
    }

    let renderedItems = '';
    // For singular/plural sections (implicitly repeatable), data can come either as:
    //   array:  data[section.id] = [{field: val}, ...]
    //   or as top-level fields in the report data (single item case)
    const hasSingularPlural = !!(section.singularTitle || section.pluralTitle);
    const itemsToProcess = section.isRepeatable
        ? Array.isArray(currentData[section.id])
            ? currentData[section.id]
            : Array.isArray(data[section.id])
                ? data[section.id]
                // Singular/plural: fall back to treating top-level data as one item
                : hasSingularPlural ? [currentData] : []
        : [currentData[section.id] || (data[section.id] ? data[section.id] : currentData)];



    const itemsWithContent = (itemsToProcess as FormDataRecord[]).filter(
        (item: FormDataRecord) => {
            const hasFields = section.fieldIds.some((fid: string) =>
                hasContent(findValueForField(fid, data, sections, predefinedValues, dynamicPredefinedValues, item))
            );
            const hasNestedContent = (section.layout || []).some(
                (id: string) => {
                    if (!(id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_'))) return false;
                    const nestedSec = sections.find((s) => s.id === id);
                    return nestedSec ? sectionHasValues(nestedSec, data, sections, predefinedValues, dynamicPredefinedValues, item) : false;
                }
            );
            return (section.hasStaticContent && section.condition) || hasFields || hasNestedContent;
        }
    );




    if (itemsWithContent.length === 0) return '';

    const renderedItemsArray = itemsWithContent
        .map((item: FormDataRecord, index: number) => {

            let itemContent = section.originalContent || '';
            let itemLayout = section.layout && section.layout.length > 0 ? section.layout : section.fieldIds;

            itemLayout.forEach((id: string) => {
                if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                    // ... (keep existing nested section logic)
                    const nestedSection = sections.find((s) => s.id === id);
                    if (nestedSection) {
                        const isVirtual = isVirtualSection(nestedSection.originalContent || '');
                        let nestedRegex;
                        let header = '';
                        let nestedBody = '';
                        if (isVirtual) {
                            nestedRegex = new RegExp(`${escapeRegExp(nestedSection.originalContent || '')}\\*`, 'g');
                        } else if (nestedSection.isSelfContained) {
                            let labelPart = '';
                            if (nestedSection.singularTitle || nestedSection.pluralTitle || nestedSection.repeatableItemLabel) {
                                // Allow attributes in any order for robustness
                                const attrList = [];
                                if (nestedSection.singularTitle) attrList.push(`singular\\s*=\\s*"${escapeRegExp(nestedSection.singularTitle)}"`);
                                if (nestedSection.pluralTitle) attrList.push(`plural\\s*=\\s*"${escapeRegExp(nestedSection.pluralTitle)}"`);
                                if (nestedSection.repeatableItemLabel) attrList.push(`sub\\s*=\\s*"${escapeRegExp(nestedSection.repeatableItemLabel)}"`);
                                
                                // Join with optional whitespace and allow any order using a more complex lookahead-based pattern 
                                // OR simpler: just match the bunch of attributes. Since we know what we expect, 
                                // we can just list them with \s* between them.
                                labelPart = attrList.map(a => `${a}\\s*`).join('');
                            } else if (nestedSection.label) {
                                const escaped = escapeRegExp(nestedSection.label);
                                labelPart = `(?:"${escaped}"|${escaped})`;
                            }

                            const nestedBodySC = nestedSection.originalContent || '';
                            nestedRegex = new RegExp(
                                `\\[\\s*${labelPart}${escapeRegExp(nestedBodySC)}\\s*\\]${nestedSection.isRepeatable ? '\\*?' : ''}`,
                                'gs'
                            );


                        } else {
                            if (nestedSection.condition) {
                                const cond = nestedSection.condition;
                                const opPart = cond.operator
                                    ? `\\s*${escapeRegExp(cond.operator)}\\s*(?:"${escapeRegExp(cond.value)}"|${escapeRegExp(cond.value)})`
                                    : '';
                                const escapedFieldId = escapeRegExp(cond.fieldId);
                                const fieldPart = `(?:\\{\\s*${escapedFieldId}\\s*\\}|${escapedFieldId})`;
                                const modeSuffix = `(?:\\s*:(?:show|hide))?`;
                                header = `\\?\\s*${fieldPart}${opPart}${modeSuffix}`;
                            } else if (
                                nestedSection.singularTitle ||
                                nestedSection.pluralTitle ||
                                nestedSection.repeatableItemLabel
                            ) {
                                header = nestedSection.singularTitle ? `singular="${escapeRegExp(nestedSection.singularTitle)}"\\s*` : '';
                                header += nestedSection.pluralTitle ? `plural="${escapeRegExp(nestedSection.pluralTitle)}"\\s*` : '';
                                header += nestedSection.repeatableItemLabel
                                    ? `sub="${escapeRegExp(nestedSection.repeatableItemLabel)}"\\s*`
                                    : '';

                            } else if (nestedSection.label && nestedSection.label !== 'separator') {

                                header = `"${escapeRegExp(nestedSection.label)}"?\\s*`;
                            } else if (nestedSection.isSeparator || nestedSection.label === 'separator') {
                                header = '""';
                            }

                            const nestedBodyStr = nestedSection.originalContent || '';
                            nestedRegex = new RegExp(
                                `\\[\\s*${header}\\s*\\]${nestedSection.isRepeatable ? '\\*?' : ''}${escapeRegExp(nestedBodyStr)}\\[\\/\\s*\\]`,
                                'gs'
                            );

                        }
                        let isDependencyBlock = false;
                        if (nestedSection.condition && !nestedSection.isMapping) {
                            const pureContent = (nestedSection.originalContent || '')
                                .replace(/\{[^}]+\}/g, '')
                                .replace(/[\s\n\r\t]/g, '');
                            if (pureContent === '') {
                                isDependencyBlock = true;
                            }
                        }

                        if (isDependencyBlock) {
                            const cleanRegex = new RegExp(
                                `\\[\\s*${header}\\s*\\]${nestedSection.isRepeatable ? '\\s*\\*?' : ''}${escapeRegExp(nestedSection.originalContent || '')}\\[\\/\\s*\\]`,
                                'gs'
                            );

                            itemContent = itemContent.replace(cleanRegex, '');
                        } else {
                            const renderedNested = renderSection(
                                id,
                                data,
                                sections,
                                fields,
                                config,
                                predefinedValues,
                                dynamicPredefinedValues,
                                item,
                                mappingResults
                            );
                            itemContent = itemContent.replace(nestedRegex, renderedNested);
                        }
                    }
                } else {
                    const baseVal = findValueForField(id, data, sections, predefinedValues, dynamicPredefinedValues, item);
                    // Case-insensitive mapping results lookup
                    const lowerId = id.toLowerCase();
                    const mappingKey = Object.keys(mappingResults).find(k => k.toLowerCase() === lowerId);
                    const val = mappingKey !== undefined ? mappingResults[mappingKey] : baseVal;


                    itemContent = itemContent.replace(
                        new RegExp(`\\{${escapeRegExp(id)}(:[^|}{]+)*(?:\\|[^{}]+?)?\\}(\\*)?`, 'g'),
                        renderValue(val, id, fields, config, { ...data, ...item })
                    );
                }
            });

            if (section.isSelfContained) {
                // Filter out "label-only" lines where the field rendered to empty.
                // Example: "- *MONTO:* " where {monto} resolved to '' → remove.
                // Blank lines (empty or only whitespace) are ALWAYS preserved — they are
                // intentional spacing that the user put in the template.
                const lines = itemContent.split(/\r?\n/);
                const filteredLines = lines.filter(line => {
                    // Blank/whitespace-only line: always keep (intentional spacing)
                    if (line.trim().length === 0) return true;

                    // Check if any alphanumeric content remains after stripping decorative chars.
                    // If nothing remains, this was a "- *LABEL:* {empty-field}" line → remove it.
                    const alphanumeric = line
                        .replace(/- \*\*[^*]+:\*\*/g, '')  // - **LABEL:**
                        .replace(/- \*[^*]+:\*/g, '')        // - *LABEL:*
                        .replace(/\*\*[^*]+:\*\*/g, '')      // **LABEL:**
                        .replace(/\*[^*]+:\*/g, '')          // *LABEL:*
                        .replace(/^[ \t]*-[ \t]*/gm, '')     // leading bullet
                        .replace(/[*\-:"'\s]/g, '')          // remaining decorative + quotes
                        .trim();

                    return alphanumeric.length > 0;
                });
                itemContent = filteredLines.join('\n');
            }

            if (section.repeatableItemLabel) {

                const isVirtual = isVirtualSection(section.originalContent || '');
                
                if (isVirtual) {
                    if (itemsWithContent.length > 1) {
                        const labelPrefix = `- *${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}:*`;
                        itemContent = `${labelPrefix} ${itemContent.replace(/^\s+/, '')}`;
                    } else {
                        const labelPrefix = `- *${section.repeatableItemLabel}:*`;
                        itemContent = `${labelPrefix} ${itemContent.replace(/^\s+/, '')}`;
                    }
                } else if (itemsWithContent.length > 1) {
                    // Format: - *NOVEDAD #01*\ncontent — only when multiple items
                    const labelPrefix = `- *${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}*`;
                    // Only trim leading newline if it was explicitly there to avoid triple newlines
                    const cleaned = itemContent.startsWith('\n') ? itemContent.slice(1) : itemContent;
                    itemContent = `${labelPrefix}\n${cleaned}`;
                }
            }
            return section.condition ? itemContent.trim() : itemContent;
        });

    // Determine appropriate joiner: 
    // If originalContent was virtual, always join with \n. 
    // Otherwise, join with \n ONLY if items don't already end with a newline.
    const isVirtual = isVirtualSection(section.originalContent || '');
    const hasInternalNewlines = renderedItemsArray.some(item => (item || '').trim().includes('\n'));
    const anyEndsWithNewline = renderedItemsArray.some(item => (item || '').endsWith('\n'));
    
    // Choose joiner:
    // 1. Virtual items -> joined by single \n
    // 2. Multiline items that don't already end in \n -> joined by \n\n (for separation)
    // 3. Items already ending in \n -> joined by '' (respect template)
    // 4. Single line items -> joined by \n
    const joiner = isVirtual ? '\n' : (anyEndsWithNewline ? '' : (hasInternalNewlines ? '\n\n' : '\n'));
    renderedItems = renderedItemsArray.join(joiner);

    // Add section title only for singular/plural sections (not plain labeled ones)
    if (section.singularTitle || section.pluralTitle) {
        const title = itemsWithContent.length > 1 && section.pluralTitle
            ? section.pluralTitle
            : (section.singularTitle || section.pluralTitle!);
        const header = `- *${title}*`;
        renderedItems = `${header}\n${renderedItems}`;
    }

    return renderedItems;
}

/**
 * Renders content with full section handling
 * 
 * Main rendering function with support for repeatable sections,
 * conditional sections, and complex nested structures
 */
export function renderContentWithSections(
    template: string,
    data: FormDataRecord,
    config: TemplateRenderConfig,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string> = {}
): string {
    const { sections = [], fields = {} } = config;
    let finalContent = template;

    // First pass: collect all mapping results for fields
    const mappingResults: Record<string, string> = {};
    const mappingRegex = /\[\?\s*\{[\s\S]+?\}\s*(?:(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?))?\s*\]([\s\S]*?)\[\/\s*\]/g;
    let mappingMatch;
    while ((mappingMatch = mappingRegex.exec(template)) !== null) {
        const block = mappingMatch[0];
        const innerContent = mappingMatch[1];
        const condMatch = block.match(/^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(?:(!=|>=|<=|>|<|=)\s*("(.*?)"|(\S+?)))?\s*\]/);
        if (condMatch && condMatch[1]) {
            const condFieldId = condMatch[1].trim();
            const operator = condMatch[2];
            const actualValue = findValueForField(condFieldId, data, sections, predefinedValues, dynamicPredefinedValues);
            if (!operator) {
                let keyToCompare = actualValue;
                const options = config.templateOptions?.get(condFieldId);
                if (options && typeof actualValue === 'string') {
                    const opt = options.find((o) => o.value === actualValue || o.label === actualValue);
                    if (opt) keyToCompare = opt.label;
                }
                const lines = (innerContent || '').split('\n');
                for (const line of lines) {
                    const eqIdx = line.indexOf('=');
                    if (eqIdx > -1) {
                        const key = line.substring(0, eqIdx).trim();
                        const val = line.substring(eqIdx + 1).trim();
                        if (evaluateCondition(keyToCompare, '=', key)) {
                            mappingResults[condFieldId] = val;
                            break;
                        }
                    }
                }
            }
        }
    }

    // Process top-level layout items
    const topLevelSections = sections.filter((s: SectionConfig) => {
        return config.layout.includes(s.id);
    });

    topLevelSections.forEach((section: SectionConfig) => {
        const isVirtual = isVirtualSection(section.originalContent || '');
        let sectionRegex;

        if (section.isSelfContained) {
            // Self-contained sections: ["Title" {field1} {field2}] — no closing [/]
            // labelPart handles: [Label], ["Label"], ["Label" extra text...{fields}]
            // For quoted labels, bodyContent already starts with whatever follows the
            // closing title quote (including static text and \n), so we DON'T add \s*
            // between labelPart and bodyContent.
            let labelPart = '';
            if (section.singularTitle || section.pluralTitle || section.repeatableItemLabel) {
                const attrList = [];
                if (section.singularTitle) attrList.push(`singular\\s*=\\s*"${escapeRegExp(section.singularTitle)}"`);
                if (section.pluralTitle) attrList.push(`plural\\s*=\\s*"${escapeRegExp(section.pluralTitle)}"`);
                if (section.repeatableItemLabel) attrList.push(`sub\\s*=\\s*"${escapeRegExp(section.repeatableItemLabel)}"`);
                labelPart = attrList.map(a => `${a}\\s*`).join('');
            } else if (section.label) {

                const escaped = escapeRegExp(section.label);
                labelPart = `(?:"${escaped}"|${escaped})`;
            }
            const bodyContent = section.originalContent || '';
            const fullBlockPattern = `\\[\\s*${labelPart}${escapeRegExp(bodyContent)}\\s*\\]${section.isRepeatable ? '\\*?' : ''}`;
            sectionRegex = new RegExp(fullBlockPattern, 'gs');
        } else if (isVirtual) {
            sectionRegex = new RegExp(`${escapeRegExp(section.originalContent || '')}\\*`, 'g');
        } else {
            let headerPart = '';
            if (section.condition) {
                const cond = section.condition;
                const opPart = cond.operator
                    ? `\\s*${escapeRegExp(cond.operator)}\\s*(?:"${escapeRegExp(cond.value)}"|${escapeRegExp(cond.value)})`
                    : '';
                // Field name may appear with or without braces: [?{Campo}=val] or [?Campo=val]
                const escapedFieldId = escapeRegExp(cond.fieldId);
                const fieldPart = `(?:\\{\\s*${escapedFieldId}\\s*\\}|${escapedFieldId})`;
                // Optional :show/:hide suffix at end of condition header
                const modeSuffix = `(?:\\s*:(?:show|hide))?`;
                headerPart = `\\?\\s*${fieldPart}${opPart}${modeSuffix}`;

            } else if (section.singularTitle || section.pluralTitle || section.repeatableItemLabel) {
                headerPart += section.singularTitle ? `singular="${escapeRegExp(section.singularTitle)}"\\s*` : '';
                headerPart += section.pluralTitle ? `plural="${escapeRegExp(section.pluralTitle)}"\\s*` : '';
                headerPart += section.repeatableItemLabel ? `sub="${escapeRegExp(section.repeatableItemLabel)}"\\s*` : '';
            } else if (section.label && section.label !== 'separator') {
                // section.label is stored WITHOUT quotes (parser strips them).
                // Template may have: [Label]  or  ["Label"]  or  ["Label" any extra text]
                const escaped = escapeRegExp(section.label);
                headerPart = `(?:"${escaped}"[^\\]]*|${escaped})\\s*`;
            } else if (section.isSeparator || section.label === 'separator') {
                headerPart = '""';
            }

            const bodyContent = section.originalContent || '';
            const fullBlockPattern = `\\[\\s*${headerPart}\\s*\\]${section.isRepeatable ? '\\*?' : ''}${escapeRegExp(bodyContent)}\\[\\/\\s*\\]`;
            sectionRegex = new RegExp(fullBlockPattern, 'gs');
        }




        const rendered = renderSection(
            section.id,
            data,
            sections,
            fields,
            config,
            predefinedValues,
            dynamicPredefinedValues,
            data,
            mappingResults
        );

        if (sectionRegex) {
            finalContent = finalContent.replace(sectionRegex, rendered);
        }
    });








    // Final cleanup of loose tags (omit semantic tags for post-processing).
    // Regex extended to also handle dotted field names like {Director.sex}.
    finalContent = finalContent.replace(
        /\{([^:{}]+?(?:\.[^:{}]+?)?)(:[^|}{]+)*(?:\|[^{}]+?)?\}/g,
        (match, fieldId: string) => {
            if (match.includes(':semantic')) return match;
            fieldId = fieldId.trim();
            const lowerFieldId = fieldId.toLowerCase();
            const baseVal = findValueForField(fieldId, data, sections, predefinedValues, dynamicPredefinedValues);
            
            // Mapping results are only applicable for non-dotted field names
            const mappingKey = !fieldId.includes('.')
                ? Object.keys(mappingResults).find(k => k.toLowerCase() === lowerFieldId)
                : undefined;
            const formValue = mappingKey !== undefined ? mappingResults[mappingKey] : baseVal;
            
            return hasContent(formValue) ? renderValue(formValue, fieldId, fields, config) : '';
        }
    );

    return finalContent;
}

/**
 * Renders the final report with full template processing
 * 
 * Main entry point for template rendering. Handles:
 * - Template parsing
 * - Configuration building
 * - Full content rendering
 * - Summary extraction
 * - Semantic concept resolution
 * - Audit recording
 * 
 * @param template - Template string
 * @param data - Data for rendering
 * @param config - Field and section configuration
 * @param predefinedValues - Predefined values (e.g., global tags)
 * @param summaryOnly - If true, only extract summary markers
 * @param dynamicPredefinedValues - Runtime predefined values
 * @returns Rendered report string
 */
export function renderFinalReport(
    template: string,
    data: FormDataRecord,
    config: { fields: Record<string, FieldConfig>; sections: SectionConfig[]; layout: string[] },
    predefinedValues: Record<string, string>,
    summaryOnly: boolean = false,
    dynamicPredefinedValues: Record<string, string> = {},
    parseTemplate: (template: string) => TemplateParserResult,
    recordReportAudit: (reportId: string, audit: ResolutionResult[]) => void
): string {
    try {
        const { sections, layout, fieldNames, fieldTypes, templateOptions, fieldModifiers } =
            parseTemplate(template);

        // Build final config with all necessary data
        const finalConfig: TemplateRenderConfig = {
            fields: {} as Record<string, FieldConfig>,
            sections,
            layout,
            templateOptions,
            fieldModifiers,
        };

        fieldNames.forEach((fieldName: string) => {
            const fieldConfig: FieldConfig = config.fields[fieldName]
                ? { ...config.fields[fieldName] }
                : { type: 'text' as FieldType, label: fieldName };

            finalConfig.fields[fieldName] = fieldConfig;
            const options = templateOptions.get(fieldName);
            if (options) {
                fieldConfig.snippetOptions = options;
            }
            if (fieldTypes.has(fieldName)) {
                fieldConfig.type = fieldTypes.get(fieldName)!;
            }
        });

        // Render full content first
        let fullRenderedContent = renderContentWithSections(
            template,
            data,
            finalConfig,
            predefinedValues,
            dynamicPredefinedValues
        );

        // Extract summary if needed
        let summaryContent = '';
        if (summaryOnly) {
            const summaryRegex = /<<([\s\S]*?)>>/g;
            const matches = Array.from(fullRenderedContent.matchAll(summaryRegex));
            if (matches.length > 0) {
                summaryContent = matches.map((match) => match[1]).join('\n\n');
            }
            fullRenderedContent = summaryContent;
        }

        // Final cleanup and semantic post-processing
        let finalOutput = fullRenderedContent
            .replace(/<<|>>/g, '') // Remove summary markers
            .replace(/\[\?.*?\][\s\S]*?\[\/\s*\]/g, '') // Remove unprocessed conditional blocks
            .replace(/\[""\]\s*/g, '') // Remove separators
            .replace(/\[[\s\S]*?\](\*)?/g, ''); // Remove unprocessed section blocks (don't swallow trailing whitespace)

        // Resolve literal semantic tags
        const semanticRegex = /\{([\s\S]+?):semantic\}/g;
        const semanticAudit: ResolutionResult[] = [];

        finalOutput = finalOutput.replace(semanticRegex, (_, concept) => {
            const result = resolveSemanticConcept(concept.trim());
            semanticAudit.push(result);
            return String(result.value);
        });

        // Record audit if there's semantic data
        if (data.id && semanticAudit.length > 0) {
            recordReportAudit(String(data.id), semanticAudit);
        }

        // Final unescaping of characters (e.g. \* -> *, \\ -> \)
        finalOutput = finalOutput.replace(/\\([\*\{\}\[\]\\])/g, '$1');

        // Collapse blank lines left by non-rendered conditional blocks.
        // Reduces 3+ consecutive newlines to a maximum of 2 (one visible blank line).
        finalOutput = finalOutput.replace(/\n{3,}/g, '\n\n');

        // Remove lines that became entirely whitespace after substitution
        // (e.g. a label line like "- *DIRECTOR:*" whose field resolved to empty).
        finalOutput = finalOutput.replace(/^[\t ]+$/gm, '');

        return finalOutput.trim();
    } catch (error) {
        logger.error('Error rendering report', error instanceof Error ? error : new Error(String(error)), {


            feature: 'TemplateRenderer',
            message: error instanceof Error ? error.message : String(error)
        });
        return 'Error al generar el reporte. La plantilla podría tener un formato incorrecto o faltan datos esenciales.';
    }
}
