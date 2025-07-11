
'use client';

import { useMemo, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import type { Template, TemplateConfig, FieldConfig, FieldType, StaffRole, SectionConfig, StaffMember } from '@/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { parseTemplate, renderFinalReport } from '@/lib/template-parser';
import { cn } from '@/lib/utils';
import { TimeHlvInput } from './time-hlv-input';
import { DatePicker } from './date-picker';
import { useRoles } from '@/hooks/use-roles';
import { MultiInput } from './ui/multi-input';
import { useGuards } from '@/hooks/use-guards';
import { useDepartments } from '@/hooks/use-departments';
import { useUnits } from '@/hooks/use-units';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AddressInput } from './ui/address-input';
import { useSettings } from '@/hooks/use-settings';
import { CedulaInput } from './cedula-input';

const formatStaffMemberForDisplay = (member: StaffMember | string): string => {
    if (typeof member === 'string') {
        return member;
    }
    return member.name;
};

const formatStaffMemberForAutocomplete = (member: StaffMember, withCedula: boolean): string => {
    if (withCedula && member.cedula) {
        return `${member.name} ${member.cedula}`;
    }
    return member.name;
};


function getFieldComponent(
    fieldId: string, 
    fieldConfig: FieldConfig, 
    roles: StaffRole[], 
    rolesLoaded: boolean, 
    units: string[], 
    staffOptions: StaffMember[],
    setValue: (name: string, value: any, options?: { shouldValidate?: boolean; shouldDirty?: boolean; }) => void
) {
    const lowerFieldId = fieldId.toLowerCase();
    const addressFieldNames = ['dirección', 'ubicación', 'destino'];

    if (lowerFieldId === 'cédula') {
        return (props: any) => <CedulaInput {...props} />;
    }

    if (addressFieldNames.includes(lowerFieldId)) {
        return (props: any) => <AddressInput {...props} placeholder="Selecciona o escribe una dirección..." />;
    }

    if (fieldId === 'Unidad') {
        return (props: any) => <MultiInput {...props} options={units} placeholder="Buscar o añadir unidades..." value={Array.isArray(props.value) ? props.value : (props.value ? [String(props.value)] : [])} />;
    }

    const role = rolesLoaded ? roles.find(r => r.name.toLowerCase() === lowerFieldId) : null;
    
    if (role) {
         return (props: any) => {
            const isReportaAnalista = lowerFieldId === 'reporta' || lowerFieldId === 'analista';
            const currentValue = Array.isArray(props.value) ? props.value.map(formatStaffMemberForDisplay) : [];
            const autocompleteOptions = staffOptions.map(member => formatStaffMemberForAutocomplete(member, isReportaAnalista));

            const handleMultiInputChange = (newValue: string[] | string) => {
                const finalValueArray = Array.isArray(newValue) ? newValue : [newValue];
                
                if (isReportaAnalista) {
                    const finalObjects = finalValueArray.map(nv => {
                        const foundStaff = staffOptions.find(so => formatStaffMemberForAutocomplete(so, true) === nv);
                        return foundStaff || { id: `staff_${Date.now()}_${Math.random()}`, name: nv };
                    });
                    props.onChange(finalObjects);
                } else {
                    props.onChange(finalValueArray);
                }
            };
            
            if (role.isSingle) {
                return <MultiInput {...props} options={autocompleteOptions} placeholder="Buscar o añadir..." value={currentValue} isSingle={true} onChange={handleMultiInputChange} />;
            } else {
                return <MultiInput {...props} options={autocompleteOptions} placeholder="Buscar o añadir..." value={currentValue} isSingle={false} onChange={handleMultiInputChange} />;
            }
        };
    }
    
    switch (fieldConfig.type) {
        case 'textarea':
            return (props: any) => <Textarea {...props} rows={1} />;
        case 'time-hlv':
            return (props: any) => <TimeHlvInput {...props} />;
        case 'date':
            return (props: any) => <DatePicker {...props} />;
        case 'dropdown':
             return (props: any) => {
                const { name, onChange, value, disabled } = props;

                const handleSelect = (selectedLabel: string) => {
                    const selectedOption = (fieldConfig.snippetOptions || []).find(opt => opt.label === selectedLabel);
                    if (selectedOption) {
                        onChange(selectedOption.label); // Update current field
                        if (fieldConfig.targetField) {
                            const pathParts = name.split('.');
                            pathParts[pathParts.length - 1] = fieldConfig.targetField;
                            const targetPath = pathParts.join('.');
                            setValue(targetPath, selectedOption.value, { shouldDirty: true });
                        }
                    }
                };
                return (
                    <Select onValueChange={handleSelect} value={value} disabled={disabled}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona una opción..." />
                        </SelectTrigger>
                        <SelectContent>
                            {(fieldConfig.snippetOptions || []).map(option => (
                                <SelectItem key={option.id} value={option.label}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            };
        case 'text':
        default:
            return (props: any) => <Input {...props} />;
    }
}


function SectionRenderer({ section, config, control, disabled, roles, rolesLoaded, activeGuardStaff, predefinedValues, units, setValue }: { section: SectionConfig, config: TemplateConfig, control: any, disabled: boolean, roles: StaffRole[], rolesLoaded: boolean, activeGuardStaff: StaffMember[], predefinedValues: Record<string, string>, units: string[], setValue: (name: string, value: any, options?: { shouldValidate?: boolean; shouldDirty?: boolean; }) => void }) {
    
    const condition = section.condition;
    const watchedFieldValue = useWatch({
        control,
        name: condition?.fieldId || 'dummy_field_to_avoid_errors',
        disabled: !condition
    });
    
    if (condition) {
        let actualValue = watchedFieldValue;
        
        const pathParts = (condition.fieldId || '').split('.');
        if (pathParts.length > 1) {
             const watchedFormValues = useWatch({ control });
             actualValue = pathParts.reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, watchedFormValues);
        }

        const fieldConfig = config.fields[condition.fieldId];
        const options = fieldConfig?.snippetOptions || [];
        const selectedIndex = options.findIndex(opt => opt.label === actualValue);

        if (String(selectedIndex) !== condition.value) {
            return null;
        }
    }


    if (section.isRepeatable) {
        const { fields, append, remove } = useFieldArray({ control, name: section.id });
        const defaultItem = section.fieldIds.reduce((acc, fieldId) => ({ ...acc, [fieldId]: predefinedValues.hasOwnProperty(fieldId) ? predefinedValues[fieldId] : '' }), {});

        // Simplified UI for single-field repeatable sections
        if (section.fieldIds.length === 1) {
            const fieldId = section.fieldIds[0];
            const fieldConfig = (config.fields || {})[fieldId];
            if (!fieldConfig) return null;

            const FieldComponent = getFieldComponent(fieldId, fieldConfig, roles, rolesLoaded, units, activeGuardStaff, setValue);
            const defaultSingleFieldItem = { [fieldId]: '' };

            return (
                <div className="space-y-4 border-t pt-6">
                    {section.label && <h3 className="text-lg font-semibold">{section.label}</h3>}
                    <div className="space-y-2">
                        {fields.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Controller
                                        name={`${section.id}.${index}.${fieldId}`}
                                        control={control}
                                        render={({ field }) => <FieldComponent {...field} disabled={disabled} />}
                                    />
                                </div>
                                {!disabled && (
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!disabled && (
                        <Button type="button" variant="outline" onClick={() => append(defaultSingleFieldItem)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir {fieldConfig.label}
                        </Button>
                    )}
                </div>
            );
        }
        
        // Simplified UI for multi-field repeatable sections
        return (
            <div className="space-y-4 border-t pt-6">
                {section.label && <h3 className="text-lg font-semibold">{section.label}</h3>}
                <div className="space-y-3">
                    {fields.map((field, index) => (
                         <div key={field.id} className="p-4 rounded-md border bg-muted/30 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                 <h4 className="font-medium">
                                    {section.repeatableItemLabel ? `${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}` : `${section.label} #${String(index + 1).padStart(2, '0')}`}
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
                                {(section.layout || section.fieldIds).map(fieldId => {
                                    if(fieldId.startsWith('section_')) {
                                        // This is a nested section, render it.
                                        const nestedSection = config.sections.find(s => s.id === fieldId);
                                        if(!nestedSection) return null;
                                        // We need to pass down the correct path prefix
                                        // This part is getting complex. For now, let's assume no nested repeatable sections.
                                        return <p key={fieldId} className="text-destructive text-xs">Nested sections not fully supported here yet.</p>
                                    }

                                    const fieldConfig = (config.fields || {})[fieldId];
                                    if (!fieldConfig) return null;
                                    const isFullWidth = fieldConfig.type === 'textarea';
                                    const path = `${section.id}.${index}.${fieldId}`;
                                    const FieldComponent = getFieldComponent(fieldId, fieldConfig, roles, rolesLoaded, units, activeGuardStaff, setValue);

                                    return (
                                        <div key={fieldId} className={cn("space-y-2", isFullWidth && "sm:col-span-2")}>
                                            <Label htmlFor={path}>{fieldConfig?.label || fieldId}</Label>
                                            <Controller
                                                name={path}
                                                control={control}
                                                render={({ field }) => <FieldComponent {...field} disabled={disabled} />}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                {!disabled && (
                    <Button type="button" variant="outline" onClick={() => append(defaultItem)} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir {section.repeatableItemLabel || section.label}
                    </Button>
                )}
            </div>
        );
    }
    
    // Non-repeatable section
    if (section.fieldIds.length === 0 && section.label) {
        return (
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold">{section.label}</h3>
            </div>
        );
    }

    if (section.fieldIds.length === 0 && !section.label) {
        return <div className="border-t"></div>;
    }
    
    return (
        <div className="space-y-4 border-t pt-6">
             {section.label && <h3 className="text-lg font-semibold">{section.label}</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-x-4 gap-y-6">
                 {(section.layout || section.fieldIds).map(fieldId => {
                    if (fieldId.startsWith('section_')) {
                        // Nested non-repeatable section
                        const nestedSection = config.sections.find(s => s.id === fieldId);
                        if (!nestedSection) return null;
                        return <SectionRenderer key={fieldId} section={nestedSection} config={config} control={control} disabled={disabled} roles={roles} rolesLoaded={rolesLoaded} activeGuardStaff={activeGuardStaff} predefinedValues={predefinedValues} units={units} setValue={setValue} />;
                    }

                    const fieldConfig = (config.fields || {})[fieldId];
                    if (!fieldConfig) return null;
                    const isFullWidth = fieldConfig.type === 'textarea';
                    const path = `${section.id}.${fieldId}`;
                    const FieldComponent = getFieldComponent(fieldId, fieldConfig, roles, rolesLoaded, units, activeGuardStaff, setValue);

                    return (
                        <div key={fieldId} className={cn("space-y-2", isFullWidth && "sm:col-span-2 3xl:col-span-3")}>
                            <Label htmlFor={path}>{fieldConfig?.label || fieldId}</Label>
                            <Controller
                                name={path}
                                control={control}
                                render={({ field }) => <FieldComponent {...field} disabled={disabled} />}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export interface ReportFormRef {
    submit: () => void;
    getValues: () => Record<string, any>;
    getRenderedContent: () => string;
}

interface ReportFormProps {
    template: Template;
    config: TemplateConfig;
    initialData?: Record<string, any>;
    onSubmit: (formData: Record<string, any>, content: string, title: string) => void;
    disabled?: boolean;
    onDataChange?: (formData: Record<string, any>) => void;
}

export const ReportForm = forwardRef<ReportFormRef, ReportFormProps>(({ template, config, initialData, onSubmit, disabled = false, onDataChange }, ref) => {
    const { definitions } = useFieldDefinitions();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const { guards, isLoaded: guardsLoaded } = useGuards();
    const { departments, isLoaded: deptsLoaded } = useDepartments();
    const { settings, isLoaded: settingsLoaded } = useSettings();
    const { units } = useUnits();

    const activeGuardStaff = useMemo(() => {
        if (!settingsLoaded || !guardsLoaded || !settings.activeGuardId) return [];
        const activeGuard = guards.find(g => g.id === settings.activeGuardId);
        if (!activeGuard || !activeGuard.staff) return [];

        const staffSet = new Set<StaffMember>();
        Object.values(activeGuard.staff).forEach(staffList => {
            staffList.forEach(person => staffSet.add(person));
        });
        return Array.from(staffSet).sort((a,b) => a.name.localeCompare(b.name));
    }, [settings.activeGuardId, guards, settingsLoaded, guardsLoaded]);

    const finalConfig = useMemo(() => {
        if (!config || !template) return { fields: {}, sections: [], layout: []};

        const { sections, layout, fieldNames, fieldTypes, templateOptions } = parseTemplate(template.content);

        const newConfig: TemplateConfig = {
            fields: {},
            sections,
            layout
        };
        
        let timeHlvFieldInConfig: string | null = null;
        const templateConfigFields = config.fields || {};
        
        if (config.fields) {
            timeHlvFieldInConfig = Object.keys(config.fields).find(k => config.fields[k]?.type === 'time-hlv') || null;
        }

        fieldNames.forEach(fieldId => {
            const templateFieldConfig = templateConfigFields[fieldId];
            const globalDef = definitions[fieldId];
            const typeFromTemplate = fieldTypes.get(fieldId);
            
            // Priority: template-specific config > global definition > calculated > default
            const mergedConfig = { ...(globalDef || {}), ...(templateFieldConfig || {}) };
            newConfig.fields[fieldId] = {
                type: 'text',
                label: fieldId,
                ...mergedConfig
            };
            
            if (templateOptions.has(fieldId)) {
                newConfig.fields[fieldId].snippetOptions = templateOptions.get(fieldId);
            }

            // Recalculate type based on priority
            if (typeFromTemplate) {
                newConfig.fields[fieldId].type = typeFromTemplate;
            } else if (fieldId.toLowerCase() === 'fecha') {
                newConfig.fields[fieldId].type = 'date';
            } else if (fieldId.toLowerCase() === 'hora') {
                 if (!timeHlvFieldInConfig || timeHlvFieldInConfig === fieldId) {
                    newConfig.fields[fieldId].type = 'time-hlv';
                    if (!timeHlvFieldInConfig) timeHlvFieldInConfig = fieldId;
                } else {
                    newConfig.fields[fieldId].type = 'text';
                }
            } else if (templateFieldConfig?.type) {
                newConfig.fields[fieldId].type = templateFieldConfig.type;
            } else if (globalDef?.type) {
                newConfig.fields[fieldId].type = globalDef.type;
            }
        });
        
        return newConfig;
    }, [config, template, definitions]);
    
    const predefinedValues: Record<string, string> = useMemo(() => {
        const values: Record<string, string> = {};
        Object.entries(definitions).forEach(([key, config]) => {
            if (config.type === 'predefined' || key === 'Fecha') { // Treat Fecha as a dynamic predefined value
                values[key] = config.value || '';
            }
        });
        return values;
    }, [definitions]);

    const getInitialValues = useCallback((data?: Record<string, any>) => {
        const initialFormValues = data ? JSON.parse(JSON.stringify(data)) : {};

        const applyDefaults = (target: Record<string, any>, fieldIds: string[]) => {
            fieldIds.forEach(fieldId => {
                if (target[fieldId] === undefined || target[fieldId] === null) {
                    const keyLower = fieldId.toLowerCase();
                    const foundKey = Object.keys(predefinedValues).find(k => k.toLowerCase() === keyLower);

                    if (foundKey) {
                        target[fieldId] = predefinedValues[foundKey];
                    }
                    else {
                        const role = roles.find(r => r.name.toLowerCase() === keyLower);
                        if (role) {
                           target[fieldId] = [];
                        } else if (fieldId === 'Unidad') {
                           target[fieldId] = [];
                        } else {
                           target[fieldId] = '';
                        }
                    }
                }
            });
        };

        const addedTopLevelFields = new Set<string>();
        const topLevelFieldIds = finalConfig.layout.filter(id => {
            if (id.startsWith('section_')) return false;
            const isAssigned = finalConfig.sections.some(s => s.fieldIds.includes(id));
            if (isAssigned) return false;
            if (addedTopLevelFields.has(id)) return false;
            addedTopLevelFields.add(id);
            return true;
        });
        applyDefaults(initialFormValues, topLevelFieldIds);

        finalConfig.sections.forEach(section => {
            if (section.isRepeatable) {
                const sectionData = initialFormValues[section.id];
                const defaultItem = {};
                applyDefaults(defaultItem, section.fieldIds);

                if (!data && (!Array.isArray(sectionData) || sectionData.length === 0)) {
                    initialFormValues[section.id] = [defaultItem];
                } else if (Array.isArray(sectionData)) {
                    sectionData.forEach((item: Record<string, any>) => {
                        applyDefaults(item, section.fieldIds);
                    });
                } else {
                    initialFormValues[section.id] = [];
                }
            } else {
                if (!initialFormValues[section.id]) {
                    initialFormValues[section.id] = {};
                }
                
                const sectionObject = initialFormValues[section.id];
                
                section.fieldIds.forEach(fieldId => {
                    if (sectionObject[fieldId] === undefined || sectionObject[fieldId] === null) {
                         const keyLower = fieldId.toLowerCase();
                         const foundKey = Object.keys(predefinedValues).find(k => k.toLowerCase() === keyLower);

                         if (foundKey) {
                            sectionObject[fieldId] = predefinedValues[foundKey];
                        } else {
                            const role = roles.find(r => r.name.toLowerCase() === keyLower);
                            if (role) {
                               sectionObject[fieldId] = [];
                            } else if (fieldId === 'Unidad') {
                               sectionObject[fieldId] = [];
                            } else {
                               sectionObject[fieldId] = '';
                            }
                        }
                    }
                });
            }
        });

        return initialFormValues;
    }, [finalConfig, predefinedValues, roles]);
    
    const { handleSubmit, control, watch, reset, getValues, setValue } = useForm({
        defaultValues: getInitialValues(initialData),
    });

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (type !== 'change' || !name) return;
            if (onDataChange) {
                onDataChange(getValues());
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, onDataChange, getValues]);


    useEffect(() => {
        const formValues = getInitialValues(initialData);
        reset(formValues);
    }, [initialData, finalConfig, getInitialValues, reset]);

    const handleFormSubmit = (data: Record<string, any>) => {
       const finalContent = renderFinalReport(template.content, data, finalConfig, predefinedValues);
       const title = data.titulo || data.title || template.name;
       onSubmit(data, finalContent, title);
    };

    useImperativeHandle(ref, () => ({
        submit: handleSubmit(handleFormSubmit),
        getValues: getValues,
        getRenderedContent: () => {
            const formData = getValues();
            return renderFinalReport(template.content, formData, finalConfig, predefinedValues);
        }
    }));

    const sectionsById = useMemo(() => 
        finalConfig.sections.reduce((acc, section) => {
            acc[section.id] = section;
            return acc;
        }, {} as Record<string, SectionConfig>),
    [finalConfig.sections]);

    const layoutChunks = useMemo(() => {
        const chunks: (string[] | string)[] = [];
        let currentFieldChunk: string[] = [];
        const addedTopLevelFields = new Set<string>();

        finalConfig.layout.forEach(id => {
            if (id.startsWith('section_')) {
                if (currentFieldChunk.length > 0) {
                    chunks.push(currentFieldChunk);
                    currentFieldChunk = [];
                }
                chunks.push(id);
            } else if (id === 'section_separator') {
                if (currentFieldChunk.length > 0) {
                    chunks.push(currentFieldChunk);
                    currentFieldChunk = [];
                }
                chunks.push(id);
            } else {
                const isAssigned = finalConfig.sections.some(s => s.fieldIds.includes(id));
                const fieldConfig = finalConfig.fields[id];
                if (!isAssigned && fieldConfig) {
                    if (!addedTopLevelFields.has(id)) {
                        currentFieldChunk.push(id);
                        addedTopLevelFields.add(id);
                    }
                }
            }
        });

        if (currentFieldChunk.length > 0) {
            chunks.push(currentFieldChunk);
        }
        return chunks;
    }, [finalConfig]);
    
    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" autoComplete="off">
            {layoutChunks.map((chunk, index) => {
                if (typeof chunk === 'string') {
                    if (chunk === 'section_separator') {
                        return <div key={`sep-${index}`} className="border-b pt-6"></div>;
                    }
                    const section = sectionsById[chunk];
                    if (!section) return null;
                    return (
                         <SectionRenderer
                            key={section.id}
                            section={section}
                            config={finalConfig}
                            control={control}
                            disabled={disabled}
                            roles={roles}
                            rolesLoaded={rolesLoaded}
                            activeGuardStaff={activeGuardStaff}
                            predefinedValues={predefinedValues}
                            units={units}
                            setValue={setValue}
                        />
                    );
                } else {
                    return (
                        <div key={`chunk-${index}`} className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-x-4 gap-y-6">
                            {chunk.map(fieldId => {
                                const fieldConfig = finalConfig.fields[fieldId];
                                if (!fieldConfig) return null;
                                const isFullWidth = fieldConfig.type === 'textarea';
                                const FieldComponent = getFieldComponent(fieldId, fieldConfig, roles, rolesLoaded, units, activeGuardStaff, setValue);

                                return (
                                    <div key={fieldId} className={cn("space-y-2", isFullWidth && "sm:col-span-2 3xl:col-span-3")}>
                                        <Label htmlFor={fieldId}>{fieldConfig.label || fieldId}</Label>
                                        <Controller
                                            name={fieldId}
                                            control={control}
                                            render={({ field }) => <FieldComponent {...field} disabled={disabled} />}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )
                }
            })}
        </form>
    );
});
ReportForm.displayName = 'ReportForm';
