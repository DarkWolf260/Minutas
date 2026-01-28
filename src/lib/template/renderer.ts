/**
 * Template Renderer - Content Rendering
 *
 * Handles rendering of templates with data substitution
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TemplateParserResult, SectionConfig } from '@/types';
import { formatStaffMember } from '../formatters';
import { resolveSemanticConcept } from '../integration-engine';
import { evaluateCondition, applyModifiers as applyTextModifier } from './evaluator';
import { parseFieldTag } from './parser';
import { logger } from '../logger';

/**
 * Renders template content with data substitution
 * 
 * Simplified version for compatibility - handles basic field replacement
 * and conditional sections
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
    const localData = (data || {}) as Record<string, any>;

    const blockRegex =
        /(\{[\s\S]+?\}|\[\?\s*\{[\s\S]+?\}\s*(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?)\s*\][\s\S]*?\[\/\s*\])/g;

    return content.replace(blockRegex, (block) => {
        if (block.startsWith('{')) {
            const tag = block.slice(1, -1);
            const { fieldId, modifiers } = parseFieldTag(tag, new Map());

            let val = localData[fieldId];

            // Manejo de dropdowns: convertir índice a valor
            const options = config.templateOptions.get(fieldId);
            if (options && typeof val === 'string' && /^\d+$/.test(val)) {
                const idx = parseInt(val, 10);
                if (options[idx]) val = options[idx].value;
            }

            // Unir modificadores de la etiqueta con los modificadores detectados globalmente
            const globalModifiers = config.fieldModifiers.get(fieldId) || [];
            const allModifiers = [...globalModifiers, ...modifiers];

            return applyTextModifier(val, allModifiers);
        } else if (block.startsWith('[?')) {
            const condMatch = block.match(
                /^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(!=|>=|<=|>|<|=)\s*("(.*?)"|(\S+?))\s*\]([\s\S]*?)\[\/\s*\]$/
            );
            if (condMatch && condMatch[1] && condMatch[2] && condMatch[6]) {
                const condFieldName = condMatch[1];
                const operator = condMatch[2];
                let targetValue = condMatch[4] || condMatch[5] || '';
                const innerContent = condMatch[6];

                const condFieldId = condFieldName.trim();

                const actualValue = localData[condFieldId];

                // Manejo de dropdowns en condicionales
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
 * Helper: Finds value for a field with fallback logic
 */
function findValueForField(
    fieldId: string,
    data: Record<string, any>,
    sections: SectionConfig[],
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    itemData?: Record<string, any>
): any {
    const source = itemData || data;
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
            if (sectionData[fieldId] !== undefined) return sectionData[fieldId];
            const foundKeyInSection = Object.keys(sectionData).find(
                (k) => k.toLowerCase() === lowerCaseFieldId
            );
            if (foundKeyInSection) return sectionData[foundKeyInSection];
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
    value: any,
    fieldId: string,
    fields: Record<string, any>,
    config: any
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
        const selectedOption = allOptions.find((opt: any) => opt && opt.label === value);
        if (selectedOption && typeof selectedOption === 'object' && 'value' in selectedOption) {
            return String(selectedOption.value);
        }
        return '';
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
        } catch (e) {
            return value;
        }
    }

    // Array rendering
    if (Array.isArray(value)) {
        if (value.length > 0) {
            if (typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
                const showCedula =
                    fieldId.toLowerCase() === 'reporta' || fieldId.toLowerCase() === 'analista';
                return value.map((member: any) => formatStaffMember(member, showCedula)).join(', ');
            }
        }
        return value.join(', ');
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
function hasContent(value: any): boolean {
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
    data: Record<string, any>,
    sections: SectionConfig[],
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    dataContext?: any
): boolean {
    const checkFieldsForContent = (fieldIds: string[], context: any): boolean => {
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

    const checkSectionRecursive = (s: SectionConfig, context: any): boolean => {
        if (s.isRepeatable) {
            const sectionData = context[s.id];
            if (!Array.isArray(sectionData) || sectionData.length === 0) return false;
            return sectionData.some(
                (item) =>
                    checkFieldsForContent(s.fieldIds, item) ||
                    (s.layout || []).some(
                        (id) =>
                            (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) &&
                            checkSectionRecursive(sections.find((sec) => sec.id === id)!, item)
                    )
            );
        } else {
            const nestedContext = context[s.id] || context;
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

    const context = dataContext || (data[section.id] ? data[section.id] : data);
    return checkSectionRecursive(section, context);
}

/**
 * Renders a section recursively with its nested content
 */
function renderSection(
    sectionId: string,
    data: Record<string, any>,
    sections: SectionConfig[],
    fields: Record<string, any>,
    config: any,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string>,
    currentData: any
): string {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    let renderedItems = '';
    const itemsToProcess = section.isRepeatable
        ? Array.isArray(data[section.id])
            ? data[section.id]
            : []
        : [data[section.id] || data];

    const itemsWithContent = itemsToProcess.filter(
        (item: any) =>
            section.fieldIds.some((fid: string) =>
                hasContent(findValueForField(fid, data, sections, predefinedValues, dynamicPredefinedValues, item))
            ) ||
            (section.layout || []).some(
                (id: string) =>
                    (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) &&
                    sectionHasValues(
                        sections.find((s) => s.id === id)!,
                        data,
                        sections,
                        predefinedValues,
                        dynamicPredefinedValues,
                        item
                    )
            )
    );

    if (itemsWithContent.length === 0) return '';

    renderedItems = itemsWithContent
        .map((item: any, index: number) => {
            let itemContent = section.originalContent || '';
            const itemLayout = section.layout || section.fieldIds;

            itemLayout.forEach((id: string) => {
                if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                    const nestedSection = sections.find((s) => s.id === id);
                    if (nestedSection) {
                        const isVirtual = nestedSection.originalContent?.startsWith('{');
                        let nestedRegex;
                        if (isVirtual) {
                            nestedRegex = new RegExp(`${escapeRegExp(nestedSection.originalContent || '')}\\*`, 'g');
                        } else {
                            let header = '';
                            if (
                                nestedSection.singularTitle ||
                                nestedSection.pluralTitle ||
                                nestedSection.repeatableItemLabel
                            ) {
                                header += nestedSection.singularTitle
                                    ? `singular="${nestedSection.singularTitle}"\\s*`
                                    : '';
                                header += nestedSection.pluralTitle ? `plural="${nestedSection.pluralTitle}"\\s*` : '';
                                header += nestedSection.repeatableItemLabel
                                    ? `sub="${nestedSection.repeatableItemLabel}"\\s*`
                                    : '';
                            } else if (nestedSection.label) {
                                header = `"${escapeRegExp(nestedSection.label)}"?\\s*`;
                            }
                            nestedRegex = new RegExp(
                                `\\[\\s*${header}${escapeRegExp(nestedSection.originalContent || '')}\\s*\\]${nestedSection.isRepeatable ? '\\s*\\*' : ''}`,
                                'g'
                            );
                        }
                        const renderedNested = renderSection(
                            id,
                            data,
                            sections,
                            fields,
                            config,
                            predefinedValues,
                            dynamicPredefinedValues,
                            item
                        );
                        itemContent = itemContent.replace(nestedRegex, renderedNested);
                    }
                } else {
                    const val = findValueForField(id, data, sections, predefinedValues, dynamicPredefinedValues, item);
                    itemContent = itemContent.replace(
                        new RegExp(`\\{${escapeRegExp(id)}(:dropdown\\(.*?\\)|:[a-zA-Z-]+)?\\}(\\*)?`, 'g'),
                        renderValue(val, id, fields, config)
                    );
                }
            });

            if (section.repeatableItemLabel) {
                let labelPrefix = '';
                if (itemsWithContent.length > 1) {
                    labelPrefix = `- *${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}:*`;
                } else {
                    labelPrefix = `- *${section.repeatableItemLabel}:*`;
                }

                if (
                    section.fieldIds.length === 1 &&
                    !section.layout?.some(
                        (id: string) => id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')
                    )
                ) {
                    itemContent = `${labelPrefix} ${itemContent.trim()}`;
                } else {
                    itemContent = `${labelPrefix}\n${itemContent}`;
                }
            }
            return itemContent;
        })
        .join('\n');

    const title = itemsWithContent.length === 1 ? section.singularTitle : section.pluralTitle;
    if (title) {
        renderedItems = `- *${title}*\n${renderedItems}`;
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
    data: Record<string, any>,
    config: any,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string> = {}
): string {
    let finalContent = template;
    const { sections = [], fields = {} } = config;

    // Process top-level layout items
    const topLevelSections = sections.filter((s: any) => {
        return config.layout.includes(s.id);
    });

    topLevelSections.forEach((section: any) => {
        const isVirtual = section.originalContent?.startsWith('{');
        let sectionRegex;
        const baseContent = escapeRegExp(section.originalContent || '###NEVERMATCH###');

        if (isVirtual) {
            sectionRegex = new RegExp(`${escapeRegExp(section.originalContent)}\\*`, 'g');
        } else {
            let headerPart = '';
            if (section.singularTitle || section.pluralTitle || section.repeatableItemLabel) {
                headerPart += section.singularTitle ? `singular="${section.singularTitle}"\\s*` : '';
                headerPart += section.pluralTitle ? `plural="${section.pluralTitle}"\\s*` : '';
                headerPart += section.repeatableItemLabel ? `sub="${section.repeatableItemLabel}"\\s*` : '';
            } else if (section.label) {
                headerPart = `"${escapeRegExp(section.label)}"?\\s*`;
            }
            const fullBlockPattern = `\\[\\s*${headerPart}${baseContent}\\s*\\]${section.isRepeatable ? '\\s*\\*' : ''}`;
            sectionRegex = new RegExp(fullBlockPattern, 'g');
        }

        const rendered = renderSection(
            section.id,
            data,
            sections,
            fields,
            config,
            predefinedValues,
            dynamicPredefinedValues,
            data
        );
        finalContent = finalContent.replace(sectionRegex, rendered);
    });

    // Final cleanup of loose tags (omit semantic tags for post-processing)
    finalContent = finalContent.replace(
        /\{([^:}]+?)(:dropdown\(.+?\)|:[a-zA-Z-]+)?(\|.+?)?\}/g,
        (match, fieldId) => {
            if (match.includes(':semantic')) return match;
            fieldId = fieldId.trim();
            const formValue = findValueForField(fieldId, data, sections, predefinedValues, dynamicPredefinedValues);
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
    data: Record<string, any>,
    config: { fields: Record<string, any>; sections: SectionConfig[]; layout: string[] },
    predefinedValues: Record<string, string>,
    summaryOnly: boolean = false,
    dynamicPredefinedValues: Record<string, string> = {},
    parseTemplate: (template: string) => any,
    recordReportAudit: (reportId: string, audit: any[]) => void
): string {
    try {
        const { sections, layout, fieldNames, fieldTypes, templateOptions, fieldModifiers } =
            parseTemplate(template);

        // Build final config with all necessary data
        const finalConfig = {
            fields: {} as Record<string, any>,
            sections,
            layout,
            templateOptions,
            fieldModifiers,
        };

        fieldNames.forEach((fieldName: string) => {
            const fieldConfig = config.fields[fieldName]
                ? { ...config.fields[fieldName] }
                : { type: 'text', label: fieldName };

            finalConfig.fields[fieldName] = fieldConfig;
            const options = templateOptions.get(fieldName);
            if (options) {
                fieldConfig.snippetOptions = options;
            }
            if (fieldTypes.has(fieldName)) {
                fieldConfig.type = fieldTypes.get(fieldName);
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
            .replace(/\[[\s\S]*?\](?:\s*)?(\*)?/g, ''); // Remove unprocessed section blocks

        // Resolve literal semantic tags
        const semanticRegex = /\{([\s\S]+?):semantic\}/g;
        const semanticAudit: any[] = [];

        finalOutput = finalOutput.replace(semanticRegex, (_, concept) => {
            const result = resolveSemanticConcept(concept.trim());
            semanticAudit.push(result);
            return String(result.value);
        });

        // Record audit if there's semantic data
        if (data.id && semanticAudit.length > 0) {
            recordReportAudit(data.id, semanticAudit);
        }

        finalOutput = finalOutput
            .replace(/\\\*/g, '*') // Convert escaped asterisks (\*) to literal asterisks (*)
            .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to max 2
            .replace(/\t/g, '    ') // Convert tabs to spaces
            .trim();

        return finalOutput;
    } catch (error) {
        logger.error('Error rendering report', error instanceof Error ? error : new Error(String(error)), {
            feature: 'TemplateRenderer',
            message: error instanceof Error ? error.message : String(error)
        });
        return 'Error al generar el reporte. La plantilla podría tener un formato incorrecto o faltan datos esenciales.';
    }
}
