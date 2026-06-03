import React, { memo } from 'react';
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
import { EstadisticasField } from './fields/estadisticas-field';

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
                return <EstadisticasField id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={className} />;
            }

            const isApoyo = lowerfield_id === 'apoyo_ins' || 
                            lowerfield_id === 'apoyo_institucional' || 
                            lowerfield_id.replace(/_/g, ' ').trim() === 'apoyo ins' ||
                            lowerfield_id.replace(/_/g, ' ').trim() === 'apoyo institucional' ||
                            fieldConfig?.label?.toLowerCase() === 'apoyo_ins' || 
                            fieldConfig?.label?.toLowerCase() === 'apoyo_institucional' ||
                            fieldConfig?.label?.toLowerCase()?.replace(/_/g, ' ')?.trim() === 'apoyo ins' ||
                            fieldConfig?.label?.toLowerCase()?.replace(/_/g, ' ')?.trim() === 'apoyo institucional';

            if (isApoyo) {
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
                            id={name}
                            name={name}
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

                // Extract saved redactant from value if it's not in the active guard list
                const savedStaffMember = (() => {
                    if (Array.isArray(value) && value.length > 0) {
                        const first = value[0];
                        if (first && typeof first === 'object' && 'id' in first) {
                            return first as unknown as StaffMember;
                        }
                    } else if (value && typeof value === 'object' && 'id' in value) {
                        return value as unknown as StaffMember;
                    }
                    return null;
                })();

                if (savedStaffMember) {
                    const isSavedStaffInList = reportingStaff.some(staff => staff.id === savedStaffMember.id);
                    if (!isSavedStaffInList) {
                        reportingStaff.unshift(savedStaffMember);
                    }
                }

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
                        name={name}
                        onValueChange={handleSelectChange}
                        value={selectedStaffId || ''}
                        disabled={disabled}
                    >
                        <SelectTrigger className={className} ref={ref} onBlur={onBlur} id={name}>
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
                            id={name}
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
                                id={name}
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
                                id={name}
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
                                id={name}
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
                                id={name}
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
                                name={name}
                                onValueChange={handleSelect}
                                value={(typeof value === 'string' ? value : '')}
                                disabled={disabled}
                            >
                                <SelectTrigger className={`w-full ${className || ''}`} ref={ref} onBlur={onBlur} id={name}>
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
                                id={name}
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
                        id={name}
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
                        id={name}
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
                        id={name}
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
                        id={name}
                    />
                );
            }

            return (
                <Input
                    id={name}
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



