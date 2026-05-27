import { TemplateParserResult, SectionConfig, form_dataRecord, FieldConfig, SnippetOption } from '@/lib/types';

import type { ResolutionResult } from './template/renderer';

/** No-op audit recorder (audit-engine was removed during cleanup) */
const recordReportAudit = (_reportId: string, _audit: ResolutionResult[]): void => { };
import { tokenize } from './template/lexer';
import { parse } from './template/parser';
import {
  renderContentWithSections as renderContentWithSectionsFromModule,
  renderContent as renderContentFromModule,
  renderFinalReport as renderFinalFromModule
} from './template/renderer';
import { validateSyntax, validateSemantics } from './template/validator';
import { findValueInform_data } from './report-sorter';

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

  const finalResult = {
    ...result,
    errors: [...syntaxErrors, ...semanticErrors],
  };

  // Store in cache (limit size if necessary, but templates are usually few)
  if (parseCache.size > 100) parseCache.clear();
  parseCache.set(templateContent, finalResult);

  return finalResult;
}

// Re-export from new evaluator module for backwards compatibility
export { evaluateCondition, applyModifiers as applyTextModifier } from './template/evaluator';

/**
 * Renderiza el contenido de una plantilla con los datos proporcionados
 */
export function renderContent(
  content: string,
  data: unknown,
  config: TemplateParserResult
): string {
  return renderContentFromModule(content, data, config);
}

/**
 * Renderiza el reporte final completo
 */
export function renderFinalReport(
  template: string,
  data: form_dataRecord,
  config: { fields: Record<string, FieldConfig>; sections: SectionConfig[]; layout: string[] },
  predefinedValues: Record<string, string>,
  summaryOnly: boolean = false,
  dynamicPredefinedValues: Record<string, string> = {}
): string {
  // Use the modular renderer which handles everything including audit and semantic resolution
  // Note: We pass the parseTemplate as a dependency to the modular renderer
  return renderFinalFromModule(
    template,
    data,
    config,
    predefinedValues,
    summaryOnly,
    dynamicPredefinedValues,
    parseTemplate,
    recordReportAudit
  );
}

/**
 * Función auxiliar para renderizar contenido con manejo completo de secciones
 * (Mantenida para compatibilidad si se usa externamente, aunque el renderizador modular es preferible)
 */
export function renderContentWithSections(
  content: string,
  data: form_dataRecord,
  config: { fields: Record<string, FieldConfig>; sections: SectionConfig[]; layout: string[] },
  predefinedValues: Record<string, string>,
  dynamicPredefinedValues: Record<string, string> = {}
): string {
  return renderContentWithSectionsFromModule(
    content,
    data,
    {
      ...config,
      templateOptions: new Map<string, SnippetOption[]>(),
      fieldModifiers: new Map<string, string[]>(),
    },
    predefinedValues,
    dynamicPredefinedValues
  );
}

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
  return templateName.replace(/\{([^}]+)\}/g, (match, fieldName) => {
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
    if (resolvedVal) {
      textMods.forEach((mod: string) => {
        if (mod === 'upper') resolvedVal = resolvedVal.toUpperCase();
        else if (mod === 'lower') resolvedVal = resolvedVal.toLowerCase();
        else if (mod === 'title') {
          resolvedVal = resolvedVal.replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      });
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

