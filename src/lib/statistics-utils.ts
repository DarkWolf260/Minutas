import { DEFAULT_STATISTICS_CATEGORIES } from '@/lib/constants/statistics';
import { findValueInFormData, getReportDateTime } from '@/lib/report-sorter';
import type { Report, Template, TemplateConfig, GuardReport } from '@/lib/types';

/**
 * Normalizes a string for comparison (lowercase, alphanumeric only, no accents).
 */
function normalizeForComp(s: any): string {
  return String(s || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Keep only letters and numbers
    .trim();
}

/**
 * Normalizes a category string to match one of the standard categories.
 * If a match is found, returns the exact standard category name (with code and label).
 */
function normalizeCategory(rawCat: string): string {
  if (!rawCat) return '';
  const cat = rawCat.trim().toUpperCase();
  const catNorm = normalizeForComp(cat);
  const catCode = cat.split(' ')[0];

  const standardKey = DEFAULT_STATISTICS_CATEGORIES.find((dk) => {
    const sdk = dk.toUpperCase();

    // 1. Exact match
    if (sdk === cat) return true;

    // 2. Alphanumeric match (ignores spaces, accents, dashes, slashes)
    if (normalizeForComp(sdk) === catNorm) return true;

    // 3. Match by code part (e.g. "5.5")
    const sdkParts = sdk.split(' ');
    const sdkCode = sdkParts[0];
    if (sdkCode && sdkCode === catCode && sdkCode.includes('.')) return true;

    return false;
  });

  return standardKey ? standardKey.toUpperCase() : cat;
}

/**
 * Resolves the statistical categories for a report based on its template rules.
 */
export function getReportCategories(
  report: Report,
  template?: Template,
  config?: TemplateConfig,
  predefinedValues: Record<string, string> = {}
): string[] {
  if (!template) return [];

  // Use a Map to consolidate counts by category string
  const categoryCounts = new Map<string, number>();
  const formData = report.formData || {};

  const add = (rawCat: string | null | undefined, count: number = 1) => {
    if (!rawCat) return;
    const norm = normalizeCategory(rawCat);
    if (!norm) return;
    // We use Math.max to ensure that if a category comes from multiple sources 
    // (e.g. general category, section, and a rule), we only take the highest frequency 
    // found for that specific category in THIS report. 
    // This prevents double-counting redundant configurations (e.g. section 6.2 + rule 6.2).
    categoryCounts.set(norm, Math.max(categoryCounts.get(norm) || 0, count));
  };

  // 1. Process General and Sub-categories from Template
  if (template.statisticsCategory) add(template.statisticsCategory);
  if (Array.isArray(template.statisticsSubCategories)) {
    template.statisticsSubCategories.forEach(cat => add(cat));
  }

  // 2. Process Conditional Rules with Deep Search
  if (Array.isArray(template.statisticsRules) && template.statisticsRules.length > 0) {
    const rulesByCat = new Map<string, number>();

    for (const rule of template.statisticsRules) {
      if (!rule.fieldId) continue;

      let rawCondition = rule.condition || (rule as any).value || '';
      const originalCondition = rawCondition;

      const resolveInterpolationKeys = (name: string): Set<string> => {
        const norm = normalizeForComp(name);
        const cleanNorm = (norm.split(':')[0] || '').trim();
        const keys = new Set<string>([norm, cleanNorm]);
        if (config?.fields) {
          Object.entries(config.fields).forEach(([id, f]) => {
            const fNorm = normalizeForComp(f.label);
            const fClean = (fNorm.split(':')[0] || '').trim();
            if (fNorm === norm || fClean === cleanNorm || normalizeForComp(id) === norm || normalizeForComp(id) === cleanNorm) {
              keys.add(normalizeForComp(id));
              keys.add(fNorm);
              keys.add(fClean);
            }
          });
        }
        return keys;
      };

      // Global fallback interpolation (only used if dynamic evaluation fails to find values)
      if (typeof rawCondition === 'string' && rawCondition.includes('{') && rawCondition.includes('}')) {
        rawCondition = rawCondition.replace(/\{([^}]+)\}/g, (match, fieldName) => {
          const keysToMatch = resolveInterpolationKeys(fieldName.trim());
          let foundValue: any = null;

          const searchFormForField = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const res = searchFormForField(item);
                if (res !== null) return res;
              }
              return null;
            }
            for (const key in obj) {
              if (keysToMatch.has(normalizeForComp(key))) {
                const val = obj[key];
                if (typeof val === 'string' || typeof val === 'number') return val;
                if (val && typeof val === 'object') return val.label || val.name || val.value || '';
              }
              if (typeof obj[key] === 'object') {
                const nested = searchFormForField(obj[key]);
                if (nested !== null) return nested;
              }
            }
            return null;
          };

          foundValue = searchFormForField(report.formData);
          return foundValue !== null ? String(foundValue) : match;
        });
      }

      const globalTargetVal = normalizeForComp(rawCondition);
      const operator = rule.operator || (rule as any).value || '=';
      const originalFieldId = rule.fieldId || '';
      const isSequentialPrimary = originalFieldId.endsWith('*');
      const isFirstOnlyPrimary = originalFieldId.endsWith(' (1)');
      const baseFieldId = isSequentialPrimary ? originalFieldId.slice(0, -1) : (isFirstOnlyPrimary ? originalFieldId.slice(0, -4) : originalFieldId);
      const normFieldId = normalizeForComp(baseFieldId);

      // Determine potential keys in formData (IDs or Labels)
      const targetKeys = new Set<string>([normFieldId]);
      let fieldConfig: any = undefined;
      if (config?.fields) {
        Object.entries(config.fields).forEach(([id, f]) => {
          if (normalizeForComp(f.label) === normFieldId || normalizeForComp(id) === normFieldId) {
            targetKeys.add(normalizeForComp(id));
            targetKeys.add(normalizeForComp(f.label));
            if (!fieldConfig) fieldConfig = f;
          }
        });
      }

      // Exhaustive search for values associated with this field
      const findValues = (obj: any): any[] => {
        let results: any[] = [];
        if (!obj || typeof obj !== 'object') return results;
        if (Array.isArray(obj)) {
          obj.forEach(item => results = results.concat(findValues(item)));
        } else {
          for (const key in obj) {
            if (targetKeys.has(normalizeForComp(key))) {
              results.push(obj[key]);
            } else if (typeof obj[key] === 'object') {
              results = results.concat(findValues(obj[key]));
            }
          }
        }
        return results;
      };

      let values = findValues(report.formData);
      if (isFirstOnlyPrimary && values.length > 0) {
        const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
        values = nonEmpty.length > 0 ? [nonEmpty[0]] : [values[0]];
      }

      // Fallback: search all values in formData (robustness)
      if (values.length === 0) {
        const searchValues = (obj: any): any[] => {
          let found: any[] = [];
          if (!obj || typeof obj !== 'object') return found;
          if (Array.isArray(obj)) {
            obj.forEach(item => found = found.concat(searchValues(item)));
          } else {
            for (const key in obj) {
              const v = obj[key];
              if (v === null || v === undefined) continue;
              if (typeof v === 'string' || typeof v === 'number') {
                if (normalizeForComp(String(v)) === globalTargetVal) {
                  found.push(v);
                }
              } else if (typeof v === 'object') {
                // If the object itself has a label or value matching the target
                const label = (v as any).label || (v as any).name || (v as any).value || '';
                const val = (v as any).value || '';
                if (normalizeForComp(String(label)) === globalTargetVal || normalizeForComp(String(val)) === globalTargetVal) {
                  found.push(v);
                } else {
                  found = found.concat(searchValues(v));
                }
              }
            }
          }
          return found;
        };
        values = searchValues(report.formData);
      }

      const evaluateCondition = (item: any, fieldConfig: any, originalCondition: string, operator: string = '='): boolean => {
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
              normalizeForComp(o.value) === normalizeForComp(item) ||
              normalizeForComp(o.label) === normalizeForComp(item)
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
              
              const searchFormForFieldArray = (obj: any, targetName: string): any[] => {
                const keysToMatch = resolveInterpolationKeys(targetName);
                if (!obj || typeof obj !== 'object') return [];
                if (Array.isArray(obj)) {
                  let res: any[] = [];
                  for (const i of obj) {
                    res = res.concat(searchFormForFieldArray(i, targetName));
                  }
                  return res;
                }
                let res: any[] = [];
                for (const key in obj) {
                  if (keysToMatch.has(normalizeForComp(key))) {
                    const val = obj[key];
                    if (Array.isArray(val)) {
                      val.forEach(v => {
                        if (typeof v === 'string' || typeof v === 'number') res.push(v);
                        else if (v && typeof v === 'object') res.push(v.label || v.name || v.value || '');
                      });
                    } else {
                      if (typeof val === 'string' || typeof val === 'number') res.push(val);
                      else if (val && typeof val === 'object') res.push(val.label || val.name || val.value || '');
                    }
                  }
                  if (typeof obj[key] === 'object') {
                    res = res.concat(searchFormForFieldArray(obj[key], targetName));
                  }
                }
                return res;
              };

              const foundValues = searchFormForFieldArray(report.formData, fullExpr);

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

        const targetVals = rawConditions.map(c => normalizeForComp(c));

        const cVal = normalizeForComp(valStr);
        const cRaw = normalizeForComp(item);
        const cLabel = normalizeForComp(labelStr);
        const cOptValue = normalizeForComp(optValueStr);
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
      };

      let matches = 0;
      let matchValue = 1;

      // Extract value helper
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

              // 1. Evaluate Primary Condition
              const primaryMatch = evaluateCondition(item, fieldConfig, originalCondition || '', rule.operator || '=');
              let isMatch = primaryMatch;
              let currentMatchValue = 1;

              // 2. Evaluate OR conditions (Alternative to Primary)
              if (rule.orConditions && rule.orConditions.length > 0) {
                let anyOrMatch = false;
                for (const orCond of rule.orConditions) {
                  if (!orCond.fieldId) continue;

                  const orOriginalId = orCond.fieldId;
                  const isOrSequential = orOriginalId.endsWith('*');
                  const isOrFirstOnly = orOriginalId.endsWith(' (1)');
                  const orBaseId = isOrSequential ? orOriginalId.slice(0, -1) : (isOrFirstOnly ? orOriginalId.slice(0, -4) : orOriginalId);
                  
                  const orKeys = resolveInterpolationKeys(orBaseId);
                  const findOrValues = (obj: any): any[] => {
                    let res: any[] = [];
                    if (!obj || typeof obj !== 'object') return res;
                    if (Array.isArray(obj)) {
                      obj.forEach(x => res = res.concat(findOrValues(x)));
                    } else {
                      for (const k in obj) {
                        if (orKeys.has(normalizeForComp(k))) {
                          res.push(obj[k]);
                        } else if (typeof obj[k] === 'object') {
                          res = res.concat(findOrValues(obj[k]));
                        }
                      }
                    }
                    return res;
                  };

                  let orValues = findOrValues(report.formData || {});
                  if (isOrFirstOnly && orValues.length > 0) {
                    const nonEmpty = orValues.filter(v => v !== '' && v !== null && v !== undefined);
                    orValues = nonEmpty.length > 0 ? [nonEmpty[0]] : [orValues[0]];
                  }

                  // Pre-process condition with placeholders
                  let orConditionStr = orCond.condition || '';
                  if (orConditionStr.includes('{')) {
                    orConditionStr = orConditionStr.replace(/\{(\w+)\}/g, (_, key) => predefinedValues[key] || `{${key}}`);
                  }

                  for (const oRawVal of orValues) {
                    const oItems = Array.isArray(oRawVal) ? oRawVal : [oRawVal];
                    for (const oItem of oItems) {
                      if (evaluateCondition(oItem, config?.fields?.[orBaseId], orConditionStr, orCond.operator || '=')) {
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
                    if (evaluateCondition(null, config?.fields?.[orBaseId], orConditionStr, orCond.operator || '=')) {
                      anyOrMatch = true;
                    }
                  }

                  if (anyOrMatch) break;
                }
                
                // Final match logic: (Primary OR Any OR)
                isMatch = primaryMatch || anyOrMatch;
              }

              // 3. Evaluate AND conditions (Must match if the above combined match is true)
              if (isMatch && rule.conditions && rule.conditions.length > 0) {
                for (const secCond of rule.conditions) {
                  if (!secCond.fieldId) continue;
                  
                  const secOriginalId = secCond.fieldId;
                  const isSecSequential = secOriginalId.endsWith('*');
                  const isSecFirstOnly = secOriginalId.endsWith(' (1)');
                  const secBaseId = isSecSequential ? secOriginalId.slice(0, -1) : (isSecFirstOnly ? secOriginalId.slice(0, -4) : secOriginalId);
                  const normSecBaseId = normalizeForComp(secBaseId);

                  if (isSecSequential && normSecBaseId === normFieldId) {
                    const sItem = items[seqIndex++];
                    if (!evaluateCondition(sItem, config?.fields?.[secBaseId], secCond.condition || '', secCond.operator || '=')) {
                      isMatch = false;
                      break;
                    }
                    continue;
                  }

                  const secKeys = resolveInterpolationKeys(secBaseId);
                  const findSecValues = (obj: any): any[] => {
                    let results: any[] = [];
                    if (!obj || typeof obj !== 'object') return results;
                    if (Array.isArray(obj)) {
                      obj.forEach(x => results = results.concat(findSecValues(x)));
                    } else {
                      for (const key in obj) {
                        if (secKeys.has(normalizeForComp(key))) {
                          results.push(obj[key]);
                        } else if (typeof obj[key] === 'object') {
                          results = results.concat(findSecValues(obj[key]));
                        }
                      }
                    }
                    return results;
                  };

                  let secValues = findSecValues(report.formData || {});
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
                      if (evaluateCondition(sItem, config?.fields?.[secBaseId], secCondition || '', secCond.operator || '=')) {
                        secMatch = true;
                        break;
                      }
                    }
                    if (secMatch) break;
                  }

                  if (secValues.length === 0 && (secCond.operator === 'empty' || secCond.operator === '!=' || secCond.operator === 'not_contains')) {
                      if (evaluateCondition(null, config?.fields?.[secBaseId], secCondition || '', secCond.operator || '=')) secMatch = true;
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
        const normRuleCat = normalizeCategory(rule.category);
        rulesByCat.set(normRuleCat, (rulesByCat.get(normRuleCat) || 0) + matches);
      }
    }
    rulesByCat.forEach((m, cat) => add(cat, m));
  }

  // 3. Process Section Categories
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

  // Flatten counts into final array
  const result: string[] = [];
  categoryCounts.forEach((count, cat) => {
    for (let i = 0; i < count; i++) result.push(cat);
  });
  return result;
}

/**
 * Structure for the monthly grid: Category → Day (1-31) → Count
 */
export type MonthlyStats = Map<string, Map<number, number>>;

/**
 * Aggregates reports into a monthly statistics grid, counting occurrences by day and category.
 * @param mode 'standard' uses 00:00-23:59, 'statistical' uses 03:00-03:00.
 */
export function calculateMonthlyStats(
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

  // Initialize all default categories with empty maps
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

    // Use getReportDateTime to extract logical date (from Fecha/Hora fields)
    let date = getReportDateTime(report);

    if (!date) {
      if (!report.timestamp) return;
      date = parseDateSafe(report.timestamp);
    }

    if (isNaN(date.getTime())) return;

    // Apply 03:00 AM cutoff logic to determine the "Statistical Day"
    const hours = date.getHours();
    let statsYear = date.getFullYear();
    let statsMonth = date.getMonth();
    let statsDay = date.getDate();

    // In 'statistical' mode, 00:00 - 02:59 belongs to previous day
    if (mode === 'statistical' && hours < 3) {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      statsYear = prevDate.getFullYear();
      statsMonth = prevDate.getMonth();
      statsDay = prevDate.getDate();
    }

    // Final filter by month/year (based on logical date)
    if (statsMonth !== month || statsYear !== year) return;

    const day = statsDay;
    const template = templates.find((t) => t.id === report.templateId);

    // 1. Process all categories for this report (General, Sub, Rules, Sections)
    const config = configs[report.templateId];
    const reportCategories = getReportCategories(report, template, config, predefinedValues);
    reportCategories.forEach(category => {
      if (!stats.has(category)) {
        stats.set(category, new Map());
      }
      const dayMap = stats.get(category)!;
      dayMap.set(statsDay, (dayMap.get(statsDay) || 0) + 1);
    });
  });

  // 4. Process Saved (Archived) Statistics from Guard Reports
  savedReports.forEach((report) => {
    if (!report.statistics) return;
    
    // Use the date the report was generated (archive date)
    const date = new Date(report.date);
    if (isNaN(date.getTime())) return;

    // Apply statistical day logic (cutoff at 3 AM)
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

    // Only add to the current view if it matches the month/year
    if (statsYear === year && statsMonth === month) {
      Object.entries(report.statistics).forEach(([cat, count]) => {
        if (typeof count !== 'number' || count <= 0) return;
        
        const catUpper = cat.toUpperCase();
        if (!stats.has(catUpper)) {
          stats.set(catUpper, new Map());
        }
        
        const dayMap = stats.get(catUpper)!;
        // Since these are aggregated from a whole guard, we ADD the count
        dayMap.set(statsDay, (dayMap.get(statsDay) || 0) + count);
      });
    }
  });

  return stats;
}

/**
 * Aggregates a list of reports into a simple Category -> Count map.
 * Useful for the daily final report.
 */
export function calculateDayStats(
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
    const reportCategories = getReportCategories(report, template, config, predefinedValues);
    
    reportCategories.forEach(category => {
      stats.set(category, (stats.get(category) || 0) + 1);
    });
  });

  return stats;
}

/**
 * Formats a stats map into a readable string for the final report.
 */
export function formatDayStats(stats: Map<string, number>): string {
  if (stats.size === 0) return '';
  
  return Array.from(stats.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, count]) => {
      // Extract the label part (without the code)
      const labelPart = category.replace(/^[\d.]+\s*/, '');
      
      // Heuristic for sub-items: starts with a preposition indicating sub-classification
      const subPrepositions = ['EN ', 'DE ', 'POR ', 'AL ', 'A ', 'CON ', 'PARA ', 'HACIA ', 'DURANTE '];
      const isSub = subPrepositions.some(p => labelPart.toUpperCase().startsWith(p));
      
      // Clean and format the category
      let cleanCategory = labelPart.toLowerCase();
      
      // Capitalize first letter
      if (cleanCategory.length > 0) {
        cleanCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);
      }
      
      const displayCount = count < 10 ? `0${count}` : String(count);
      const prefix = isSub ? '\t- ' : '- ';
      return `${prefix}${cleanCategory} ${displayCount}`;
    })
    .join('\n');
}

