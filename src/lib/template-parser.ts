
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

        const processFieldTag = (tagContent: string): string => {
            const dropdownWithOptionsMatch = tagContent.match(/^(.+?):dropdown\((.+)\)$/s);
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
                return fieldName;
            }

            const fieldName = tagContent.trim();
            fieldNames.add(fieldName);
            if (fieldName.toLowerCase() === 'hora') {
                if (!Array.from(fieldTypes.values()).includes('time-hlv')) {
                    fieldTypes.set(fieldName, 'time-hlv');
                }
            }
            return fieldName;
        };

        const topLevelResult = parseContentRecursive(templateContent, 0, processFieldTag);
        
        sections.push(...topLevelResult.sections);
        layout = topLevelResult.layout;

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
    
    // Regex to find conditional blocks (by index) OR simple sections OR field tags
    const blockRegex = /(\[\?(\{.+?\})=(\d+?)\][\s\S]*?\[\/\])|(\[(?:[^[\]]+|\[[^[\]]*\])*\](\*)?)|(\{[\s\S]+?\})/g;

    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
        const [fullMatch, conditionalBlock, condField, condValue, standardBlock, isRepeatable, fieldBlock] = match;

        if (conditionalBlock) {
            const sectionId = `section_${sectionIdCounter++}`;
            const innerContent = conditionalBlock.substring(match[2].length + 2 + match[3].length, conditionalBlock.length - 3).trim();

            const nestedParse = parseContentRecursive(innerContent, sectionIdCounter, processFieldTag);
            sectionIdCounter += nestedParse.sections.length;

            const conditionField = processFieldTag(condField.slice(1, -1));
            
            nestedParse.fieldNames.forEach(fn => fieldNames.add(fn));
            fieldNames.add(conditionField);
            
            sections.push(...nestedParse.sections);

            const newSection: SectionConfig = {
                id: sectionId,
                label: `Conditional Block for ${conditionField}`,
                isRepeatable: false,
                fieldIds: nestedParse.layout.filter(id => !id.startsWith('section_')),
                layout: nestedParse.layout,
                condition: { fieldId: conditionField, value: condValue },
                originalContent: innerContent,
            };
            sections.push(newSection);
            layout.push(sectionId);

        } else if (standardBlock) {
            const sectionId = `section_${sectionIdCounter++}`;
            const sectionContent = standardBlock.slice(1, -1);
            
            const singularMatch = sectionContent.match(/singular="([^"]*)"/);
            const pluralMatch = sectionContent.match(/plural="([^"]*)"/);
            const subMatch = sectionContent.match(/sub="([^"]*)"/);

            const isNewRepeatableSyntax = !!(pluralMatch || singularMatch || subMatch);
            const oldFormatTitleMatch = sectionContent.match(/^"([^"]*)"/);

            const sectionFieldIdsSet = new Set<string>();
            const fieldsContent = sectionContent.replace(/singular="[^"]*"/, '').replace(/plural="[^"]*"/, '').replace(/sub="[^"]*"/, '');
            
            let fieldMatch;
            const fieldTagRegex = /\{([\s\S]+?)\}/g;
            while ((fieldMatch = fieldTagRegex.exec(fieldsContent)) !== null) {
                const fieldName = processFieldTag(fieldMatch[1]);
                sectionFieldIdsSet.add(fieldName);
            }
            const sectionFieldIds = Array.from(sectionFieldIdsSet);
            sectionFieldIds.forEach(fn => fieldNames.add(fn));

            let sectionLabel = '';
            if(isNewRepeatableSyntax) {
                sectionLabel = singularMatch?.[1] || pluralMatch?.[1] || subMatch?.[1] || `Sección ${sections.length + 1}`;
            } else if (oldFormatTitleMatch) {
                sectionLabel = oldFormatTitleMatch[1];
            }
            
            if (sectionContent === '""') {
                 layout.push('section_separator');
            } else {
                 sections.push({
                    id: sectionId,
                    label: sectionLabel,
                    isRepeatable: !!isRepeatable,
                    fieldIds: sectionFieldIds,
                    repeatableItemLabel: subMatch?.[1],
                    singularTitle: singularMatch?.[1],
                    pluralTitle: pluralMatch?.[1],
                });
                layout.push(sectionId);
            }

        } else if (fieldBlock) {
            const fieldName = processFieldTag(fieldBlock.slice(1, -1));
            fieldNames.add(fieldName);
            layout.push(fieldName);
        }
        lastIndex = blockRegex.lastIndex;
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

        if (source[fieldId] !== undefined) return source[fieldId];
        
        const foundKeyInSource = Object.keys(source).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInSource) return source[foundKeyInSource];

        if (predefinedValues[fieldId] !== undefined) return predefinedValues[fieldId];

        const foundKeyInPredefined = Object.keys(predefinedValues).find(k => k.toLowerCase() === lowerCaseFieldId);
        if (foundKeyInPredefined) return predefinedValues[foundKeyInPredefined];

        if (itemData && data[fieldId] !== undefined) return data[fieldId];
        if (itemData) {
            const globalFoundKey = Object.keys(data).find(k => k.toLowerCase() === lowerCaseFieldId);
            if (globalFoundKey) return data[globalFoundKey];
        }

        // Check inside non-repeatable sections
        for (const section of sections.filter(s => !s.isRepeatable)) {
             if (source[section.id] && source[section.id][fieldId] !== undefined) {
                return source[section.id][fieldId];
             }
        }
        
        return undefined;
    };

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
    
    // This needs to be a mutable variable to keep track across recursive calls if needed
    let sectionIdCounter = 0;
    const { sections: parsedSections, templateOptions } = parseTemplate(finalContent);

    finalContent = finalContent.replace(/(\[\?(\{.+?\})=\d+\][\s\S]*?\[\/\])|(\[(?:[^[\]]+|\[[^[\]]*\])*\](\*)?)/g, (match, conditionalBlock, condField, standardBlock, isRepeatable) => {
        if (conditionalBlock) {
             const sectionConfig = parsedSections.find(s => s.originalContent === conditionalBlock.substring(conditionalBlock.indexOf(']')+1, conditionalBlock.lastIndexOf('[')).trim());
             if (!sectionConfig || !sectionConfig.condition) return '';

             const conditionFieldId = sectionConfig.condition.fieldId;
             const conditionValue = sectionConfig.condition.value; // This is the index string
             const actualValue = findValueForField(conditionFieldId);
             
             const fieldConfig = fields[conditionFieldId];
             const allOptions = [...(fieldConfig?.snippetOptions || []), ...(templateOptions.get(conditionFieldId) || [])];
             const selectedIndex = allOptions.findIndex(opt => opt.label === actualValue);

             if (String(selectedIndex) !== conditionValue) {
                 return '';
             }
             return renderContent(sectionConfig.originalContent || '', data, config, predefinedValues, dynamicPredefinedValues);
        }

        if (standardBlock) {
             const sectionConfig = parsedSections.find(s => {
                const content = standardBlock.slice(1, -1);
                const isRepeatableMatch = standardBlock.endsWith('*');
                return s.isRepeatable === isRepeatableMatch && (s.label === content.match(/^"([^"]*)"/)?.[1] || s.singularTitle || s.pluralTitle || s.repeatableItemLabel);
             });
             if (!sectionConfig) return standardBlock;
             
             if (standardBlock.trim() === '[""]') {
                 return ""; 
             }

             if (sectionConfig.isRepeatable) {
                 const sectionData = data[sectionConfig.id];
                 if (!Array.isArray(sectionData) || sectionData.length === 0) return ''; 
                 const allItemsEmpty = sectionData.every((item: any) => {
                     return sectionConfig.fieldIds.every(fieldId => {
                         const val = item[fieldId];
                         return val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
                     });
                 });
                 if (allItemsEmpty) return '';
             } else if (sectionConfig.fieldIds.length === 0) {
                 return `- *${sectionConfig.label}*`;
             }
            
             let contentInsideBrackets = standardBlock.slice(1, -1);

             if (!sectionConfig.isRepeatable) {
                 let processedContent = contentInsideBrackets.replace(/^"([^"]*)"\s*/, '');
                 
                 sectionConfig.fieldIds.forEach(fieldId => {
                     const value = findValueForField(fieldId, data[sectionConfig.id]);
                     const renderedValue = renderValue(value, fieldId);
                     processedContent = processedContent.replace(new RegExp(`\\{${escapeRegExp(fieldId)}(:dropdown\\(.*?\\)|:[a-zA-Z-]+)?\\}`, 'gs'), renderedValue);
                 });
                 
                 return processedContent.trim();
             }
            
             const sectionData = data[sectionConfig.id];
             if (!Array.isArray(sectionData) || sectionData.length === 0) return ''; 

             const isComplex = !!(sectionConfig.singularTitle || sectionConfig.pluralTitle);

             let generatedBlock = '';
             if (isComplex) {
                 if (sectionData.length === 1 && sectionConfig.singularTitle) {
                     generatedBlock = `- *${sectionConfig.singularTitle}*`;
                 } else if (sectionData.length > 1 && sectionConfig.pluralTitle) {
                     generatedBlock = `- *${sectionConfig.pluralTitle}*`;
                 }
             }
             
             const innerContent = contentInsideBrackets
                 .replace(/singular="[^"]*"/g, '')
                 .replace(/plural="[^"]*"/g, '')
                 .replace(/sub="[^"]*"/g, '')
                 .replace(/^"([^"]*)"/, '') 
                 .trim();

             const itemsContent = sectionData.map((item: Record<string, any>, index: number) => {
                 let itemBlock = innerContent;
                
                 if (sectionConfig.repeatableItemLabel) {
                     const subTitle = `- *${sectionConfig.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}*`;
                     itemBlock = `${subTitle}\n${itemBlock}`;
                 }

                 let hasContent = false;
                 const itemParts: string[] = [];
                 sectionConfig.fieldIds.forEach(fieldId => {
                     const value = item[fieldId];
                     const renderedValue = renderValue(value, fieldId);
                    
                     if (renderedValue) {
                         hasContent = true;
                         if (isComplex || sectionConfig.repeatableItemLabel) {
                             itemBlock = itemBlock.replace(new RegExp(`\\{${escapeRegExp(fieldId)}(:dropdown\\(.*?\\)|:[a-zA-Z-]+)?\\}`, 'gs'), renderedValue);
                         } else {
                             itemParts.push(renderedValue);
                         }
                     } else {
                         itemBlock = itemBlock.replace(new RegExp(`\\{${escapeRegExp(fieldId)}(:dropdown\\(.*?\\)|:[a-zA-Z-]+)?\\}`, 'gs'), '');
                     }
                 });

                 if (!hasContent) return null;
                 return (isComplex || sectionConfig.repeatableItemLabel) ? itemBlock.trim() : itemParts.join(' ');
             }).filter(Boolean) as string[];

             if (itemsContent.length === 0) return '';

             if (isComplex) {
                 return generatedBlock ? generatedBlock + '\n' + itemsContent.join('\n\n') : itemsContent.join('\n\n');
             } else { 
                 const renderedItems = itemsContent.map(item => `- ${item}`).join('\n');
                 return renderedItems.length > 0 && generatedBlock ? `${generatedBlock}\n${renderedItems}` : renderedItems;
             }
        }
        return match;
    });
    
    finalContent = finalContent.replace(/\{([^:}]+?)(:dropdown\(.+?\)|:[a-zA-Z-]+)?\}/g, (match, fieldId) => {
        fieldId = fieldId.trim();
        const formValue = findValueForField(fieldId);

        if (formValue !== undefined && formValue !== null) {
            return renderValue(formValue, fieldId);
        }
        
        return '';
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
        let contentToProcess = template;

        if (summaryOnly) {
            const summaryRegex = /<<([\s\S]*?)>>/g;
            const matches = Array.from(contentToProcess.matchAll(summaryRegex));
            
            if (matches.length === 0) {
                return ''; // No summary markers found, return empty string
            }
            // Join all found summary blocks
            contentToProcess = matches.map(match => match[1]).join('\n\n');
        } else {
            // Remove summary markers for full report
            contentToProcess = contentToProcess.replace(/<<|>>/g, '');
        }
        
        const summaryConfig = parseTemplate(contentToProcess);
        const finalConfig = { ...config, ...summaryConfig };

        const rendered = renderContent(contentToProcess, data, finalConfig, predefinedValues, dynamicPredefinedValues);
        return rendered.replace(/\n{3,}/g, '\n\n').trim();

    } catch (error) {
        console.error("Error rendering report:", error);
        return "Error al generar el reporte. La plantilla podría tener un formato incorrecto.";
    }
};
