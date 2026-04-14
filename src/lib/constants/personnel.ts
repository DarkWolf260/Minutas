import { STATUS_ROLES } from './roles';

export const RANK_OPTIONS = [
  { value: 'OPC', label: 'OPC' },
  { value: 'OPC I', label: 'OPC I' },
  { value: 'OPC II', label: 'OPC II' },
  { value: 'OPC III', label: 'OPC III' },
  { value: 'OSPC I', label: 'OSPC I' },
  { value: 'OSPC II', label: 'OSPC II' },
  { value: 'OSPC III', label: 'OSPC III' },
  { value: 'OCPC I', label: 'OCPC I' },
  { value: 'OCPC II', label: 'OCPC II' },
  { value: 'Voluntario', label: 'Voluntario' },
  { value: 'Sin jerarquía', label: 'Sin jerarquía' },
];

export const PERSONNEL_STATUS = {
  ACTIVO: 'activo',
  VACACIONES: STATUS_ROLES.VACACIONES,
  PERMISO: STATUS_ROLES.PERMISO,
  REPOSO: STATUS_ROLES.REPOSO,
  AUSENTE: STATUS_ROLES.AUSENTE,
} as const;

export const STATUS_OPTIONS = [
  {
    value: PERSONNEL_STATUS.ACTIVO,
    label: 'Activo',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  {
    value: PERSONNEL_STATUS.VACACIONES,
    label: 'Vacaciones',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  {
    value: PERSONNEL_STATUS.PERMISO,
    label: 'Permiso',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  {
    value: PERSONNEL_STATUS.REPOSO,
    label: 'Reposo',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  {
    value: PERSONNEL_STATUS.AUSENTE,
    label: 'Ausente',
    color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  },
];

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];
