import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    TemplateParserResult,
    SectionConfig,
    FieldType,
    SnippetOption
} from '../types';
import { formatStaffMember } from './formatters';

/**
 * Tipos automáticos basados en el nombre del campo
 */
const AUTOMATIC_FIELD_TYPES: Record<string, FieldType> = {
    'hora': 'time-hlv'
};

/**
 * Parsea el contenido de un tag de campo para extraer el ID, tipo y modificadores
 */
const parseFieldTag = (
    tagContent: string,
    templateOptions: Map<string, SnippetOption[]>
): { fieldId: string; fieldType: FieldType; modifier?: string } => {
    // 1. Dropdown con opciones inline: {Campo:dropdown(A=Val1|B=Val2)}
    const dropdownMatch = tagContent.match(/^(.+?):dropdown\((.+)\)(?:\|(.+))?$/);
    if (dropdownMatch) {
        const fieldName = dropdownMatch[1].trim();
        const optionsString = dropdownMatch[2];
        const modifier = dropdownMatch[3];

        const options: SnippetOption[] = optionsString.split('|').map((opt, i) => {
            const eqIdx = opt.indexOf('=');
            if (eqIdx > -1) {
                const label = opt.substring(0, eqIdx).trim();
                const value = opt.substring(eqIdx + 1).trim();
                if (label) {
                    return { id: `tpl_opt_${fieldName}_${i}`, label, value };
                }
            }
            return null;
        }).filter((o): o is SnippetOption => o !== null);

        if (options.length > 0) {
            templateOptions.set(fieldName, options);
        }
        return { fieldId: fieldName, fieldType: 'dropdown', modifier };
    }

    // 2. Campo con tipo explícito y posibles modificadores: {Campo:tipo|mod1|mod2}
    const typeMatch = tagContent.match(/^(.+?):([a-zA-Z-]+)(?:\|(.+))?$/);
    if (typeMatch) {
        const fieldName = typeMatch[1].trim();
        const fieldType = typeMatch[2] as FieldType;
        const modifier = typeMatch[3];
        return { fieldId: fieldName, fieldType, modifier };
    }

    // 3. Campo simple sin tipo (puede tener modificadores): {Campo|mod1|mod2}
    const parts = tagContent.split('|');
    const fieldName = parts[0].trim();
    const modifier = parts.length > 1 ? parts.slice(1).join('|') : undefined;
    const autoType = AUTOMATIC_FIELD_TYPES[fieldName.toLowerCase()] || 'text';

    return { fieldId: fieldName, fieldType: autoType, modifier };
};

/**
 * Valida la semántica de la plantilla (campos inexistentes en condicionales, índices fuera de rango, etc.)
 */
const validateSemantics = (
    sections: SectionConfig[],
    fieldNames: Set<string>,
    fieldTypes: Map<string, FieldType>,
    templateOptions: Map<string, SnippetOption[]>,
    errors: string[]
): void => {
    sections.forEach(section => {
        if (section.condition) {
            const { fieldId, value, operator } = section.condition;

            // Verificar que el campo existe
            if (!fieldNames.has(fieldId)) {
                errors.push(
                    `El condicional hace referencia al campo '{${fieldId}}' que no está definido en la plantilla.`
                );
                return;
            }

            const fieldType = fieldTypes.get(fieldId);
            const options = templateOptions.get(fieldId);

            // Validar si es dropdown
            if (fieldType === 'dropdown' && options) {
                // Solo validar índices numéricos para operador = (retrocompatibilidad)
                const isNumericIndex = (!operator || operator === '=') && /^\d+$/.test(value);
                if (isNumericIndex) {
                    const idx = parseInt(value, 10);
                    if (idx < 0 || idx >= options.length) {
                        errors.push(
                            `El condicional para '{${fieldId}}' usa índice ${idx}, pero el dropdown solo tiene ${options.length} opciones (índices 0-${options.length - 1}).`
                        );
                    }
                }
            } else if (!operator || operator === '=') {
                // Si usa = con valor numérico pero no es dropdown, advertir
                if (/^\d+$/.test(value)) {
                    errors.push(
                        `El campo '{${fieldId}}' se usa en un condicional pero no es un dropdown. Los condicionales solo funcionan con dropdowns.`
                    );
                }
            }
        }
    });
};

/**
 * Función principal para parsear una plantilla
 */
export function parseTemplate(templateContent: string): TemplateParserResult {
    const errors: string[] = [];

    // Validaciones de sintaxis básica
    const openBraces = (templateContent.match(/\{/g) || []).length;
    const closeBraces = (templateContent.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        errors.push("Desbalance de llaves detectado.");
    }

    if (templateContent.includes('[') && !templateContent.includes(']')) {
        errors.push("Desbalance de Corchetes detectado.");
    }

    if (templateContent.includes('[?') && !templateContent.includes('[/]')) {
        errors.push("Condicionales sin cerrar detectados.");
    }

    try {
        const fieldNames = new Set<string>();
        const fieldTypes = new Map<string, FieldType>();
        const templateOptions = new Map<string, SnippetOption[]>();
        const fieldModifiers = new Map<string, string>();

        const processFieldTag = (tagContent: string): string => {
            const { fieldId, fieldType, modifier } = parseFieldTag(tagContent, templateOptions);
            if (fieldId) {
                fieldNames.add(fieldId);
                // Solo sobrescribir si no está definido o si el nuevo tipo es más específico
                const currentType = fieldTypes.get(fieldId);
                if (!currentType || (currentType === 'text' && fieldType !== 'text')) {
                    fieldTypes.set(fieldId, fieldType);
                }
                if (modifier) {
                    fieldModifiers.set(fieldId, modifier);
                }
            }
            return fieldId;
        };

        const topLevelResult = parseContentRecursive(templateContent, 0, processFieldTag);

        const sections = topLevelResult.sections;
        const layout = topLevelResult.layout;

        // Consolidar nombres de campos
        topLevelResult.fieldNames.forEach(fn => fieldNames.add(fn));
        sections.forEach(s => {
            if (s.condition) fieldNames.add(s.condition.fieldId);
            s.fieldIds.forEach(fid => fieldNames.add(fid));
        });

        // Validación semántica
        validateSemantics(sections, fieldNames, fieldTypes, templateOptions, errors);

        return {
            sections,
            layout,
            fieldNames,
            fieldTypes,
            templateOptions,
            fieldModifiers,
            errors
        };
    } catch (error) {
        console.error("Error parsing template:", error);
        return {
            sections: [],
            layout: [],
            fieldNames: new Set(),
            fieldTypes: new Map(),
            templateOptions: new Map(),
            fieldModifiers: new Map(),
            errors: ["Error interno al procesar la plantilla."]
        };
    }
}

/**
 * Parsea el contenido de forma recursiva para manejar secciones anidadas
 */
function parseContentRecursive(
    content: string,
    sectionIdCounter: number,
    processFieldTag: (tag: string) => string
): { sections: SectionConfig[], layout: string[], fieldNames: Set<string> } {
    const sections: SectionConfig[] = [];
    const layout: string[] = [];
    const fieldNames = new Set<string>();

    // Regex para encontrar: campos {}, condicionales avanzados [?{...} op valor]...[/], o secciones [...](*)
    const blockRegex = /(\{[\s\S]+?\}|\[\?\s*\{[\s\S]+?\}\s*(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?)\s*\][\s\S]*?\[\/\s*\]|\[[\s\S]+?\](\*)?)/g;

    let lastIndex = 0;
    let match;

    const processTextChunk = (text: string) => {
        const tempFields = text.match(/\{[\s\S]+?\}/g) || [];
        tempFields.forEach(tag => {
            const fieldName = processFieldTag(tag.slice(1, -1));
            fieldNames.add(fieldName);
            layout.push(fieldName);
        });
    };

    while ((match = blockRegex.exec(content)) !== null) {
        const precedingText = content.substring(lastIndex, match.index);
        if (precedingText) {
            processTextChunk(precedingText);
        }

        const blockText = match[0];
        const isRepeatable = !!match[2];

        if (blockText.startsWith('{')) {
            const fieldName = processFieldTag(blockText.slice(1, -1));
            fieldNames.add(fieldName);
            layout.push(fieldName);
        } else if (blockText.startsWith('[?')) {
            // Condicional avanzado con operadores: [?{Campo} op Valor]...[/]
            const condMatch = blockText.match(/^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(!=|>=|<=|>|<|=)\s*("[^"]*"|\S+?)\s*\]([\s\S]*?)\[\/\s*\]$/);
            if (condMatch) {
                const sectionId = `section_${sectionIdCounter++}`;
                let [_, condFieldName, operator, condValue, condInnerContent] = condMatch;

                // Limpiar comillas del valor
                if (condValue.startsWith('"') && condValue.endsWith('"')) {
                    condValue = condValue.slice(1, -1);
                }

                const nestedParse = parseContentRecursive(condInnerContent, sectionIdCounter, processFieldTag);
                sectionIdCounter += nestedParse.sections.length;

                const conditionFieldId = processFieldTag(condFieldName.trim());
                nestedParse.fieldNames.forEach(fn => fieldNames.add(fn));
                fieldNames.add(conditionFieldId);

                sections.push(...nestedParse.sections);

                sections.push({
                    id: sectionId,
                    label: `Conditional for ${conditionFieldId}`,
                    isRepeatable: false,
                    fieldIds: nestedParse.layout.filter(id => !id.startsWith('section_')),
                    layout: nestedParse.layout,
                    condition: { fieldId: conditionFieldId, operator: operator as any, value: condValue },
                    originalContent: condInnerContent,
                });
                layout.push(sectionId);
            }
        } else {
            const contentWithBrackets = isRepeatable ? blockText.slice(0, -1).trim() : blockText;
            let innerContent = contentWithBrackets.slice(1, -1);

            if (innerContent.trim() === '""') {
                layout.push('section_separator');
            } else {
                const sectionId = `section_${sectionIdCounter++}`;

                let singularTitle, pluralTitle, subTitle, oldFormatTitle;
                let definitionPart = '';

                // Formato avanzado: singular="..." plural="..." sub="..."
                const advancedMatch = innerContent.match(/^((?:singular="[^"]*"\s*|plural="[^"]*"\s*|sub="[^"]*"\s*)+)/);
                if (advancedMatch) {
                    definitionPart = advancedMatch[0];
                    singularTitle = (definitionPart.match(/singular="([^"]*)"/) || [])[1];
                    pluralTitle = (definitionPart.match(/plural="([^"]*)"/) || [])[1];
                    subTitle = (definitionPart.match(/sub="([^"]*)"/) || [])[1];
                } else {
                    // Formato antiguo: "Título"
                    const oldMatch = innerContent.match(/^"([^"]*)"\s*/);
                    if (oldMatch) {
                        definitionPart = oldMatch[0];
                        oldFormatTitle = oldMatch[1];
                    }
                }

                const fieldsContent = innerContent.substring(definitionPart.length);

                const nestedParse = parseContentRecursive(fieldsContent, sectionIdCounter, processFieldTag);
                sectionIdCounter += nestedParse.sections.length;
                nestedParse.fieldNames.forEach(fn => fieldNames.add(fn));

                sections.push(...nestedParse.sections);

                let sectionLabel = oldFormatTitle || singularTitle || pluralTitle || subTitle || `Sección ${sections.length + 1}`;

                const allFieldIds = new Set<string>();
                (nestedParse.layout || []).forEach(id => {
                    if (!id.startsWith('section_')) {
                        allFieldIds.add(id);
                    }
                });

                sections.push({
                    id: sectionId,
                    label: sectionLabel,
                    isRepeatable: isRepeatable,
                    fieldIds: Array.from(allFieldIds),
                    layout: nestedParse.layout,
                    repeatableItemLabel: subTitle,
                    singularTitle: singularTitle,
                    pluralTitle: pluralTitle,
                    originalContent: fieldsContent,
                });
                layout.push(sectionId);
            }
        }
        lastIndex = match.index + blockText.length;
    }

    const remainingText = content.substring(lastIndex);
    if (remainingText) {
        processTextChunk(remainingText);
    }

    return { sections, layout, fieldNames };
}

/**
 * Evalúa una condición usando el operador especificado
 */
function evaluateCondition(fieldValue: any, operator: string, targetValue: string): boolean {
    const sValue = String(fieldValue || '').trim();
    const tValue = String(targetValue || '').trim();

    // Si ambos son numéricos, comparar como números
    const isNumeric = /^\d+(\.\d+)?$/.test(sValue) && /^\d+(\.\d+)?$/.test(tValue);

    if (isNumeric) {
        const n1 = parseFloat(sValue);
        const n2 = parseFloat(tValue);
        switch (operator) {
            case '!=': return n1 !== n2;
            case '>': return n1 > n2;
            case '<': return n1 < n2;
            case '>=': return n1 >= n2;
            case '<=': return n1 <= n2;
            case '=':
            default: return n1 === n2;
        }
    }

    // Comparación de strings
    switch (operator) {
        case '!=': return sValue !== tValue;
        case '>': return sValue > tValue;
        case '<': return sValue < tValue;
        case '>=': return sValue >= tValue;
        case '<=': return sValue <= tValue;
        case '=':
        default: return sValue === tValue;
    }
}

/**
 * Aplica modificadores de texto de forma encadenada
 */
function applyTextModifier(value: any, modifier?: string): string {
    if (value === undefined || value === null) return '';
    let result = String(value);

    if (!modifier) return result;

    const modifiers = modifier.split('|');
    for (const mod of modifiers) {
        const m = mod.trim().toLowerCase();

        // default("fallback")
        const defaultMatch = m.match(/^default\("([^"]*)"\)$/);
        if (defaultMatch) {
            if (!result || result.trim() === '') {
                result = defaultMatch[1];
            }
            continue;
        }

        // format("formatString")
        const formatMatch = m.match(/^format\("([^"]*)"\)$/);
        if (formatMatch) {
            try {
                const date = new Date(result);
                if (!isNaN(date.getTime())) {
                    result = format(date, formatMatch[1], { locale: es });
                }
            } catch (e) {
                // Silenciar error de formato
            }
            continue;
        }

        // Modificadores simples
        switch (m) {
            case 'upper':
                result = result.toUpperCase();
                break;
            case 'lower':
                result = result.toLowerCase();
                break;
            case 'title':
                result = result.toLowerCase().split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                break;
        }
    }

    return result;
}

/**
 * Renderiza el contenido de una plantilla con los datos proporcionados
 * Esta es una versión simplificada para compatibilidad con tests
 */
export function renderContent(
    content: string,
    data: unknown,
    config: TemplateParserResult
): string {
    if (!content) return '';
    const localData = (data || {}) as Record<string, any>;

    const blockRegex = /(\{[\s\S]+?\}|\[\?\s*\{[\s\S]+?\}\s*(?:!=|>=|<=|>|<|=)\s*(?:"[^"]*"|\S+?)\s*\][\s\S]*?\[\/\s*\])/g;

    return content.replace(blockRegex, (block) => {
        if (block.startsWith('{')) {
            const tag = block.slice(1, -1);
            const { fieldId, modifier } = parseFieldTag(tag, new Map());

            let val = localData[fieldId];

            // Manejo de dropdowns: convertir índice a valor
            const options = config.templateOptions.get(fieldId);
            if (options && typeof val === 'string' && /^\d+$/.test(val)) {
                const idx = parseInt(val, 10);
                if (options[idx]) val = options[idx].value;
            }

            return applyTextModifier(val, modifier || config.fieldModifiers.get(fieldId));
        } else if (block.startsWith('[?')) {
            const condMatch = block.match(/^\[\?\s*\{\s*([\s\S]+?)\s*\}\s*(!=|>=|<=|>|<|=)\s*("[^"]*"|\S+?)\s*\]([\s\S]*?)\[\/\s*\]$/);
            if (condMatch) {
                let [_, condFieldName, operator, targetValue, innerContent] = condMatch;
                const condFieldId = condFieldName.trim();

                if (targetValue.startsWith('"') && targetValue.endsWith('"')) {
                    targetValue = targetValue.slice(1, -1);
                }

                const actualValue = localData[condFieldId];

                // Manejo de dropdowns en condicionales
                let valToCompare = actualValue;
                const options = config.templateOptions.get(condFieldId);
                if (options && /^\d+$/.test(String(actualValue))) {
                    const idx = parseInt(String(actualValue), 10);
                    if (options[idx]) valToCompare = options[idx].value;
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
 * Renderiza el reporte final completo
 */
export function renderFinalReport(
    template: string,
    data: Record<string, any>,
    config: { fields: Record<string, any>; sections: SectionConfig[]; layout: string[] },
    predefinedValues: Record<string, string>,
    summaryOnly: boolean = false,
    dynamicPredefinedValues: Record<string, string> = {}
): string {
    try {
        const { sections, layout, fieldNames, fieldTypes, templateOptions, fieldModifiers } = parseTemplate(template);

        // Construcción del config final con todos los datos necesarios
        const finalConfig = {
            fields: {} as Record<string, any>,
            sections,
            layout,
            templateOptions,
            fieldModifiers
        };

        fieldNames.forEach(fieldName => {
            finalConfig.fields[fieldName] = config.fields[fieldName] || { type: 'text', label: fieldName };
            if (templateOptions.has(fieldName)) {
                finalConfig.fields[fieldName].snippetOptions = templateOptions.get(fieldName);
            }
            if (fieldTypes.has(fieldName)) {
                finalConfig.fields[fieldName].type = fieldTypes.get(fieldName);
            }
        });

        // Renderizar el contenido completo primero
        let fullRenderedContent = renderContentWithSections(template, data, finalConfig, predefinedValues, dynamicPredefinedValues);

        // Si solo queremos el resumen, extraerlo del contenido renderizado
        let summaryContent = '';
        if (summaryOnly) {
            const summaryRegex = /<<([\s\S]*?)>>/g;
            const matches = Array.from(fullRenderedContent.matchAll(summaryRegex));
            if (matches.length > 0) {
                summaryContent = matches.map(match => match[1]).join('\n\n');
            }
            fullRenderedContent = summaryContent;
        }

        // Limpieza final
        let finalOutput = fullRenderedContent
            .replace(/<<|>>/g, '') // Eliminar marcadores de resumen
            .replace(/\[\?.*?\][\s\S]*?\[\/\s*\]/g, '') // Eliminar bloques condicionales no procesados
            .replace(/\[""\]\s*/g, '') // Eliminar separadores
            .replace(/\[[\s\S]*?\](?:\s*)?(\*)?/g, '') // Eliminar bloques de sección no procesados
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return finalOutput;

    } catch (error) {
        console.error("Error rendering report:", error);
        return "Error al generar el reporte. La plantilla podría tener un formato incorrecto.";
    }
}

/**
 * Función auxiliar para renderizar contenido con manejo completo de secciones
 */
function renderContentWithSections(
    template: string,
    data: Record<string, any>,
    config: any,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string> = {}
): string {
    let finalContent = template;
    const { sections = [], fields = {} } = config;

    const escapeRegExp = (string: string): string => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const findValueForField = (fieldId: string, itemData?: Record<string, any>) => {
        const source = itemData || data;
        const lowerCaseFieldId = fieldId.toLowerCase();

        if (dynamicPredefinedValues[fieldId] !== undefined) return dynamicPredefinedValues[fieldId];
        const foundKeyInDynamic = Object.keys(dynamicPredefinedValues).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInDynamic) return dynamicPredefinedValues[foundKeyInDynamic];

        if (itemData && itemData[fieldId] !== undefined) return itemData[fieldId];
        if (itemData) {
            const foundKeyInItem = Object.keys(itemData).find(k => k.toLowerCase() === lowerCaseFieldId);
            if (foundKeyInItem) return itemData[foundKeyInItem];
        }

        if (data[fieldId] !== undefined) return data[fieldId];
        const foundKeyInRoot = Object.keys(data).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInRoot) return data[foundKeyInRoot];

        for (const section of sections.filter((s: any) => !s.isRepeatable && s.id in data)) {
            const sectionData = data[section.id];
            if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
                if (sectionData[fieldId] !== undefined) return sectionData[fieldId];
                const foundKeyInSection = Object.keys(sectionData).find(k => k.toLowerCase() === lowerCaseFieldId);
                if (foundKeyInSection) return sectionData[foundKeyInSection];
            }
        }

        if (predefinedValues[fieldId] !== undefined) return predefinedValues[fieldId];
        const foundKeyInPredefined = Object.keys(predefinedValues).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInPredefined) return predefinedValues[foundKeyInPredefined];

        return undefined;
    };

    const renderValue = (value: any, fieldId: string): string => {
        if (value === undefined || value === null) return '';

        const fieldConfig = fields[fieldId];

        if (fieldConfig?.type === 'dropdown' && typeof value === 'string') {
            if (fieldConfig.targetField) return '';
            const allOptions = [
                ...(fieldConfig.snippetOptions || []),
                ...(config.templateOptions?.get(fieldId) || [])
            ];
            const selectedOption = allOptions.find((opt: any) => opt.label === value);
            return selectedOption ? selectedOption.value : '';
        }

        if (fieldConfig?.type === 'date' && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
                const date = new Date(value + 'T00:00:00');
                if (isNaN(date.getTime())) return value;

                const formattedDate = format(date, "dd/MMMM/yyyy", { locale: es });
                const parts = formattedDate.split('/');
                if (parts.length === 3) {
                    parts[1] = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
                    return parts.join('/');
                }
                return formattedDate;
            } catch (e) {
                return value;
            }
        }

        if (Array.isArray(value)) {
            if (value.length > 0) {
                if (typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
                    const showCedula = fieldId.toLowerCase() === 'reporta' || fieldId.toLowerCase() === 'analista';
                    return value.map((member: any) => formatStaffMember(member, showCedula)).join(', ');
                }
            }
            return value.join(', ');
        }

        // Aplicar modificadores si existen
        const modifier = config.fieldModifiers?.get(fieldId);
        return applyTextModifier(String(value), modifier);
    };

    const hasContent = (value: any): boolean => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    };

    const sectionHasValues = (section: SectionConfig, dataContext?: any): boolean => {
        const checkFieldsForContent = (fieldIds: string[], context: any): boolean => {
            return fieldIds.some(fieldId => {
                const value = findValueForField(fieldId, context);
                return hasContent(value);
            });
        };

        let context;
        if (dataContext) {
            context = dataContext;
        } else if (data[section.id]) {
            context = data[section.id];
        } else {
            context = data;
        }

        if (section.isRepeatable) {
            const sectionData = data[section.id];
            if (!Array.isArray(sectionData) || sectionData.length === 0) return false;
            return sectionData.some(item => checkFieldsForContent(section.fieldIds, item));
        } else {
            return checkFieldsForContent(section.fieldIds, context);
        }
    };

    // Procesar todas las secciones
    sections.forEach((section: any) => {
        let sectionRegex;
        const baseContent = escapeRegExp(section.originalContent || '###NEVERMATCH###');

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

        let blockRendered = false;

        if (section.isRepeatable) {
            const sectionData = data[section.id];
            let renderedItems = '';
            if (Array.isArray(sectionData) && sectionData.length > 0) {
                const itemsWithContent = sectionData.filter((item: any) =>
                    section.fieldIds.some((fid: string) => hasContent(item[fid]))
                );

                if (itemsWithContent.length > 0) {
                    renderedItems = itemsWithContent.map((item: any, index: number) => {
                        let itemBlock = section.originalContent || '';
                        section.fieldIds.forEach((fieldId: string) => {
                            const value = findValueForField(fieldId, item);
                            itemBlock = itemBlock.replace(new RegExp(`\\{${escapeRegExp(fieldId)}(:dropdown\\(.*?\\)|:[a-zA-Z-]+)?\\}`, 'g'), renderValue(value, fieldId));
                        });

                        if (section.repeatableItemLabel) {
                            const subTitle = `- *${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}*`;
                            itemBlock = `${subTitle}\n${itemBlock}`;
                        }
                        return itemBlock;
                    }).join('\n\n');

                    const title = itemsWithContent.length === 1 ? section.singularTitle : section.pluralTitle;
                    if (title) {
                        renderedItems = `- *${title}*\n${renderedItems}`;
                    }
                }
            }
            finalContent = finalContent.replace(sectionRegex, renderedItems);
            blockRendered = true;
        } else {
            if (sectionHasValues(section)) {
                let sectionContent = section.originalContent || '';
                if (section.label && !section.fieldIds.length) {
                    sectionContent = `- *${section.label}*`;
                } else {
                    section.fieldIds.forEach((fieldId: string) => {
                        const value = findValueForField(fieldId, data[section.id]);
                        sectionContent = sectionContent.replace(new RegExp(`\\{${escapeRegExp(fieldId)}(:dropdown\\(.*?\\)|:[a-zA-Z-]+)?\\}`, 'g'), renderValue(value, fieldId));
                    });
                }
                finalContent = finalContent.replace(sectionRegex, sectionContent);
                blockRendered = true;
            }
        }

        if (!blockRendered) {
            finalContent = finalContent.replace(sectionRegex, '');
        }
    });

    // Limpieza final de tags sueltos
    finalContent = finalContent.replace(/\{([^:}]+?)(:dropdown\(.+?\)|:[a-zA-Z-]+)?(\|.+?)?\}/g, (match, fieldId) => {
        fieldId = fieldId.trim();
        const formValue = findValueForField(fieldId);
        return hasContent(formValue) ? renderValue(formValue, fieldId) : '';
    });

    return finalContent;
}
