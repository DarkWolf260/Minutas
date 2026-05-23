import React, { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
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
import { findValueInform_data } from '@/lib/report-sorter';
import { useMemo } from 'react';
import { toast } from 'sonner';
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

    const handleCalculate = async () => {
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
                return true;
            });

            if (reportesFinalizados.length === 0) {
                toast.error('No hay reportes finalizados para calcular estadísticas.', { id: 'calc-stats' });
                return;
            }

            // Fetch templates and configs directly from DB to avoid reactive hooks
            const templatesDocs = await db.configs.find({
                selector: {
                    workspace_id: currentWorkspace,
                    type: 'template' as any
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
                acc[config.template_id] = config;
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
                (acc: any, config: any) => {
                    Object.keys(config.fields).forEach((fieldName) => {
                        const field = config.fields[fieldName];
                        if (field && field.type === 'predefined' && field.value) {
                            acc[fieldName] = field.value;
                        }
                    });
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
                toast.info('No se encontraron categorías estadísticas en los reportes de hoy.', { id: 'calc-stats' });
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



