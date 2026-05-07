import type { Token } from './types';
import type { SnippetOption, FieldType, SectionConfig, TemplateParserResult } from '@/lib/types';
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
    field_id: string;
    fieldType: FieldType;
    modifiers: string[];
    isFullWidth: boolean;
    isRequired: boolean;
    defaultValue?: string;
    value?: string;
} {
    const segments = tagContent.split(':').map((s) => s.trim());
    const field_id = segments[0] || '';
    const otherSegments = segments.slice(1);

    let fieldType: FieldType = AUTOMATIC_FIELD_TYPES[field_id.toLowerCase()] || 'text';
    let isFullWidth = false;
    let isRequired = false;
    let defaultValue: string | undefined = undefined;
    let value: string | undefined = undefined;
    const modifiers: string[] = [];

    const VALID_FIELD_TYPES = new Set<FieldType>([
        'text',
        'textarea',
        'date',
        'predefined',
        'time-hlv',
        'multi-text',
        'dropdown',
        'cedula',
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
                            return { id: `tpl_opt_${field_id}_${i}`, label, value };
                        }
                    }
                    return null;
                })
                .filter((o): o is SnippetOption => o !== null);

            if (options.length > 0) {
                templateOptions.set(field_id, options);
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
                else if (trimmed) {
                    // If it's not a known flag/modifier, it's likely the predefined value
                    if (value === undefined) {
                        value = trimmed;
                    } else {
                        modifiers.push(trimmed);
                    }
                }
            });
        }
    });

    return { field_id, fieldType, modifiers, isFullWidth, isRequired, defaultValue, value };
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
    const predefinedValues = new Map<string, string>();
    const globalRenderedFields = new Set<string>();

    // Refactored internal parser for recursion
    function parseInternal(tokenList: Token[], parentId?: string): {
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
                const field_id = config.field_id;
                if (!field_id) {
                    idx++;
                    continue;
                }

                subFieldNames.add(field_id);
                fieldNames.add(field_id);

                const currentType = fieldTypes.get(field_id);
                if (!currentType || (currentType === 'text' && config.fieldType !== 'text')) {
                    fieldTypes.set(field_id, config.fieldType);
                }
                if (config.modifiers.length > 0) fieldModifiers.set(field_id, config.modifiers);
                if (config.isFullWidth) fieldWidths.set(field_id, true);
                if (config.isRequired) requiredFields.set(field_id, true);
                if (config.defaultValue !== undefined) defaultValues.set(field_id, config.defaultValue);
                if (config.value !== undefined) predefinedValues.set(field_id, config.value);

                if (token.raw.endsWith('}*')) {
                    const sectionId = generateSectionId(field_id, [...sections, ...subSections]);
                    const sec: SectionConfig = {
                        id: sectionId,
                        parentId,
                        label: field_id,
                        isRepeatable: true,
                        field_ids: [field_id],
                        layout: [field_id],
                        repeatableItemLabel: field_id.toUpperCase(),
                        originalContent: rawWithoutStar,
                    };


                    if (!globalRenderedFields.has(sectionId)) {
                        subSections.push(sec);
                        subLayout.push(sectionId);
                        globalRenderedFields.add(sectionId);
                    }
                } else {
                    // Allow fields to appear in multiple sections, especially useful for 
                    // mutually exclusive conditionals (e.g., [?{sex}=F]{Director}[/] [?{sex}=M]{Director}[/])
                    // We only prevent duplicates at the same level if they are at the root.
                    if (!parentId) {
                        if (!globalRenderedFields.has(field_id)) {
                            subLayout.push(field_id);
                            globalRenderedFields.add(field_id);
                        }
                    } else {
                        // Inside a section, always add it to the section's layout.
                        // The section's visibility logic in the form will handle showing only one instance.
                        subLayout.push(field_id);
                        globalRenderedFields.add(field_id);
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

                        if (currentToken.type === 'section_start') {
                            // Self-contained sections (those with { in their label, or separators [""])
                            // don't emit a matching [/], so they must NOT increment depth.
                            // Failing to account for this causes depth to grow and outer tokens
                            // (fields after the [/]) to be swallowed into the conditional's inner list.
                            const rawLabel = currentToken.label || '';
                            const isSep = rawLabel.trim() === '""';
                            const hasBrace = rawLabel.includes('{');
                            const isSelfContainedInner = (hasBrace && !currentToken.condition) || isSep;
                            if (!isSelfContainedInner) depth++;
                        }
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


                const baseId = baseLabel || (token.condition ? `cond_${token.condition.field_id}` : 'section');
                const sectionId = generateSectionId(baseId, [...sections, ...subSections]);

                const innerResult = parseInternal(inner, sectionId);

                const isMappingConditional = token.condition && token.condition.value === '' && inner.length > 0;

                if (isMappingConditional) {
                    const field_id = token.condition!.field_id;
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
                                            id: `tpl_opt_${field_id}_implicit_${i}_${options.length}`,
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
                        const existing = templateOptions.get(field_id) || [];
                        const merged = [...existing];
                        options.forEach(opt => {
                            if (!merged.some(m => m.label === opt.label)) {
                                merged.push(opt);
                            }
                        });
                        templateOptions.set(field_id, merged);
                        fieldTypes.set(field_id, 'dropdown');
                    }
                }

                subSections.push(...innerResult.subSections);

                const section: SectionConfig = {
                    id: sectionId,
                    parentId,
                    label: (isSeparator || token.condition) ? '' : (baseLabel || `Sección ${subSections.length + 1}`),
                    isRepeatable,

                    field_ids: Array.from(innerResult.subFieldNames),
                    layout: innerResult.subLayout,
                    condition: token.condition ? {
                        field_id: token.condition.field_id,
                        operator: token.condition.operator,
                        value: token.condition.value,
                        conditionMode: token.condition.conditionMode,
                    } : undefined,
                    originalContent: inner.map(t => t.raw).join(''),
                    isSeparator: isSeparator,
                    isMapping: isMappingConditional || false,
                    isSelfContained: isSelfContained && !isSeparator,
                    hasStaticContent: inner.some(t => t.type === 'text' && t.raw.replace(/[\s\n\r\t]/g, '').length > 0),
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
    // NOTE: Reconciliation of mapping conditional values was removed because 
    // it caused a mismatch between form data (labels) and condition targets.
    // We now compare against the literal label as specified in the template.


    // Emulate replacing fields with their conditional sections in layout and non-condition sections
    // This allows conditionals to wrap fields even when they appear in self-contained Sections
    const conditionalSections = sections.filter(s => s.condition && !s.isMapping);

    const fieldToConditionMap = new Map<string, string[]>();
    conditionalSections.forEach(condSec => {
        condSec.field_ids.forEach(field_id => {
            const existing = fieldToConditionMap.get(field_id) || [];
            existing.push(condSec.id);
            fieldToConditionMap.set(field_id, existing);
        });
    });

    const absorbedItems = new Set<string>();
    sections.forEach(sec => {
        // Mapping sections don't have a visual layout to absorb into
        if (!sec.isMapping) {
            sec.field_ids.forEach(id => absorbedItems.add(id));
            if (sec.layout) sec.layout.forEach(id => absorbedItems.add(id));
        }
    });

    // Also update global layout
    const updatedLayout = layout.flatMap(fid => fieldToConditionMap.get(fid) || [fid])
        .filter((val, idx, self) => self.indexOf(val) === idx)
        .filter(val => !absorbedItems.has(val));

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
        predefinedValues,
        errors: [],
    };
}

/**
 * Generates a unique, stable section ID
 */
function generateSectionId(base: string, existingSections: SectionConfig[]): string {
    const prefix = base.startsWith('cond_') || base.startsWith('sec_') ? '' : 'sec_';
    // Normalize: lowercase, remove accents, replace non-alphanumeric with underscore
    const normalized = base.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '_')
        .replace(/^_+|_+$/g, '');
        
    let id = `${prefix}${normalized || 'unknown'}`;

    let counter = 1;
    const originalId = id;
    while (existingSections.some(s => s.id === id)) {
        id = `${originalId}_${counter++}`;
    }
    return id;
}

