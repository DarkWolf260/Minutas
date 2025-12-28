'use client';

import { useStats } from '@/hooks/use-stats';
import { StatCard } from '@/components/stats/stat-card';
import dynamic from 'next/dynamic';

// Lazy load del gráfico pesado (Recharts)
const ReportsChart = dynamic(() => import('@/components/stats/reports-chart').then(mod => ({ default: mod.ReportsChart })), {
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded-lg" />,
    ssr: false
});
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Layout, MapPin, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns/format';
import { es } from 'date-fns/locale/es';
import { Progress } from '@/components/ui/progress';

export default function EstadisticasPage() {
    const stats = useStats();

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Estadísticas</h1>
                <p className="text-muted-foreground">Métricas y análisis de tu actividad</p>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Reportes"
                    value={stats.totalReports}
                    subtitle="Reportes creados"
                    icon={<FileText className="h-4 w-4" />}
                />
                <StatCard
                    title="Plantillas Activas"
                    value={stats.activeTemplates}
                    subtitle={`de ${stats.totalTemplates} totales`}
                    icon={<Layout className="h-4 w-4" />}
                />
                <StatCard
                    title="Direcciones"
                    value={stats.totalAddresses}
                    subtitle="Ubicaciones guardadas"
                    icon={<MapPin className="h-4 w-4" />}
                />
                <StatCard
                    title="Promedio/Día"
                    value={stats.averagePerDay}
                    subtitle="Reportes por día"
                    icon={<TrendingUp className="h-4 w-4" />}
                />
            </div>

            {/* Gráfico de actividad */}
            <Card>
                <CardHeader>
                    <CardTitle>Actividad Semanal</CardTitle>
                    <CardDescription>Reportes creados en los últimos 7 días</CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportsChart data={stats.reportsByDay} />
                </CardContent>
            </Card>

            {/* Detalles adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Plantillas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Plantillas</CardTitle>
                        <CardDescription>Plantillas más utilizadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.topTemplates.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topTemplates.map((template, index) => {
                                    const maxCount = stats.topTemplates[0]?.count || 1;
                                    const percentage = (template.count / maxCount) * 100;

                                    return (
                                        <div key={template.id} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-muted-foreground">#{index + 1}</span>
                                                    <span className="font-medium">{template.name}</span>
                                                </div>
                                                <Badge variant="secondary">{template.count}</Badge>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay datos de plantillas
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Actividad Reciente */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>Últimos reportes creados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.recentReports.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentReports.map((report) => {
                                    let formattedDate = 'Fecha no disponible';
                                    if (report.timestamp) {
                                        try {
                                            formattedDate = format(new Date(report.timestamp), "d 'de' MMMM, yyyy", { locale: es });
                                        } catch (error) {
                                            console.warn('Invalid timestamp for report:', report.id);
                                        }
                                    }

                                    return (
                                        <div key={report.id} className="flex items-start gap-3">
                                            <div className="rounded-full bg-primary/10 p-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {report.templateName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    <Clock className="inline h-3 w-3 mr-1" />
                                                    {formattedDate}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay reportes recientes
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
