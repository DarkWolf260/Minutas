import type { Token } from './types';
import type { SnippetOption, FieldType, SectionConfig, TemplateParserResult } from '@/types';
import { tokenize } from './lexer';

/**
 * Automatic field types based on field name
 */
const AUTOMATIC_FIELD_TYPES: Record<string, FieldType> = {
    hora: 'time-hlv',
    fecha: 'date',
};

/**
 * Parses field tag content to extract configuration
 * 
 * Syntax: {FieldName:type:modifiers|textMod}
 * Examples:
 * - {Name} → text field
 * - {Fecha:date} → date field
 * - {Nombre:text:full:req|title} → required full-width text with title case
 * - {Tipo:dropdown(A=Val1|B=Val2)} → dropdown with inline options
 */
export function parseFieldTag(
    tagContent: string,
    templateOptions: Map<string, SnippetOption[]>
): {
    fieldId: string;
    fieldType: FieldType;
    modifiers: string[];
    isFullWidth: boolean;
    isRequired: boolean;
    defaultValue?: string;
} {
    const segments = tagContent.split(':').map((s) => s.trim());
    const fieldId = segments[0] || '';
    const otherSegments = segments.slice(1);

    let fieldType: FieldType = AUTOMATIC_FIELD_TYPES[fieldId.toLowerCase()] || 'text';
    let isFullWidth = false;
    let isRequired = false;
    let defaultValue: string | undefined = undefined;
    const modifiers: string[] = [];

    const VALID_FIELD_TYPES = new Set<FieldType>([
        'text',
        'textarea',
        'date',
        'predefined',
        'time-hlv',
        'multi-text',
        'dropdown',
        'semantic',
    ]);
    const VALID_TEXT_MODS = new Set(['upper', 'lower', 'title']);

    otherSegments.forEach((segment) => {
        const dropdownMatch = segment.match(/^dropdown\((.+)\)$/);
        const optionsString = dropdownMatch?.[1];
        if (dropdownMatch && optionsString) {
            fieldType = 'dropdown';
            const options: SnippetOption[] = optionsString
                .split('|')
                .map((opt, i) => {
                    const eqIdx = opt.indexOf('=');
                    if (eqIdx > -1) {
                        const label = opt.substring(0, eqIdx).trim();
                        const value = opt.substring(eqIdx + 1).trim();
                        if (label) {
                            return { id: `tpl_opt_${fieldId}_${i}`, label, value };
                        }
                    }
                    return null;
                })
                .filter((o): o is SnippetOption => o !== null);

            if (options.length > 0) {
                templateOptions.set(fieldId, options);
            }
            return;
        }

        if (segment === 'full') {
            isFullWidth = true;
        } else if (segment === 'req') {
            isRequired = true;
        } else if (VALID_FIELD_TYPES.has(segment as FieldType)) {
            fieldType = segment as FieldType;
        } else if (VALID_TEXT_MODS.has(segment)) {
            modifiers.push(segment);
        } else {
            const pipeParts = segment.split('|');
            pipeParts.forEach((part) => {
                const trimmed = part.trim();
                const defMatch = trimmed.match(/^def=\((.*)\)$/);
                if (defMatch) {
                    defaultValue = defMatch[1];
                } else if (trimmed === 'full') isFullWidth = true;
                else if (trimmed === 'req') isRequired = true;
                else if (VALID_TEXT_MODS.has(trimmed)) modifiers.push(trimmed);
                else if (trimmed) modifiers.push(trimmed);
            });
        }
    });

    return { fieldId, fieldType, modifiers, isFullWidth, isRequired, defaultValue };
}

/**
 * Parses a token stream into a structured TemplateParserResult
 */
export function parse(tokens: Token[]): TemplateParserResult {
    const sections: SectionConfig[] = [];
    const layout: string[] = [];
    const fieldNames = new Set<string>();
    const fieldTypes = new Map<string, FieldType>();
    const templateOptions = new Map<string, SnippetOption[]>();
    const fieldModifiers = new Map<string, string[]>();
    const fieldWidths = new Map<string, boolean>();
    const requiredFields = new Map<string, boolean>();
    const defaultValues = new Map<string, string>();
    const globalRenderedFields = new Set<string>();

    // Refactored internal parser for recursion
    function parseInternal(tokenList: Token[]): {
        subLayout: string[];
        subSections: SectionConfig[];
        subFieldNames: Set<string>;
    } {
        const subLayout: string[] = [];
        const subSections: SectionConfig[] = [];
        const subFieldNames = new Set<string>();

        let idx = 0;
        while (idx < tokenList.length) {
            const token = tokenList[idx];
            if (!token) {
                idx++;
                continue;
            }

            if (token.type === 'field') {
                // Remove optional trailing * before slicing { and }
                const rawWithoutStar = token.raw.endsWith('*') ? token.raw.slice(0, -1) : token.raw;
                const config = parseFieldTag(rawWithoutStar.slice(1, -1), templateOptions);
                const fieldId = config.fieldId;
                if (!fieldId) {
                    idx++;
                    continue;
                }

                subFieldNames.add(fieldId);
                fieldNames.add(fieldId);

                const currentType = fieldTypes.get(fieldId);
                if (!currentType || (currentType === 'text' && config.fieldType !== 'text')) {
                    fieldTypes.set(fieldId, config.fieldType);
                }
                if (config.modifiers.length > 0) fieldModifiers.set(fieldId, config.modifiers);
                if (config.isFullWidth) fieldWidths.set(fieldId, true);
                if (config.isRequired) requiredFields.set(fieldId, true);
                if (config.defaultValue) defaultValues.set(fieldId, config.defaultValue);

                if (token.raw.endsWith('}*')) {
                    const sectionId = generateSectionId(fieldId, [...sections, ...subSections]);
                    const sec: SectionConfig = {
                        id: sectionId,
                        label: fieldId,
                        isRepeatable: true,
                        fieldIds: [fieldId],
                        layout: [fieldId],
                        repeatableItemLabel: fieldId.toUpperCase(),
                        originalContent: rawWithoutStar,
                    };

                    if (!globalRenderedFields.has(sectionId)) {
                        subSections.push(sec);
                        subLayout.push(sectionId);
                        globalRenderedFields.add(sectionId);
                    }
                } else {
                    if (!globalRenderedFields.has(fieldId)) {
                        subLayout.push(fieldId);
                        globalRenderedFields.add(fieldId);
                    }
                }
                idx++;
            } else if (token.type === 'section_start') {
                let inner: Token[] = [];
                let isRepeatable = token.isRepeatable || false;
                let isSelfContained = false;
                let baseLabel = token.label || '';

                const originalLabel = baseLabel;
                const isSeparator = baseLabel.trim() === '""';
                // firstBraceIdx uses the original label (before any quote stripping)
                const firstBraceIdx = baseLabel.indexOf('{');

                // If the label starts with ", extract ONLY the quoted portion as the title.
                // Text after the closing " (and before ]) is ignored as part of the label.
                //   "NOVEDADES"          → NOVEDADES
                //   "Título" texto extra → Título  (texto extra discarded)
                // Do NOT apply to attribute-style labels like: singular="X" plural="Y"
                if (baseLabel.startsWith('"')) {
                    const closingQuote = baseLabel.indexOf('"', 1);
                    if (closingQuote !== -1) {
                        baseLabel = baseLabel.slice(1, closingQuote).trim();
                    } else {
                        baseLabel = baseLabel.slice(1).trim();
                    }
                }

                if ((firstBraceIdx !== -1 && !token.condition) || isSeparator) {
                    isSelfContained = true;
                    if (isSeparator) {
                        baseLabel = 'separator';
                        inner = [];
                    } else {
                        if (originalLabel.startsWith('"')) {
                            // ["Title" ...static text... {field}]
                            // Take EVERYTHING after the closing title quote so
                            // static text like "Campo1: " is preserved in originalContent.
                            const closingQuoteIdx = originalLabel.indexOf('"', 1);
                            const bodyStart = closingQuoteIdx !== -1 ? closingQuoteIdx + 1 : 0;
                            inner = tokenize(originalLabel.slice(bodyStart));
                        } else {
                            // No quotes: derive label from before the first {
                            // Special case: label may start with singular/plural/sub attributes
                            // In that case we capture EVERYTHING after the last attribute as body
                            // so that static text like "- *NOMBRE:* " before {field} is preserved.
                            const attrPattern = /^((?:singular\s*=\s*"[^"]*"\s*|plural\s*=\s*"[^"]*"\s*|sub\s*=\s*"[^"]*"\s*)+)/i;
                            const attrMatch = originalLabel.match(attrPattern);
                            if (attrMatch) {
                                // Body is everything after the attribute block
                                const bodyStart = attrMatch[0].length;
                                const bodyContent = originalLabel.slice(bodyStart);
                                baseLabel = attrMatch[0].trim();
                                inner = tokenize(bodyContent);
                            } else {
                                const inlineContent = originalLabel.substring(firstBraceIdx);
                                baseLabel = originalLabel.substring(0, firstBraceIdx).trim();
                                inner = tokenize(inlineContent);
                            }
                        }
                    }
                }
                idx++;
                if (!isSelfContained) {
                    let depth = 1;
                    while (idx < tokenList.length && depth > 0) {
                        const currentToken = tokenList[idx];
                        if (!currentToken) {
                            idx++;
                            continue;
                        }

                        if (currentToken.type === 'section_start') depth++;
                        if (currentToken.type === 'section_end') depth--;

                        if (depth > 0) {
                            inner.push(currentToken);
                        }
                        idx++;
                    }
                }

                // Parse attributes from label: [singular="X" plural="Y" sub="Z"]
                let singularTitle = '';
                let pluralTitle = '';
                let subLabel = '';
                if (baseLabel) {
                    const singularMatch = baseLabel.match(/singular\s*=\s*"([^"]*)"/i);
                    const pluralMatch = baseLabel.match(/plural\s*=\s*"([^"]*)"/i);
                    const subMatch = baseLabel.match(/sub\s*=\s*"([^"]*)"/i);

                    if (singularMatch) singularTitle = singularMatch[1] || '';
                    if (pluralMatch) pluralTitle = pluralMatch[1] || '';
                    if (subMatch) subLabel = subMatch[1] || '';

                    // If it has attributes, the label itself shouldn't be used as title directly 
                    // unless no attributes were found.
                    if (singularMatch || pluralMatch || subMatch) {
                        baseLabel = singularTitle || '';
                    }
                }


                const innerResult = parseInternal(inner);

                // Implicit dropdown options extraction from mapping conditionals
                const isMappingConditional = token.condition && token.condition.value === '' && inner.length > 0;

                if (isMappingConditional) {
                    const fieldId = token.condition!.fieldId;
                    const options: SnippetOption[] = [];
                    inner.forEach((t, i) => {
                        if (t.type === 'text') {
                            const lines = t.raw.split('\n');
                            lines.forEach((line) => {
                                const eqIdx = line.indexOf('=');
                                if (eqIdx > -1) {
                                    const key = line.substring(0, eqIdx).trim();
                                    const val = line.substring(eqIdx + 1).trim();
                                    if (key) {
                                        options.push({
                                            id: `tpl_opt_${fieldId}_implicit_${i}_${options.length}`,
                                            label: key, // The Key: what the user selects in the dropdown
                                            value: val, // The Value: what goes into the report (long text)
                                        });
                                        // Extract {campo} references from the mapped value
                                        // so they appear in the form as input fields
                                        const refMatches = val.matchAll(/\{([^}:]+)(?::[^}]*)?\}/g);
                                        for (const ref of refMatches) {
                                            const refId = ref[1]?.trim();
                                            if (refId) {
                                                fieldNames.add(refId);
                                                subFieldNames.add(refId);
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
                    if (options.length > 0) {
                        const existing = templateOptions.get(fieldId) || [];
                        const merged = [...existing];
                        options.forEach(opt => {
                            if (!merged.some(m => m.label === opt.label)) {
                                merged.push(opt);
                            }
                        });
                        templateOptions.set(fieldId, merged);
                        fieldTypes.set(fieldId, 'dropdown');
                    }
                }

                const baseId = baseLabel || (token.condition ? `cond_${token.condition.fieldId}` : 'section');
                const sectionId = generateSectionId(baseId, [...sections, ...subSections, ...innerResult.subSections]);

                subSections.push(...innerResult.subSections);

                const section: SectionConfig = {
                    id: sectionId,
                    label: (isSeparator || token.condition) ? '' : (baseLabel || `Sección ${subSections.length + 1}`),
                    isRepeatable,
                    fieldIds: Array.from(innerResult.subFieldNames),
                    layout: innerResult.subLayout,
                    condition: token.condition,
                    originalContent: inner.map(t => t.raw).join(''),
                    isSeparator: isSeparator,
                    isMapping: isMappingConditional || false,
                    isSelfContained: isSelfContained && !isSeparator,
                };

                if (singularTitle) section.singularTitle = singularTitle;
                if (pluralTitle) section.pluralTitle = pluralTitle;
                if (subLabel) section.repeatableItemLabel = subLabel;
                // Sections with singular/plural titles are implicitly repeatable
                if (singularTitle || pluralTitle) section.isRepeatable = true;

                subSections.push(section);
                subLayout.push(sectionId);
                innerResult.subFieldNames.forEach(fn => subFieldNames.add(fn));
            } else {
                idx++;
            }
        }
        return { subLayout: subLayout, subSections: subSections, subFieldNames: subFieldNames };
    }

    const finalResult = parseInternal(tokens);
    sections.push(...finalResult.subSections);
    layout.push(...finalResult.subLayout);

    finalResult.subFieldNames.forEach(fn => fieldNames.add(fn));
    // Reconcile mapping conditional values
    // If a condition requests a label that matches a dropdown option for the target field,
    // convert the condition to expect the underlying value instead.
    sections.forEach(section => {
        if (section.condition) {
            const targetFieldId = section.condition.fieldId;
            const targetOpts = templateOptions.get(targetFieldId);
            if (targetOpts && targetOpts.length > 0) {
                const matchedOpt = targetOpts.find(
                    opt => opt.label.trim() === section.condition!.value.trim()
                );
                if (matchedOpt) {
                    section.condition.value = matchedOpt.value;
                }
            }
        }
    });

    // Emulate replacing fields with their conditional sections in layout and non-condition sections
    // This allows conditionals to wrap fields even when they appear in self-contained Sections
    const conditionalSections = sections.filter(s => s.condition && !s.isMapping);

    const fieldToConditionMap = new Map<string, string[]>();
    conditionalSections.forEach(condSec => {
        condSec.fieldIds.forEach(fieldId => {
            const existing = fieldToConditionMap.get(fieldId) || [];
            existing.push(condSec.id);
            fieldToConditionMap.set(fieldId, existing);
        });
    });

    sections.forEach(sec => {
        if (sec.condition) return;

        // Determine the base layout to modify (use fieldIds if layout is empty)
        const baseLayout = (sec.layout && sec.layout.length > 0) ? sec.layout : [...sec.fieldIds];

        // Always set the layout with replaced condition wrappers
        sec.layout = baseLayout.flatMap(fid => fieldToConditionMap.get(fid) || [fid])
            .filter((val, idx, self) => self.indexOf(val) === idx);

        // CRITICAL: We do NOT mutate sec.fieldIds here because renderer.ts relies on the
        // original raw field IDs to match `{Field}` tags in the generated text!
    });

    const absorbedItems = new Set<string>();
    sections.forEach(sec => {
        if (!sec.condition && !sec.isMapping) {
            sec.fieldIds.forEach(id => absorbedItems.add(id));
            if (sec.layout) sec.layout.forEach(id => absorbedItems.add(id));
        }
    });

    // Also update global layout
    const updatedLayout = layout.flatMap(fid => fieldToConditionMap.get(fid) || [fid])
        .filter((val, idx, self) => self.indexOf(val) === idx)
        .filter(val => {
            // Remove condition sections from root layout if they are absorbed inside another section
            if (val.startsWith('cond_') && absorbedItems.has(val)) return false;
            return true;
        });

    return {
        sections,
        layout: updatedLayout,
        fieldNames,
        fieldTypes,
        templateOptions,
        fieldModifiers,
        fieldWidths,
        requiredFields,
        defaultValues,
        errors: [],
    };
}

/**
 * Generates a unique, stable section ID
 */
function generateSectionId(base: string, existingSections: SectionConfig[]): string {
    const prefix = base.startsWith('cond_') || base.startsWith('sec_') ? '' : 'sec_';
    let id = `${prefix}${base.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    let counter = 1;
    const originalId = id;
    while (existingSections.some(s => s.id === id)) {
        id = `${originalId}_${counter++}`;
    }
    return id;
}
