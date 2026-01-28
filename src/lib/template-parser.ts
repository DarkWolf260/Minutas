import { TemplateParserResult, SectionConfig } from '../types';
import { recordReportAudit } from './audit-engine';
import { evaluateCondition, applyModifiers } from './template/evaluator';
import { tokenize } from './template/lexer';
import { parse } from './template/parser';
import {
  renderContentWithSections as renderContentWithSectionsFromModule,
  renderContent as renderContentFromModule,
  renderFinalReport as renderFinalFromModule
} from './template/renderer';
import { validateSyntax, validateSemantics } from './template/validator';

/**
 * Parsea una plantilla completa y devuelve su configuración y errores
 */
export function parseTemplate(templateContent: string): TemplateParserResult {
  const tokens = tokenize(templateContent);
  const result = parse(tokens);

  // Syntax and semantic validation
  const syntaxErrors = validateSyntax(templateContent);
  const semanticErrors = validateSemantics(result.sections, result.fieldNames, result.fieldTypes, result.templateOptions);

  return {
    ...result,
    errors: [...syntaxErrors, ...semanticErrors],
  };
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
  data: Record<string, any>,
  config: { fields: Record<string, any>; sections: SectionConfig[]; layout: string[] },
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
  data: Record<string, any>,
  config: { fields: Record<string, any>; sections: SectionConfig[]; layout: string[] },
  predefinedValues: Record<string, string>,
  dynamicPredefinedValues: Record<string, string> = {}
): string {
  return renderContentWithSectionsFromModule(
    content,
    data,
    config,
    predefinedValues,
    dynamicPredefinedValues
  );
}
