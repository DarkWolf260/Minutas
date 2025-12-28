import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: React.ReactNode;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
}

export const StatCard = React.memo(function StatCard({ title, value, subtitle, icon, change, trend }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
                {change !== undefined && trend && (
                    <p
                        className={cn(
                            'text-xs flex items-center gap-1 mt-1',
                            trend === 'up' && 'text-green-600',
                            trend === 'down' && 'text-red-600',
                            trend === 'neutral' && 'text-muted-foreground'
                        )}
                    >
                        {trend === 'up' && '↑'}
                        {trend === 'down' && '↓'}
                        {trend === 'neutral' && '→'}
                        <span>{Math.abs(change)}%</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
});
