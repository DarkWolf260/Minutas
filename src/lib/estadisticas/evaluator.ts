import type { TemplateConfig } from '@/lib/types';
import { normalizarParaComp, resolverClavesInterpolacion, buscarValores } from './utils';

/**
 * Evalúa si un valor cumple con una condición específica.
 */
export function evaluarCondicion(
  item: any,
  fieldConfig: any,
  originalCondition: string,
  operator: string = '=',
  form_data: any = {},
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
        const foundValues = buscarValores(form_data, keysToMatch);

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

