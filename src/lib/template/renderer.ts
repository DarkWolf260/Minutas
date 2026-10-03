/**
 * Template Renderer - Content Rendering
 *
 * Handles rendering of templates with data substitution
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TemplateParserResult, SectionConfig, FieldConfig, FieldType, SnippetOption, form_dataRecord, form_dataValue } from '@/lib/types';
import { formatStaffMember, formatStaffReporta } from '../formatters';
import { evaluateCondition, applyModifiers as applyTextModifier } from './evaluator';
import { parseTemplate as defaultParseTemplate } from './parser';
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
    return renderContentWithSections(
        content,
        localData,
        {
            fields: {},
            sections: config.sections || [],
            layout: config.layout || [],
            templateOptions: config.templateOptions || new Map(),
            fieldModifiers: config.fieldModifiers || new Map(),
        },
        config.predefinedValues ? Object.fromEntries(config.predefinedValues) : {},
        {}
    );
}

/**
 * Helper: Escapes special regex characters
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const rawPattern = section.full_raw || section.original_content || '';
    const escaped = escapeRegExp(rawPattern).replace(/\n/g, '\\r?\\n');
    const regex = new RegExp(escaped, 'g');

    if (sectionRegexCache.size >= 500) {
        const oldestKey = sectionRegexCache.keys().next().value;
        if (oldestKey) sectionRegexCache.delete(oldestKey);
    }
    sectionRegexCache.set(cacheKey, regex);
    return regex;
}

// WeakMap for O(1) case-insensitive key lookups without mutating or copying repeatedly
const lowerKeyCache = new WeakMap<object, Map<string, any>>();

function getFromObjectInsensitive(
    obj: Record<string, any> | undefined | null,
    lowerKey: string,
    exactKey: string
): form_dataValue {
    if (!obj || typeof obj !== 'object') return undefined;
    if (obj[exactKey] !== undefined) return obj[exactKey];

    let map = lowerKeyCache.get(obj);
    if (!map) {
        map = new Map<string, any>();
        for (const k of Object.keys(obj)) {
            map.set(k.toLowerCase(), obj[k]);
        }
        lowerKeyCache.set(obj, map);
    }
    return map.get(lowerKey);
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
        const dotIndex = field_id.indexOf('.');
        const basefield_id = field_id.slice(0, dotIndex);
        const baseValue = findValueForField(basefield_id, data, sections, predefinedValues, dynamicPredefinedValues, itemData);
        // If the base field was found (even as empty array), attempt property resolution
        if (baseValue !== undefined) {
            return resolvePropertyAccess(field_id, baseValue);
        }
        return undefined;
    }

    const lowerCasefield_id = field_id.toLowerCase();

    // 1. Check dynamic predefined values
    const dynamicVal = getFromObjectInsensitive(dynamicPredefinedValues, lowerCasefield_id, field_id);
    if (dynamicVal !== undefined) return dynamicVal;

    // 2. Check item data (for repeatable sections)
    if (itemData) {
        const itemVal = getFromObjectInsensitive(itemData, lowerCasefield_id, field_id);
        if (itemVal !== undefined) return itemVal;
    }

    // 3. Check root data
    const rootVal = getFromObjectInsensitive(data, lowerCasefield_id, field_id);
    if (rootVal !== undefined) return rootVal;

    // 4. Check non-repeatable section data
    for (const section of sections) {
        if (!section.is_repeatable && section.id in data) {
            const sectionData = data[section.id];
            if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
                const secVal = getFromObjectInsensitive(sectionData as Record<string, any>, lowerCasefield_id, field_id);
                if (secVal !== undefined) return secVal;
            }
        }
    }

    // 5. Check predefined values
    const predefinedVal = getFromObjectInsensitive(predefinedValues, lowerCasefield_id, field_id);
    if (predefinedVal !== undefined) return predefinedVal;

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

    if (section.is_separator) {
        return section.label ? `- *${section.label}*` : '';
    }

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
                            itemContent = itemContent.replace(nestedRegex, '');
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
                            itemContent = itemContent.replace(nestedRegex, () => renderedNested);
                        }
                    }
                } else {
                    const baseVal = findValueForField(id, data, sections, predefinedValues, dynamicPredefinedValues, item);
                    const lowerId = id.toLowerCase();
                    const val = mappingResults[lowerId] !== undefined
                        ? mappingResults[lowerId]
                        : (mappingResults[id] !== undefined ? mappingResults[id] : baseVal);

                    itemContent = itemContent.replace(
                        new RegExp(`\\{${escapeRegExp(id)}(:[^|}{]+)*(?:\\|[^{}]+?)?\\}(\\*)?`, 'gi'),
                        () => renderValue(val, id, fields, config, { ...data, ...item })
                    );
                }
            });

            if (section.is_repeatable) {
                const originalLines = (section.original_content || '').split(/\r?\n/);
                const lines = itemContent.split(/\r?\n/);
                const filteredLines = lines.filter((line, lineIdx) => {
                    // Blank/whitespace-only line: always keep (intentional spacing)
                    if (line.trim().length === 0) return true;

                    const origLine = originalLines[lineIdx] ?? '';
                    const hadField = /\{[^{}]+\}/.test(origLine);

                    // If the line never had a field, it's a static label/header -> keep it!
                    if (!hadField) return true;

                    // If the line had a field, check if any alphanumeric content remains
                    const alphanumeric = line
                        .replace(/^[ \t]*(?:-[ \t]*)?(?:\*{1,2}[^*:]+:\*{1,2}|"[^"]*")/g, '')
                        .replace(/[*:\-\s"']/g, '')
                        .trim();

                    return alphanumeric.length > 0;
                });
                itemContent = filteredLines.join('\n');
            } else if (section.is_self_contained) {
                const lines = itemContent.split(/\r?\n/);
                const filteredLines = lines.filter(line => {
                    // Blank/whitespace-only line: always keep (intentional spacing)
                    if (line.trim().length === 0) return true;

                    const alphanumeric = line
                        .replace(/^[ \t]*(?:-[ \t]*)?(?:\*{1,2}[^*:]+:\*{1,2}|"[^"]*")/g, '')
                        .replace(/[*:\-\s"']/g, '')
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
                    const hasDistinctSubLabel =
                        section.repeatable_item_label.toLowerCase() !== (section.label || '').toLowerCase() &&
                        section.repeatable_item_label.toLowerCase() !== (section.plural_title || '').toLowerCase();

                    // Only add prefix if there is an explicit distinct sub-label (e.g. ::: section DATOS DE LOS PACIENTES | PACIENTE* :::)
                    // If there is NO distinct sub-label (e.g. ::: section DATOS OPERACIONALES* :::),
                    // the top header is already rendered once, so do not repeat or number items.
                    if (hasDistinctSubLabel) {
                        const labelPrefix = `- *${section.repeatable_item_label} #${String(index + 1).padStart(2, '0')}*`;
                        // Only trim leading newline if it was explicitly there to avoid triple newlines
                        const cleaned = itemContent.startsWith('\n') ? itemContent.slice(1) : itemContent;
                        itemContent = `${labelPrefix}\n${cleaned}`;
                    }
                }
            }
            if (section.condition) {
                const isInline = !section.original_content?.includes('\n') && !section.full_raw?.includes('\n');
                if (isInline) {
                    return itemContent;
                }
                const hasTrailingNewline = (section.original_content || '').endsWith('\n') || (section.full_raw || '').endsWith('\n');
                const trimmed = itemContent.trim();
                return trimmed ? (hasTrailingNewline ? `${trimmed}\n` : trimmed) : '';
            }
            return itemContent;
        });



    // Determine appropriate joiner: 
    // 1. Virtual items -> joined by single \n
    // 2. Multiline items -> joined by \n\n (for clean blank line separation between records)
    // 3. Single line items -> joined by \n
    const isVirtual = section.is_virtual;
    const hasInternalNewlines = renderedItemsArray.some(item => (item || '').trim().includes('\n'));
    const joiner = isVirtual ? '\n' : (hasInternalNewlines ? '\n\n' : '\n');
    renderedItems = hasInternalNewlines
        ? renderedItemsArray.map(item => item.trimEnd()).join(joiner)
        : renderedItemsArray.join(joiner);

    // Add section title only for repeatable sections (or sections with singular/plural titles)
    if (section.is_repeatable && (section.singular_title || section.plural_title || section.label)) {
        const title = itemsWithContent.length > 1 && section.plural_title
            ? section.plural_title
            : (section.singular_title || section.plural_title || section.label);
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

    // First pass: collect all mapping results for fields from mapping sections
    const mappingResults: Record<string, string> = {};
    sections.filter((s) => s.is_mapping).forEach((s) => {
        const condfield_id = s.condition?.field_id;
        if (!condfield_id) return;
        const actualValue = findValueForField(condfield_id, data, sections, predefinedValues, dynamicPredefinedValues);
        let keyToCompare = actualValue;
        const options = config.templateOptions?.get(condfield_id);
        if (options && typeof actualValue === 'string') {
            const opt = options.find((o) => o.value === actualValue || o.label === actualValue);
            if (opt) keyToCompare = opt.label;
        }
        const lines = (s.original_content || '').split('\n');
        for (const line of lines) {
            const eqIdx = line.indexOf('=');
            if (eqIdx > -1) {
                const key = line.substring(0, eqIdx).trim();
                const val = line.substring(eqIdx + 1).trim();
                if (evaluateCondition(keyToCompare, '=', key)) {
                    mappingResults[condfield_id] = val;
                    mappingResults[condfield_id.toLowerCase()] = val;
                    break;
                }
            }
        }
    });

    const topLevelSections = sections.filter((s: SectionConfig) => {
        return !s.parent_id;
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
            finalContent = finalContent.replace(sectionRegex, () => rendered);
        }
    });

    // Final cleanup of loose tags (handles normal and dotted field names like {Director.sex})
    finalContent = finalContent.replace(
        /\{([^:{}]+?(?:\.[^:{}]+?)?)(:[^|}{]+)*(?:\|[^{}]+?)?\}/g,
        (_, field_id: string) => {
            field_id = field_id.trim();
            const lowerfield_id = field_id.toLowerCase();
            const baseVal = findValueForField(field_id, data, sections, predefinedValues, dynamicPredefinedValues);

            // Mapping results are only applicable for non-dotted field names
            const formValue = (!field_id.includes('.') && mappingResults[lowerfield_id] !== undefined)
                ? mappingResults[lowerfield_id]
                : baseVal;

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
    parseTemplateFn?: (template: string) => TemplateParserResult,
    _recordReportAudit?: unknown
): string {
    try {
        const parseFn = parseTemplateFn || defaultParseTemplate;
        const { sections, layout, fieldNames, fieldTypes, templateOptions, fieldModifiers } =
            parseFn(template);

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

        // Replace photos/fotos markers in a single pass
        fullRenderedContent = fullRenderedContent.replace(/\{(?:photos|fotos)\}/gi, '');

        // Extract summary if needed
        if (summaryOnly) {
            const summaryRegex = /<<([\s\S]*?)>>/g;
            const matches = Array.from(fullRenderedContent.matchAll(summaryRegex));
            fullRenderedContent = matches.length > 0
                ? matches.map((match) => match[1]).join('\n\n')
                : '';
        }

        // Final cleanup
        const finalOutput = fullRenderedContent
            .replace(/<<|>>/g, '') // Remove summary markers
            .replace(/:::[^:\n\r]*:::/g, '') // Remove unrendered single-line ::: directives
            .replace(/:::[\s\S]*?:::/g, '') // Remove unprocessed multiline ::: blocks
            .replace(/\\([*{}:[\]\\])/g, '$1') // Final unescaping of characters (\* -> *, \: -> :)
            .replace(/^[\t ]+$/gm, '') // Remove whitespace-only lines
            .replace(/\n{3,}/g, '\n\n'); // Collapse excessive blank lines

        return finalOutput.trim();
    } catch (error) {
        logger.error('Error rendering report', error instanceof Error ? error : new Error(String(error)), {


            feature: 'TemplateRenderer',
            message: error instanceof Error ? error.message : String(error)
        });
        return 'Error al generar el reporte. La plantilla podría tener un formato incorrecto o faltan datos esenciales.';
    }
}


