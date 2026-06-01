/**
 * Template Renderer - Content Rendering
 *
 * Handles rendering of templates with data substitution
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TemplateParserResult, SectionConfig, FieldConfig, FieldType, SnippetOption, form_dataRecord, form_dataValue } from '@/lib/types';
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
    const localData = (data || {}) as form_dataRecord;

    // First pass: collect all mapping results for fields
    const mappingResults: Record<string, string> = {};
    const mappingRegex = /\[\?\s*\{[\s\S]+?\}\s*(?:(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?))?\s*\]([\s\S]*?)\[\/\s*\]/g;

    let mappingMatch;
    while ((mappingMatch = mappingRegex.exec(content)) !== null) {
        const block = mappingMatch[0];
        const innerContent = mappingMatch[1];
        const condMatch = block.match(/^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(?:(!=|>=|<=|>|<|=)\s*("(.*?)"|(\S+?)))?\s*\]/);

        if (condMatch && condMatch[1]) {
            const condfield_id = condMatch[1].trim();
            const operator = condMatch[2];

            // Re-use findValueForField for robust case-insensitive lookup
            const actualValue = findValueForField(
                condfield_id,
                localData,
                config.sections || [],
                {},
                {}
            );

            const options = config.templateOptions.get(condfield_id);

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
                            mappingResults[condfield_id] = val;
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
            const { field_id, modifiers } = parseFieldTag(tag, new Map());

            // If we have a mapping result for this field, use it
            let val = mappingResults[field_id] !== undefined ? mappingResults[field_id] : localData[field_id];

            // If not already mapped, handle standard dropdown value conversion
            if (mappingResults[field_id] === undefined) {
                const options = config.templateOptions.get(field_id);
                if (options && typeof val === 'string' && /^\d+$/.test(val)) {
                    const idx = parseInt(val, 10);
                    if (options[idx]) val = options[idx].value;
                }
            }

            // Unir modificadores de la etiqueta con los modificadores detectados globalmente
            const globalModifiers = config.fieldModifiers.get(field_id) || [];
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
                    const condfield_id = condMatch[1].trim();
                    const targetValue = condMatch[4] || condMatch[5] || '';
                    const innerContent = condMatch[6];
                    const actualValue = localData[condfield_id];

                    let valToCompare = actualValue;
                    const options = config.templateOptions.get(condfield_id);
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

// Cache for section regexes to avoid repeated RegExp creation
const sectionRegexCache = new Map<string, RegExp>();

/**
 * Helper: Generates a regex to match a section block in the template
 */
function getSectionRegex(section: SectionConfig): RegExp {
    // Stable key for caching: section ID + repeatable flag + self-contained flag
    const cacheKey = `${section.id}_${section.is_repeatable}_${section.is_self_contained}_${section.full_raw?.length || 0}`;
    const cached = sectionRegexCache.get(cacheKey);
    if (cached) return cached;

    let regex: RegExp;
    if (section.full_raw) {
        const escaped = escapeRegExp(section.full_raw).replace(/\n/g, '\\r?\\n');
        regex = new RegExp(escaped, 'g');
    } else {
        const isVirtual = section.is_virtual;
        const bodyContent = section.original_content || '';
        const isRepeatable = section.is_repeatable;

        // Use a pattern that handles both CRLF and LF for cross-platform stability
        const escapedBody = escapeRegExp(bodyContent).replace(/\n/g, '\\r?\\n');

        if (isVirtual) {
            regex = new RegExp(`${escapedBody}\\*`, 'g');
        } else if (section.is_self_contained) {
            let labelPart = '';
            if (section.singular_title || section.plural_title || section.repeatable_item_label) {
                const attrList = [];
                if (section.singular_title) attrList.push(`singular\\s*=\\s*"${escapeRegExp(section.singular_title)}"`);
                if (section.plural_title) attrList.push(`plural\\s*=\\s*"${escapeRegExp(section.plural_title)}"`);
                if (section.repeatable_item_label) attrList.push(`sub\\s*=\\s*"${escapeRegExp(section.repeatable_item_label)}"`);
                labelPart = attrList.map(a => `${a}\\s*`).join('');
            } else if (section.label) {
                const escaped = escapeRegExp(section.label);
                labelPart = `(?:"${escaped}"|${escaped})`;
            }
            const pattern = `\\[\\s*${labelPart}[^\\]]*\\]${isRepeatable ? '\\*?' : ''}`;
            regex = new RegExp(pattern, 'gs');
        } else {
            // Normal or Conditional Section
            let headerPart = '';
            if (section.condition) {
                const cond = section.condition;
                const opPart = cond.operator
                    ? `\\s*${escapeRegExp(cond.operator)}\\s*(?:"${escapeRegExp(cond.value)}"|${escapeRegExp(cond.value)})`
                    : '';
                const escapedfield_id = escapeRegExp(cond.field_id);
                const fieldPart = `(?:\\{\\s*${escapedfield_id}\\s*\\}|${escapedfield_id})`;
                const modeSuffix = `(?:\\s*:(?:show|hide))?`;
                headerPart = `\\?\\s*${fieldPart}${opPart}${modeSuffix}`;
            } else if (section.singular_title || section.plural_title || section.repeatable_item_label) {
                headerPart += section.singular_title ? `singular="${escapeRegExp(section.singular_title)}"\\s*` : '';
                headerPart += section.plural_title ? `plural="${escapeRegExp(section.plural_title)}"\\s*` : '';
                headerPart += section.repeatable_item_label ? `sub="${escapeRegExp(section.repeatable_item_label)}"\\s*` : '';
            } else if (section.label && section.label !== 'separator') {
                const escaped = escapeRegExp(section.label);
                headerPart = `(?:"${escaped}"[^\\]]*|${escaped})\\s*`;
            } else if (section.is_separator || section.label === 'separator') {
                headerPart = '""';
            }

            const pattern = `\\[\\s*${headerPart}\\s*\\]${isRepeatable ? '\\*?' : ''}${escapedBody}\\[\\/\\s*\\]`;
            regex = new RegExp(pattern, 'gs');
        }
    }

    if (sectionRegexCache.size > 500) sectionRegexCache.clear();
    sectionRegexCache.set(cacheKey, regex);
    return regex;
}

/**
 * Resolves a dot-notation property from a resolved field value.
 * e.g. "Director.sex" resolves "Director" first, then reads `.sex` from the first StaffMember.
 * Supported properties: sex, name, cargo, rank, cedula, titulo, role_id, observations, id
 */
function resolvePropertyAccess(field_id: string, baseValue: form_dataValue): form_dataValue {
    const dotIndex = field_id.indexOf('.');
    if (dotIndex === -1) return undefined;
    const prop = field_id.slice(dotIndex + 1).trim();
    if (!prop) return undefined;

    // Array of objects (e.g. StaffMember[]) — read from first element
    if (Array.isArray(baseValue) && baseValue.length > 0) {
        const first = baseValue[0];
        if (first && typeof first === 'object') {
            const obj = first as Record<string, unknown>;
            if (prop.toLowerCase() === 'cargo') {
                const assignedRole = obj.role_id ?? obj.roleId;
                if (assignedRole && assignedRole !== 'none') {
                    return assignedRole as form_dataValue;
                }
            }
            const val = obj[prop] ?? obj[prop.toLowerCase()];
            return val as form_dataValue;
        }
        // Fallback for string elements in array: if requesting 'name', return the string itself
        if (typeof first === 'string' && prop.toLowerCase() === 'name') {
            return first;
        }
        // Fallback for string elements in array: if requesting 'sex', default to 'M'
        if (typeof first === 'string' && prop.toLowerCase() === 'sex') {
            return 'M';
        }
    }
    // Plain object
    if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
        const obj = baseValue as Record<string, unknown>;
        if (prop.toLowerCase() === 'cargo') {
            const assignedRole = obj.role_id ?? obj.roleId;
            if (assignedRole && assignedRole !== 'none') {
                return assignedRole as form_dataValue;
            }
        }
        const val = obj[prop] ?? obj[prop.toLowerCase()];
        return val as form_dataValue;
    }

    // Fallback for string values: if requesting 'name', return the string itself
    if (typeof baseValue === 'string' && prop.toLowerCase() === 'name') {
        return baseValue;
    }
    // Fallback for string values: if requesting 'sex', default to 'M'
    if (typeof baseValue === 'string' && prop.toLowerCase() === 'sex') {
        return 'M';
    }

    return undefined;
}

/**
 * Helper: Finds value for a field with fallback logic
 */
function findValueForField(
    field_id: string,
    data: form_dataRecord,
    sections: SectionConfig[],
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    itemData?: form_dataRecord
): form_dataValue {
    // Dot-notation property access: {Director.sex}, {Reporta.cargo}, etc.
    if (field_id.includes('.')) {
        const basefield_id = field_id.slice(0, field_id.indexOf('.'));
        const baseValue = findValueForField(basefield_id, data, sections, predefinedValues, dynamicPredefinedValues, itemData);
        // If the base field was found (even as empty array), attempt property resolution
        if (baseValue !== undefined) {
            return resolvePropertyAccess(field_id, baseValue);
        }
        return undefined;
    }

    const lowerCasefield_id = field_id.toLowerCase();


    // 1. Check dynamic predefined values
    if (dynamicPredefinedValues[field_id] !== undefined) return dynamicPredefinedValues[field_id];
    const foundKeyInDynamic = Object.keys(dynamicPredefinedValues).find(
        (k) => k.toLowerCase() === lowerCasefield_id
    );
    if (foundKeyInDynamic) return dynamicPredefinedValues[foundKeyInDynamic];

    // 2. Check item data (for repeatable sections)
    if (itemData && itemData[field_id] !== undefined) return itemData[field_id];
    if (itemData) {
        const foundKeyInItem = Object.keys(itemData).find(
            (k) => k.toLowerCase() === lowerCasefield_id
        );
        if (foundKeyInItem) return itemData[foundKeyInItem];
    }

    // 3. Check root data
    if (data[field_id] !== undefined) return data[field_id];
    const foundKeyInRoot = Object.keys(data).find((k) => k.toLowerCase() === lowerCasefield_id);
    if (foundKeyInRoot) return data[foundKeyInRoot];

    // 4. Check non-repeatable section data
    for (const section of sections.filter((s) => !s.is_repeatable && s.id in data)) {
        const sectionData = data[section.id];
        if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
            const dataObj = sectionData as Record<string, any>;
            if (dataObj[field_id] !== undefined) return dataObj[field_id];
            const foundKeyInSection = Object.keys(dataObj).find(
                (k) => k.toLowerCase() === lowerCasefield_id
            );
            if (foundKeyInSection) return dataObj[foundKeyInSection];
        }
    }

    // 5. Check predefined values
    if (predefinedValues[field_id] !== undefined) return predefinedValues[field_id];
    const foundKeyInPredefined = Object.keys(predefinedValues).find(
        (k) => k.toLowerCase() === lowerCasefield_id
    );
    if (foundKeyInPredefined) return predefinedValues[foundKeyInPredefined];

    return undefined;
}

/**
 * Helper: Renders a value based on its type and field config
 */
function renderValue(
    value: form_dataValue,
    field_id: string,
    fields: Record<string, FieldConfig>,
    config: TemplateRenderConfig,
    data?: form_dataRecord
): string {
    if (value === undefined || value === null) return '';

    const fieldConfig = fields[field_id];
    let rendered = '';

    // Dropdown rendering
    if (fieldConfig?.type === 'dropdown' && typeof value === 'string') {
        const allOptions = [
            ...(fieldConfig.snippet_options || []),
            ...(config.templateOptions?.get(field_id) || []),
        ];
        const selectedOption = allOptions.find((opt: SnippetOption) => opt && opt.label === value);
        if (selectedOption && typeof selectedOption === 'object' && 'value' in selectedOption) {
            const resolved = String(selectedOption.value);
            // If the mapped value contains {field} references, expand them with context data
            if (resolved.includes('{') && data) {
                rendered = resolved.replace(/\{([\s\S]+?)(?::[^}]*)?\}/g, (_, fieldRef: string) => {
                    const key = fieldRef.trim();
                    const found = Object.keys(data).find((k) => k.toLowerCase() === key.toLowerCase());
                    return found ? String(data[found] ?? '') : '';
                });
            } else {
                rendered = resolved;
            }
        } else {
            rendered = String(value);
        }
    }
    // Date rendering
    else if (
        fieldConfig?.type === 'date' &&
        typeof value === 'string' &&
        value.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
        try {
            const date = new Date(value + 'T00:00:00');
            if (isNaN(date.getTime())) {
                rendered = value;
            } else {
                const formattedDate = format(date, 'dd/MMMM/yyyy', { locale: es });
                const parts = formattedDate.split('/');
                const monthName = parts[1];
                if (parts.length === 3 && monthName) {
                    parts[1] = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    rendered = parts.join('/');
                } else {
                    rendered = formattedDate;
                }
            }
        } catch {
            rendered = value;
        }
    }
    // Array rendering
    else if (Array.isArray(value)) {
        if (value.length > 0) {
            if (typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
                const isReporta = field_id.toLowerCase() === 'reporta';
                if (isReporta) {
                    rendered = value.map((member) => formatStaffReporta(member as import('@/lib/types').StaffMember)).join(' / ');
                } else {
                    const showCedula = field_id.toLowerCase() === 'analista';
                    rendered = value.map((member) => formatStaffMember(member as import('@/lib/types').StaffMember, showCedula)).join(' / ');
                }
            } else {
                rendered = value.join(' / ');
            }
        } else {
            rendered = value.join(' / ');
        }
    }
    // Semantic field rendering
    else if (fieldConfig?.type === 'semantic') {
        const result = resolveSemanticConcept(field_id);
        rendered = String(result.value);
    }
    // Default rendering
    else {
        rendered = String(value);
    }

    // Apply text modifiers to the fully rendered value (handles upper, lower, title, hidden, etc.)
    const modifiers = config.fieldModifiers?.get(field_id) || [];
    return applyTextModifier(rendered, modifiers);
}

/**
 * Helper: Checks if a value has content
 */
function hasContent(value: form_dataValue): boolean {
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
    data: form_dataRecord,
    sections: SectionConfig[],
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    dataContext?: form_dataRecord
): boolean {
    const checkFieldsForContent = (field_ids: string[], context: form_dataRecord): boolean => {
        return field_ids.some((field_id) => {
            const value = findValueForField(
                field_id,
                data,
                sections,
                predefinedValues,
                dynamicPredefinedValues,
                context
            );
            return hasContent(value);
        });
    };

    const checkSectionRecursive = (s: SectionConfig, context: form_dataRecord): boolean => {
        if (s.has_static_content && s.condition) return true;

        if (s.is_repeatable) {
            const sectionData = context[s.id] as form_dataValue[];
            if (!Array.isArray(sectionData) || sectionData.length === 0) return false;
            return sectionData.some(
                (item) =>
                    checkFieldsForContent(s.field_ids, item as form_dataRecord) ||
                    (s.layout || []).some(
                        (id) =>
                            (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) &&
                            checkSectionRecursive(sections.find((sec) => sec.id === id)!, item as form_dataRecord)
                    )
            );
        } else {
            const nestedContext = (context[s.id] || context) as form_dataRecord;
            return (
                checkFieldsForContent(s.field_ids, nestedContext) ||
                (s.layout || []).some(
                    (id) =>
                        (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) &&
                        checkSectionRecursive(sections.find((sec) => sec.id === id)!, nestedContext)
                )
            );
        }
    };

    const context = dataContext || (data[section.id] ? data[section.id] as form_dataRecord : data);
    return checkSectionRecursive(section, context);
}

/**
 * Renders a section recursively with its nested content
 */
function renderSection(
    sectionId: string,
    data: form_dataRecord,
    sections: SectionConfig[],
    fields: Record<string, FieldConfig>,
    config: TemplateRenderConfig,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    currentData: form_dataRecord,
    mappingResults: Record<string, string> = {}
): string {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    // Evaluate condition if present
    if (section.condition) {
        let valToCompare = findValueForField(
            section.condition.field_id,
            data,
            sections,
            predefinedValues,
            dynamicPredefinedValues,
            currentData
        );

        // Resolve dropdown labels for comparison
        const options = [
            ...(config.templateOptions?.get(section.condition.field_id) || []),
            ...(config.fields[section.condition.field_id]?.snippet_options || [])
        ];
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

        if (section.is_mapping) {
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
    const hasSingularPlural = !!(section.singular_title || section.plural_title);
    const itemsToProcess = section.is_repeatable
        ? Array.isArray(currentData[section.id])
            ? currentData[section.id]
            : Array.isArray(data[section.id])
                ? data[section.id]
                // Singular/plural: fall back to treating top-level data as one item
                : hasSingularPlural ? [currentData] : []
        : [currentData[section.id] || (data[section.id] ? data[section.id] : currentData)];



    const itemsWithContent = (itemsToProcess as form_dataRecord[]).filter(
        (item: form_dataRecord) => {
            const hasFields = section.field_ids.some((fid: string) =>
                hasContent(findValueForField(fid, data, sections, predefinedValues, dynamicPredefinedValues, item))
            );
            const hasNestedContent = (section.layout || []).some(
                (id: string) => {
                    if (!(id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_'))) return false;
                    const nestedSec = sections.find((s) => s.id === id);
                    return nestedSec ? sectionHasValues(nestedSec, data, sections, predefinedValues, dynamicPredefinedValues, item) : false;
                }
            );
            return (section.has_static_content && section.condition) || hasFields || hasNestedContent;
        }
    );




    if (itemsWithContent.length === 0) return '';

    const renderedItemsArray = itemsWithContent
        .map((item: form_dataRecord, index: number) => {

            let itemContent = section.original_content || '';
            let itemLayout = section.layout && section.layout.length > 0 ? section.layout : section.field_ids;

            itemLayout.forEach((id: string) => {
                if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                    // ... (keep existing nested section logic)
                    const nestedSection = sections.find((s) => s.id === id);
                    if (nestedSection) {
                        const nestedRegex = getSectionRegex(nestedSection);
                        let isDependencyBlock = false;
                        if (nestedSection.condition && !nestedSection.is_mapping) {
                            const pureContent = (nestedSection.original_content || '')
                                .replace(/\{[^}]+\}/g, '')
                                .replace(/[\s\n\r\t]/g, '');
                            if (pureContent === '') {
                                isDependencyBlock = true;
                            }
                        }

                        if (isDependencyBlock) {
                            // Dependency block is a special case where we just remove the definition 
                            // but the header construction is same as normal. 
                            // We can use the regex generated by getSectionRegex.
                            const cleanRegex = getSectionRegex(nestedSection);
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
                        new RegExp(`\\{${escapeRegExp(id)}(:[^|}{]+)*(?:\\|[^{}]+?)?\\}(\\*)?`, 'gi'),
                        renderValue(val, id, fields, config, { ...data, ...item })
                    );
                }
            });

            if (section.is_self_contained && !section.is_repeatable) {
                // For non-repeatable self-contained sections, we preserve all static text lines
                // to avoid stripping intentional headers that don't have fields on the same line.
                // The final cleanup will handle empty fields.
            } else if (section.is_self_contained) {
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

            if (section.repeatable_item_label) {

                const isVirtual = section.is_virtual;

                if (isVirtual) {
                    if (itemsWithContent.length > 1) {
                        const labelPrefix = `- *${section.repeatable_item_label} #${String(index + 1).padStart(2, '0')}:*`;
                        itemContent = `${labelPrefix} ${itemContent.replace(/^\s+/, '')}`;
                    } else {
                        const labelPrefix = `- *${section.repeatable_item_label}:*`;
                        itemContent = `${labelPrefix} ${itemContent.replace(/^\s+/, '')}`;
                    }
                } else if (itemsWithContent.length > 1) {
                    // Format: - *NOVEDAD #01*\ncontent — only when multiple items
                    const labelPrefix = `- *${section.repeatable_item_label} #${String(index + 1).padStart(2, '0')}*`;
                    // Only trim leading newline if it was explicitly there to avoid triple newlines
                    const cleaned = itemContent.startsWith('\n') ? itemContent.slice(1) : itemContent;
                    itemContent = `${labelPrefix}\n${cleaned}`;
                }
            }
            return section.condition ? itemContent.trim() : itemContent;
        });

    // Determine appropriate joiner: 
    // If original_content was virtual, always join with \n. 
    // Otherwise, join with \n ONLY if items don't already end with a newline.
    const isVirtual = section.is_virtual;
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
    if (section.singular_title || section.plural_title) {
        const title = itemsWithContent.length > 1 && section.plural_title
            ? section.plural_title
            : (section.singular_title || section.plural_title!);
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
    data: form_dataRecord,
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
            const condfield_id = condMatch[1].trim();
            const operator = condMatch[2];
            const actualValue = findValueForField(condfield_id, data, sections, predefinedValues, dynamicPredefinedValues);
            if (!operator) {
                let keyToCompare = actualValue;
                const options = config.templateOptions?.get(condfield_id);
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
                            mappingResults[condfield_id] = val;
                            break;
                        }
                    }
                }
            }
        }
    }

    const topLevelSections = sections.filter((s: SectionConfig) => {
        return config.layout.includes(s.id);
    });

    topLevelSections.forEach((section: SectionConfig) => {
        const sectionRegex = getSectionRegex(section);
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
        (match, field_id: string) => {
            if (match.includes(':semantic')) return match;
            field_id = field_id.trim();
            const lowerfield_id = field_id.toLowerCase();
            const baseVal = findValueForField(field_id, data, sections, predefinedValues, dynamicPredefinedValues);

            // Mapping results are only applicable for non-dotted field names
            const mappingKey = !field_id.includes('.')
                ? Object.keys(mappingResults).find(k => k.toLowerCase() === lowerfield_id)
                : undefined;
            const formValue = mappingKey !== undefined ? mappingResults[mappingKey] : baseVal;

            return hasContent(formValue) ? renderValue(formValue, field_id, fields, config) : '';
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
    data: form_dataRecord,
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
                fieldConfig.snippet_options = options;
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

        // Replace photos/fotos markers with empty string (or clean spacing)
        fullRenderedContent = fullRenderedContent
            .replace(/\{photos\}/gi, '')
            .replace(/\{fotos\}/gi, '');

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


