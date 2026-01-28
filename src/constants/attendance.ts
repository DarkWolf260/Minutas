/**
 * Attendance-related constants and configuration for the Minutas application
 */

import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

export const ATTENDANCE_STATUS = {
  PRESENTE: 'presente',
  TARDE: 'tarde',
  PERMISO: 'permiso',
  AUSENTE: 'ausente',
} as const;

export const ATTENDANCE_STATUS_CONFIG = {
  [ATTENDANCE_STATUS.PRESENTE]: {
    label: 'Presente',
    icon: CheckCircle2,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  [ATTENDANCE_STATUS.TARDE]: {
    label: 'Tarde',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  [ATTENDANCE_STATUS.PERMISO]: {
    label: 'Permiso',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  [ATTENDANCE_STATUS.AUSENTE]: {
    label: 'Ausente',
    icon: XCircle,
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
};
