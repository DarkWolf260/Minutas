import React, { memo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
    FieldConfig,
    StaffRole,
    StaffMember,
    AppSettings,
    SnippetOption,
    form_dataValue,
} from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TimeHlvInput } from '@/components/ui/custom/time-hlv-input';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { Switch } from '@/components/ui/switch';
import { MultiInput } from '@/components/ui/custom/multi-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AddressInput } from '@/components/ui/custom/address-input';
import { CedulaInput } from '@/components/ui/custom/cedula-input';
import { formatStaffMemberForAutocomplete } from '@/lib/formatters';
import { useReports } from '@/hooks/use-reports';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { createReportRepository } from '@/lib/repositories';
import { useTemplates } from '@/hooks/use-templates';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { calcularEstadisticasDia, formatearEstadisticasDia } from '@/lib/estadisticas-utils';
import { findValueInform_data, getReportDateTime } from '@/lib/report-sorter';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/custom/responsive-modal';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldRendererProps {
    field_id: string;
    fieldConfig: FieldConfig;
    roles: StaffRole[];
    rolesLoaded: boolean;
    units: string[];
    staffOptions: StaffMember[];
    setValue: (
        name: string,
        value: form_dataValue,
        options?: { shouldValidate?: boolean; shouldDirty?: boolean }
    ) => void;
    settings: AppSettings | null;
    // Props passed from Controller render — typed as `form_dataValue`
    value: form_dataValue;
    onChange: (value: form_dataValue) => void;
    onBlur?: () => void;
    disabled?: boolean;
    className?: string;
    name: string; // The full path name from react-hook-form
}

interface EstadisticasFieldProps {
    value: form_dataValue;
    onChange: (value: form_dataValue) => void;
    disabled?: boolean;
    className?: string;
}

const EstadisticasField = ({ value, onChange, disabled, className }: EstadisticasFieldProps) => {
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

export const FieldRenderer = memo(
    React.forwardRef<any, FieldRendererProps>(
        (
            {
                field_id,
                fieldConfig,
                roles,
                rolesLoaded,
                units,
                staffOptions,
                setValue,
                settings,
                value,
                onChange,
                onBlur,
                disabled,
                className,
                name,
            },
            ref
        ) => {
            const lowerfield_id = field_id.toLowerCase();
            const addressFieldNames = ['ubicación', 'destino'];
            const formContext = useFormContext();
            const tipoPath = `${name}_tipo`;
            const watchedTypeValue = useWatch({
                control: formContext?.control,
                name: tipoPath
            });

            if (lowerfield_id === 'estadísticas' || lowerfield_id === 'estadisticas' || fieldConfig.label.toLowerCase() === 'estadísticas') {
                return <EstadisticasField value={value} onChange={onChange} disabled={disabled} className={className} />;
            }

            if (lowerfield_id === 'apoyo_ins' || lowerfield_id === 'apoyo_institucional' || fieldConfig.label.toLowerCase() === 'apoyo_ins' || fieldConfig.label.toLowerCase() === 'apoyo institucional') {
                const isActive = value === '(Apoyo institucional)';
                return (
                    <div className={cn(
                        "flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 max-w-sm",
                        isActive 
                            ? "bg-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400" 
                            : "bg-muted/10 border-muted text-muted-foreground"
                    )}>
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-tight transition-colors duration-300",
                            isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground/80"
                        )}>
                            Apoyo institucional
                        </span>
                        <Switch
                            id={field_id}
                            checked={isActive}
                            onCheckedChange={(checked) => onChange(checked ? '(Apoyo institucional)' : '')}
                            disabled={disabled}
                            className={cn(
                                "data-[state=checked]:bg-orange-500",
                                isActive && "ring-2 ring-orange-500/20"
                            )}
                        />
                    </div>
                );
            }

            // Derived property fields (e.g. "Director.sex") must never render as form inputs.
            // They are resolved at render time from the base field's StaffMember data.
            if (field_id.includes('.')) return null;

            // System/dynamic fields are injected at render time and must never appear in the form.
            const SYSTEM_TAGS = new Set(['enc', 'pie', 'usuario', 'estatus']);
            if (SYSTEM_TAGS.has(lowerfield_id)) return null;

            // Check for Reporta field (Analista is discarded)
            if (lowerfield_id === 'reporta') {
                const reportarole_ids = (settings?.reportarole_ids || []).map(id => id.trim().toLowerCase());
                const reportingStaff = staffOptions.filter(
                    (staff) => {
                        if (!staff.role_id) return false;
                        const staffRoleLower = staff.role_id.trim().toLowerCase();
                        return reportarole_ids.includes(staffRoleLower);
                    }
                );

                // The value might be an array of StaffMember objects. We need the ID for the Select.
                const selectedStaffId =
                    Array.isArray(value) &&
                        value.length > 0 &&
                        value[0] &&
                        typeof value[0] === 'object' &&
                        'id' in value[0]
                        ? (value[0] as any).id
                        : undefined;

                const handleSelectChange = (staffId: string) => {
                    const selectedStaff = reportingStaff.find((s) => s.id === staffId);
                    // The form expects an array for this field
                    onChange(selectedStaff ? [selectedStaff] : []);
                };

                return (
                    <Select
                        onValueChange={handleSelectChange}
                        value={selectedStaffId || ''}
                        disabled={disabled}
                    >
                        <SelectTrigger className={className} ref={ref} onBlur={onBlur} id={field_id}>
                            <SelectValue placeholder="Selecciona el personal..." />
                        </SelectTrigger>
                        <SelectContent>
                            {reportingStaff.length > 0 ? (
                                reportingStaff.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                        {formatStaffMemberForAutocomplete(staff, true)}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-xs text-muted-foreground text-center">
                                    No hay personal asignado a los cargos de reporte.
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                );
            }

            // If type is explicitly something other than 'text', prioritize the switch
            if (fieldConfig.type && fieldConfig.type !== 'text') {
                if (fieldConfig.type === 'textarea' && addressFieldNames.includes(lowerfield_id)) {
                    const tipoPath = `${name}_tipo`;
                    return (
                        <AddressInput
                            value={(typeof value === 'string' ? value : '')}
                            onChange={onChange}
                            onTypeChange={(tipo) => setValue(tipoPath, tipo)}
                            typeValue={String(watchedTypeValue ?? '')}
                            disabled={disabled}
                            className={className}
                            placeholder="Selecciona o escribe una dirección..."
                            ref={ref}
                            onBlur={onBlur}
                            isTextarea
                            name={name}
                            id={field_id}
                        />
                    );
                }

                switch (fieldConfig.type) {
                    case 'textarea':
                        return (
                            <Textarea
                                value={(typeof value === 'string' ? value : '')}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={onBlur}
                                disabled={disabled}
                                className={className}
                                rows={1}
                                ref={ref}
                                name={name}
                                id={field_id}
                            />
                        );
                    case 'time-hlv':
                        return (
                            <TimeHlvInput
                                value={(typeof value === 'string' ? value : '')}
                                onChange={onChange}
                                disabled={disabled}
                                className={className}
                                ref={ref}
                                onBlur={onBlur}
                                name={name}
                                id={field_id}
                            />
                        );
                    case 'date':
                        return (
                            <DatePicker
                                value={(typeof value === 'string' ? value : '')}
                                onChange={onChange}
                                disabled={disabled}
                                className={className}
                                ref={ref}
                                onBlur={onBlur}
                                name={name}
                                id={field_id}
                            />
                        );
                    case 'multi-text':
                        return (
                            <MultiInput
                                value={
                                    Array.isArray(value) ? (value as string[]) : []
                                }
                                onChange={onChange}
                                disabled={disabled}
                                className={className}
                                placeholder="Escribe y presiona Enter para añadir..."
                                ref={ref}
                                onBlur={onBlur}
                                name={name}
                                id={field_id}
                            />
                        );
                    case 'dropdown': {
                        const handleSelect = (selectedLabel: string) => {
                            const selectedOption = (fieldConfig.snippet_options || []).find(
                                (opt: SnippetOption) => opt.label === selectedLabel
                            );
                            if (selectedOption) {
                                onChange(selectedOption.label);
                            }
                        };
                        return (
                            <Select
                                onValueChange={handleSelect}
                                value={(typeof value === 'string' ? value : '')}
                                disabled={disabled}
                            >
                                <SelectTrigger className={`w-full ${className || ''}`} ref={ref} onBlur={onBlur} id={field_id}>
                                    <SelectValue placeholder="Selecciona una opción..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(fieldConfig.snippet_options || []).map((option) => (
                                        <SelectItem key={option.id} value={option.label}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        );
                    }
                    case 'cedula':
                        return (
                            <CedulaInput
                                value={(typeof value === 'string' ? value : '')}
                                onChange={onChange}
                                disabled={disabled}
                                className={className}
                                ref={ref}
                                onBlur={onBlur}
                                name={name}
                                id={field_id}
                            />
                        );
                }
            }

            // Default or explicitly 'text': use name-based specialization or standard input
            if (lowerfield_id === 'cédula') {
                return (
                    <CedulaInput
                        value={(typeof value === 'string' ? value : '')}
                        onChange={onChange}
                        disabled={disabled}
                        className={className}
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={field_id}
                    />
                );
            }

            if (addressFieldNames.includes(lowerfield_id)) {
                const tipoPath = `${name}_tipo`;
                return (
                    <AddressInput
                        value={(typeof value === 'string' ? value : '')}
                        onChange={onChange}
                        onTypeChange={(tipo) => setValue(tipoPath, tipo)}
                        typeValue={String(watchedTypeValue ?? '')}
                        disabled={disabled}
                        className={className}
                        placeholder="Selecciona o escribe una dirección..."
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={field_id}
                    />
                );
            }

            if (field_id === 'Unidad') {
                return (
                    <MultiInput
                        value={
                            Array.isArray(value) ? (value as string[]) : []
                        }
                        onChange={onChange}
                        disabled={disabled}
                        className={className}
                        options={units}
                        placeholder="Buscar o añadir unidades..."
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={field_id}
                    />
                );
            }

            const role = rolesLoaded
                ? roles.find((r) => r.name.toLowerCase() === lowerfield_id)
                : null;

            if (role) {
                // currentValue: show formatted display strings in the autocomplete input
                const currentValue = Array.isArray(value)
                    ? (value as any[]).map((val: any) =>
                        typeof val === 'object' && val && 'name' in val
                            ? formatStaffMemberForAutocomplete(val as StaffMember, false)
                            : String(val || '')
                    )
                    : [];
                const autocompleteOptions = staffOptions.map((member) =>
                    formatStaffMemberForAutocomplete(member, false)
                );
                const handleMultiInputChange = (newValue: string[] | string) => {
                    const finalValueArray = Array.isArray(newValue) ? newValue : [newValue];
                    // Map display strings back to raw StaffMember objects so {Campo.propiedad} works
                    const resolved = finalValueArray.map((displayStr) => {
                        const found = staffOptions.find(
                            (m) => formatStaffMemberForAutocomplete(m, false) === displayStr
                        );
                        return found ?? displayStr;
                    });
                    onChange(resolved);
                };

                return (
                    <MultiInput
                        value={currentValue as string[]}
                        onChange={(val) => handleMultiInputChange(val as string[] | string)}
                        disabled={disabled}
                        className={className}
                        options={autocompleteOptions}
                        placeholder="Buscar o añadir..."
                        is_single={role.is_single}
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={field_id}
                    />
                );
            }

            return (
                <Input
                    id={field_id}
                    name={name}
                    value={(typeof value === 'string' || typeof value === 'number' ? value : '')}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    disabled={disabled}
                    className={className}
                    ref={ref}
                />
            );
        }
    )
);
FieldRenderer.displayName = 'FieldRenderer';



