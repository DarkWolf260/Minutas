/**
 * Role-related constants for the Minutas application
 */

export const LEADER_ROLES = {
  DIRECTOR: 'Director',
  JEFE_OPERACIONES: 'Jefe de Operaciones',
} as const;

export const DEFAULT_ROLES = [
  { name: LEADER_ROLES.DIRECTOR, isSingle: true, departmentScope: [], isHidden: false },
  {
    name: LEADER_ROLES.JEFE_OPERACIONES,
    isSingle: true,
    departmentScope: ['OPERATIONS'],
    isHidden: false,
  },
];
