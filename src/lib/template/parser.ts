import type { Token } from './types';
import type { SnippetOption, FieldType, SectionConfig, TemplateParserResult } from '@/lib/types';
import { tokenize } from './lexer';
import { validateSyntax, validateSemantics } from './validator';

/**
 * Automatic field types based on field name
 */
const AUTOMATIC_FIELD_TYPES: Record<string, FieldType> = {
    hora: 'time-hlv',
    fecha: 'date',
};

const VALID_FIELD_TYPES = new Set<FieldType>([
    'text',
    'textarea',
    'date',
    'time-hlv',
    'multi-text',
    'dropdown',
    'cedula',
]);

const VALID_TEXT_MODS = new Set(['upper', 'lower', 'title', 'single', 'hidden']);

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
    field_type: FieldType;
    modifiers: string[];
    is_full_width: boolean;
    is_required: boolean;
    default_value?: string;
    value?: string;
} {
    // Split segments by colon, but respect parentheses e.g. default(12:30) or dropdown(...)
    const segments: string[] = [];
    let currentSegment = '';
    let parenDepth = 0;
    for (let i = 0; i < tagContent.length; i++) {
        const char = tagContent[i];
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);

        if (char === ':' && parenDepth === 0) {
            segments.push(currentSegment.trim());
            currentSegment = '';
        } else {
            currentSegment += char;
        }
    }
    segments.push(currentSegment.trim());

    const field_id = segments[0] || '';
    const otherSegments = segments.slice(1);

    let field_type: FieldType = AUTOMATIC_FIELD_TYPES[field_id.toLowerCase()] || 'text';
    let is_full_width = false;
    let is_required = false;
    let default_value: string | undefined = undefined;
    const modifiers: string[] = [];

    otherSegments.forEach((segment) => {
        const dropdownMatch = segment.match(/^dropdown\((.+)\)$/);
        const optionsString = dropdownMatch?.[1];
        if (dropdownMatch && optionsString) {
            field_type = 'dropdown';
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

        const directDefMatch = segment.match(/^(?:default\("?(.*?)"?\)|def=\((.*?)\))$/i);
        if (directDefMatch) {
            default_value = directDefMatch[1] ?? directDefMatch[2];
            return;
        }

        if (segment === 'full') {
            is_full_width = true;
        } else if (segment === 'req') {
            is_required = true;
        } else if (VALID_FIELD_TYPES.has(segment as FieldType)) {
            field_type = segment as FieldType;
        } else if (VALID_TEXT_MODS.has(segment)) {
            modifiers.push(segment);
        } else {
            const pipeParts = segment.split('|');
            pipeParts.forEach((part) => {
                const trimmed = part.trim();
                const defMatch = trimmed.match(/^(?:default\("?(.*?)"?\)|def=\((.*?)\))$/i);
                if (defMatch) {
                    default_value = defMatch[1] ?? defMatch[2];
                } else if (trimmed === 'full') is_full_width = true;
                else if (trimmed === 'req') is_required = true;
                else if (trimmed) {
                    modifiers.push(trimmed);
                }
            });
        }
    });

    return { field_id, field_type, modifiers, is_full_width, is_required, default_value };
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
    const takenSectionIds = new Set<string>();

    // Refactored internal parser for recursion
    function parseInternal(tokenList: Token[], parent_id?: string): {
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
                if (!currentType || (currentType === 'text' && config.field_type !== 'text')) {
                    fieldTypes.set(field_id, config.field_type);
                }
                if (config.modifiers.length > 0) fieldModifiers.set(field_id, config.modifiers);
                if (config.is_full_width) fieldWidths.set(field_id, true);
                if (config.is_required) requiredFields.set(field_id, true);
                if (config.default_value !== undefined) defaultValues.set(field_id, config.default_value);

                if (token.raw.endsWith('}*')) {
                    const sectionId = generateSectionId(field_id, [...sections, ...subSections], takenSectionIds);
                    const sec: SectionConfig = {
                        id: sectionId,
                        parent_id,
                        label: field_id,
                        is_repeatable: true,
                        field_ids: [field_id],
                        layout: [field_id],
                        repeatable_item_label: field_id.toUpperCase(),
                        original_content: rawWithoutStar,
                        full_raw: token.raw,
                        is_virtual: true,
                    };


                    if (!globalRenderedFields.has(sectionId)) {
                        subSections.push(sec);
                        subLayout.push(sectionId);
                        globalRenderedFields.add(sectionId);
                    }
                } else {
                    // Allow fields to appear in multiple sections, especially useful for 
                    // mutually exclusive conditionals (e.g., ::: if sex == "F" ::: {Director} ::: ::: if sex == "M" ::: {Director} :::)
                    // We only prevent duplicates at the same level if they are at the root.
                    if (!parent_id) {
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
                const is_repeatable = !!token.is_repeatable;
                const isSelfContained = !!token.is_self_contained;
                const is_separator = !!token.is_separator;
                const is_mapping = !!token.is_mapping;
                const baseLabel = token.label || '';
                const singular_title = token.singular_title || '';
                const plural_title = token.plural_title || '';
                const sub_label = token.repeatable_item_label || '';

                idx++;
                let depth = 1;
                while (idx < tokenList.length && depth > 0) {
                    const currentToken = tokenList[idx];
                    if (!currentToken) {
                        idx++;
                        continue;
                    }

                    if (currentToken.type === 'section_start') {
                        depth++;
                    } else if (currentToken.type === 'section_end') {
                        depth--;
                    }

                    if (depth > 0) {
                        inner.push(currentToken);
                    }
                    idx++;
                }

                const baseId = baseLabel || (token.condition ? `cond_${token.condition.field_id}` : (is_separator ? 'separator' : 'section'));
                const sectionId = generateSectionId(baseId, [...sections, ...subSections], takenSectionIds);

                const innerResult = parseInternal(inner, sectionId);

                if (is_mapping && token.condition) {
                    const field_id = token.condition.field_id;
                    subFieldNames.add(field_id);
                    fieldNames.add(field_id);
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
                                            label: key,
                                            value: val,
                                        });
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
                        options.forEach((opt) => {
                            if (!merged.some((m) => m.label === opt.label)) {
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
                    parent_id,
                    label: is_separator ? (baseLabel === 'separator' ? '' : baseLabel) : (token.condition ? '' : (baseLabel || `Sección ${subSections.length + 1}`)),
                    is_repeatable,
                    field_ids: Array.from(innerResult.subFieldNames),
                    layout: innerResult.subLayout,
                    condition: token.condition ? {
                        field_id: token.condition.field_id,
                        operator: token.condition.operator,
                        value: token.condition.value,
                        condition_mode: token.condition.condition_mode,
                    } : undefined,
                    original_content: inner.map((t) => t.raw).join(''),
                    full_raw: (() => {
                        if (isSelfContained) return token.raw;
                        const lastToken = idx > 0 ? tokenList[idx - 1] : undefined;
                        const closingRaw = (lastToken?.type === 'section_end') ? lastToken.raw : '';
                        return [token.raw, ...inner.map((t) => t.raw), closingRaw].join('');
                    })(),
                    is_separator: is_separator,
                    is_mapping: is_mapping,
                    is_self_contained: isSelfContained && !is_separator,
                    has_static_content: inner.some((t) => t.type === 'text' && t.raw.replace(/[\s\n\r\t]/g, '').length > 0),
                };

                if (singular_title) section.singular_title = singular_title;
                if (plural_title) section.plural_title = plural_title;
                if (sub_label) section.repeatable_item_label = sub_label;
                if (singular_title || plural_title) section.is_repeatable = true;

                subSections.push(section);
                subLayout.push(sectionId);
                innerResult.subFieldNames.forEach((fn) => subFieldNames.add(fn));
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

    const predefinedFieldNames = new Set([
        'fecha', 'hora', 'municipio', 'estado', 'redan', 'zoedan',
        'usuario', 'guardia', 'grupo', 'active_guard_id',
        'director', 'analista', 'reporta', 'estatus', 'status'
    ]);

    // Ensure valid fields used in conditions are also tracked in fieldNames
    sections.forEach(sec => {
        if (sec.condition) {
            const base = sec.condition.field_id.split('.')[0] || sec.condition.field_id;
            if (fieldNames.has(sec.condition.field_id) || fieldNames.has(base) || predefinedFieldNames.has(base.toLowerCase())) {
                fieldNames.add(sec.condition.field_id);
            }
        }
    });
    // NOTE: Reconciliation of mapping conditional values was removed because 
    // it caused a mismatch between form data (labels) and condition targets.
    // We now compare against the literal label as specified in the template.


    // Emulate replacing fields with their conditional sections in layout and non-condition sections
    // This allows conditionals to wrap fields even when they appear in self-contained Sections
    const conditionalSections = sections.filter(s => s.condition && !s.is_mapping);

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
        if (!sec.is_mapping && sec.parent_id) {
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
function generateSectionId(base: string, existingSections: SectionConfig[], knownIds?: Set<string>): string {
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
    if (knownIds) {
        while (knownIds.has(id)) {
            id = `${originalId}_${counter++}`;
        }
        knownIds.add(id);
    } else {
        while (existingSections.some(s => s.id === id)) {
            id = `${originalId}_${counter++}`;
        }
    }
    return id;
}

// Cache for parsed templates to avoid redundant work
const parseCache = new Map<string, TemplateParserResult>();

/**
 * Parsea una plantilla completa y devuelve su configuración y errores
 */
export function parseTemplate(templateContent: string): TemplateParserResult {
    if (!templateContent) {
        return {
            sections: [],
            layout: [],
            fieldNames: new Set(),
            fieldTypes: new Map(),
            templateOptions: new Map(),
            fieldModifiers: new Map(),
            fieldWidths: new Map(),
            requiredFields: new Map(),
            defaultValues: new Map(),
            predefinedValues: new Map(),
            errors: [],
        };
    }

    // Check cache first
    const cached = parseCache.get(templateContent);
    if (cached) return cached;

    const tokens = tokenize(templateContent);
    const result = parse(tokens);

    // Syntax and semantic validation
    const syntaxErrors = validateSyntax(templateContent);
    const semanticErrors = validateSemantics(result.sections, result.fieldNames, result.fieldTypes, result.templateOptions);

    const finalResult: TemplateParserResult = {
        ...result,
        errors: [...syntaxErrors, ...semanticErrors],
    };

    // Store in cache (FIFO eviction to keep cache warm)
    if (parseCache.size >= 100) {
        const oldestKey = parseCache.keys().next().value;
        if (oldestKey) parseCache.delete(oldestKey);
    }
    parseCache.set(templateContent, finalResult);

    return finalResult;
}

