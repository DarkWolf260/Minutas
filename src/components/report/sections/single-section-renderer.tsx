import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    SectionConfig,
} from '@/lib/types';
import { ReportFormField } from '../fields/report-form-field';
import { SectionRenderer, SectionRendererProps } from '../section-renderer';

export function SingleSectionRenderer(props: SectionRendererProps) {
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

    const fieldNamePrefix = pathPrefix;

    const layoutItems = section.layout && section.layout.length > 0 ? section.layout : section.field_ids;
    if (layoutItems.length === 0 && !section.label && !section.is_separator) {
        return null;
    }

    if (section.field_ids.length === 0 && section.label) {
        return (
            <div className={cn(!isNested && 'pt-4', props.wrapperClassName)}>
                <h3 className="text-lg font-semibold">{section.label}</h3>
            </div>
        );
    }

    if (section.is_separator) {
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
                    .filter((fid: string) => !['enc', 'pie', 'usuario', 'estatus'].includes(fid.toLowerCase()))
                    .map((field_id: string, fIdx: number) => {
                        const fieldConfig = (config.fields || {})[field_id];
                        if (!fieldConfig) return null;
                        const isFullWidth = fieldConfig.type === 'textarea' || fieldConfig.is_full_width;
                        const path = fieldNamePrefix ? `${fieldNamePrefix}.${field_id}` : field_id;
                        return (
                            <div
                                key={`${field_id}-${fIdx}`}
                                className={cn('space-y-2', isFullWidth && 'sm:col-span-2 3xl:col-span-3')}
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
                {(section.layout && section.layout.length > 0 ? section.layout : section.field_ids).map(
                    (field_id: string, fIdx: number) => {
                        if (
                            field_id.startsWith('section_') ||
                            field_id.startsWith('sec_') ||
                            field_id.startsWith('cond_')
                        ) {
                            // Nested section
                            const nestedSection = config.sections.find(
                                (s: SectionConfig) => s.id === field_id
                            );
                            if (!nestedSection) return null;
                            // Transparent conditionals (no label, with condition) render their
                            // fields directly as Fragment children of the parent grid — don't
                            // force full width on them.
                            const isTransparentConditional =
                                !!nestedSection.condition && !nestedSection.label;
                            return (
                                <SectionRenderer
                                    key={`${field_id}-${fIdx}`}
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
                        if (field_id.includes('.')) return null;

                        // Skip system/dynamic fields (enc, pie, usuario, estatus)
                        const SYSTEM_TAGS = new Set(['enc', 'pie', 'usuario', 'estatus']);
                        if (SYSTEM_TAGS.has(field_id.toLowerCase())) return null;

                        const fieldConfig = (config.fields || {})[field_id];
                        if (!fieldConfig) return null;
                        const isFullWidth =
                            fieldConfig.type === 'textarea' || fieldConfig.is_full_width;
                        const path = fieldNamePrefix ? `${fieldNamePrefix}.${field_id}` : field_id;

                        return (
                            <div
                                key={`${field_id}-${fIdx}`}
                                className={cn(
                                    'space-y-2',
                                    isFullWidth && 'sm:col-span-2 3xl:col-span-3'
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
    );
}
