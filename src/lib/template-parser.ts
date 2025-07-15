
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TemplateConfig, SectionConfig, FieldType, SnippetOption, StaffMember } from '@/types';

/**
 * Escapes characters in a string that have special meaning in regular expressions.
 * @param string The string to escape.
 * @returns The escaped string, safe to use in a RegExp.
 */
const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};


/**
 * Parses a template string to extract field names, section definitions, and the overall layout.
 * Supports sections `["title" ...]` and a repeatable section format with `*`.
 * This function is designed to be safe and not throw errors on malformed input.
 * @param templateContent The raw string content of the template file.
 * @returns An object containing the detected sections, the layout order, and a set of all unique field names. Returns an empty structure on parsing failure.
 */
export function parseTemplate(templateContent: string): { sections: SectionConfig[], layout: string[], fieldNames: Set<string>, fieldTypes: Map<string, FieldType>, templateOptions: Map<string, SnippetOption[]> } {
    try {
        const sections: SectionConfig[] = [];
        let layout: string[] = [];
        const fieldNames = new Set<string>();
        const fieldTypes = new Map<string, FieldType>();
        const templateOptions = new Map<string, SnippetOption[]>();
        const globalFieldTypes = new Map<string, FieldType>();

        const processFieldTag = (tagContent: string): string => {
            const dropdownWithOptionsMatch = tagContent.match(/^(.+?):dropdown\((.+)\)$/);
            if (dropdownWithOptionsMatch) {
                const fieldName = dropdownWithOptionsMatch[1].trim();
                const optionsString = dropdownWithOptionsMatch[2];
                fieldNames.add(fieldName);
                fieldTypes.set(fieldName, 'dropdown');

                const options: SnippetOption[] = optionsString.split('|').map((opt, i) => {
                    const firstEqualIndex = opt.indexOf('=');
                    if (firstEqualIndex > -1) {
                        const label = opt.substring(0, firstEqualIndex).trim();
                        const value = opt.substring(firstEqualIndex + 1).trim();
                        if (label) {
                             return { id: `tpl_opt_${fieldName}_${i}`, label, value };
                        }
                    }
                    return null;
                }).filter((o): o is SnippetOption => o !== null);

                if (options.length > 0) {
                    templateOptions.set(fieldName, options);
                }
                return fieldName;
            }

            const typeMatch = tagContent.match(/^(.+?):([a-zA-Z-]+)$/);
            if (typeMatch) {
                const fieldName = typeMatch[1].trim();
                const fieldType = typeMatch[2] as FieldType;
                fieldNames.add(fieldName);
                fieldTypes.set(fieldName, fieldType);
                if (fieldType === 'time-hlv') {
                    if (!Array.from(globalFieldTypes.values()).includes('time-hlv')) {
                         globalFieldTypes.set(fieldName, 'time-hlv');
                    }
                }
                return fieldName;
            }

            const fieldName = tagContent.trim();
            fieldNames.add(fieldName);
            if (fieldName.toLowerCase() === 'hora') {
                if (!Array.from(globalFieldTypes.values()).includes('time-hlv')) {
                    fieldTypes.set(fieldName, 'time-hlv');
                    globalFieldTypes.set(fieldName, 'time-hlv');
                }
            }
            return fieldName;
        };

        const topLevelResult = parseContentRecursive(templateContent, 0, processFieldTag);
        
        sections.push(...topLevelResult.sections);
        layout = topLevelResult.layout;
        topLevelResult.fieldNames.forEach(fn => fieldNames.add(fn));


        return { sections, layout, fieldNames, fieldTypes, templateOptions };
    } catch (error) {
        console.error("Error parsing template:", error);
        return { sections: [], layout: [], fieldNames: new Set<string>(), fieldTypes: new Map(), templateOptions: new Map() };
    }
}


function parseContentRecursive(
    content: string,
    sectionIdCounter: number,
    processFieldTag: (tag: string) => string
): { sections: SectionConfig[], layout: string[], fieldNames: Set<string> } {
    const sections: SectionConfig[] = [];
    const layout: string[] = [];
    const fieldNames = new Set<string>();
    
    // Regex to find blocks: fields {}, conditional sections [?{...}...]...[/], or standard sections [...] 
    const blockRegex = /(\{[\s\S]+?\}|\[\?\{[\s\S]+?\}\s*=\s*\d+\][\s\S]*?\[\/\s*\]|\[[\s\S]+?\](\*)?)/g;
    
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
            const condMatch = blockText.match(/^\[\?\s*(\{.+?\})\s*=\s*(\d+)\s*\]([\s\S]*?)\[\/\s*\]$/);
            if(condMatch) {
                const sectionId = `section_${sectionIdCounter++}`;
                const [, condField, condValue, condInnerContent] = condMatch;

                const nestedParse = parseContentRecursive(condInnerContent, sectionIdCounter, processFieldTag);
                sectionIdCounter += nestedParse.sections.length;

                const conditionFieldId = processFieldTag(condField.slice(1, -1));
                nestedParse.fieldNames.forEach(fn => fieldNames.add(fn));
                fieldNames.add(conditionFieldId);
                
                sections.push(...nestedParse.sections);

                const newSection: SectionConfig = {
                    id: sectionId,
                    label: `Conditional for ${conditionFieldId}`,
                    isRepeatable: false,
                    fieldIds: nestedParse.layout.filter(id => !id.startsWith('section_')),
                    layout: nestedParse.layout,
                    condition: { fieldId: conditionFieldId, value: condValue },
                    originalContent: condInnerContent,
                };
                sections.push(newSection);
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

                const advancedMatch = innerContent.match(/^((?:singular="[^"]*"\s*|plural="[^"]*"\s*|sub="[^"]*"\s*)+)/);
                if (advancedMatch) {
                    definitionPart = advancedMatch[0];
                    singularTitle = (definitionPart.match(/singular="([^"]*)"/) || [])[1];
                    pluralTitle = (definitionPart.match(/plural="([^"]*)"/) || [])[1];
                    subTitle = (definitionPart.match(/sub="([^"]*)"/) || [])[1];
                } 
                else {
                    const oldMatch = innerContent.match(/^"([^"]*)"\s*/);
                    if(oldMatch) {
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

const formatStaffMember = (member: StaffMember, showCedula: boolean): string => {
    if (showCedula && member.cedula) {
        return `${member.name} ${member.cedula}`;
    }
    return member.name;
};


const renderContent = (
    template: string,
    data: Record<string, any>,
    config: TemplateConfig,
    predefinedValues: Record<string, string>,
    dynamicPredefinedValues: Record<string, string> = {}
): string => {
    let finalContent = template;
    const { sections = [], fields = {} } = config;

    const findValueForField = (fieldId: string, itemData?: Record<string, any>) => {
        const source = itemData || data;
        const lowerCaseFieldId = fieldId.toLowerCase();

        if (dynamicPredefinedValues[fieldId] !== undefined) return dynamicPredefinedValues[fieldId];
        const foundKeyInDynamic = Object.keys(dynamicPredefinedValues).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInDynamic) return dynamicPredefinedValues[foundKeyInDynamic];

        // Search in current item data first for repeatable sections
        if (itemData && itemData[fieldId] !== undefined) return itemData[fieldId];
        if (itemData) {
            const foundKeyInItem = Object.keys(itemData).find(k => k.toLowerCase() === lowerCaseFieldId);
            if (foundKeyInItem) return itemData[foundKeyInItem];
        }

        // Search in top-level data
        if (data[fieldId] !== undefined) return data[fieldId];
        const foundKeyInRoot = Object.keys(data).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInRoot) return data[foundKeyInRoot];
        
        // Search inside non-repeatable sections at root level
        for (const section of sections.filter(s => !s.isRepeatable && s.id in data)) {
            const sectionData = data[section.id];
            if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
                if (sectionData[fieldId] !== undefined) return sectionData[fieldId];
                const foundKeyInSection = Object.keys(sectionData).find(k => k.toLowerCase() === lowerCaseFieldId);
                if (foundKeyInSection) return sectionData[foundKeyInSection];
            }
        }

        // Fallback to predefined values
        if (predefinedValues[fieldId] !== undefined) return predefinedValues[fieldId];
        const foundKeyInPredefined = Object.keys(predefinedValues).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInPredefined) return predefinedValues[foundKeyInPredefined];
        
        return undefined;
    };

    const { templateOptions } = parseTemplate(template);

    const renderValue = (value: any, fieldId: string): string => {
        if (value === undefined || value === null) return '';

        const fieldConfig = fields[fieldId];
        
        if (fieldConfig?.type === 'dropdown' && typeof value === 'string') {
            if (fieldConfig.targetField) return '';
            const allOptions = [
                ...(fieldConfig.snippetOptions || []), 
                ...(templateOptions.get(fieldId) || [])
            ];
            const selectedOption = allOptions.find(opt => opt.label === value);
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
                    return (value as StaffMember[]).map(member => formatStaffMember(member, showCedula)).join(', ');
                }
            }
            return value.join(', ');
        }

        return String(value);
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
    }


    // First, process all sections
    sections.forEach(section => {
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
                const itemsWithContent = sectionData.filter(item => 
                    section.fieldIds.some(fid => hasContent(item[fid]))
                );

                if (itemsWithContent.length > 0) {
                    renderedItems = itemsWithContent.map((item, index) => {
                         let itemBlock = section.originalContent || '';
                         section.fieldIds.forEach(fieldId => {
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
                if(section.label && !section.fieldIds.length) {
                    sectionContent = `- *${section.label}*`;
                } else {
                    section.fieldIds.forEach(fieldId => {
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
    
    // Final cleanup for any stray tags outside of sections
    finalContent = finalContent.replace(/\{([^:}]+?)(:dropdown\(.+?\)|:[a-zA-Z-]+)?\}/g, (match, fieldId) => {
        fieldId = fieldId.trim();
        const formValue = findValueForField(fieldId);
        return hasContent(formValue) ? renderValue(formValue, fieldId) : '';
    });
    
    return finalContent;
};


export const renderFinalReport = (
    template: string,
    data: Record<string, any>,
    config: TemplateConfig,
    predefinedValues: Record<string, string>,
    summaryOnly: boolean = false,
    dynamicPredefinedValues: Record<string, string> = {}
): string => {
    try {
        const { sections, layout, fieldNames, fieldTypes, templateOptions } = parseTemplate(template);
        const finalConfig: TemplateConfig = { fields: {}, sections, layout };

        fieldNames.forEach(fieldName => {
            finalConfig.fields[fieldName] = config.fields[fieldName] || { type: 'text', label: fieldName };
            if (templateOptions.has(fieldName)) {
                finalConfig.fields[fieldName].snippetOptions = templateOptions.get(fieldName);
            }
            if (fieldTypes.has(fieldName)) {
                finalConfig.fields[fieldName].type = fieldTypes.get(fieldName)!;
            }
        });
        
        // Step 1: Render the full content first.
        let fullRenderedContent = renderContent(template, data, finalConfig, predefinedValues, dynamicPredefinedValues);

        // Step 2: Now, if summaryOnly is true, extract the summary from the *rendered* content.
        let summaryContent = '';
        if (summaryOnly) {
            const summaryRegex = /<<([\s\S]*?)>>/g;
            const matches = Array.from(fullRenderedContent.matchAll(summaryRegex));
            if (matches.length > 0) {
                summaryContent = matches.map(match => match[1]).join('\n\n');
            }
            // If we only want the summary, we replace the full content with just the summary part.
            fullRenderedContent = summaryContent;
        }

        // Step 3: Clean up any remaining markers from the final text.
        let finalOutput = fullRenderedContent
            .replace(/<<|>>/g, '') // Remove summary markers
            .replace(/\[\?.*?\][\s\S]*?\[\/\s*\]/g, '') // remove unprocessed conditional blocks
            .replace(/\[""]\s*/g, '') // remove separators and any trailing space
            .replace(/\[[\s\S]*?\](?:\s*)?(\*)?/g, '') // remove unprocessed section blocks
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return finalOutput;

    } catch (error) {
        console.error("Error rendering report:", error);
        return "Error al generar el reporte. La plantilla podría tener un formato incorrecto.";
    }
};


    
