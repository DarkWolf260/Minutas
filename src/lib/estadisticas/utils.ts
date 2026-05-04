import { DEFAULT_STATISTICS_CATEGORIES } from '@/lib/constants/statistics';
import type { TemplateConfig } from '@/lib/types';

/**
 * Normaliza una cadena para comparación (minúsculas, solo alfanuméricos, sin acentos).
 */
export function normalizarParaComp(s: any): string {
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
export function normalizarCategoria(rawCat: string): string {
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
export function resolverClavesInterpolacion(name: string, config?: TemplateConfig): Set<string> {
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
export function buscarValores(obj: any, targetKeys: Set<string>): any[] {
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
