import type { Report, Template, TemplateConfig } from '@/lib/types';
import { normalizarParaComp, normalizarCategoria, resolverClavesInterpolacion, buscarValores } from './utils';
import { evaluarCondicion } from './evaluator';

/**
 * Resuelve las categorías estadísticas para un reporte basándose en las reglas de su plantilla.
 */
export function obtenerCategoriasReporte(
  report: Report,
  template?: Template,
  config?: TemplateConfig,
  predefinedValues: Record<string, string> = {}
): string[] {
  if (!template) return [];

  // Usar un Map para consolidar conteos por cadena de categoría
  const categoryCounts = new Map<string, number>();

  const add = (rawCat: string | null | undefined, count: number = 1) => {
    if (!rawCat) return;
    const norm = normalizarCategoria(rawCat);
    if (!norm) return;
    // Usamos Math.max para asegurar que si una categoría proviene de múltiples fuentes,
    // solo tomamos la frecuencia más alta encontrada en ESTE reporte.
    categoryCounts.set(norm, Math.max(categoryCounts.get(norm) || 0, count));
  };

  // 1. Procesar Categoría General y Subcategorías de la Plantilla
  if (template.statisticsCategory) add(template.statisticsCategory);
  if (Array.isArray(template.statistics_sub_categories)) {
    template.statistics_sub_categories.forEach(cat => add(cat));
  }

  // 2. Procesar Reglas Condicionales
  if (Array.isArray(template.statistics_rules) && template.statistics_rules.length > 0) {
    const rulesByCat = new Map<string, number>();

    for (const rule of template.statistics_rules) {
      if (!rule.field_id) continue;

      let rawCondition = rule.condition || (rule as any).value || '';
      const originalCondition = rawCondition;

      // Interpolación de reserva global
      if (typeof rawCondition === 'string' && rawCondition.includes('{') && rawCondition.includes('}')) {
        rawCondition = rawCondition.replace(/\{([^}]+)\}/g, (match, fieldName) => {
          const keysToMatch = resolverClavesInterpolacion(fieldName.trim(), config);
          const foundValue = buscarValores(report.form_data, keysToMatch)[0];
          return foundValue !== undefined ? String(foundValue) : match;
        });
      }

      const originalfield_id = rule.field_id || '';
      const isSequentialPrimary = originalfield_id.endsWith('*');
      const isFirstOnlyPrimary = originalfield_id.endsWith(' (1)');
      const basefield_id = isSequentialPrimary ? originalfield_id.slice(0, -1) : (isFirstOnlyPrimary ? originalfield_id.slice(0, -4) : originalfield_id);
      const normfield_id = normalizarParaComp(basefield_id);

      // Determinar claves potenciales en form_data (IDs o Etiquetas)
      const targetKeys = new Set<string>([normfield_id]);
      let fieldConfig: any = undefined;
      if (config?.fields) {
        Object.entries(config.fields).forEach(([id, f]) => {
          if (normalizarParaComp(f.label) === normfield_id || normalizarParaComp(id) === normfield_id) {
            targetKeys.add(normalizarParaComp(id));
            targetKeys.add(normalizarParaComp(f.label));
            if (!fieldConfig) fieldConfig = f;
          }
        });
      }

      let values = buscarValores(report.form_data, targetKeys);
      if (isFirstOnlyPrimary && values.length > 0) {
        const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
        values = nonEmpty.length > 0 ? [nonEmpty[0]] : [values[0]];
      }

      // Fallback: buscar todos los valores en form_data si no se encontró nada por clave
      if (values.length === 0) {
        const globalTargetVal = normalizarParaComp(rawCondition);
        const buscarEnTodo = (obj: any): any[] => {
          let found: any[] = [];
          if (!obj || typeof obj !== 'object') return found;
          if (Array.isArray(obj)) {
            obj.forEach(item => found = found.concat(buscarEnTodo(item)));
          } else {
            for (const key in obj) {
              const v = obj[key];
              if (v === null || v === undefined) continue;
              if (typeof v === 'string' || typeof v === 'number') {
                if (normalizarParaComp(String(v)) === globalTargetVal) found.push(v);
              } else if (typeof v === 'object') {
                const label = (v as any).label || (v as any).name || (v as any).value || '';
                const val = (v as any).value || '';
                if (normalizarParaComp(String(label)) === globalTargetVal || normalizarParaComp(String(val)) === globalTargetVal) {
                  found.push(v);
                } else {
                  found = found.concat(buscarEnTodo(v));
                }
              }
            }
          }
          return found;
        };
        values = buscarEnTodo(report.form_data);
      }

      let matches = 0;

      const tryExtractValue = (val: any): number => {
        const num = parseFloat(String(val));
        return !isNaN(num) && num > 0 ? num : 0;
      };
      
      const iterationList = isSequentialPrimary && values.length > 0 ? [values.flat(Infinity)] : values;

      for (const rawVal of iterationList) {
        const items = Array.isArray(rawVal) ? rawVal : [rawVal];

        for (let i = 0; i < items.length; i++) {
          let seqIndex = i;
          const item = isSequentialPrimary ? items[seqIndex++] : items[i];

          // 1. Evaluar Condición Principal
          const primaryMatch = evaluarCondicion(item, fieldConfig, originalCondition || '', rule.operator || '=', report.form_data, config);
          let currentMatchValue = 1;

          // 2. Evaluar condiciones OR (Opcionales, pero al menos una debe cumplir si existen)
          let anyOrMatch = true;
          if (rule.orConditions && rule.orConditions.length > 0) {
            anyOrMatch = false;
            for (const orCond of rule.orConditions) {
              if (!orCond.field_id) continue;

              const orOriginalId = orCond.field_id;
              const isOrSequential = orOriginalId.endsWith('*');
              const isOrFirstOnly = orOriginalId.endsWith(' (1)');
              const orBaseId = isOrSequential ? orOriginalId.slice(0, -1) : (isOrFirstOnly ? orOriginalId.slice(0, -4) : orOriginalId);
              
              const orKeys = resolverClavesInterpolacion(orBaseId, config);
              let orValues = buscarValores(report.form_data || {}, orKeys);
              if (isOrFirstOnly && orValues.length > 0) {
                const nonEmpty = orValues.filter(v => v !== '' && v !== null && v !== undefined);
                orValues = nonEmpty.length > 0 ? [nonEmpty[0]] : [orValues[0]];
              }

              let orConditionStr = orCond.condition || '';
              if (orConditionStr.includes('{')) {
                orConditionStr = orConditionStr.replace(/\{(\w+)\}/g, (_, key) => predefinedValues[key] || `{${key}}`);
              }

              for (const oRawVal of orValues) {
                const oItems = Array.isArray(oRawVal) ? oRawVal : [oRawVal];
                for (const oItem of oItems) {
                  if (evaluarCondicion(oItem, config?.fields?.[orBaseId], orConditionStr, orCond.operator || '=', report.form_data, config)) {
                    anyOrMatch = true;
                    if (orCond.operator === 'extract_value') {
                      currentMatchValue = tryExtractValue(oItem);
                    }
                    break;
                  }
                }
                if (anyOrMatch) break;
              }
              
              if (!anyOrMatch && orValues.length === 0 && (orCond.operator === 'empty' || orCond.operator === '!=' || orCond.operator === 'not_contains')) {
                if (evaluarCondicion(null, config?.fields?.[orBaseId], orConditionStr, orCond.operator || '=', report.form_data, config)) {
                  anyOrMatch = true;
                }
              }

              if (anyOrMatch) break;
            }
          }

          let isMatch = primaryMatch && anyOrMatch;

          // 3. Evaluar condiciones AND (Deben cumplir todas si la anterior combinación es verdadera)
          if (isMatch && rule.conditions && rule.conditions.length > 0) {
            for (const secCond of rule.conditions) {
              if (!secCond.field_id) continue;
              
              const secOriginalId = secCond.field_id;
              const isSecSequential = secOriginalId.endsWith('*');
              const isSecFirstOnly = secOriginalId.endsWith(' (1)');
              const secBaseId = isSecSequential ? secOriginalId.slice(0, -1) : (isSecFirstOnly ? secOriginalId.slice(0, -4) : secOriginalId);
              const normSecBaseId = normalizarParaComp(secBaseId);

              if (isSecSequential && normSecBaseId === normfield_id) {
                const sItem = items[seqIndex++];
                if (!evaluarCondicion(sItem, config?.fields?.[secBaseId], secCond.condition || '', secCond.operator || '=', report.form_data, config)) {
                  isMatch = false;
                  break;
                }
                continue;
              }

              const secKeys = resolverClavesInterpolacion(secBaseId, config);
              let secValues = buscarValores(report.form_data || {}, secKeys);
              if (isSecFirstOnly && secValues.length > 0) {
                const nonEmpty = secValues.filter(v => v !== '' && v !== null && v !== undefined);
                secValues = nonEmpty.length > 0 ? [nonEmpty[0]] : [secValues[0]];
              }
              
              let secCondition = secCond.condition;
              if (secCondition?.includes('{')) {
                secCondition = secCondition.replace(/\{(\w+)\}/g, (_, k) => predefinedValues[k] || `{${k}}`);
              }

              let secMatch = false;
              for (const sRawVal of secValues) {
                const sItems = Array.isArray(sRawVal) ? sRawVal : [sRawVal];
                for (const sItem of sItems) {
                  if (evaluarCondicion(sItem, config?.fields?.[secBaseId], secCondition || '', secCond.operator || '=', report.form_data, config)) {
                    secMatch = true;
                    break;
                  }
                }
                if (secMatch) break;
              }

              if (secValues.length === 0 && (secCond.operator === 'empty' || secCond.operator === '!=' || secCond.operator === 'not_contains')) {
                  if (evaluarCondicion(null, config?.fields?.[secBaseId], secCondition || '', secCond.operator || '=', report.form_data, config)) secMatch = true;
              }

              if (!secMatch) {
                isMatch = false;
                break;
              }
            }
          }

          if (isMatch) matches += currentMatchValue;
        }
      }

      if (matches > 0 && rule.category) {
        const normRuleCat = normalizarCategoria(rule.category);
        rulesByCat.set(normRuleCat, (rulesByCat.get(normRuleCat) || 0) + matches);
      }
    }
    rulesByCat.forEach((m, cat) => add(cat, m));
  }

  // 3. Procesar Categorías de Sección
  if (config?.sections) {
    config.sections.forEach((section, idx) => {
      if (!section.statisticsCategory) return;

      const sectionData = report.form_data?.[section.id] || report.form_data?.[`section_${idx}`] ||
        report.form_data?.[`${section.id}_1`] ||
        (() => {
          if (!report.form_data) return undefined;
          const key = Object.keys(report.form_data).find(k => k.startsWith(section.id + '_'));
          return key ? report.form_data[key] : undefined;
        })();

      if (section.isRepeatable) {
        if (Array.isArray(sectionData) && sectionData.length > 0) add(section.statisticsCategory, sectionData.length);
      } else {
        const hasData = sectionData && (Array.isArray(sectionData) ? sectionData.length > 0 : Object.keys(sectionData as object).length > 0);
        const reportSection = report.sections?.find(rs => rs.title === section.label || rs.title === section.id);
        const hasContent = reportSection && reportSection.content && reportSection.content.trim().length > 0;
        if (hasData || hasContent) add(section.statisticsCategory);
      }
    });
  }

  // Aplanar conteos en el array final
  const result: string[] = [];
  categoryCounts.forEach((count, cat) => {
    for (let i = 0; i < count; i++) result.push(cat);
  });
  return result;
}


