
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TemplateConfig, SectionConfig } from '@/types';

/**
 * Parses a template string to extract field names, section definitions, and the overall layout.
 * Supports sections `["title" ...]` and a new repeatable section format.
 * @param templateContent The raw string content of the template file.
 * @returns An object containing the detected sections, the layout order, and a set of all unique field names.
 */
export function parseTemplate(templateContent: string): { sections: SectionConfig[], layout: string[], fieldNames: Set<string> } {
    const sections: SectionConfig[] = [];
    const layout: string[] = [];
    const fieldNames = new Set<string>();

    const sectionMap: Map<string, string> = new Map();
    let sectionIndex = 0;
    const contentWithPlaceholders = templateContent.replace(/(\[(?:[^[\]]+|\[[^[\]]*\])*\])/g, (match) => {
        const placeholder = `__SECTION_${sectionIndex}__`;
        sectionMap.set(placeholder, match);
        sectionIndex++;
        return placeholder;
    });

    const orderedBlockRegex = /(__SECTION_\d+__|\{[^}]+\})/g;
    let match;
    let currentLayoutIndex = 0;

    while((match = orderedBlockRegex.exec(contentWithPlaceholders)) !== null) {
        const block = match[0];
        
        if (block.startsWith('__SECTION_')) {
            const originalSectionBlock = sectionMap.get(block)!;
            const sectionContent = originalSectionBlock.slice(1, -1).trim();

            const sectionId = `section_${currentLayoutIndex}`;
            
            const singularMatch = sectionContent.match(/singular="([^"]*)"/);
            const pluralMatch = sectionContent.match(/plural="([^"]*)"/);
            const subMatch = sectionContent.match(/sub="([^"]*)"/);

            const isNewRepeatableSyntax = !!(pluralMatch || singularMatch || subMatch);

            const sectionFieldIds: string[] = [];
            const fieldRegex = /\{([^}]+)\}/g;
            let fieldMatch;
            const fieldsContent = sectionContent
                .replace(/singular="[^"]*"/, '')
                .replace(/plural="[^"]*"/, '')
                .replace(/sub="[^"]*"/, '');
                
            while ((fieldMatch = fieldRegex.exec(fieldsContent)) !== null) {
                const fieldName = fieldMatch[1].trim();
                sectionFieldIds.push(fieldName);
                fieldNames.add(fieldName);
            }

            if (isNewRepeatableSyntax) {
                const label = singularMatch?.[1] || pluralMatch?.[1] || subMatch?.[1] || `Sección ${sections.length + 1}`;
                
                sections.push({
                    id: sectionId,
                    label: label,
                    isRepeatable: true,
                    fieldIds: sectionFieldIds,
                    repeatableItemLabel: subMatch?.[1],
                    singularTitle: singularMatch?.[1],
                    pluralTitle: pluralMatch?.[1],
                });
                layout.push(sectionId);
                currentLayoutIndex++;

            } else {
                const oldFormatMatch = sectionContent.match(/"([^"]*)"(\s*\*)?/);
                
                if (oldFormatMatch) {
                    const sectionLabel = oldFormatMatch[1];
                    const isRepeatable = !!oldFormatMatch[2];
                    
                    if (sectionLabel === '' && sectionFieldIds.length === 0) {
                        layout.push('section_separator');
                    } else {
                         sections.push({
                            id: sectionId,
                            label: sectionLabel,
                            isRepeatable,
                            fieldIds: sectionFieldIds,
                            repeatableItemLabel: isRepeatable ? sectionLabel.replace(/es$/, '').replace(/s$/, '') : undefined,
                        });
                        layout.push(sectionId);
                        currentLayoutIndex++;
                    }
                }
            }
        } else {
            const fieldName = block.slice(1, -1).trim();
            fieldNames.add(fieldName);
            layout.push(fieldName);
        }
    }
    
    return { sections, layout, fieldNames };
}


/**
 * Renders the final report string by populating a template with form data.
 * @param template The original template string.
 * @param data The form data from react-hook-form.
 * @param config The template configuration.
 * @param predefinedValues A map of special values (e.g., from global settings).
 * @param summaryOnly If true, only renders content inside << ... >> markers.
 * @returns The populated report string.
 */
export const renderFinalReport = (
    template: string,
    data: Record<string, any>,
    config: TemplateConfig,
    predefinedValues: Record<string, string>,
    summaryOnly: boolean = false,
): string => {
    let finalContent = template;
    const { sections = [], fields = {} } = config;

    const renderValue = (value: any, fieldId: string): string => {
        if (value === undefined || value === null) return '';
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        
        const fieldConfig = fields[fieldId];
        if (fieldConfig?.type === 'date' && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
             try {
                const date = new Date(value + 'T00:00:00');
                if (isNaN(date.getTime())) return value; 

                const formattedDate = format(date, "d/MMMM/yyyy", { locale: es });
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

        return String(value);
    };
    
    let templateSectionIndex = 0;
    
    finalContent = finalContent.replace(/(\[(?:[^[\]]+|\[[^[\]]*\])*\])/g, (match) => {
        const contentInsideBrackets = match.slice(1, -1).trim();
        if (contentInsideBrackets === '""') {
             return '';
        }

        const sectionConfig = sections.find(s => s.id === `section_${templateSectionIndex}`);
        templateSectionIndex++;
        
        if (!sectionConfig) return ''; 

        if (sectionConfig.fieldIds.length === 0 && !sectionConfig.isRepeatable) {
            return sectionConfig.label ? `- *${sectionConfig.label}*` : '';
        }
        
        if (sectionConfig.isRepeatable) {
            const sectionData = data[sectionConfig.id];
            if (!Array.isArray(sectionData) || sectionData.length === 0) {
                return ''; 
            }

            const isComplex = !!(sectionConfig.singularTitle || sectionConfig.pluralTitle);

            let generatedBlock = '';
            if (isComplex) {
                 if (sectionData.length === 1 && sectionConfig.singularTitle) {
                    generatedBlock = `- *${sectionConfig.singularTitle}*`;
                } else if (sectionData.length > 1 && sectionConfig.pluralTitle) {
                    generatedBlock = `- *${sectionConfig.pluralTitle}*`;
                }
            }

            const innerContent = match.slice(1, -1)
                .replace(/singular="[^"]*"/, '')
                .replace(/plural="[^"]*"/, '')
                .replace(/sub="[^"]*"/, '')
                .replace(/"([^"]*)"(\s*\*)?/, '') // Also remove old format title
                .trim();

            const itemsContent = sectionData.map((item: Record<string, any>, index: number) => {
                let itemBlock = innerContent;
                
                // Only add the numbered item subtitle for complex repeatable sections
                if (isComplex && sectionConfig.repeatableItemLabel) {
                    const subTitle = `- *${sectionConfig.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}*`;
                    itemBlock = `${subTitle}\n${itemBlock}`;
                }

                sectionConfig.fieldIds.forEach(fieldId => {
                    const value = item[fieldId];
                    itemBlock = itemBlock.replace(new RegExp(`\\{${fieldId}\\}`, 'g'), renderValue(value, fieldId));
                });
                return itemBlock;
            }).join(isComplex ? '\n\n' : '\n');
            
            return generatedBlock ? generatedBlock + '\n' + itemsContent : itemsContent;
        } 
        
        else { // Simple non-repeatable section
            const sectionData = data[sectionConfig.id] || {};
            let hasContent = false;

            for (const fieldId of sectionConfig.fieldIds) {
                const value = sectionData[fieldId];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    hasContent = true;
                    break;
                }
            }

            if (!hasContent) {
                return '';
            }
            
            let processedContent = match.slice(1, -1);
            processedContent = processedContent.replace(/"[^"]*"\s*/, '');
            
            sectionConfig.fieldIds.forEach(fieldId => {
                const value = sectionData[fieldId];
                const renderedValue = renderValue(value, fieldId);
                processedContent = processedContent.replace(new RegExp(`\\{${fieldId}\\}`, 'g'), renderedValue);
            });
            
            return processedContent.trim();
        }
    });

    finalContent = finalContent.replace(/\{([^}]+)\}/g, (match, fieldId) => {
        fieldId = fieldId.trim();
        const formValue = data[fieldId];

        if (formValue !== undefined && formValue !== null) {
            return renderValue(formValue, fieldId);
        }

        if (predefinedValues[fieldId] !== undefined) {
            return predefinedValues[fieldId];
        }

        return '';
    });
    
    if (summaryOnly) {
        const summaryRegex = /<<([\s\S]*?)>>/g;
        const summaryParts = Array.from(finalContent.matchAll(summaryRegex)).map(match => match[1].trim());
        
        if (summaryParts.length > 0) {
            finalContent = summaryParts.join('\n\n');
        } else {
            finalContent = '';
        }
    }
    
    // For all views, remove the summary markers themselves from the final output.
    finalContent = finalContent.replace(/<<|>>/g, '');

    return finalContent.replace(/\n{3,}/g, '\n\n').trim();
};
