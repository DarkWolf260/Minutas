/**
 * Department-related constants and utilities for the Minutas application
 */

/**
 * Generates a clean URL/identifier slug for a department based on its name.
 * Normalizes diacritics, strips common prefixes like "Departamento de ", and converts spaces to hyphens.
 *
 * @example
 * generateDepartmentId('Departamento de Operaciones') // "operaciones"
 * generateDepartmentId('Sala de Monitoreo')          // "sala-de-monitoreo"
 * generateDepartmentId('Departamento de Educación')   // "educacion"
 */
export function generateDepartmentId(name: string): string {
  if (!name || !name.trim()) return 'dept';

  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Try stripping common department prefixes first for cleaner slugs
  const withoutPrefix = normalized
    .replace(/^(?:departamento|dpto\.?|depto\.?)\s+(?:de\s+|del\s+)?/i, '')
    .trim();

  const target = withoutPrefix.length > 0 ? withoutPrefix : normalized;

  const slug = target
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'dept';
}

/**
 * Generates a unique department ID ensuring no collisions with existing departments.
 */
export function generateUniqueDepartmentId(
  name: string,
  existingDeptsOrIds?: (string | { id: string })[]
): string {
  const base = generateDepartmentId(name);
  if (!existingDeptsOrIds || existingDeptsOrIds.length === 0) return base;

  const idSet = new Set(
    existingDeptsOrIds.map((item) => (typeof item === 'string' ? item : item.id).toLowerCase())
  );

  if (!idSet.has(base.toLowerCase())) return base;

  let counter = 2;
  while (idSet.has(`${base}-${counter}`.toLowerCase())) {
    counter++;
  }
  return `${base}-${counter}`;
}

export const DEPARTMENT_NAMES = {
  OPERATIONS: 'Departamento de Operaciones',
  SALA_MONITOREO: 'Sala de Monitoreo',
  CEMUPRAD: 'Sala de Monitoreo',
  EDUCATION: 'Departamento de Educación',
  RISKS: 'Departamento de Gestión de Riesgos',
  IT: 'Departamento de Informática',
  LOGISTICS: 'Departamento de Logística',
} as const;

export const DEPARTMENT_IDS = {
  OPERATIONS: generateDepartmentId(DEPARTMENT_NAMES.OPERATIONS),
  SALA_MONITOREO: generateDepartmentId(DEPARTMENT_NAMES.SALA_MONITOREO),
  CEMUPRAD: generateDepartmentId(DEPARTMENT_NAMES.SALA_MONITOREO),
  EDUCATION: generateDepartmentId(DEPARTMENT_NAMES.EDUCATION),
  RISKS: generateDepartmentId(DEPARTMENT_NAMES.RISKS),
  IT: generateDepartmentId(DEPARTMENT_NAMES.IT),
  LOGISTICS: generateDepartmentId(DEPARTMENT_NAMES.LOGISTICS),
} as const;

