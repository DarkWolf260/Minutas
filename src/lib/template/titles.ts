/**
 * Template Titles - Title Resolution and Cleaning Utilities
 */

import type { FieldConfig } from '@/lib/types';
import { findValueInform_data } from '../report-sorter';
import { applyModifiers } from './evaluator';

/**
 * Resolves curly bracket placeholders in a template's name/title using form data.
 * E.g., "accidente de tránsito {Tipo de accidente}" -> "accidente de tránsito Colisión"
 */
export function resolveTemplateTitle(
    templateName: string,
    formData: Record<string, any>,
    config?: { fields: Record<string, FieldConfig> }
): string {
    if (!templateName) return '';
    return templateName.replace(/\{([^}]+)\}/g, (_match, fieldName) => {
        // Split by pipe for text transformations, e.g., {FieldName:value|upper}
        const pipeParts = fieldName.split('|').map((s: string) => s.trim());
        const basePart = pipeParts[0] || '';
        const textMods = pipeParts.slice(1).map((s: string) => s.toLowerCase());

        // Split by colon for value mode, e.g., {FieldName:value}
        const colonParts = basePart.split(':').map((s: string) => s.trim());
        const trimmed = colonParts[0] || '';
        const valueMode = colonParts[1]?.toLowerCase(); // 'value', 'val', 'label', 'key'

        const rawVal = findValueInform_data(formData, trimmed);
        const val = rawVal !== null && rawVal !== undefined ? rawVal : undefined;
        const actualFieldId = trimmed;

        let resolvedVal = '';
        if (val !== undefined && val !== null && val !== '') {
            // If we have field configurations and it's a dropdown option, resolve key/label based on modifier
            if (config?.fields) {
                const fieldKey = Object.keys(config.fields).find(k => k.toLowerCase() === actualFieldId.toLowerCase());
                const field = fieldKey ? config.fields[fieldKey] : undefined;
                if (field && field.type === 'dropdown' && field.snippet_options) {
                    const opt = field.snippet_options.find(o => o.id === val || o.label === val || o.value === val);
                    if (opt) {
                        if (valueMode === 'value' || valueMode === 'val') {
                            resolvedVal = opt.value || '';
                        } else {
                            resolvedVal = opt.label || '';
                        }
                    }
                }
            }
            if (!resolvedVal) resolvedVal = String(val);
        }

        // Apply text transformations if provided
        if (resolvedVal && textMods.length > 0) {
            resolvedVal = applyModifiers(resolvedVal, textMods);
        }

        return resolvedVal;
    }).replace(/\s+/g, ' ').trim();
}

/**
 * Removes placeholder curly bracket tags from template names for clean UI display.
 * E.g., "accidente de tránsito {Tipo de accidente}" -> "accidente de tránsito"
 */
export function cleanTemplateName(name: string): string {
    if (!name) return '';
    return name.replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim();
}
