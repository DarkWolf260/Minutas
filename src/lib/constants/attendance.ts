import { CheckCircle2, Clock, XCircle, CalendarCheck } from 'lucide-react';
import type { AttendanceStatus } from '@/lib/types';

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, {
  label: string;
  icon: any;
  color: string;
}> = {
  presente: {
    label: 'Presente',
    icon: CheckCircle2,
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  tarde: {
    label: 'Tarde',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  ausente: {
    label: 'Ausente',
    icon: XCircle,
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  permiso: {
    label: 'Permiso',
    icon: CalendarCheck,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
};
