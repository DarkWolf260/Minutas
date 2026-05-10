
import { Department, StaffRole } from '@/lib/types';
import { LEADER_ROLES, OPERATIONAL_ROLES, SPECIAL_ROLES, STATUS_ROLES } from './roles';
import { DEPARTMENT_IDS, DEPARTMENT_NAMES } from './departments';

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: DEPARTMENT_IDS.OPERATIONS, name: DEPARTMENT_NAMES.OPERATIONS, staff: {}, order: 0 },
  { id: DEPARTMENT_IDS.EDUCATION, name: DEPARTMENT_NAMES.EDUCATION, staff: {}, order: 1 },
  { id: DEPARTMENT_IDS.RISKS, name: DEPARTMENT_NAMES.RISKS, staff: {}, order: 2 },
  { id: DEPARTMENT_IDS.LOGISTICS, name: DEPARTMENT_NAMES.LOGISTICS, staff: {}, order: 3 },
];

export const EXTENDED_DEPARTMENTS: Department[] = [
  ...DEFAULT_DEPARTMENTS,
  { id: DEPARTMENT_IDS.CEMUPRAD, name: DEPARTMENT_NAMES.CEMUPRAD, staff: {}, order: 4 },
  { id: DEPARTMENT_IDS.IT, name: DEPARTMENT_NAMES.IT, staff: {}, order: 5 },
];

export const DEFAULT_ROLES: StaffRole[] = [
  // Globales
  { name: LEADER_ROLES.DIRECTOR, is_single: true, department_scope: [], order: 0, hierarchy_order: 0 },

  // Operaciones
  { name: LEADER_ROLES.JEFE_OPERACIONES, is_single: true, department_scope: [DEPARTMENT_IDS.OPERATIONS], order: 1, hierarchy_order: 1 },
  { name: LEADER_ROLES.JEFE_SERVICIOS, is_single: true, department_scope: [DEPARTMENT_IDS.OPERATIONS], order: 2, hierarchy_order: 2 },
  { name: OPERATIONAL_ROLES.OPERADOR_RADIO, is_single: false, department_scope: [DEPARTMENT_IDS.OPERATIONS], order: 11, hierarchy_order: 11 },
  { name: OPERATIONAL_ROLES.TECNICO, is_single: false, department_scope: [DEPARTMENT_IDS.OPERATIONS], order: 12, hierarchy_order: 12 },
  { name: OPERATIONAL_ROLES.AUXILIAR, is_single: false, department_scope: [DEPARTMENT_IDS.OPERATIONS], order: 13, hierarchy_order: 13 },
  { name: OPERATIONAL_ROLES.CONDUCTOR, is_single: false, department_scope: [DEPARTMENT_IDS.OPERATIONS], order: 14, hierarchy_order: 14 },

  // Jefaturas Departamentales
  { name: SPECIAL_ROLES.JEFE_EDUCACION, is_single: true, department_scope: [DEPARTMENT_IDS.EDUCATION], order: 4, hierarchy_order: 4, is_hidden: true },
  { name: SPECIAL_ROLES.JEFE_RIESGOS, is_single: true, department_scope: [DEPARTMENT_IDS.RISKS], order: 5, hierarchy_order: 5, is_hidden: true },
  { name: SPECIAL_ROLES.JEFE_LOGISTICA, is_single: true, department_scope: [DEPARTMENT_IDS.LOGISTICS], order: 7, hierarchy_order: 7, is_hidden: true },

  // Estatus (Especiales)
  { name: STATUS_ROLES.REPOSO, is_single: false, department_scope: [], is_status: true, order: 100, hierarchy_order: 100 },
  { name: STATUS_ROLES.PERMISO, is_single: false, department_scope: [], is_status: true, order: 101, hierarchy_order: 101 },
  { name: STATUS_ROLES.VACACIONES, is_single: false, department_scope: [], is_status: true, order: 102, hierarchy_order: 102 },
  { name: STATUS_ROLES.AUSENTE, is_single: false, department_scope: [], is_status: true, order: 103, hierarchy_order: 103 },
  { name: STATUS_ROLES.APOYO, is_single: false, department_scope: [], is_status: true, order: 104, hierarchy_order: 104 },
];

export const EXTENDED_ROLES: StaffRole[] = [
  ...DEFAULT_ROLES,
  { name: SPECIAL_ROLES.JEFE_CEMUPRAD, is_single: true, department_scope: [DEPARTMENT_IDS.CEMUPRAD], order: 3, hierarchy_order: 3, is_hidden: true },
  { name: SPECIAL_ROLES.ANALISTA_CEMUPRAD, is_single: false, department_scope: [DEPARTMENT_IDS.CEMUPRAD], order: 8, hierarchy_order: 8 },
  { name: SPECIAL_ROLES.AUXILIAR_CEMUPRAD, is_single: false, department_scope: [DEPARTMENT_IDS.CEMUPRAD], order: 9, hierarchy_order: 9 },
  { name: SPECIAL_ROLES.JEFE_INFORMATICA, is_single: true, department_scope: [DEPARTMENT_IDS.IT], order: 6, hierarchy_order: 6, is_hidden: true },
];

