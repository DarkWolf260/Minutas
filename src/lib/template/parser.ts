import type { Token, ParseResult, FieldConfig } from './types';
import type { SnippetOption, FieldType, SectionConfig, TemplateParserResult } from '@/types';

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
} {
    const segments = tagContent.split(':').map((s) => s.trim());
    const fieldId = segments[0] || '';
    const otherSegments = segments.slice(1);

    let fieldType: FieldType = AUTOMATIC_FIELD_TYPES[fieldId.toLowerCase()] || 'text';
    let isFullWidth = false;
    let isRequired = false;
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
                if (trimmed === 'full') isFullWidth = true;
                else if (trimmed === 'req') isRequired = true;
                else if (VALID_TEXT_MODS.has(trimmed)) modifiers.push(trimmed);
                else if (trimmed) modifiers.push(trimmed);
            });
        }
    });

    return { fieldId, fieldType, modifiers, isFullWidth, isRequired };
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
                const config = parseFieldTag(token.raw.slice(1, -1), templateOptions);
                const fieldId = config.fieldId;
                subFieldNames.add(fieldId);
                fieldNames.add(fieldId);

                const currentType = fieldTypes.get(fieldId);
                if (!currentType || (currentType === 'text' && config.fieldType !== 'text')) {
                    fieldTypes.set(fieldId, config.fieldType);
                }
                if (config.modifiers.length > 0) fieldModifiers.set(fieldId, config.modifiers);
                if (config.isFullWidth) fieldWidths.set(fieldId, true);
                if (config.isRequired) requiredFields.set(fieldId, true);

                if (token.raw.endsWith('}*')) {
                    const sectionId = generateSectionId(fieldId, [...sections, ...subSections]);
                    const sec: SectionConfig = {
                        id: sectionId,
                        label: fieldId,
                        isRepeatable: true,
                        fieldIds: [fieldId],
                        layout: [fieldId],
                        repeatableItemLabel: fieldId.toUpperCase(),
                        originalContent: `{${fieldId}}`,
                    };
                    subSections.push(sec);
                    subLayout.push(sectionId);
                } else {
                    subLayout.push(fieldId);
                }
                idx++;
            } else if (token.type === 'section_start') {
                const inner: Token[] = [];
                idx++;
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

                const innerResult = parseInternal(inner);
                const isRepeatable = token.raw?.endsWith('*') || false;
                const baseId = token.label || (token.condition ? `cond_${token.condition.fieldId}` : 'section');
                const sectionId = generateSectionId(baseId, [...sections, ...subSections, ...innerResult.subSections]);

                subSections.push(...innerResult.subSections);

                const section: SectionConfig = {
                    id: sectionId,
                    label: token.label || (token.condition ? `Conditional for ${token.condition.fieldId}` : `Sección ${subSections.length + 1}`),
                    isRepeatable,
                    fieldIds: Array.from(innerResult.subFieldNames),
                    layout: innerResult.subLayout,
                    condition: token.condition,
                    originalContent: inner.map(t => t.raw).join(''),
                };

                if (token.label) {
                    section.singularTitle = token.label;
                    section.pluralTitle = token.label;
                }

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

    return {
        sections,
        layout,
        fieldNames,
        fieldTypes,
        templateOptions,
        fieldModifiers,
        fieldWidths,
        requiredFields,
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
