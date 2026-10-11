/**
 * Role-related constants for the Minutas application
 */

export const LEADER_ROLES = {
  DIRECTOR: 'Director',
  JEFE_OPERACIONES: 'Jefe de Operaciones',
  JEFE_DEPARTAMENTO: 'Jefe de Departamento',
  JEFE_SERVICIOS: 'Jefe de los Servicios',
} as const;

export const OPERATIONAL_ROLES = {
  OPERADOR_RADIO: 'Operador de radio',
  TECNICO: 'Técnico',
  AUXILIAR: 'Auxiliar',
  CONDUCTOR: 'Conductor',
} as const;

export const SPECIAL_ROLES = {
  JEFE_SALA_MONITOREO: 'Jefe de Sala de Monitoreo',
  ANALISTA_SALA_MONITOREO: 'Analista de Sala de Monitoreo',
  AUXILIAR_SALA_MONITOREO: 'Auxiliar de Sala de Monitoreo',
  JEFE_EDUCACION: 'Jefe de Educación',
  JEFE_RIESGOS: 'Jefe de Gestión de Riesgos',
  JEFE_INFORMATICA: 'Jefe de Informática',
  JEFE_LOGISTICA: 'Jefe de Logística',
} as const;

export const STATUS_ROLES = {
  REPOSO: 'Reposo',
  PERMISO: 'Permiso',
  VACACIONES: 'Vacaciones',
  AUSENTE: 'Ausente',
  APOYO: 'Apoyo',
} as const;
