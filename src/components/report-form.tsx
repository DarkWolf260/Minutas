
'use client';

import { useMemo, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import type { Template, TemplateConfig, FieldConfig, FieldType, StaffRole, SectionConfig } from '@/types';
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


function renderField(fieldId: string, fieldConfig: FieldConfig, control: any, disabled: boolean, roles: StaffRole[], rolesLoaded: boolean, staffOptions: string[]) {
    const getFieldType = (fieldId: string, originalType: FieldType): FieldType | 'multi-text' => {
        if (!rolesLoaded) return originalType;
        const role = roles.find(r => r.name === fieldId);
        if (role && !role.isSingle && originalType === 'text') {
            return 'multi-text';
        }
        return originalType;
    };
    
    const type = getFieldType(fieldId, fieldConfig?.type || 'text');

    switch (type) {
        case 'textarea':
             return (
                 <Controller
                    name={fieldId}
                    control={control}
                    render={({ field }) => (
                        <Textarea {...field} disabled={disabled} />
                    )}
                 />
            );
        case 'time-hlv':
            return (
                <Controller
                    name={fieldId}
                    control={control}
                    render={({ field }) => (
                        <TimeHlvInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            disabled={disabled}
                        />
                    )}
                />
            );
        case 'date':
            return (
                <Controller
                    name={fieldId}
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            value={field.value || ''}
                            onChange={field.onChange}
                            disabled={disabled}
                        />
                    )}
                />
            );
        case 'multi-text':
            return (
                 <Controller
                    name={fieldId}
                    control={control}
                    render={({ field }) => (
                        <MultiInput
                            options={staffOptions}
                            value={Array.isArray(field.value) ? field.value : []}
                            onChange={field.onChange}
                            placeholder="Buscar o añadir..."
                            disabled={disabled}
                        />
                    )}
                />
            );
        case 'text':
        default:
             return (
                 <Controller
                    name={fieldId}
                    control={control}
                    render={({ field }) => (
                        <Input {...field} disabled={disabled} />
                    )}
                 />
            );
    }
}

function SectionRenderer({ section, config, control, disabled, roles, rolesLoaded, getStaffOptionsForRole, predefinedValues }: { section: SectionConfig, config: TemplateConfig, control: any, disabled: boolean, roles: StaffRole[], rolesLoaded: boolean, getStaffOptionsForRole: (roleName: string) => string[], predefinedValues: Record<string, string> }) {
    const visibleFields = useMemo(() => section.fieldIds, [section.fieldIds]);

    if (section.isRepeatable) {
        const { fields, append, remove } = useFieldArray({ control, name: section.id });
        const defaultItem = section.fieldIds.reduce((acc, fieldId) => ({ ...acc, [fieldId]: predefinedValues.hasOwnProperty(fieldId) ? predefinedValues[fieldId] : '' }), {});

        return (
            <div className="space-y-4 border-t pt-6">
                {section.label && <h3 className="text-lg font-semibold">{section.label}</h3>}
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="bg-muted/30 overflow-hidden">
                            <div className="flex items-center justify-between bg-muted/60 p-3 border-b">
                                <h4 className="font-semibold text-md">
                                    {section.repeatableItemLabel ? `${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}` : `${section.label} #${String(index + 1).padStart(2, '0')}`}
                                </h4>
                                 {!disabled && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                 )}
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                    {visibleFields.map(fieldId => {
                                        const fieldConfig = (config.fields || {})[fieldId];
                                        if (!fieldConfig) return null;
                                        const isFullWidth = fieldConfig.type === 'textarea';
                                        const path = `${section.id}.${index}.${fieldId}`;
                                        const staffOptions = getStaffOptionsForRole(fieldId);
                                        const finalDisabled = disabled;

                                        return (
                                            <div key={fieldId} className={cn("space-y-2", isFullWidth && "sm:col-span-2")}>
                                                <Label htmlFor={path}>{fieldConfig?.label || fieldId}</Label>
                                                <Controller
                                                    name={path}
                                                    control={control}
                                                    render={({ field }) => {
                                                        const role = roles.find(r => r.name === fieldId);
                                                        const fieldType = (role && !role.isSingle ? 'multi-text' : fieldConfig.type) || 'text';
                                                        
                                                        if (fieldType === 'multi-text') {
                                                            return <MultiInput options={staffOptions} value={Array.isArray(field.value) ? field.value : []} onChange={field.onChange} placeholder="Buscar o añadir..." disabled={finalDisabled} />;
                                                        }
                                                        if (fieldType === 'textarea') {
                                                            return <Textarea {...field} disabled={finalDisabled} />;
                                                        }
                                                        if (fieldType === 'time-hlv') {
                                                            return <TimeHlvInput value={field.value || ''} onChange={field.onChange} disabled={finalDisabled} />;
                                                        }
                                                        if (fieldType === 'date') {
                                                            return <DatePicker value={field.value || ''} onChange={field.onChange} disabled={finalDisabled} />;
                                                        }
                                                        return <Input {...field} disabled={finalDisabled} />;
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                {!disabled && (
                    <Button type="button" variant="outline" onClick={() => append(defaultItem)}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                 {visibleFields.map(fieldId => {
                    const fieldConfig = (config.fields || {})[fieldId];
                    if (!fieldConfig) return null;
                    const isFullWidth = fieldConfig.type === 'textarea';
                    const path = `${section.id}.${fieldId}`;
                    const staffOptions = getStaffOptionsForRole(fieldId);
                    const finalDisabled = disabled;

                    return (
                        <div key={fieldId} className={cn("space-y-2", isFullWidth && "sm:col-span-2")}>
                            <Label htmlFor={path}>{fieldConfig?.label || fieldId}</Label>
                            <Controller
                                name={path}
                                control={control}
                                render={({ field }) => {
                                    const role = roles.find(r => r.name === fieldId);
                                    const fieldType = (role && !role.isSingle ? 'multi-text' : fieldConfig.type) || 'text';
                                    
                                    if (fieldType === 'multi-text') {
                                        return <MultiInput options={staffOptions} value={Array.isArray(field.value) ? field.value : []} onChange={field.onChange} placeholder="Buscar o añadir..." disabled={finalDisabled} />;
                                    }
                                    if (fieldType === 'textarea') {
                                        return <Textarea {...field} disabled={finalDisabled} />;
                                    }
                                    if (fieldType === 'time-hlv') {
                                        return <TimeHlvInput value={field.value || ''} onChange={field.onChange} disabled={finalDisabled} />;
                                    }
                                    if (fieldType === 'date') {
                                        return <DatePicker value={field.value || ''} onChange={field.onChange} disabled={finalDisabled} />;
                                    }
                                    return <Input {...field} disabled={finalDisabled} />;
                                }}
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

    const getStaffOptionsForRole = useCallback((roleName: string): string[] => {
        const role = roles.find(r => r.name === roleName);
        if (!role || !guardsLoaded || !deptsLoaded) return [];

        const staffSet = new Set<string>();
        const isGlobal = !role.departmentScope || role.departmentScope.length === 0;

        if (isGlobal || role.departmentScope.includes('OPERATIONS')) {
             guards.forEach(guard => {
                const staffForRole = guard.staff[roleName];
                if (staffForRole) staffForRole.forEach(person => staffSet.add(person));
            });
        }

        departments.forEach(dept => {
             if (isGlobal || role.departmentScope.includes(dept.id)) {
                const staffForRole = dept.staff[roleName];
                if (staffForRole) staffForRole.forEach(person => staffSet.add(person));
            }
        });
        
        return Array.from(staffSet).sort();
    }, [roles, guards, departments, guardsLoaded, deptsLoaded]);

    const finalConfig = useMemo(() => {
        if (!config || !template) return { fields: {}, sections: [], layout: []};

        const { sections, layout, fieldNames } = parseTemplate(template.content);

        const newConfig: TemplateConfig = {
            fields: {},
            sections,
            layout
        };
        
        let timeHlvFieldInConfig: string | null = null;
        if (config && config.fields) {
            timeHlvFieldInConfig = Object.keys(config.fields).find(k => config.fields[k]?.type === 'time-hlv') || null;
        }

        fieldNames.forEach(fieldId => {
            const existingFieldConfig = (config.fields || {})[fieldId];
            
            newConfig.fields[fieldId] = existingFieldConfig 
                ? { ...existingFieldConfig } 
                : { type: 'text', label: fieldId };
            
            newConfig.fields[fieldId].label = fieldId;

            const globalDef = definitions[fieldId];

            if (globalDef) {
                 newConfig.fields[fieldId].type = globalDef.type || 'text';
                 if (globalDef.type === 'time-hlv' && !timeHlvFieldInConfig) {
                    timeHlvFieldInConfig = fieldId;
                }
            } 
            else if (fieldId.toLowerCase() === 'fecha') {
                newConfig.fields[fieldId].type = 'date';
            }
            else if (fieldId.toLowerCase() === 'hora') {
                if (!timeHlvFieldInConfig) {
                    newConfig.fields[fieldId].type = 'time-hlv';
                    timeHlvFieldInConfig = fieldId;
                } else if (timeHlvFieldInConfig !== fieldId && newConfig.fields[fieldId].type === 'time-hlv') {
                    newConfig.fields[fieldId].type = 'text';
                }
            }
        });
        
        return newConfig;
    }, [config, template, definitions]);
    
    const predefinedValues: Record<string, string> = useMemo(() => {
        const values: Record<string, string> = {};
        Object.entries(definitions).forEach(([key, config]) => {
            if (config.type === 'predefined') {
                values[key] = config.value || '';
            }
        });
        return values;
    }, [definitions]);

    const getInitialValues = useCallback((data?: Record<string, any>) => {
        const initialFormValues = data ? JSON.parse(JSON.stringify(data)) : {};
        const isNewReport = !data;

        const applyDefaults = (target: Record<string, any>, fieldIds: string[]) => {
            fieldIds.forEach(fieldId => {
                if (target[fieldId] === undefined || target[fieldId] === null) {
                    if (predefinedValues.hasOwnProperty(fieldId)) {
                        target[fieldId] = predefinedValues[fieldId];
                    }
                    else if (isNewReport && fieldId === 'Fecha') {
                        target[fieldId] = new Date().toISOString().split('T')[0];
                    }
                    else {
                        target[fieldId] = '';
                    }
                }
            });
        };

        const topLevelFieldIds = finalConfig.layout.filter(id => !id.startsWith('section_'));
        applyDefaults(initialFormValues, topLevelFieldIds);

        finalConfig.sections.forEach(section => {
            if (section.isRepeatable) {
                if (Array.isArray(initialFormValues[section.id])) {
                    initialFormValues[section.id].forEach((item: Record<string, any>) => {
                        applyDefaults(item, section.fieldIds);
                    });
                } else {
                    initialFormValues[section.id] = [];
                }
            } else {
                // Ensure the section object exists on the initial values
                if (!initialFormValues[section.id]) {
                    initialFormValues[section.id] = {};
                }
                
                // Get a reference to the nested object for this section
                const sectionObject = initialFormValues[section.id];
                
                // Populate its fields with defaults if they don't exist
                section.fieldIds.forEach(fieldId => {
                    if (sectionObject[fieldId] === undefined || sectionObject[fieldId] === null) {
                         if (predefinedValues.hasOwnProperty(fieldId)) {
                            sectionObject[fieldId] = predefinedValues[fieldId];
                        } else {
                            sectionObject[fieldId] = '';
                        }
                    }
                });
            }
        });

        return initialFormValues;
    }, [finalConfig, predefinedValues]);
    
    const { handleSubmit, control, watch, reset, getValues } = useForm({
        defaultValues: getInitialValues(initialData),
    });

    useEffect(() => {
        if (!onDataChange) return;
        const subscription = watch((value) => {
            onDataChange(value);
        });
        return () => subscription.unsubscribe();
    }, [watch, onDataChange]);


    useEffect(() => {
        reset(getInitialValues(initialData));
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
                    currentFieldChunk.push(id);
                }
            }
        });

        if (currentFieldChunk.length > 0) {
            chunks.push(currentFieldChunk);
        }
        return chunks;
    }, [finalConfig]);

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                            getStaffOptionsForRole={getStaffOptionsForRole}
                            predefinedValues={predefinedValues}
                        />
                    );
                } else {
                    return (
                        <div key={`chunk-${index}`} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            {chunk.map(fieldId => {
                                const fieldConfig = finalConfig.fields[fieldId];
                                if (!fieldConfig) return null;
                                const isFullWidth = fieldConfig.type === 'textarea';
                                const staffOptions = getStaffOptionsForRole(fieldId);
                                const finalDisabled = disabled;

                                return (
                                    <div key={fieldId} className={cn("space-y-2", isFullWidth && "sm:col-span-2")}>
                                        <Label htmlFor={fieldId}>{fieldConfig.label || fieldId}</Label>
                                        {renderField(fieldId, fieldConfig, control, finalDisabled, roles, rolesLoaded, staffOptions)}
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
