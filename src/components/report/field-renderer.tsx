
import React, { memo } from 'react';
import {
    FieldConfig,
    StaffRole,
    StaffMember,
    AppSettings,
    SnippetOption,
    FormDataValue,
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

interface FieldRendererProps {
    fieldId: string;
    fieldConfig: FieldConfig;
    roles: StaffRole[];
    rolesLoaded: boolean;
    units: string[];
    staffOptions: StaffMember[];
    setValue: (
        name: string,
        value: FormDataValue,
        options?: { shouldValidate?: boolean; shouldDirty?: boolean }
    ) => void;
    settings: AppSettings | null;
    // Props passed from Controller render — typed as `FormDataValue`
    value: FormDataValue;
    onChange: (value: FormDataValue) => void;
    onBlur?: () => void;
    disabled?: boolean;
    className?: string;
    name: string; // The full path name from react-hook-form
}

export const FieldRenderer = memo(
    React.forwardRef<any, FieldRendererProps>(
        (
            {
                fieldId,
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
            const lowerFieldId = fieldId.toLowerCase();
            const addressFieldNames = ['ubicación', 'destino'];

            // Derived property fields (e.g. "Director.sex") must never render as form inputs.
            // They are resolved at render time from the base field's StaffMember data.
            if (fieldId.includes('.')) return null;

            // System/dynamic fields are injected at render time and must never appear in the form.
            const SYSTEM_TAGS = new Set(['enc', 'pie', 'usuario', 'estatus']);
            if (SYSTEM_TAGS.has(lowerFieldId)) return null;

            // Check for Reporta field (Analista is discarded)
            if (lowerFieldId === 'reporta') {
                const reportaRoleIds = settings?.reportaRoleIds || [];
                const reportingStaff = staffOptions.filter(
                    (staff) => staff.roleId && reportaRoleIds.includes(staff.roleId)
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
                        <SelectTrigger className={className} ref={ref} onBlur={onBlur} id={fieldId}>
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
                if (fieldConfig.type === 'textarea' && addressFieldNames.includes(lowerFieldId)) {
                    return (
                        <AddressInput
                            value={(typeof value === 'string' ? value : '')}
                            onChange={onChange}
                            disabled={disabled}
                            className={className}
                            placeholder="Selecciona o escribe una dirección..."
                            ref={ref}
                            onBlur={onBlur}
                            isTextarea
                            name={name}
                            id={fieldId}
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
                                id={fieldId}
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
                                id={fieldId}
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
                                id={fieldId}
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
                                id={fieldId}
                            />
                        );
                    case 'dropdown': {
                        const handleSelect = (selectedLabel: string) => {
                            const selectedOption = (fieldConfig.snippetOptions || []).find(
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
                                <SelectTrigger className={`w-full ${className || ''}`} ref={ref} onBlur={onBlur} id={fieldId}>
                                    <SelectValue placeholder="Selecciona una opción..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(fieldConfig.snippetOptions || []).map((option) => (
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
                                id={fieldId}
                            />
                        );
                }
            }

            // Default or explicitly 'text': use name-based specialization or standard input
            if (lowerFieldId === 'cédula') {
                return (
                    <CedulaInput
                        value={(typeof value === 'string' ? value : '')}
                        onChange={onChange}
                        disabled={disabled}
                        className={className}
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={fieldId}
                    />
                );
            }

            if (addressFieldNames.includes(lowerFieldId)) {
                return (
                    <AddressInput
                        value={(typeof value === 'string' ? value : '')}
                        onChange={onChange}
                        disabled={disabled}
                        className={className}
                        placeholder="Selecciona o escribe una dirección..."
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={fieldId}
                    />
                );
            }

            if (fieldId === 'Unidad') {
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
                        id={fieldId}
                    />
                );
            }

            const role = rolesLoaded
                ? roles.find((r) => r.name.toLowerCase() === lowerFieldId)
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
                        isSingle={role.isSingle}
                        ref={ref}
                        onBlur={onBlur}
                        name={name}
                        id={fieldId}
                    />
                );
            }

            return (
                <Input
                    id={fieldId}
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

