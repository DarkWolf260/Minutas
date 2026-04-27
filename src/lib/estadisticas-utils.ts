import { DEFAULT_STATISTICS_CATEGORIES } from '@/lib/constants/statistics';
import { findValueInFormData, getReportDateTime } from '@/lib/report-sorter';
import type { Report, Template, TemplateConfig, GuardReport } from '@/lib/types';

/**
 * Normaliza una cadena para comparación (minúsculas, solo alfanuméricos, sin acentos).
 */
function normalizarParaComp(s: any): string {
  return String(s || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Mantener solo letras y números
    .trim();
}

/**
 * Normaliza una cadena de categoría para que coincida con una de las categorías estándar.
 * Si se encuentra una coincidencia, devuelve el nombre exacto de la categoría estándar.
 */
function normalizarCategoria(rawCat: string): string {
  if (!rawCat) return '';
  const cat = rawCat.trim().toUpperCase();
  const catNorm = normalizarParaComp(cat);
  const catCode = cat.split(' ')[0];

  const standardKey = DEFAULT_STATISTICS_CATEGORIES.find((dk) => {
    const sdk = dk.toUpperCase();

    // 1. Coincidencia exacta
    if (sdk === cat) return true;

    // 2. Coincidencia alfanumérica (ignora espacios, acentos, guiones, barras)
    if (normalizarParaComp(sdk) === catNorm) return true;

    // 3. Coincidencia por parte del código (ej. "5.5")
    const sdkParts = sdk.split(' ');
    const sdkCode = sdkParts[0];
    if (sdkCode && sdkCode === catCode && sdkCode.includes('.')) return true;

    return false;
  });

  return standardKey ? standardKey.toUpperCase() : cat;
}

/**
 * Resuelve las claves de interpolación para un nombre de campo dado.
 */
function resolverClavesInterpolacion(name: string, config?: TemplateConfig): Set<string> {
  const norm = normalizarParaComp(name);
  const cleanNorm = (norm.split(':')[0] || '').trim();
  const keys = new Set<string>([norm, cleanNorm]);
  if (config?.fields) {
    Object.entries(config.fields).forEach(([id, f]) => {
      const fNorm = normalizarParaComp(f.label);
      const fClean = (fNorm.split(':')[0] || '').trim();
      if (fNorm === norm || fClean === cleanNorm || normalizarParaComp(id) === norm || normalizarParaComp(id) === cleanNorm) {
        keys.add(normalizarParaComp(id));
        keys.add(fNorm);
        keys.add(fClean);
      }
    });
  }
  return keys;
}

/**
 * Busca valores asociados a un campo en los datos del formulario de forma exhaustiva.
 */
function buscarValores(obj: any, targetKeys: Set<string>): any[] {
  let results: any[] = [];
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    obj.forEach(item => results = results.concat(buscarValores(item, targetKeys)));
  } else {
    for (const key in obj) {
      if (targetKeys.has(normalizarParaComp(key))) {
        results.push(obj[key]);
      } else if (typeof obj[key] === 'object') {
        results = results.concat(buscarValores(obj[key], targetKeys));
      }
    }
  }
  return results;
}

/**
 * Evalúa si un valor cumple con una condición específica.
 */
function evaluarCondicion(
  item: any,
  fieldConfig: any,
  originalCondition: string,
  operator: string = '=',
  formData: any = {},
  config?: TemplateConfig
): boolean {
  if (item === null || item === undefined || item === '') {
    return operator === 'empty';
  }

  let valStr = '';
  let labelStr = '';
  let optValueStr = '';

  if (typeof item === 'object') {
    valStr = (item as any).label || (item as any).name || (item as any).value || String(item);
    labelStr = (item as any).label || (item as any).name || '';
    optValueStr = (item as any).value || '';
  } else {
    valStr = String(item);
    if (fieldConfig?.snippetOptions) {
      const opt = fieldConfig.snippetOptions.find((o: any) =>
        normalizarParaComp(o.value) === normalizarParaComp(item) ||
        normalizarParaComp(o.label) === normalizarParaComp(item)
      );
      if (opt) {
        valStr = opt.label;
        labelStr = opt.label;
        optValueStr = opt.value;
      }
    }
  }

  let rawConditions: string[] = [originalCondition];
  if (typeof rawConditions[0] === 'string' && rawConditions[0].includes('{') && rawConditions[0].includes('}')) {
    let conditionsToProcess = [...rawConditions];
    const matchPattern = rawConditions[0].match(/\{([^}]+)\}/g);
    
    if (matchPattern) {
      for (const matchStr of matchPattern) {
        const fullExpr = matchStr.replace(/[{}]/g, '').trim();
        const keysToMatch = resolverClavesInterpolacion(fullExpr, config);
        const foundValues = buscarValores(formData, keysToMatch);

        if (foundValues.length > 0) {
          const newConditions: string[] = [];
          const uniqueVals = Array.from(new Set(foundValues.map(v => String(v))));
          for (const cond of conditionsToProcess) {
            for (const val of uniqueVals) {
              newConditions.push(cond.replace(matchStr, val));
            }
          }
          conditionsToProcess = newConditions;
        } else {
          conditionsToProcess = conditionsToProcess.map(c => c.replace(matchStr, matchStr));
        }
      }
    }
    rawConditions = conditionsToProcess;
  }

  const targetVals = rawConditions.map(c => normalizarParaComp(c));
  const cVal = normalizarParaComp(valStr);
  const cRaw = normalizarParaComp(item);
  const cLabel = normalizarParaComp(labelStr);
  const cOptValue = normalizarParaComp(optValueStr);
  const hasValue = cVal.length > 0 || cRaw.length > 0;
  let isMatch = false;
  
  const isNegativeOperator = ['!=', 'empty', 'not_contains'].includes(operator);

  if (isNegativeOperator) {
    isMatch = true; 
    for (const targetVal of targetVals) {
      let matchForThisTarget = false;
      switch (operator) {
        case '!=': 
          matchForThisTarget = hasValue && targetVal !== '' && cVal !== targetVal && cRaw !== targetVal && cLabel !== targetVal && cOptValue !== targetVal; 
          break;
        case 'empty': matchForThisTarget = !hasValue; break;
        case 'not_contains': 
          matchForThisTarget = hasValue && targetVal !== '' && !cVal.includes(targetVal) && !cRaw.includes(targetVal) && !cLabel.includes(targetVal) && !cOptValue.includes(targetVal); 
          break;
      }
      if (!matchForThisTarget) {
        isMatch = false;
        break;
      }
    }
  } else {
    isMatch = false; 
    for (const targetVal of targetVals) {
      let matchForThisTarget = false;
      switch (operator) {
        case '=': 
          matchForThisTarget = targetVal !== '' && (cVal === targetVal || cRaw === targetVal || cLabel === targetVal || cOptValue === targetVal); 
          break;
        case 'filled': matchForThisTarget = hasValue; break;
        case 'contains': 
          matchForThisTarget = targetVal !== '' && (cVal.includes(targetVal) || cRaw.includes(targetVal) || cLabel.includes(targetVal) || cOptValue.includes(targetVal)); 
          break;
        case 'not_empty':
          matchForThisTarget = valStr.trim() !== '';
          break;
        case 'extract_value':
          const num = parseFloat(cRaw);
          matchForThisTarget = !isNaN(num) && num > 0;
          break;
      }
      if (matchForThisTarget) {
        isMatch = true;
        break;
      }
    }
  }
  return isMatch;
}

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
  const formData = report.formData || {};

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
  if (Array.isArray(template.statisticsSubCategories)) {
    template.statisticsSubCategories.forEach(cat => add(cat));
  }

  // 2. Procesar Reglas Condicionales
  if (Array.isArray(template.statisticsRules) && template.statisticsRules.length > 0) {
    const rulesByCat = new Map<string, number>();

    for (const rule of template.statisticsRules) {
      if (!rule.fieldId) continue;

      let rawCondition = rule.condition || (rule as any).value || '';
      const originalCondition = rawCondition;

      // Interpolación de reserva global
      if (typeof rawCondition === 'string' && rawCondition.includes('{') && rawCondition.includes('}')) {
        rawCondition = rawCondition.replace(/\{([^}]+)\}/g, (match, fieldName) => {
          const keysToMatch = resolverClavesInterpolacion(fieldName.trim(), config);
          const foundValue = buscarValores(report.formData, keysToMatch)[0];
          return foundValue !== undefined ? String(foundValue) : match;
        });
      }

      const operator = rule.operator || (rule as any).value || '=';
      const originalFieldId = rule.fieldId || '';
      const isSequentialPrimary = originalFieldId.endsWith('*');
      const isFirstOnlyPrimary = originalFieldId.endsWith(' (1)');
      const baseFieldId = isSequentialPrimary ? originalFieldId.slice(0, -1) : (isFirstOnlyPrimary ? originalFieldId.slice(0, -4) : originalFieldId);
      const normFieldId = normalizarParaComp(baseFieldId);

      // Determinar claves potenciales en formData (IDs o Etiquetas)
      const targetKeys = new Set<string>([normFieldId]);
      let fieldConfig: any = undefined;
      if (config?.fields) {
        Object.entries(config.fields).forEach(([id, f]) => {
          if (normalizarParaComp(f.label) === normFieldId || normalizarParaComp(id) === normFieldId) {
            targetKeys.add(normalizarParaComp(id));
            targetKeys.add(normalizarParaComp(f.label));
            if (!fieldConfig) fieldConfig = f;
          }
        });
      }

      let values = buscarValores(report.formData, targetKeys);
      if (isFirstOnlyPrimary && values.length > 0) {
        const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
        values = nonEmpty.length > 0 ? [nonEmpty[0]] : [values[0]];
      }

      // Fallback: buscar todos los valores en formData si no se encontró nada por clave
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
        values = buscarEnTodo(report.formData);
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
          const primaryMatch = evaluarCondicion(item, fieldConfig, originalCondition || '', rule.operator || '=', report.formData, config);
          let currentMatchValue = 1;

          // 2. Evaluar condiciones OR (Opcionales, pero al menos una debe cumplir si existen)
          let anyOrMatch = true;
          if (rule.orConditions && rule.orConditions.length > 0) {
            anyOrMatch = false;
            for (const orCond of rule.orConditions) {
              if (!orCond.fieldId) continue;

              const orOriginalId = orCond.fieldId;
              const isOrSequential = orOriginalId.endsWith('*');
              const isOrFirstOnly = orOriginalId.endsWith(' (1)');
              const orBaseId = isOrSequential ? orOriginalId.slice(0, -1) : (isOrFirstOnly ? orOriginalId.slice(0, -4) : orOriginalId);
              
              const orKeys = resolverClavesInterpolacion(orBaseId, config);
              let orValues = buscarValores(report.formData || {}, orKeys);
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
                  if (evaluarCondicion(oItem, config?.fields?.[orBaseId], orConditionStr, orCond.operator || '=', report.formData, config)) {
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
                if (evaluarCondicion(null, config?.fields?.[orBaseId], orConditionStr, orCond.operator || '=', report.formData, config)) {
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
              if (!secCond.fieldId) continue;
              
              const secOriginalId = secCond.fieldId;
              const isSecSequential = secOriginalId.endsWith('*');
              const isSecFirstOnly = secOriginalId.endsWith(' (1)');
              const secBaseId = isSecSequential ? secOriginalId.slice(0, -1) : (isSecFirstOnly ? secOriginalId.slice(0, -4) : secOriginalId);
              const normSecBaseId = normalizarParaComp(secBaseId);

              if (isSecSequential && normSecBaseId === normFieldId) {
                const sItem = items[seqIndex++];
                if (!evaluarCondicion(sItem, config?.fields?.[secBaseId], secCond.condition || '', secCond.operator || '=', report.formData, config)) {
                  isMatch = false;
                  break;
                }
                continue;
              }

              const secKeys = resolverClavesInterpolacion(secBaseId, config);
              let secValues = buscarValores(report.formData || {}, secKeys);
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
                  if (evaluarCondicion(sItem, config?.fields?.[secBaseId], secCondition || '', secCond.operator || '=', report.formData, config)) {
                    secMatch = true;
                    break;
                  }
                }
                if (secMatch) break;
              }

              if (secValues.length === 0 && (secCond.operator === 'empty' || secCond.operator === '!=' || secCond.operator === 'not_contains')) {
                  if (evaluarCondicion(null, config?.fields?.[secBaseId], secCondition || '', secCond.operator || '=', report.formData, config)) secMatch = true;
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

      const sectionData = report.formData?.[section.id] || report.formData?.[`section_${idx}`] ||
        report.formData?.[`${section.id}_1`] ||
        (() => {
          if (!report.formData) return undefined;
          const key = Object.keys(report.formData).find(k => k.startsWith(section.id + '_'));
          return key ? report.formData[key] : undefined;
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

/**
 * Estructura para la cuadrícula mensual: Categoría → Día (1-31) → Conteo
 */
export type MonthlyStats = Map<string, Map<number, number>>;

/**
 * Agrega reportes en una cuadrícula de estadísticas mensual, contando ocurrencias por día y categoría.
 * @param mode 'standard' usa 00:00-23:59, 'statistical' usa 03:00-03:00.
 */
export function calcularEstadisticasMensuales(
  reports: Report[],
  templates: Template[],
  configs: Record<string, TemplateConfig>,
  month: number,
  year: number,
  mode: 'standard' | 'statistical' = 'statistical',
  predefinedValues: Record<string, string> = {},
  savedReports: GuardReport[] = []
): MonthlyStats {
  const stats: MonthlyStats = new Map();

  // Inicializar todas las categorías por defecto con mapas vacíos
  DEFAULT_STATISTICS_CATEGORIES.forEach((cat) => {
    stats.set(cat.toUpperCase(), new Map());
  });

  const parseDateSafe = (ts: string) => {
    if (!ts) return new Date(NaN);
    let d = new Date(ts);
    if (!isNaN(d.getTime())) return d;

    const match = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const dStr = match[1];
      const mStr = match[2];
      const yStr = match[3];
      const hStr = match[4];
      const minStr = match[5];

      if (dStr && mStr && yStr) {
        return new Date(
          parseInt(yStr),
          parseInt(mStr) - 1,
          parseInt(dStr),
          parseInt(hStr || '0'),
          parseInt(minStr || '0')
        );
      }
    }
    return new Date(NaN);
  };

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;

    // Usar getReportDateTime para extraer la fecha lógica (de los campos Fecha/Hora)
    let date = getReportDateTime(report);

    if (!date) {
      if (!report.timestamp) return;
      date = parseDateSafe(report.timestamp);
    }

    if (isNaN(date.getTime())) return;

    // Aplicar lógica de corte de las 03:00 AM para determinar el "Día Estadístico"
    const hours = date.getHours();
    let statsYear = date.getFullYear();
    let statsMonth = date.getMonth();
    let statsDay = date.getDate();

    // En modo 'statistical', 00:00 - 02:59 pertenece al día anterior
    if (mode === 'statistical' && hours < 3) {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      statsYear = prevDate.getFullYear();
      statsMonth = prevDate.getMonth();
      statsDay = prevDate.getDate();
    }

    // Filtrado final por mes/año (basado en la fecha lógica)
    if (statsMonth !== month || statsYear !== year) return;

    const template = templates.find((t) => t.id === report.templateId);

    // 1. Procesar todas las categorías para este reporte (General, Sub, Reglas, Secciones)
    const config = configs[report.templateId];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues);
    reportCategories.forEach(category => {
      if (!stats.has(category)) {
        stats.set(category, new Map());
      }
      const dayMap = stats.get(category)!;
      dayMap.set(statsDay, (dayMap.get(statsDay) || 0) + 1);
    });
  });

  // 4. Procesar Estadísticas Guardadas (Archivadas) de Reportes de Guardia
  savedReports.forEach((report) => {
    if (!report.statistics) return;
    
    // Usar la fecha en que se generó el reporte (fecha de archivo)
    const date = new Date(report.date);
    if (isNaN(date.getTime())) return;

    // Aplicar lógica de día estadístico (corte a las 3 AM)
    const hours = date.getHours();
    let statsYear = date.getFullYear();
    let statsMonth = date.getMonth();
    let statsDay = date.getDate();

    if (mode === 'statistical' && hours < 3) {
      const prev = new Date(date);
      prev.setDate(date.getDate() - 1);
      statsYear = prev.getFullYear();
      statsMonth = prev.getMonth();
      statsDay = prev.getDate();
    }

    // Solo agregar a la vista actual si coincide con el mes/año
    if (statsYear === year && statsMonth === month) {
      Object.entries(report.statistics).forEach(([cat, count]) => {
        if (typeof count !== 'number' || count <= 0) return;
        
        const catUpper = cat.toUpperCase();
        if (!stats.has(catUpper)) {
          stats.set(catUpper, new Map());
        }
        
        const dayMap = stats.get(catUpper)!;
        // Dado que estas se agregan de toda una guardia, SUMAMOS el conteo
        dayMap.set(statsDay, (dayMap.get(statsDay) || 0) + count);
      });
    }
  });

  return stats;
}

/**
 * Agrega una lista de reportes en un mapa simple de Categoría -> Conteo.
 * Útil para el reporte final diario.
 */
export function calcularEstadisticasDia(
  reports: Report[],
  templates: Template[],
  configs: Record<string, TemplateConfig>,
  predefinedValues: Record<string, string> = {}
): Map<string, number> {
  const stats = new Map<string, number>();

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;
    
    const template = templates.find((t) => t.id === report.templateId);
    const config = configs[report.templateId];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues);
    
    reportCategories.forEach(category => {
      stats.set(category, (stats.get(category) || 0) + 1);
    });
  });

  return stats;
}

/**
 * Formatea un mapa de estadísticas en una cadena legible para el reporte final.
 */
export function formatearEstadisticasDia(stats: Map<string, number>): string {
  if (stats.size === 0) return '';
  
  return Array.from(stats.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, count]) => {
      // Extraer la parte de la etiqueta (sin el código)
      const labelPart = category.replace(/^[\d.]+\s*/, '');
      
      // Heurística para sub-ítems: comienza con una preposición indicando sub-clasificación
      const preposicionesSub = ['EN ', 'DE ', 'POR ', 'AL ', 'A ', 'CON ', 'PARA ', 'HACIA ', 'DURANTE '];
      const esSub = preposicionesSub.some(p => labelPart.toUpperCase().startsWith(p));
      
      // Limpiar y formatear la categoría
      let cleanCategory = labelPart.toLowerCase();
      
      // Capitalizar la primera letra
      if (cleanCategory.length > 0) {
        cleanCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);
      }
      
      const displayCount = count < 10 ? `0${count}` : String(count);
      const prefix = esSub ? '\t- ' : '- ';
      return `${prefix}${cleanCategory} ${displayCount}`;
    })
    .join('\n');
}

