import React, { useMemo } from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    SectionConfig,
    form_dataRecord,
} from '@/lib/types';
import { ReportFormField } from '../fields/report-form-field';
import { SectionRenderer, SectionRendererProps } from '../section-renderer';

export function RepeatableSectionRenderer(props: SectionRendererProps) {
    const {
        section,
        config,
        control,
        disabled,
        roles,
        rolesLoaded,
        activeGuardStaff,
        predefinedValues,
        units,
        setValue,
        settings,
        isNested,
        pathPrefix = '',
    } = props;

    if (!control || !control.register) {
        return null;
    }

    const fieldNamePrefix = pathPrefix
        ? `${pathPrefix}.${section.id}`
        : section.id;

    const layoutItems = section.layout && section.layout.length > 0 ? section.layout : section.field_ids;
    if (layoutItems.length === 0 && !section.label && !section.is_separator) {
        return null;
    }

    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldNamePrefix,
    });

    const defaultItem = useMemo(
        () =>
            section.field_ids.reduce(
                (acc: form_dataRecord, field_id: string) => ({
                    ...acc,
                    [field_id]: predefinedValues.hasOwnProperty(field_id)
                        ? JSON.parse(JSON.stringify(predefinedValues[field_id]))
                        : '',
                }),
                {}
            ),
        [section.field_ids, predefinedValues]
    );

    // Simplified UI for single-field repeatable sections
    if (section.field_ids.length === 1) {
        const field_id = section.field_ids[0];
        if (!field_id) return null;
        const fieldConfig = (config.fields || {})[field_id];
        if (!fieldConfig) return null;

        const isFullWidth =
            fieldConfig.type === 'textarea' || fieldConfig.is_full_width;

        const defaultSingleFieldItem: form_dataRecord = { [field_id]: '' };

        return (
            <div
                className={cn(
                    'space-y-4',
                    !isNested && 'pt-4',
                    isNested && isFullWidth && 'sm:col-span-2',
                    props.wrapperClassName
                )}
            >
                {section.label &&
                    (isNested ? (
                        <Label className="text-sm font-medium">
                            {section.label}
                            {fieldConfig.required && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                    ) : (
                        <h3 className="text-lg font-semibold">
                            {section.label}
                            {fieldConfig.required && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </h3>
                    ))}
                <div className="space-y-2">
                    {fields.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <div className="flex-1">
                                <ReportFormField
                                    path={`${fieldNamePrefix}.${index}.${field_id}`}
                                    control={control}
                                    field_id={field_id}
                                    fieldConfig={fieldConfig}
                                    roles={roles}
                                    rolesLoaded={rolesLoaded}
                                    units={units}
                                    activeGuardStaff={activeGuardStaff}
                                    setValue={setValue}
                                    settings={settings}
                                    disabled={disabled}
                                />
                            </div>
                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-destructive shrink-0"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                {!disabled && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append(defaultSingleFieldItem)}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir {fieldConfig.label}
                    </Button>
                )}
            </div>
        );
    }

    const isFullWidth = section.field_ids.some((fid: string) => {
        const fc = config.fields[fid];
        return fc?.type === 'textarea' || fc?.is_full_width;
    });

    // Simplified UI for multi-field repeatable sections
    return (
        <div
            className={cn(
                'space-y-4',
                !isNested && 'pt-4',
                isNested && isFullWidth && 'sm:col-span-2',
                props.wrapperClassName
            )}
        >
            {section.label && (
                <h3 className="text-lg font-semibold">{section.label}</h3>
            )}
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="p-4 rounded-md border bg-muted/30 flex flex-col gap-4"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                                {section.repeatable_item_label
                                    ? `${section.repeatable_item_label} #${String(
                                        index + 1
                                    ).padStart(2, '0')}`
                                    : `${section.label} #${String(index + 1).padStart(2, '0')}`}
                            </h4>
                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive -mr-2 -mt-2"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            {(section.layout && section.layout.length > 0 ? section.layout : section.field_ids).map(
                                (field_id: string, fIdx: number) => {
                                    if (
                                        field_id.startsWith('section_') ||
                                        field_id.startsWith('sec_') ||
                                        field_id.startsWith('cond_')
                                    ) {
                                        // This is a nested section, render it.
                                        const nestedSection = config.sections.find(
                                            (s: SectionConfig) => s.id === field_id
                                        );
                                        if (!nestedSection) return null;

                                        return (
                                            <div
                                                key={`${field_id}-${fIdx}`}
                                                className="sm:col-span-2 3xl:col-span-3"
                                            >
                                                <SectionRenderer
                                                    section={nestedSection}
                                                    config={config}
                                                    control={control}
                                                    disabled={disabled}
                                                    roles={roles}
                                                    rolesLoaded={rolesLoaded}
                                                    activeGuardStaff={activeGuardStaff}
                                                    predefinedValues={predefinedValues}
                                                    units={units}
                                                    setValue={setValue}
                                                    settings={settings}
                                                    isNested={true}
                                                    pathPrefix={`${fieldNamePrefix}.${index}`}
                                                />
                                            </div>
                                        );
                                    }

                                    // Skip derived property fields (e.g. "Director.sex")
                                    if (field_id.includes('.')) return null;

                                    // Skip system/dynamic fields (enc, pie, usuario, estatus)
                                    const SYSTEM_TAGS = new Set(['enc', 'pie', 'usuario', 'estatus']);
                                    if (SYSTEM_TAGS.has(field_id.toLowerCase())) return null;

                                    const fieldConfig = (config.fields || {})[field_id];
                                    if (!fieldConfig) return null;
                                    const isFullWidth =
                                        fieldConfig.type === 'textarea' || fieldConfig.is_full_width;
                                    const path = `${fieldNamePrefix}.${index}.${field_id}`;

                                    return (
                                        <div
                                            key={field_id}
                                            className={cn(
                                                'space-y-2',
                                                isFullWidth && 'sm:col-span-2'
                                            )}
                                        >
                                            {(() => {
                                                const normalized = field_id.toLowerCase().replace(/_/g, ' ').trim();
                                                return normalized !== 'apoyo ins' && normalized !== 'apoyo institucional';
                                            })() && (
                                                <Label htmlFor={path}>
                                                    {fieldConfig?.label || field_id}
                                                    {fieldConfig.required && (
                                                        <span className="text-destructive ml-1">*</span>
                                                    )}
                                                </Label>
                                            )}
                                            <ReportFormField
                                                path={path}
                                                control={control}
                                                field_id={field_id}
                                                fieldConfig={fieldConfig}
                                                roles={roles}
                                                rolesLoaded={rolesLoaded}
                                                units={units}
                                                activeGuardStaff={activeGuardStaff}
                                                setValue={setValue}
                                                settings={settings}
                                                disabled={disabled}
                                            />
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {!disabled && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append(defaultItem)}
                    className="mt-4"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir{' '}
                    {section.repeatable_item_label || section.label}
                </Button>
            )}
        </div>
    );
}
