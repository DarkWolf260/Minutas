import React from 'react';
import { Controller, useWatch, Control } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
    StaffRole,
    StaffMember,
    AppSettings,
    form_dataValue,
} from '@/lib/types';
import { FieldRenderer } from '../field-renderer';

export interface ReportFormFieldProps {
    path: string;
    control: Control<any>;
    field_id: string;
    fieldConfig: any;
    roles: StaffRole[];
    rolesLoaded: boolean;
    units: string[];
    activeGuardStaff: StaffMember[];
    setValue: (
        name: string,
        value: form_dataValue,
        options?: { shouldValidate?: boolean; shouldDirty?: boolean }
    ) => void;
    settings: AppSettings | null;
    disabled?: boolean;
}

export function ReportFormField({
    path,
    control,
    field_id,
    fieldConfig,
    roles,
    rolesLoaded,
    units,
    activeGuardStaff,
    setValue,
    settings,
    disabled
}: ReportFormFieldProps) {
    if (!control || !control.register) {
        return null;
    }

    const currentEstatus = useWatch({ control, name: 'Estatus' });
    const isFinalizado = currentEstatus === 'Finalizado';

    return (
        <Controller
            name={path}
            control={control}
            rules={{
                required: (isFinalizado && fieldConfig.required) ? 'Este campo es obligatorio' : false,
            }}
            render={({ field, fieldState: { error } }) => (
                <div className="flex flex-col gap-1 w-full">
                    <FieldRenderer
                        field_id={field_id}
                        fieldConfig={fieldConfig}
                        roles={roles}
                        rolesLoaded={rolesLoaded}
                        units={units}
                        staffOptions={activeGuardStaff}
                        setValue={setValue}
                        settings={settings}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                        disabled={disabled}
                        className={cn(error && 'border-destructive')}
                    />
                    {error && (
                        <span className="text-[10px] text-destructive">
                            {error.message}
                        </span>
                    )}
                </div>
            )}
        />
    );
}
