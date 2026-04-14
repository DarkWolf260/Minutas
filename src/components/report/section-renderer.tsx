
import React, { useMemo } from 'react';
import { useFieldArray, Controller, useWatch, Control } from 'react-hook-form';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    TemplateConfig,
    SectionConfig,
    StaffRole,
    StaffMember,
    AppSettings,
    FormDataRecord,
    FormDataValue,
} from '@/lib/types';
import { evaluateCondition } from '@/lib/template-parser';
import { FieldRenderer } from './field-renderer';

export interface SectionRendererProps {
    section: SectionConfig;
    config: TemplateConfig;
    control: Control<any>; // Keep Control<any> for react-hook-form generic flexibility
    disabled?: boolean;
    roles: StaffRole[];
    rolesLoaded: boolean;
    activeGuardStaff: StaffMember[];
    predefinedValues: FormDataRecord;
    units: string[];
    setValue: (
        name: string,
        value: FormDataValue,
        options?: { shouldValidate?: boolean; shouldDirty?: boolean }
    ) => void;
    settings: AppSettings | null;
    isNested?: boolean;
    pathPrefix?: string;
    /** If provided, this value is used directly for condition evaluation instead of internal useWatch */
    conditionValue?: FormDataValue;
    wrapperClassName?: string;
}

export function SectionRenderer(props: SectionRendererProps) {
    const { section, config, pathPrefix = '', conditionValue } = props;
    const condition = section.condition;
    const conditionMode = condition?.conditionMode || 'hide';

    // For dotted condition field IDs like "Director.sex", we need to watch
    // the BASE field ("Director") and derive the property at evaluation time.
    const isDottedCondition = condition ? condition.fieldId.includes('.') : false;
    const baseConditionFieldId = isDottedCondition && condition
        ? condition.fieldId.slice(0, condition.fieldId.indexOf('.'))
        : condition?.fieldId;
    const conditionProp = isDottedCondition && condition
        ? condition.fieldId.slice(condition.fieldId.indexOf('.') + 1)
        : null;

    const watchPath = condition
        ? pathPrefix
            ? `${pathPrefix}.${baseConditionFieldId}`
            : (baseConditionFieldId ?? 'dummy_no_condition')
        : 'dummy_no_condition';

    // By not passing a 'control' prop, useWatch automatically attempts to find 
    // the FormProvider context we set up in report-form.tsx. This correctly
    // tracks dynamic field registrations nested inside conditions.
    const watchedFieldValue = useWatch({
        name: watchPath,
        disabled: !condition
    });

    // If the condition uses dot-notation (e.g. Director.sex), resolve the property
    // from the watched base value (e.g. Director[0].sex)
    let resolvedWatchValue = conditionValue !== undefined ? conditionValue : watchedFieldValue;
    if (isDottedCondition && conditionProp && resolvedWatchValue !== undefined) {
        if (Array.isArray(resolvedWatchValue) && resolvedWatchValue.length > 0) {
            const first = resolvedWatchValue[0];
            if (first && typeof first === 'object') {
                resolvedWatchValue = (first as Record<string, unknown>)[conditionProp] as FormDataValue ?? undefined;
            } else {
                resolvedWatchValue = undefined;
            }
        } else {
            resolvedWatchValue = undefined;
        }
    }

    let actualValueToEvaluate = resolvedWatchValue;

    let conditionMet = true;
    if (condition) {
        // If the field has snippet options (dropdown), check if we need to compare
        // against the value or the label. 'actualValueToEvaluate' might be the label.

        // Find fieldConfig case-insensitively since template allows `{Campo}` and `{campo}` interchangeably
        const fieldConfigKey = Object.keys(config.fields).find(k => k.toLowerCase() === condition.fieldId.toLowerCase());
        const fieldConfig = fieldConfigKey ? config.fields[fieldConfigKey] : config.fields[condition.fieldId];

        if (fieldConfig?.snippetOptions?.length) {
            const options = fieldConfig.snippetOptions;
            const targetValue = condition.value;
            const matchedOpt = options.find(
                (opt: any) => opt.value === targetValue || opt.label === targetValue
            );

            if (matchedOpt) {
                if (actualValueToEvaluate === matchedOpt.label || actualValueToEvaluate === String(matchedOpt.value)) {
                    actualValueToEvaluate = targetValue;
                }
            }
        }

        conditionMet = evaluateCondition(
            actualValueToEvaluate,
            condition.operator || '=',
            condition.value
        );

        // hide mode (default): fields disappear from form when condition not met
        if (!conditionMet && conditionMode === 'hide') {
            return null;
        }
    }

    const inner = section.isRepeatable
        ? <RepeatableSectionRenderer {...props} />
        : <SingleSectionRenderer {...props} />;

    // show mode: always render — no wrapper, just like a normal section
    return inner;
}


function RepeatableSectionRenderer(props: SectionRendererProps) {
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

    const fieldNamePrefix = pathPrefix
        ? `${pathPrefix}.${section.id}`
        : section.id;

    const layoutItems = section.layout && section.layout.length > 0 ? section.layout : section.fieldIds;
    if (layoutItems.length === 0 && !section.label && !section.isSeparator) {
        return null;
    }

    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldNamePrefix,
    });

    const defaultItem = useMemo(
        () =>
            section.fieldIds.reduce(
                (acc: FormDataRecord, fieldId: string) => ({
                    ...acc,
                    [fieldId]: predefinedValues.hasOwnProperty(fieldId)
                        ? JSON.parse(JSON.stringify(predefinedValues[fieldId]))
                        : '',
                }),
                {}
            ),
        [section.fieldIds, predefinedValues]
    );

    // Simplified UI for single-field repeatable sections
    if (section.fieldIds.length === 1) {
        const fieldId = section.fieldIds[0];
        if (!fieldId) return null;
        const fieldConfig = (config.fields || {})[fieldId];
        if (!fieldConfig) return null;

        const isFullWidth =
            fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;

        const defaultSingleFieldItem: FormDataRecord = { [fieldId]: '' };

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
                                <Controller
                                    name={`${fieldNamePrefix}.${index}.${fieldId}`}
                                    control={control}
                                    rules={{
                                        required: fieldConfig.required
                                            ? 'Este campo es obligatorio'
                                            : false,
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="flex flex-col gap-1 w-full">
                                            <FieldRenderer
                                                fieldId={fieldId}
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

    const isFullWidth = section.fieldIds.some((fid: string) => {
        const fc = config.fields[fid];
        return fc?.type === 'textarea' || fc?.isFullWidth;
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
                                {section.repeatableItemLabel
                                    ? `${section.repeatableItemLabel} #${String(
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
                            {(section.layout && section.layout.length > 0 ? section.layout : section.fieldIds).map(
                                (fieldId: string, fIdx: number) => {
                                    if (
                                        fieldId.startsWith('section_') ||
                                        fieldId.startsWith('sec_') ||
                                        fieldId.startsWith('cond_')
                                    ) {
                                        // This is a nested section, render it.
                                        const nestedSection = config.sections.find(
                                            (s: SectionConfig) => s.id === fieldId
                                        );
                                        if (!nestedSection) return null;

                                        return (
                                            <div
                                                key={`${fieldId}-${fIdx}`}
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
                                    if (fieldId.includes('.')) return null;

                                    const fieldConfig = (config.fields || {})[fieldId];
                                    if (!fieldConfig) return null;
                                    const isFullWidth =
                                        fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;
                                    const path = `${fieldNamePrefix}.${index}.${fieldId}`;

                                    return (
                                        <div
                                            key={fieldId}
                                            className={cn(
                                                'space-y-2',
                                                isFullWidth && 'sm:col-span-2'
                                            )}
                                        >
                                            <Label htmlFor={path}>
                                                {fieldConfig?.label || fieldId}
                                                {fieldConfig.required && (
                                                    <span className="text-destructive ml-1">*</span>
                                                )}
                                            </Label>
                                            <Controller
                                                name={path}
                                                control={control}
                                                rules={{
                                                    required: fieldConfig.required
                                                        ? 'Este campo es obligatorio'
                                                        : false,
                                                }}
                                                render={({ field, fieldState: { error } }) => (
                                                    <div className="flex flex-col gap-1">
                                                        <FieldRenderer
                                                            fieldId={fieldId}
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
                    {section.repeatableItemLabel || section.label}
                </Button>
            )}
        </div>
    );
}

function SingleSectionRenderer(props: SectionRendererProps) {
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

    const fieldNamePrefix = pathPrefix;

    const layoutItems = section.layout && section.layout.length > 0 ? section.layout : section.fieldIds;
    if (layoutItems.length === 0 && !section.label && !section.isSeparator) {
        return null;
    }

    if (section.fieldIds.length === 0 && section.label) {
        return (
            <div className={cn(!isNested && 'pt-4', props.wrapperClassName)}>
                <h3 className="text-lg font-semibold">{section.label}</h3>
            </div>
        );
    }

    if (section.isSeparator) {
        return (
            <div className={cn("py-6 sm:col-span-2 3xl:col-span-3", props.wrapperClassName)}>
                <Separator className="bg-border" />
            </div>
        );
    }

    // Transparent conditional: nested section with a condition but no label.
    // Render its fields as Fragment children so they participate directly in the
    // parent's CSS grid — no inner grid wrapper and no col-span forcing.
    if (isNested && section.condition && !section.label) {
        return (
            <>
                {layoutItems
                    .filter((fid: string) => !fid.includes('.'))
                    .map((fieldId: string, fIdx: number) => {
                        const fieldConfig = (config.fields || {})[fieldId];
                        if (!fieldConfig) return null;
                        const isFullWidth = fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;
                        const path = fieldNamePrefix ? `${fieldNamePrefix}.${fieldId}` : fieldId;
                        return (
                            <div
                                key={`${fieldId}-${fIdx}`}
                                className={cn('space-y-2', isFullWidth && 'sm:col-span-2 3xl:col-span-3')}
                            >
                                <Label htmlFor={path}>
                                    {fieldConfig?.label || fieldId}
                                    {fieldConfig.required && (
                                        <span className="text-destructive ml-1">*</span>
                                    )}
                                </Label>
                                <Controller
                                    name={path}
                                    control={control}
                                    rules={{
                                        required: fieldConfig.required
                                            ? 'Este campo es obligatorio'
                                            : false,
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="flex flex-col gap-1">
                                            <FieldRenderer
                                                fieldId={fieldId}
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
                            </div>
                        );
                    })}
            </>
        );
    }

    return (
        <div className={cn('space-y-4', !isNested && 'pt-4', props.wrapperClassName)}>
            {section.label && (
                <h3 className="text-lg font-semibold">{section.label}</h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-x-4 gap-y-6">
                {(section.layout && section.layout.length > 0 ? section.layout : section.fieldIds).map(
                    (fieldId: string, fIdx: number) => {
                        if (
                            fieldId.startsWith('section_') ||
                            fieldId.startsWith('sec_') ||
                            fieldId.startsWith('cond_')
                        ) {
                            // Nested section
                            const nestedSection = config.sections.find(
                                (s: SectionConfig) => s.id === fieldId
                            );
                            if (!nestedSection) return null;
                            // Transparent conditionals (no label, with condition) render their
                            // fields directly as Fragment children of the parent grid — don't
                            // force full width on them.
                            const isTransparentConditional =
                                !!nestedSection.condition && !nestedSection.label;
                            return (
                                <SectionRenderer
                                    key={`${fieldId}-${fIdx}`}
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
                                    pathPrefix={fieldNamePrefix}
                                    wrapperClassName={isTransparentConditional ? undefined : "sm:col-span-2 3xl:col-span-3"}
                                />
                            );
                        }

                        // Skip derived property fields (e.g. "Director.sex") —
                        // they are read-only properties resolved at render time, not user form fields.
                        if (fieldId.includes('.')) return null;

                        const fieldConfig = (config.fields || {})[fieldId];
                        if (!fieldConfig) return null;
                        const isFullWidth =
                            fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;
                        const path = fieldNamePrefix ? `${fieldNamePrefix}.${fieldId}` : fieldId;

                        return (
                            <div
                                key={`${fieldId}-${fIdx}`}
                                className={cn(
                                    'space-y-2',
                                    isFullWidth && 'sm:col-span-2 3xl:col-span-3'
                                )}
                            >
                                <Label htmlFor={path}>
                                    {fieldConfig?.label || fieldId}
                                    {fieldConfig.required && (
                                        <span className="text-destructive ml-1">*</span>
                                    )}
                                </Label>
                                <Controller
                                    name={path}
                                    control={control}
                                    rules={{
                                        required: fieldConfig.required
                                            ? 'Este campo es obligatorio'
                                            : false,
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="flex flex-col gap-1">
                                            <FieldRenderer
                                                fieldId={fieldId}
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
                            </div>
                        );
                    }
                )}
            </div>
        </div>
    );
}
