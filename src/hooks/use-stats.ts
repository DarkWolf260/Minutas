'use client';

import { useMemo } from 'react';
import { useReports } from './use-reports';
import { useTemplates } from './use-templates';
import { useAddresses } from './use-addresses';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { subDays } from 'date-fns/subDays';
import { es } from 'date-fns/locale';

export function useStats() {
    const { reports } = useReports();
    const { templates } = useTemplates();
    const { addresses } = useAddresses();

    const stats = useMemo(() => {
        // Total reportes
        const totalReports = reports.length;

        // Reportes por plantilla
        const reportsByTemplate: Record<string, number> = {};
        reports.forEach(report => {
            const templateId = report.templateId;
            if (templateId) {
                reportsByTemplate[templateId] = (reportsByTemplate[templateId] || 0) + 1;
            }
        });

        // Reportes por mes (últimos 6 meses)
        const reportsByMonth: Record<string, number> = {};
        reports.forEach(report => {
            if (report.timestamp) {
                try {
                    const month = format(new Date(report.timestamp), 'MMM yyyy', { locale: es });
                    reportsByMonth[month] = (reportsByMonth[month] || 0) + 1;
                } catch (error) {
                    console.warn('Invalid timestamp for report:', report.id);
                }
            }
        });

        // Reportes por día de la semana (últimos 7 días)
        const last7Days = eachDayOfInterval({
            start: subDays(new Date(), 6),
            end: new Date()
        });

        const reportsByDay = last7Days.map(day => {
            const dayKey = format(day, 'EEE', { locale: es });
            const dayFull = format(day, 'yyyy-MM-dd');
            const count = reports.filter(r => {
                if (!r.timestamp) return false;
                try {
                    const reportDate = format(new Date(r.timestamp), 'yyyy-MM-dd');
                    return reportDate === dayFull;
                } catch (error) {
                    return false;
                }
            }).length;

            return {
                day: dayKey,
                reportes: count
            };
        });

        // Top plantilla más usada
        const templateEntries = Object.entries(reportsByTemplate);
        const topTemplateEntry = templateEntries.length > 0
            ? templateEntries.sort(([, a], [, b]) => b - a)[0]
            : null;

        const topTemplate = topTemplateEntry
            ? {
                id: topTemplateEntry[0],
                count: topTemplateEntry[1],
                name: templates.find(t => t.id === topTemplateEntry[0])?.name || 'Desconocida'
            }
            : null;

        // Top 5 plantillas
        const topTemplates = templateEntries
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id, count]) => ({
                id,
                name: templates.find(t => t.id === id)?.name || 'Desconocida',
                count
            }));

        // Promedio de reportes por día
        const validReports = reports.filter(r => r.timestamp);
        const daysWithReports = new Set(
            validReports.map(r => {
                try {
                    return format(new Date(r.timestamp), 'yyyy-MM-dd');
                } catch (error) {
                    return '';
                }
            }).filter(d => d !== '')
        ).size;
        const averagePerDay = daysWithReports > 0 ? (validReports.length / daysWithReports).toFixed(1) : '0';

        // Reportes recientes (últimos 5)
        const recentReports = [...reports]
            .filter(r => r.timestamp)
            .sort((a, b) => {
                try {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                } catch (error) {
                    return 0;
                }
            })
            .slice(0, 5)
            .map(report => ({
                ...report,
                templateName: templates.find(t => t.id === report.templateId)?.name || 'Sin plantilla'
            }));

        return {
            totalReports,
            reportsByTemplate,
            reportsByMonth,
            reportsByDay,
            topTemplate,
            topTemplates,
            totalTemplates: templates.length,
            activeTemplates: templates.filter(t => t.isActive).length,
            inactiveTemplates: templates.filter(t => !t.isActive).length,
            totalAddresses: addresses.length,
            averagePerDay,
            recentReports
        };
    }, [reports, templates, addresses]);

    return stats;
}
