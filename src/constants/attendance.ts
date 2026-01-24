/**
 * Attendance-related constants and configuration for the Minutas application
 */

import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

export const ATTENDANCE_STATUS_CONFIG = {
    presente: {
        label: 'Presente',
        icon: CheckCircle2,
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    tarde: {
        label: 'Tarde',
        icon: Clock,
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    },
    permiso: {
        label: 'Permiso',
        icon: FileText,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    ausente: {
        label: 'Ausente',
        icon: XCircle,
        color: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
    },
};
