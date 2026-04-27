
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
  { name: LEADER_ROLES.DIRECTOR, isSingle: true, departmentScope: [], order: 0, hierarchyOrder: 0 },

  // Operaciones
  { name: LEADER_ROLES.JEFE_OPERACIONES, isSingle: true, departmentScope: [DEPARTMENT_IDS.OPERATIONS], order: 1, hierarchyOrder: 1 },
  { name: LEADER_ROLES.JEFE_SERVICIOS, isSingle: true, departmentScope: [DEPARTMENT_IDS.OPERATIONS], order: 2, hierarchyOrder: 2 },
  { name: OPERATIONAL_ROLES.OPERADOR_RADIO, isSingle: false, departmentScope: [DEPARTMENT_IDS.OPERATIONS], order: 11, hierarchyOrder: 11 },
  { name: OPERATIONAL_ROLES.TECNICO, isSingle: false, departmentScope: [DEPARTMENT_IDS.OPERATIONS], order: 12, hierarchyOrder: 12 },
  { name: OPERATIONAL_ROLES.AUXILIAR, isSingle: false, departmentScope: [DEPARTMENT_IDS.OPERATIONS], order: 13, hierarchyOrder: 13 },
  { name: OPERATIONAL_ROLES.CONDUCTOR, isSingle: false, departmentScope: [DEPARTMENT_IDS.OPERATIONS], order: 14, hierarchyOrder: 14 },

  // Jefaturas Departamentales
  { name: SPECIAL_ROLES.JEFE_EDUCACION, isSingle: true, departmentScope: [DEPARTMENT_IDS.EDUCATION], order: 4, hierarchyOrder: 4, isHidden: true },
  { name: SPECIAL_ROLES.JEFE_RIESGOS, isSingle: true, departmentScope: [DEPARTMENT_IDS.RISKS], order: 5, hierarchyOrder: 5, isHidden: true },
  { name: SPECIAL_ROLES.JEFE_LOGISTICA, isSingle: true, departmentScope: [DEPARTMENT_IDS.LOGISTICS], order: 7, hierarchyOrder: 7, isHidden: true },

  // Estatus (Especiales)
  { name: STATUS_ROLES.REPOSO, isSingle: false, departmentScope: [], isStatus: true, order: 100, hierarchyOrder: 100 },
  { name: STATUS_ROLES.PERMISO, isSingle: false, departmentScope: [], isStatus: true, order: 101, hierarchyOrder: 101 },
  { name: STATUS_ROLES.VACACIONES, isSingle: false, departmentScope: [], isStatus: true, order: 102, hierarchyOrder: 102 },
  { name: STATUS_ROLES.AUSENTE, isSingle: false, departmentScope: [], isStatus: true, order: 103, hierarchyOrder: 103 },
  { name: STATUS_ROLES.APOYO, isSingle: false, departmentScope: [], isStatus: true, order: 104, hierarchyOrder: 104 },
];

export const EXTENDED_ROLES: StaffRole[] = [
  ...DEFAULT_ROLES,
  { name: SPECIAL_ROLES.JEFE_CEMUPRAD, isSingle: true, departmentScope: [DEPARTMENT_IDS.CEMUPRAD], order: 3, hierarchyOrder: 3, isHidden: true },
  { name: SPECIAL_ROLES.ANALISTA_CEMUPRAD, isSingle: false, departmentScope: [DEPARTMENT_IDS.CEMUPRAD], order: 8, hierarchyOrder: 8 },
  { name: SPECIAL_ROLES.AUXILIAR_CEMUPRAD, isSingle: false, departmentScope: [DEPARTMENT_IDS.CEMUPRAD], order: 9, hierarchyOrder: 9 },
  { name: SPECIAL_ROLES.JEFE_INFORMATICA, isSingle: true, departmentScope: [DEPARTMENT_IDS.IT], order: 6, hierarchyOrder: 6, isHidden: true },
];
