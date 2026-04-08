/**
 * Role-related constants for the Minutas application
 */

export const LEADER_ROLES = {
  DIRECTOR: 'Director',
  JEFE_OPERACIONES: 'Jefe de Operaciones',
  JEFE_DEPARTAMENTO: 'Jefe de Departamento',
} as const;

export const DEFAULT_ROLES = [
  { name: LEADER_ROLES.DIRECTOR, isSingle: true, departmentScope: [], isHidden: false },
  {
    name: LEADER_ROLES.JEFE_OPERACIONES,
    isSingle: true,
    departmentScope: ['OPERATIONS'],
    isHidden: false,
  },
  {
    name: 'Auxiliar de CEMUPRAD',
    isSingle: false,
    departmentScope: ['CEMUPRAD'],
    isHidden: false,
  },
];
