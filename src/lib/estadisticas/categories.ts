import type { Report, Template, TemplateConfig, Address } from '@/lib/types';
import { normalizarParaComp, normalizarCategoria, resolverClavesInterpolacion, buscarValores } from './utils';
import { evaluarCondicion } from './evaluator';
import { resolverCategoriaTraslado } from './transfer-type-resolver';

function obtenerBaseIdYVirtual(field_id: string): { baseId: string; isVirtual: boolean } {
  const norm = normalizarParaComp(field_id);
  if (norm.endsWith('origen')) {
    let baseId = field_id;
    if (field_id.toLowerCase().endsWith('-origen')) {
      baseId = field_id.slice(0, -7);
    } else if (field_id.toLowerCase().endsWith('origen')) {
      baseId = field_id.slice(0, -6);
    }
    return { baseId, isVirtual: true };
  }
  return { baseId: field_id, isVirtual: false };
}

function obtenerValoresConSoporteVirtual(form_data: any, field_id: string, config?: TemplateConfig): any[] {
  const { baseId, isVirtual } = obtenerBaseIdYVirtual(field_id);
  
  if (isVirtual) {
    const baseKeys = resolverClavesInterpolacion(baseId, config);
    const baseValues = buscarValores(form_data || {}, baseKeys).flat(Infinity);
    
    const ubiKeys = resolverClavesInterpolacion('Ubicación', config);
    const ubiValues = buscarValores(form_data || {}, ubiKeys).flat(Infinity);
    const startVal = ubiValues.length > 0 ? ubiValues[0] : '';
    
    const origenValues: any[] = [];
    for (let i = 0; i < baseValues.length; i++) {
      if (i === 0) {
        origenValues.push(startVal);
      } else {
        origenValues.push(baseValues[i - 1]);
      }
    }
    return origenValues;
  }
  
  const targetKeys = resolverClavesInterpolacion(field_id, config);
  return buscarValores(form_data || {}, targetKeys);
}

interface TransferPoint {
  value: string;
  type?: string;
}

function findPointsWithTypes(
  obj: any,
  ubiKeys: Set<string>,
  destKeys: Set<string>,
  origenPoints: TransferPoint[],
  destinoPoints: TransferPoint[],
  rootObj?: any
) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item) => findPointsWithTypes(item, ubiKeys, destKeys, origenPoints, destinoPoints, rootObj));
    return;
  }

  const root = rootObj || obj;

  for (const key in obj) {
    const normKey = normalizarParaComp(key);
    const val = obj[key];

    if (ubiKeys.has(normKey)) {
      if (val && typeof val === 'string') {
        const typeValueKey = Object.keys(obj).find(k => normalizarParaComp(k) === `${normKey}tipo`);
        let manualType = typeValueKey ? obj[typeValueKey] : undefined;
        if (!manualType && root) {
          const rootTypeValueKey = Object.keys(root).find(k => normalizarParaComp(k) === `${normKey}tipo` || normalizarParaComp(k) === 'ubicaciontipo');
          manualType = rootTypeValueKey ? root[rootTypeValueKey] : undefined;
        }
        origenPoints.push({ value: val, type: manualType });
      }
    } else if (destKeys.has(normKey)) {
      if (val && typeof val === 'string') {
        const typeValueKey = Object.keys(obj).find(k => normalizarParaComp(k) === `${normKey}tipo`);
        let manualType = typeValueKey ? obj[typeValueKey] : undefined;
        if (!manualType && root) {
          const rootTypeValueKey = Object.keys(root).find(k => normalizarParaComp(k) === `${normKey}tipo` || normalizarParaComp(k) === 'destinotipo');
          manualType = rootTypeValueKey ? root[rootTypeValueKey] : undefined;
        }
        destinoPoints.push({ value: val, type: manualType });
      }
    } else if (typeof val === 'object') {
      findPointsWithTypes(val, ubiKeys, destKeys, origenPoints, destinoPoints, root);
    }
  }
}

/**
 * Resuelve las categorías estadísticas para un reporte basándose en las reglas de su plantilla.
 */
export function obtenerCategoriasReporte(
  report: Report,
  template?: Template,
  config?: TemplateConfig,
  predefinedValues: Record<string, string> = {},
  addresses: Address[] = []
): string[] {
  if (!template) return [];

  // Extract meta-options if stored in statistics_rules
  const rules = template.statistics_rules || [];
  const metaRule = rules.find(r => r.field_id === '__meta__');
  const disableMain = metaRule 
    ? (metaRule as any).disable_main_stat_on_apoyo 
    : template.disable_main_stat_on_apoyo;
  const disabledSubs = metaRule 
    ? (metaRule as any).disabled_sub_categories_on_apoyo 
    : template.disabled_sub_categories_on_apoyo;

  const checkApoyoIns = (val: any) => {
    if (val === true || val === 'true') return true;
    if (typeof val === 'string') {
      const norm = val.trim().toLowerCase();
      return norm === '(apoyo institucional)' || norm === 'apoyo institucional' || norm === 'si' || norm === 'sí';
    }
    return false;
  };

  const findValueCaseInsensitive = (obj: any, targetKey: string) => {
    if (!obj) return undefined;
    const lowerTarget = targetKey.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerTarget);
    return foundKey ? obj[foundKey] : undefined;
  };

  const apoyoInsVal = findValueCaseInsensitive(report.form_data, 'apoyo_ins');
  const apoyoInstVal = findValueCaseInsensitive(report.form_data, 'apoyo_institucional');

  const esApoyo = checkApoyoIns(apoyoInsVal) || 
                  checkApoyoIns(apoyoInstVal) || 
                  (report.content?.includes('(Apoyo institucional)') ?? false) ||
                  (report.content?.includes('Apoyo institucional') ?? false);

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

  if (esApoyo) {
    add('8.2 APOYOS INSTITUCIONALES');
  }

  // 1. Procesar Categoría General
  if (template.statistics_category) {
    if (!esApoyo || !disableMain) {
      add(template.statistics_category);
    }
  }

  // 2. Procesar Sub-categorías
  if (Array.isArray(template.statistics_sub_categories)) {
    template.statistics_sub_categories.forEach(cat => {
      const currentDisabledSubs = disabledSubs || [];
      if (!esApoyo || !currentDisabledSubs.includes(cat)) {
        add(cat);
      }
    });
  }

  // 2. Procesar Reglas Condicionales
  if (Array.isArray(template.statistics_rules) && template.statistics_rules.length > 0) {
    const rulesByCat = new Map<string, number>();

    if (import.meta.env.DEV) {
      console.log(`[STATS DEBUG] === Evaluando reporte "${report.title}" (ID: ${report.id}) con plantilla "${template.name}" ===`);
      console.log(`[STATS DEBUG] predefinedValues:`, predefinedValues);
      console.log(`[STATS DEBUG] form_data:`, report.form_data);
    }

    for (const rule of template.statistics_rules) {
      if (!rule.field_id) continue;
      if (rule.field_id === '__meta__') continue; // Skip metadata container
      if (esApoyo && rule.disable_on_apoyo) continue;

      let rawCondition = rule.condition || (rule as any).value || '';

      // 1. Primero interpolar con predefinedValues si existen (para soportar variables globales como {Municipio})
      if (typeof rawCondition === 'string' && rawCondition.includes('{') && rawCondition.includes('}')) {
        rawCondition = rawCondition.replace(/\{([^}]+)\}/g, (match, fieldName) => {
          const key = fieldName.trim().toLowerCase();
          const foundKey = Object.keys(predefinedValues).find(k => k.toLowerCase() === key);
          const val = foundKey !== undefined ? predefinedValues[foundKey] : undefined;
          return typeof val === 'string' ? val : match;
        });
      }

      const originalCondition = rawCondition;

      // 2. Interpolación de reserva global con form_data
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
      
      const { baseId: realPrimaryBaseId, isVirtual: isPrimaryVirtual } = obtenerBaseIdYVirtual(basefield_id);
      const normfield_id = normalizarParaComp(realPrimaryBaseId);

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

      let values = obtenerValoresConSoporteVirtual(report.form_data, basefield_id, config);
      if (isFirstOnlyPrimary && values.length > 0) {
        const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
        values = nonEmpty.length > 0 ? [nonEmpty[0]] : [values[0]];
      }

      // Fallback: buscar todos los valores en form_data si no se encontró nada por clave y no es campo virtual
      if (values.length === 0 && !isPrimaryVirtual) {
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

      // Detectar si es el campo de destinos repetibles (ej: Destino*)
      const isRouteDestinations = normalizarParaComp(basefield_id) === 'destino' && isSequentialPrimary;

      for (const rawVal of iterationList) {
        const items = (Array.isArray(rawVal) ? rawVal : [rawVal]).filter(v => v !== '' && v !== null && v !== undefined);
        const startIdx = isRouteDestinations ? 1 : 0;

        for (let i = startIdx; i < items.length; i++) {
          const item = items[i];

          // 1. Primero resolver {Destino*} (o el campo secuencial actual) secuencialmente si corresponde
          let legCondition = originalCondition;
          if (isSequentialPrimary && typeof legCondition === 'string' && legCondition.includes('{') && legCondition.includes('}')) {
            const placeholder = `{${basefield_id}*}`;
            if (normalizarParaComp(legCondition).includes(normalizarParaComp(placeholder))) {
              let prevValue = '';
              if (i === 0) {
                const ubiKeys = resolverClavesInterpolacion('Ubicación', config);
                const ubiValues = buscarValores(report.form_data || {}, ubiKeys).flat(Infinity);
                prevValue = ubiValues.length > 0 ? String(ubiValues[0]) : '';
              } else {
                prevValue = String(items[i - 1]);
              }
              const regex = new RegExp(`\\{${basefield_id}\\*\\}`, 'i');
              legCondition = legCondition.replace(regex, prevValue);
            }
          }

          // 2. Evaluar Condición Principal
          let primaryMatch = evaluarCondicion(item, fieldConfig, legCondition || '', rule.operator || '=', report.form_data, config);
          
          if (isRouteDestinations && i > 0) {
            const prevMatch = evaluarCondicion(items[i - 1], fieldConfig, legCondition || '', rule.operator || '=', report.form_data, config);
            const isNegative = ['!=', 'empty', 'not_contains'].includes(rule.operator || '=');
            if (isNegative) {
              primaryMatch = primaryMatch || prevMatch;
            } else {
              primaryMatch = primaryMatch && prevMatch;
            }

            if (import.meta.env.DEV) {
              console.log(`[STATS DEBUG] Evaluando tramo de ruta secuencial (Leg ${i}): "${items[i - 1]}" -> "${item}" contra "${legCondition}" (${rule.operator}). Resultado: ${primaryMatch}`);
            }
          }

          let currentMatchValue = 1;

          // 2. Evaluar condiciones OR (Opcionales, pero al menos una debe cumplir si existen)
          let anyOrMatch = true;
          if (rule.or_conditions && rule.or_conditions.length > 0) {
            anyOrMatch = false;
            for (const orCond of rule.or_conditions) {
              if (!orCond.field_id) continue;

              const orOriginalId = orCond.field_id;
              const isOrSequential = orOriginalId.endsWith('*');
              const isOrFirstOnly = orOriginalId.endsWith(' (1)');
              const orBaseId = isOrSequential ? orOriginalId.slice(0, -1) : (isOrFirstOnly ? orOriginalId.slice(0, -4) : orOriginalId);
              
              const { baseId: realOrBaseId } = obtenerBaseIdYVirtual(orBaseId);
              let orValues = obtenerValoresConSoporteVirtual(report.form_data, orBaseId, config);
              if (isOrFirstOnly && orValues.length > 0) {
                const nonEmpty = orValues.filter(v => v !== '' && v !== null && v !== undefined);
                orValues = nonEmpty.length > 0 ? [nonEmpty[0]] : [orValues[0]];
              }

              let orConditionStr = orCond.condition || '';
              if (typeof orConditionStr === 'string' && orConditionStr.includes('{') && orConditionStr.includes('}')) {
                // Primero resolver {Destino*} secuencial si corresponde
                const placeholder = `{${orBaseId}*}`;
                if (isOrSequential && normalizarParaComp(orConditionStr).includes(normalizarParaComp(placeholder))) {
                  let prevValue = '';
                  if (i === 0) {
                    const ubiKeys = resolverClavesInterpolacion('Ubicación', config);
                    const ubiValues = buscarValores(report.form_data || {}, ubiKeys).flat(Infinity);
                    prevValue = ubiValues.length > 0 ? String(ubiValues[0]) : '';
                  } else {
                    prevValue = String(orValues[i - 1]);
                  }
                  const regex = new RegExp(`\\{${orBaseId}\\*\\}`, 'i');
                  orConditionStr = orConditionStr.replace(regex, prevValue);
                }

                // Resolver otras variables de predefinedValues
                orConditionStr = orConditionStr.replace(/\{([^}]+)\}/g, (match, fieldName) => {
                  const key = fieldName.trim().toLowerCase();
                  const foundKey = Object.keys(predefinedValues).find(k => k.toLowerCase() === key);
                  const val = foundKey !== undefined ? predefinedValues[foundKey] : undefined;
                  return typeof val === 'string' ? val : match;
                });
              }

              let orMatch = false;
              if (isOrSequential && orValues.length === items.length) {
                const oItem = orValues[i];
                if (evaluarCondicion(oItem, config?.fields?.[realOrBaseId], orConditionStr, orCond.operator || '=', report.form_data, config)) {
                  orMatch = true;
                  if (orCond.operator === 'extract_value') {
                    currentMatchValue = tryExtractValue(oItem);
                  }
                }
              } else {
                for (const oRawVal of orValues) {
                  const oItems = Array.isArray(oRawVal) ? oRawVal : [oRawVal];
                  for (const oItem of oItems) {
                    if (evaluarCondicion(oItem, config?.fields?.[realOrBaseId], orConditionStr, orCond.operator || '=', report.form_data, config)) {
                      orMatch = true;
                      if (orCond.operator === 'extract_value') {
                        currentMatchValue = tryExtractValue(oItem);
                      }
                      break;
                    }
                  }
                  if (orMatch) break;
                }
              }

              if (orMatch) anyOrMatch = true;
              
              if (!anyOrMatch && orValues.length === 0 && (orCond.operator === 'empty' || orCond.operator === '!=' || orCond.operator === 'not_contains')) {
                if (evaluarCondicion(null, config?.fields?.[realOrBaseId], orConditionStr, orCond.operator || '=', report.form_data, config)) {
                  anyOrMatch = true;
                }
              }

              if (anyOrMatch) break;
            }
          }

          let isMatch = (rule.or_conditions && rule.or_conditions.length > 0)
            ? (primaryMatch || anyOrMatch)
            : primaryMatch;

          // 3. Evaluar condiciones AND (Deben cumplir todas si la anterior combinación es verdadera)
          if (isMatch && rule.conditions && rule.conditions.length > 0) {
            for (const secCond of rule.conditions) {
              if (!secCond.field_id) continue;
              
              const secOriginalId = secCond.field_id;
              const isSecSequential = secOriginalId.endsWith('*');
              const isSecFirstOnly = secOriginalId.endsWith(' (1)');
              const secBaseId = isSecSequential ? secOriginalId.slice(0, -1) : (isSecFirstOnly ? secOriginalId.slice(0, -4) : secOriginalId);

              const { baseId: realSecBaseId } = obtenerBaseIdYVirtual(secBaseId);
              let secValues = obtenerValoresConSoporteVirtual(report.form_data, secBaseId, config);
              if (isSecFirstOnly && secValues.length > 0) {
                const nonEmpty = secValues.filter(v => v !== '' && v !== null && v !== undefined);
                secValues = nonEmpty.length > 0 ? [nonEmpty[0]] : [secValues[0]];
              }
              
              let secCondition = secCond.condition || '';
              if (typeof secCondition === 'string' && secCondition.includes('{') && secCondition.includes('}')) {
                // Primero resolver {Destino*} secuencial si corresponde
                const placeholder = `{${secBaseId}*}`;
                if (isSecSequential && normalizarParaComp(secCondition).includes(normalizarParaComp(placeholder))) {
                  let prevValue = '';
                  if (i === 0) {
                    const ubiKeys = resolverClavesInterpolacion('Ubicación', config);
                    const ubiValues = buscarValores(report.form_data || {}, ubiKeys).flat(Infinity);
                    prevValue = ubiValues.length > 0 ? String(ubiValues[0]) : '';
                  } else {
                    prevValue = String(secValues[i - 1]);
                  }
                  const regex = new RegExp(`\\{${secBaseId}\\*\\}`, 'i');
                  secCondition = secCondition.replace(regex, prevValue);
                }

                // Resolver otras variables de predefinedValues
                secCondition = secCondition.replace(/\{([^}]+)\}/g, (match, fieldName) => {
                  const key = fieldName.trim().toLowerCase();
                  const foundKey = Object.keys(predefinedValues).find(k => k.toLowerCase() === key);
                  const val = foundKey !== undefined ? predefinedValues[foundKey] : undefined;
                  return typeof val === 'string' ? val : match;
                });
              }

              let secMatch = false;
              if (isSecSequential && secValues.length === items.length) {
                const sItem = secValues[i];
                if (evaluarCondicion(sItem, config?.fields?.[realSecBaseId], secCondition || '', secCond.operator || '=', report.form_data, config)) {
                  secMatch = true;
                }
              } else {
                for (const sRawVal of secValues) {
                  const sItems = Array.isArray(sRawVal) ? sRawVal : [sRawVal];
                  for (const sItem of sItems) {
                    if (evaluarCondicion(sItem, config?.fields?.[realSecBaseId], secCondition || '', secCond.operator || '=', report.form_data, config)) {
                      secMatch = true;
                      break;
                    }
                  }
                  if (secMatch) break;
                }
              }

              if (secValues.length === 0 && (secCond.operator === 'empty' || secCond.operator === '!=' || secCond.operator === 'not_contains')) {
                  if (evaluarCondicion(null, config?.fields?.[realSecBaseId], secCondition || '', secCond.operator || '=', report.form_data, config)) secMatch = true;
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

      const ruleCategories: string[] = [];
      if (rule.category) {
        ruleCategories.push(rule.category);
      }
      if (Array.isArray(rule.categories)) {
        rule.categories.forEach(cat => {
          if (cat && !ruleCategories.includes(cat)) {
            ruleCategories.push(cat);
          }
        });
      }

      if (import.meta.env.DEV) {
        console.log(`[STATS DEBUG] Regla para campo "${rule.field_id}" (${rule.operator} "${rule.condition}") -> Matches found: ${matches}. Categorías:`, ruleCategories);
      }

      if (matches > 0 && ruleCategories.length > 0) {
        ruleCategories.forEach(cat => {
          const normRuleCat = normalizarCategoria(cat);
          rulesByCat.set(normRuleCat, (rulesByCat.get(normRuleCat) || 0) + matches);
        });
      }
    }
    rulesByCat.forEach((m, cat) => add(cat, m));
  }

  // 3. Procesar Categorías de Sección
  if (config?.sections) {
    config.sections.forEach((section, idx) => {
      if (!section.statistics_category) return;

      const sectionData = report.form_data?.[section.id] || report.form_data?.[`section_${idx}`] ||
        report.form_data?.[`${section.id}_1`] ||
        (() => {
          if (!report.form_data) return undefined;
          const key = Object.keys(report.form_data).find(k => k.startsWith(section.id + '_'));
          return key ? report.form_data[key] : undefined;
        })();

      if (section.is_repeatable) {
        if (Array.isArray(sectionData) && sectionData.length > 0) add(section.statistics_category, sectionData.length);
      } else {
        const hasData = sectionData && (Array.isArray(sectionData) ? sectionData.length > 0 : Object.keys(sectionData as object).length > 0);
        const reportSection = report.sections?.find(rs => rs.title === section.label || rs.title === section.id);
        const hasContent = reportSection && reportSection.content && reportSection.content.trim().length > 0;
        if (hasData || hasContent) add(section.statistics_category);
      }
    });
  }

  if (report.form_data) {
    const ubiKeys = resolverClavesInterpolacion('Ubicación', config);
    const destKeys = resolverClavesInterpolacion('Destino', config);
    const origenPoints: TransferPoint[] = [];
    const destinoPoints: TransferPoint[] = [];

    findPointsWithTypes(report.form_data, ubiKeys, destKeys, origenPoints, destinoPoints);

    if (origenPoints.length > 0 && destinoPoints.length > 0) {
      const transferCounts = new Map<string, number>();
      const allPoints = [origenPoints[0]!, ...destinoPoints];
      for (let i = 0; i < allPoints.length - 1; i++) {
        const origen = allPoints[i]!;
        const destino = allPoints[i + 1]!;
        if (!origen.value || !destino.value) continue;

        const categoria = resolverCategoriaTraslado(
          origen.value,
          destino.value,
          origen.type,
          destino.type,
          addresses
        );

        if (categoria) {
          const normCat = normalizarCategoria(categoria);
          transferCounts.set(normCat, (transferCounts.get(normCat) || 0) + 1);
          if (import.meta.env.DEV) {
            console.log(`[STATS DEBUG] Tipo traslado Tramo ${i}: "${origen.value}" (${origen.type}) -> "${destino.value}" (${destino.type}) => ${categoria}`);
          }
        }
      }
      transferCounts.forEach((count, cat) => add(cat, count));
    }
  }

  // Aplanar conteos en el array final
  const result: string[] = [];
  categoryCounts.forEach((count, cat) => {
    for (let i = 0; i < count; i++) result.push(cat);
  });
  return result;
}


