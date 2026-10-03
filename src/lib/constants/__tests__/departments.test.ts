import { describe, it, expect } from 'vitest';
import {
  generateDepartmentId,
  generateUniqueDepartmentId,
  DEPARTMENT_NAMES,
  DEPARTMENT_IDS,
} from '../departments';

describe('Department ID Generator', () => {
  it('generates clean slug IDs removing common prefixes and accents', () => {
    expect(generateDepartmentId('Departamento de Operaciones')).toBe('operaciones');
    expect(generateDepartmentId('Sala de Monitoreo')).toBe('sala-de-monitoreo');
    expect(generateDepartmentId('CEMUPRAD')).toBe('cemuprad');
    expect(generateDepartmentId('Departamento de Educación')).toBe('educacion');
    expect(generateDepartmentId('Departamento de Gestión de Riesgos')).toBe('gestion-de-riesgos');
    expect(generateDepartmentId('Departamento de Informática')).toBe('informatica');
    expect(generateDepartmentId('Departamento de Logística')).toBe('logistica');
  });

  it('handles variations like Dpto., Depto., or without prefix', () => {
    expect(generateDepartmentId('Dpto. de Mantenimiento')).toBe('mantenimiento');
    expect(generateDepartmentId('Depto. de Seguridad')).toBe('seguridad');
    expect(generateDepartmentId('Recursos Humanos')).toBe('recursos-humanos');
    expect(generateDepartmentId('Área Técnica')).toBe('area-tecnica');
  });

  it('handles edge cases gracefully', () => {
    expect(generateDepartmentId('')).toBe('dept');
    expect(generateDepartmentId('   ')).toBe('dept');
    expect(generateDepartmentId('Departamento')).toBe('departamento');
    expect(generateDepartmentId('---')).toBe('dept');
  });

  it('ensures uniqueness when collisions exist', () => {
    const existing = [
      { id: 'operaciones' },
      { id: 'operaciones-2' },
      { id: 'logistica' },
    ];

    expect(generateUniqueDepartmentId('Departamento de Operaciones', existing)).toBe('operaciones-3');
    expect(generateUniqueDepartmentId('Departamento de Educación', existing)).toBe('educacion');
    expect(generateUniqueDepartmentId('Departamento de Logística', ['logistica'])).toBe('logistica-2');
  });

  it('matches DEPARTMENT_IDS to generated slugs from DEPARTMENT_NAMES', () => {
    expect(DEPARTMENT_IDS.OPERATIONS).toBe('operaciones');
    expect(DEPARTMENT_IDS.SALA_MONITOREO).toBe('sala-de-monitoreo');
    expect(DEPARTMENT_IDS.EDUCATION).toBe('educacion');
    expect(DEPARTMENT_IDS.RISKS).toBe('gestion-de-riesgos');
    expect(DEPARTMENT_IDS.IT).toBe('informatica');
    expect(DEPARTMENT_IDS.LOGISTICS).toBe('logistica');
  });
});
