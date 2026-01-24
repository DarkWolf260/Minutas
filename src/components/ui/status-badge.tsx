/**
 * StatusBadge - Reusable status badge component
 * Displays personnel and attendance status with consistent styling
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PersonnelStatus, AttendanceStatus } from '@/types';
import { STATUS_OPTIONS } from '@/constants/personnel';
import { ATTENDANCE_STATUS_CONFIG } from '@/constants/attendance';

interface StatusBadgeProps {
    status: PersonnelStatus | AttendanceStatus;
    variant?: 'default' | 'compact';
    className?: string;
}

export const StatusBadge = React.memo(function StatusBadge({
    status,
    variant = 'default',
    className
}: StatusBadgeProps) {
    // Try personnel status first
    const personnelStatus = STATUS_OPTIONS.find(s => s.value === status);

    if (personnelStatus) {
        return (
            <Badge
                variant="outline"
                className={cn(
                    personnelStatus.color,
                    variant === 'compact' ? 'text-[10px] px-2 py-0.5' : 'text-xs',
                    className
                )}
            >
                {personnelStatus.label}
            </Badge>
        );
    }

    // Try attendance status
    const attendanceStatus = ATTENDANCE_STATUS_CONFIG[status as keyof typeof ATTENDANCE_STATUS_CONFIG];

    if (attendanceStatus) {
        const Icon = attendanceStatus.icon;
        return (
            <Badge
                variant="outline"
                className={cn(
                    attendanceStatus.color,
                    variant === 'compact' ? 'text-[10px] px-2 py-0.5' : 'text-xs',
                    'flex items-center gap-1',
                    className
                )}
            >
                {variant === 'default' && <Icon className="h-3 w-3" />}
                {attendanceStatus.label}
            </Badge>
        );
    }

    // Fallback
    return (
        <Badge variant="outline" className={cn('text-xs', className)}>
            {status}
        </Badge>
    );
});
