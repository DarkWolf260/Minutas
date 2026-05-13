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

