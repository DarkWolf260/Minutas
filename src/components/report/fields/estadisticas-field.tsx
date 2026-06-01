import React, { useState } from 'react';
import {
    form_dataValue,
} from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { createReportRepository } from '@/lib/repositories';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { calcularEstadisticasDia, formatearEstadisticasDia } from '@/lib/estadisticas-utils';
import { findValueInform_data, getReportDateTime } from '@/lib/report-sorter';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/custom/responsive-modal';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EstadisticasFieldProps {
    value: form_dataValue;
    onChange: (value: form_dataValue) => void;
    disabled?: boolean;
    className?: string;
}

export const EstadisticasField = ({ value, onChange, disabled, className }: EstadisticasFieldProps) => {
    const db = useDatabase();
    const { currentWorkspace, isCloud } = useWorkspaceManager();
    const { activeGuard } = useActiveGuard();
    const { definitions } = useFieldDefinitions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startDateStr, setStartDateStr] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [endDateStr, setEndDateStr] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("08:00");

    const handleCalculate = async () => {
        setIsModalOpen(true);
    };

    const handleConfirmCalculate = async () => {
        setIsModalOpen(false);

        if (!db || !currentWorkspace) {
            toast.error('Base de datos no disponible.');
            return;
        }

        toast.loading('Calculando estadísticas...', { id: 'calc-stats' });

        try {
            const repo = createReportRepository(db, currentWorkspace, isCloud);
            const allReports = await repo.findAll();

            // Filter reports
            const currentGuardId = activeGuard?.id;
            const reportesFinalizados = allReports.filter((report) => {
                if (report.status !== 'Finalizado') return false;
                if (currentGuardId) {
                    const reportGuard = findValueInform_data(report.form_data, 'Guardia');
                    if (reportGuard && String(reportGuard).trim().toUpperCase() !== String(currentGuardId).trim().toUpperCase()) {
                        return false;
                    }
                }

                // Filter by date & time range if provided
                if (startDateStr || endDateStr) {
                    let reportDate = getReportDateTime(report);
                    if (!reportDate) {
                        reportDate = report.timestamp ? new Date(report.timestamp) : null;
                    }
                    if (!reportDate || isNaN(reportDate.getTime())) return false;

                    // Construct start boundary (local)
                    let startBoundary: Date | null = null;
                    if (startDateStr) {
                        const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
                        const [sHours, sMinutes] = startTime.split(':').map(Number);
                        startBoundary = new Date(sYear!, sMonth! - 1, sDay!, sHours ?? 0, sMinutes ?? 0, 0, 0);
                    }

                    // Construct end boundary (local)
                    let endBoundary: Date | null = null;
                    if (endDateStr) {
                        const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
                        const [eHours, eMinutes] = endTime.split(':').map(Number);
                        endBoundary = new Date(eYear!, eMonth! - 1, eDay!, eHours ?? 23, eMinutes ?? 59, 59, 999);
                    }

                    if (startBoundary && reportDate < startBoundary) return false;
                    if (endBoundary && reportDate > endBoundary) return false;
                }

                return true;
            });

            if (reportesFinalizados.length === 0) {
                toast.error('No hay reportes finalizados en el rango seleccionado para calcular estadísticas.', { id: 'calc-stats' });
                return;
            }

            // Fetch templates and configs directly from DB to avoid reactive hooks
            const templatesDocs = await db.templates.find({
                selector: {
                    $or: [
                        { workspace_id: currentWorkspace },
                        { workspace_id: null }
                    ]
                }
            }).exec();
            const templates = templatesDocs.map(doc => doc.toJSON());

            const configsDocs = await db.configs.find({
                selector: {
                    workspace_id: currentWorkspace,
                    type: 'template_config'
                }
            }).exec();
            const configs = configsDocs.map(doc => doc.toJSON());

            // Build configs map as in useTemplates
            const configsMap = configs.reduce((acc: any, config: any) => {
                acc[config.name || ''] = config.data;
                return acc;
            }, {});

            // Build configuracionesGlobales
            const settingsMap: Record<string, string> = {};
            Object.keys(definitions).forEach((key) => {
                if (definitions[key]?.value) {
                    settingsMap[key] = definitions[key]!.value!;
                }
            });

            const configuracionesGlobales = Object.values(configsMap).reduce(
                (acc: any, configData: any) => {
                    if (configData && configData.fields) {
                        Object.keys(configData.fields).forEach((fieldName) => {
                            const field = configData.fields[fieldName];
                            if (field && field.type === 'predefined' && field.value) {
                                acc[fieldName] = field.value;
                            }
                        });
                    }
                    return acc;
                },
                settingsMap
            );

            const dayStats = calcularEstadisticasDia(reportesFinalizados, templates as any, configsMap, configuracionesGlobales as any);
            const formateado = formatearEstadisticasDia(dayStats);

            if (formateado) {
                onChange(formateado);
                toast.success('Estadísticas calculadas correctamente.', { id: 'calc-stats' });
            } else {
                toast.info('No se encontraron categorías estadísticas en los reportes de las fechas seleccionadas.', { id: 'calc-stats' });
            }
        } catch (error) {
            console.error('Error calculating stats:', error);
            toast.error('Error al calcular estadísticas.', { id: 'calc-stats' });
        }
    };

    return (
        <div className="relative">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalculate}
                disabled={disabled}
                className="absolute -top-8 right-0 h-7 text-xs font-bold gap-1.5 border-orange-700 text-orange-700 hover:bg-gray-300 hover:text-orange-700 hover:border-orange-700 transition-colors"
                title="Calcular estadísticas del día"
            >
                <Clock className="h-3.5 w-3.5 mr-1" />
                Actualizar
            </Button>
            <Textarea
                value={String(value || '')}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Las estadísticas se generarán al presionar el botón..."
                rows={8}
                className={`min-h-[160px] ${className || ''}`}
            />

            <ResponsiveModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                title="Seleccionar Rango de Fechas y Horas"
                description="Selecciona el rango de fechas y horas para calcular las estadísticas de los reportes de guardia."
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmCalculate}
                        >
                            Calcular
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha de Inicio</label>
                        <DatePicker value={startDateStr} onChange={setStartDateStr} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hora de Inicio</label>
                        <input
                            type="text"
                            placeholder="08:00"
                            value={startTime}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                                let formatted = digits;
                                if (digits.length > 2) {
                                    formatted = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
                                }
                                setStartTime(formatted);
                            }}
                            onBlur={() => {
                                const digits = startTime.replace(/\D/g, '');
                                if (!digits) return;
                                let hours = parseInt(digits.slice(0, 2), 10);
                                let minutes = parseInt(digits.slice(2, 4), 10);
                                if (isNaN(hours)) hours = 8;
                                if (hours > 23) hours = 23;
                                if (isNaN(minutes)) minutes = 0;
                                if (minutes > 59) minutes = 59;
                                const formattedHours = String(hours).padStart(2, '0');
                                const formattedMinutes = String(minutes).padStart(2, '0');
                                setStartTime(`${formattedHours}:${formattedMinutes}`);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha de Fin</label>
                        <DatePicker value={endDateStr} onChange={setEndDateStr} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hora de Fin</label>
                        <input
                            type="text"
                            placeholder="08:00"
                            value={endTime}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                                let formatted = digits;
                                if (digits.length > 2) {
                                    formatted = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
                                }
                                setEndTime(formatted);
                            }}
                            onBlur={() => {
                                const digits = endTime.replace(/\D/g, '');
                                if (!digits) return;
                                let hours = parseInt(digits.slice(0, 2), 10);
                                let minutes = parseInt(digits.slice(2, 4), 10);
                                if (isNaN(hours)) hours = 8;
                                if (hours > 23) hours = 23;
                                if (isNaN(minutes)) minutes = 0;
                                if (minutes > 59) minutes = 59;
                                const formattedHours = String(hours).padStart(2, '0');
                                const formattedMinutes = String(minutes).padStart(2, '0');
                                setEndTime(`${formattedHours}:${formattedMinutes}`);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        />
                    </div>
                </div>
            </ResponsiveModal>
        </div>
    );
};
