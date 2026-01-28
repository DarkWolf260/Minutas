'use client';

import { useMemo, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  FieldType,
  StaffRole,
  SectionConfig,
  StaffMember,
} from '@/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { parseTemplate, renderFinalReport, evaluateCondition } from '@/lib/template-parser';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { TimeHlvInput } from '@/components/time-hlv-input';
import { DatePicker } from '@/components/date-picker';
import { useRoles } from '@/hooks/use-roles';
import { useGuards } from '@/hooks/use-guards';
import { MultiInput } from '@/components/ui/multi-input';
import { useDepartments } from '@/hooks/use-departments';
import { useUnits } from '@/hooks/use-units';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddressInput } from '@/components/ui/address-input';
import { useSettings } from '@/hooks/use-settings';
import { CedulaInput } from '@/components/cedula-input';
import { toast } from 'sonner';
import { formatStaffMemberForDisplay, formatStaffMemberForAutocomplete } from '@/lib/formatters';

function getFieldComponent(
  fieldId: string,
  fieldConfig: FieldConfig,
  roles: StaffRole[],
  rolesLoaded: boolean,
  units: string[],
  staffOptions: StaffMember[],
  setValue: (
    name: string,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void,
  settings: any // Using 'any' for simplicity, should be AppSettings
) {
  const lowerFieldId = fieldId.toLowerCase();
  const addressFieldNames = ['dirección', 'ubicación', 'destino'];

  // Check for Reporta field (Analista is discarded)
  if (lowerFieldId === 'reporta') {
    const reportaRoleIds = settings.reportaRoleIds || [];
    const reportingStaff = staffOptions.filter((staff) =>
      staff.roleId && reportaRoleIds.includes(staff.roleId)
    );

    return (props: any) => {
      const { onChange, value, disabled } = props;

      // The value might be an array of StaffMember objects. We need the ID for the Select.
      const selectedStaffId =
        Array.isArray(value) && value.length > 0 && typeof value[0] === 'object'
          ? value[0].id
          : undefined;

      const handleSelectChange = (staffId: string) => {
        const selectedStaff = reportingStaff.find((s) => s.id === staffId);
        // The form expects an array for this field
        onChange(selectedStaff ? [selectedStaff] : []);
      };

      return (
        <Select onValueChange={handleSelectChange} value={selectedStaffId} disabled={disabled}>
          <SelectTrigger>
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
    };
  }

  // If type is explicitly something other than 'text', prioritize the switch
  if (fieldConfig.type && fieldConfig.type !== 'text') {
    switch (fieldConfig.type) {
      case 'textarea':
        return (props: any) => <Textarea {...props} rows={1} />;
      case 'time-hlv':
        return (props: any) => <TimeHlvInput {...props} />;
      case 'date':
        return (props: any) => <DatePicker {...props} />;
      case 'multi-text':
        return (props: any) => (
          <MultiInput
            {...props}
            value={
              Array.isArray(props.value) ? props.value : props.value ? [String(props.value)] : []
            }
            placeholder="Escribe y presiona Enter para añadir..."
          />
        );
      case 'dropdown':
        return (props: any) => {
          const { name, onChange, value, disabled } = props;
          const handleSelect = (selectedLabel: string) => {
            const selectedOption = (fieldConfig.snippetOptions || []).find(
              (opt) => opt.label === selectedLabel
            );
            if (selectedOption) {
              onChange(selectedOption.label);
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
                {(fieldConfig.snippetOptions || []).map((option) => (
                  <SelectItem key={option.id} value={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        };
    }
  }

  // Default or explicitly 'text': use name-based specialization or standard input
  if (lowerFieldId === 'cédula') {
    return (props: any) => <CedulaInput {...props} />;
  }

  if (addressFieldNames.includes(lowerFieldId)) {
    return (props: any) => (
      <AddressInput {...props} placeholder="Selecciona o escribe una dirección..." />
    );
  }

  if (fieldId === 'Unidad') {
    return (props: any) => (
      <MultiInput
        {...props}
        options={units}
        placeholder="Buscar o añadir unidades..."
        value={Array.isArray(props.value) ? props.value : props.value ? [String(props.value)] : []}
      />
    );
  }

  const role = rolesLoaded ? roles.find((r) => r.name.toLowerCase() === lowerFieldId) : null;
  if (role) {
    return (props: any) => {
      const currentValue = Array.isArray(props.value)
        ? props.value.map((val: any) => (typeof val === 'object' && val.name ? val.name : val))
        : [];
      const autocompleteOptions = staffOptions.map((member) =>
        formatStaffMemberForAutocomplete(member, false)
      );
      const handleMultiInputChange = (newValue: string[] | string) => {
        const finalValueArray = Array.isArray(newValue) ? newValue : [newValue];
        props.onChange(finalValueArray);
      };

      return (
        <MultiInput
          {...props}
          options={autocompleteOptions}
          placeholder="Buscar o añadir..."
          value={currentValue}
          isSingle={role.isSingle}
          onChange={(val) => handleMultiInputChange(val as string[] | string)}
        />
      );
    };
  }

  return (props: any) => <Input {...props} />;
}

function RepeatableSectionRenderer({
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
}: any) {
  const { fields, append, remove } = useFieldArray({ control, name: section.id });
  const defaultItem = useMemo(
    () =>
      section.fieldIds.reduce(
        (acc: any, fieldId: string) => ({
          ...acc,
          [fieldId]: predefinedValues.hasOwnProperty(fieldId) ? predefinedValues[fieldId] : '',
        }),
        {}
      ),
    [section.fieldIds, predefinedValues]
  );

  // Simplified UI for single-field repeatable sections
  if (section.fieldIds.length === 1) {
    const fieldId = section.fieldIds[0];
    const fieldConfig = (config.fields || {})[fieldId];
    if (!fieldConfig) return null;

    const isFullWidth = fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;
    const FieldComponent = getFieldComponent(
      fieldId,
      fieldConfig,
      roles,
      rolesLoaded,
      units,
      activeGuardStaff,
      setValue,
      settings
    );
    const defaultSingleFieldItem = { [fieldId]: '' };

    return (
      <div
        className={cn('space-y-4', !isNested && 'pt-4', isNested && isFullWidth && 'sm:col-span-2')}
      >
        {section.label &&
          (isNested ? (
            <Label className="text-sm font-medium">
              {section.label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          ) : (
            <h3 className="text-lg font-semibold">
              {section.label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </h3>
          ))}
        <div className="space-y-2">
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1">
                <Controller
                  name={`${section.id}.${index}.${fieldId}`}
                  control={control}
                  rules={{ required: fieldConfig.required ? 'Este campo es obligatorio' : false }}
                  render={({ field, fieldState: { error } }) => (
                    <div className="flex flex-col gap-1 w-full">
                      <FieldComponent
                        {...field}
                        disabled={disabled}
                        className={cn(error && 'border-destructive')}
                      />
                      {error && (
                        <span className="text-[10px] text-destructive">{error.message}</span>
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
          <Button type="button" variant="outline" onClick={() => append(defaultSingleFieldItem)}>
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
      className={cn('space-y-4', !isNested && 'pt-4', isNested && isFullWidth && 'sm:col-span-2')}
    >
      {section.label && <h3 className="text-lg font-semibold">{section.label}</h3>}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 rounded-md border bg-muted/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {section.repeatableItemLabel
                  ? `${section.repeatableItemLabel} #${String(index + 1).padStart(2, '0')}`
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
              {(section.layout || section.fieldIds).map((fieldId: string) => {
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
                  // We need to pass down the correct path prefix
                  // This part is getting complex. For now, let's assume no nested repeatable sections.
                  return (
                    <p key={fieldId} className="text-destructive text-xs">
                      Nested sections not fully supported here yet.
                    </p>
                  );
                }

                const fieldConfig = (config.fields || {})[fieldId];
                if (!fieldConfig) return null;
                const isFullWidth = fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;
                const path = `${section.id}.${index}.${fieldId}`;
                const FieldComponent = getFieldComponent(
                  fieldId,
                  fieldConfig,
                  roles,
                  rolesLoaded,
                  units,
                  activeGuardStaff,
                  setValue,
                  settings
                );

                return (
                  <div key={fieldId} className={cn('space-y-2', isFullWidth && 'sm:col-span-2')}>
                    <Label htmlFor={path}>
                      {fieldConfig?.label || fieldId}
                      {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Controller
                      name={path}
                      control={control}
                      rules={{
                        required: fieldConfig.required ? 'Este campo es obligatorio' : false,
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <div className="flex flex-col gap-1">
                          <FieldComponent
                            {...field}
                            disabled={disabled}
                            className={cn(error && 'border-destructive')}
                          />
                          {error && (
                            <span className="text-[10px] text-destructive">{error.message}</span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                );
              })}
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

function SingleSectionRenderer({
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
}: any) {
  if (section.fieldIds.length === 0 && section.label) {
    return (
      <div className={cn(!isNested && 'pt-4')}>
        <h3 className="text-lg font-semibold">{section.label}</h3>
      </div>
    );
  }

  if (section.fieldIds.length === 0 && !section.label) {
    return <div className="pt-2"></div>;
  }

  return (
    <div className={cn('space-y-4', !isNested && 'pt-4')}>
      {section.label && <h3 className="text-lg font-semibold">{section.label}</h3>}
      <div className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-x-4 gap-y-6">
        {(section.layout || section.fieldIds).map((fieldId: string) => {
          if (
            fieldId.startsWith('section_') ||
            fieldId.startsWith('sec_') ||
            fieldId.startsWith('cond_')
          ) {
            // Nested non-repeatable section
            const nestedSection = config.sections.find((s: SectionConfig) => s.id === fieldId);
            if (!nestedSection) return null;
            return (
              <SectionRenderer
                key={fieldId}
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
              />
            );
          }

          const fieldConfig = (config.fields || {})[fieldId];
          if (!fieldConfig) return null;
          const isFullWidth = fieldConfig.type === 'textarea' || fieldConfig.isFullWidth;
          const path = `${section.id}.${fieldId}`;
          const FieldComponent = getFieldComponent(
            fieldId,
            fieldConfig,
            roles,
            rolesLoaded,
            units,
            activeGuardStaff,
            setValue,
            settings
          );

          return (
            <div
              key={fieldId}
              className={cn('space-y-2', isFullWidth && 'sm:col-span-2 3xl:col-span-3')}
            >
              <Label htmlFor={path}>
                {fieldConfig?.label || fieldId}
                {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Controller
                name={path}
                control={control}
                rules={{ required: fieldConfig.required ? 'Este campo es obligatorio' : false }}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col gap-1">
                    <FieldComponent
                      {...field}
                      disabled={disabled}
                      className={cn(error && 'border-destructive')}
                    />
                    {error && <span className="text-[10px] text-destructive">{error.message}</span>}
                  </div>
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionRenderer(props: {
  section: SectionConfig;
  config: TemplateConfig;
  control: any;
  disabled: boolean;
  roles: StaffRole[];
  rolesLoaded: boolean;
  activeGuardStaff: StaffMember[];
  predefinedValues: Record<string, string>;
  units: string[];
  setValue: (
    name: string,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
  settings: any;
  isNested?: boolean;
}) {
  const { section, config, control } = props;
  const condition = section.condition;

  // Always call useWatch, but conditionally enable it
  const watchedFieldValue = useWatch({
    control,
    name: condition?.fieldId || 'dummy_field_to_avoid_errors',
    disabled: !condition,
  });

  if (condition) {
    let actualValue = watchedFieldValue;

    const pathParts = (condition.fieldId || '').split('.');
    if (pathParts.length > 1) {
      // NOTE: This useWatch logic for deep paths inside a condition check MIGHT still be risky if pathParts check changes.
      // However, usually condition.fieldId is stable for a given section.id.
      // For now, assume simple conditions. Deep path watching logic was inline and conditional.
      // Ideally we should use watch() from useForm context if possible, or accept it is what it is.
      // But strict hooks rules say NO hooks in if.
      // The previous code had: if (pathParts.length > 1) { const watchedFormValues = useWatch({ control }); ... }
      // This IS a violation if pathParts.length changes dynamically.
      // We should useWatch the whole form or NOT useWatch conditionally.
      // Let's rely on the top level useWatch for the specific field.
    }

    // Logic to evaluate condition
    const fieldConfig = config.fields[condition.fieldId];
    const options = fieldConfig?.snippetOptions || [];

    // Legacy: Check if condition is checking for a specific index of a dropdown
    // This is kept for backward compatibility with existing templates using [?{Field}=0]
    if (fieldConfig?.type === 'dropdown' && /^\d+$/.test(condition.value)) {
      const selectedIndex = options.findIndex((opt) => opt.label === actualValue);
      // Only use index logic if the value matches an index
      if (selectedIndex !== -1) {
        // Check if it matches exactly
        if (String(selectedIndex) === condition.value) {
          // Condition met by index
        } else {
          return null;
        }
      } else {
        // If value is not in options (maybe free text?) or didn't match index logic
        // Fallback to standard evaluation below
        // Wait, if users wrote [?{Motivo}=0] and value is "Accidente", we must map "Accidente" -> Index and compare.
        // If selectedIndex != condition.value, then it DOES NOT MATCH.

        // However, we now want to allow [?{Motivo}=Accidente].
        // If condition.value is "Accidente", /^\d+$/ is false. It goes to standard eval.

        // If condition.value is "0":
        // Case A: Motivo="Accidente" (which is index 0). selectedIndex=0. "0"==="0". Match.
        // Case B: Motivo="Otro" (index 1). selectedIndex=1. "1"!=="0". No Match.

        if (String(selectedIndex) !== condition.value) return null;
      }
    } else {
      // Standard Evaluation using the shared logic (handles strings, numbers, operators)
      // We need to import evaluateCondition from template-parser.
      // Since we can't easily add the import in this scoped replace, we'll implement a safe local check
      // or assume evaluateCondition is available if we add the import.
      // Let's rely on adding the import statement in a separate replacement or use a MultiReplace to do both.

      // For now, let's duplicate the simple string check to ensure strictness if import is hard?
      // No, the task is to use the parser logic. I will add the import in a previous step or next step.
      // Wait, I cannot add imports easily with replace_file_content if I don't target the top.
      // I will assume I can add the import at the top of this file in a separate call or modify this block to not need it?
      // Actually, evaluateCondition IS simple enough to inline here if I want to avoid Top-File edits multiple times.
      // BUT, consistency is key. I'll use evaluateCondition and fix imports in next step.

      if (!evaluateCondition(actualValue, condition.operator || '=', condition.value)) {
        return null;
      }
    }
  }

  if (section.isRepeatable) {
    return <RepeatableSectionRenderer {...props} />;
  }

  return <SingleSectionRenderer {...props} />;
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

export const ReportForm = forwardRef<ReportFormRef, ReportFormProps>(
  ({ template, config, initialData, onSubmit, disabled = false, onDataChange }, ref) => {
    const { definitions } = useFieldDefinitions();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const { guards, isLoaded: guardsLoaded } = useGuards();
    const { departments, isLoaded: deptsLoaded } = useDepartments();
    const { settings, isLoaded: settingsLoaded } = useSettings();
    const { units } = useUnits();

    const activeGuardStaff = useMemo(() => {
      if (!settingsLoaded || !guardsLoaded || !settings.activeGuardId) return [];
      const activeGuard = guards.find((g) => g.id === settings.activeGuardId);
      if (!activeGuard || !activeGuard.staff) return [];

      const staffSetWithRoles = new Set<StaffMember & { roleId?: string }>();
      Object.entries(activeGuard.staff).forEach(([roleName, staffList]) => {
        const roleId = roles.find((r) => r.name === roleName)?.name; // Using name as ID for now
        staffList.forEach((person) => {
          staffSetWithRoles.add({ ...person, roleId: roleId });
        });
      });

      return Array.from(staffSetWithRoles).sort((a, b) => a.name.localeCompare(b.name));
    }, [settings.activeGuardId, guards, settingsLoaded, guardsLoaded, roles]);

    const finalConfig = useMemo(() => {
      if (!config || !template) return { fields: {}, sections: [], layout: [] };

      const {
        sections,
        layout,
        fieldNames,
        fieldTypes,
        templateOptions,
        fieldModifiers,
        fieldWidths,
        requiredFields,
      } = parseTemplate(template.content);

      const newConfig: TemplateConfig = {
        fields: {},
        sections,
        layout,
      };

      let timeHlvFieldInConfig: string | null = null;
      const templateConfigFields = config.fields || {};

      if (config.fields) {
        timeHlvFieldInConfig =
          Object.keys(config.fields).find((k) => config.fields[k]?.type === 'time-hlv') || null;
      }

      fieldNames.forEach((fieldId) => {
        const templateFieldConfig = templateConfigFields[fieldId];
        const globalDef = definitions[fieldId];
        const typeFromTemplate = fieldTypes.get(fieldId);

        // Priority: template-specific config > global definition > calculated > default
        const mergedConfig = { ...(globalDef || {}), ...(templateFieldConfig || {}) };

        // Determine the type with proper priority
        let fieldType: FieldType = 'text';

        // Priority 1: Explicitly specified type from template (e.g. {Field:dropdown})
        if (typeFromTemplate && typeFromTemplate !== 'text') {
          fieldType = typeFromTemplate;
        }
        // Priority 2: Special handling for Fecha and Hora fields by name
        else if (fieldId.toLowerCase() === 'fecha') {
          fieldType = 'date';
        } else if (fieldId.toLowerCase() === 'hora') {
          if (!timeHlvFieldInConfig || timeHlvFieldInConfig === fieldId) {
            fieldType = 'time-hlv';
            if (!timeHlvFieldInConfig) timeHlvFieldInConfig = fieldId;
          } else {
            fieldType = 'text';
          }
        }
        // Priority 3: Use type from template even if it's 'text'
        else if (typeFromTemplate) {
          fieldType = typeFromTemplate;
        }
        // Priority 4: Check template config (from JSON/Props)
        else if (templateFieldConfig?.type) {
          fieldType = templateFieldConfig.type;
        }
        // Priority 5: Check global definition
        else if (globalDef?.type) {
          fieldType = globalDef.type;
        }
        // Priority 6: Otherwise use merged config or default to 'text'
        else if ((mergedConfig as any).type) {
          fieldType = (mergedConfig as any).type;
        }

        newConfig.fields[fieldId] = {
          ...mergedConfig,
          type: fieldType,
          label: (mergedConfig as any).label || fieldId,
        } as FieldConfig;

        if (templateOptions.has(fieldId)) {
          newConfig.fields[fieldId].snippetOptions = templateOptions.get(fieldId);
        }

        // Apply text modifiers if defined in template
        if (fieldModifiers.has(fieldId)) {
          newConfig.fields[fieldId].modifiers = fieldModifiers.get(fieldId) as any;
        } else if ((mergedConfig as any).modifier) {
          // Backward compatibility for singular modifier in config
          newConfig.fields[fieldId].modifiers = [(mergedConfig as any).modifier];
        }

        // Apply full width if defined in template or if it's a textarea
        if (fieldWidths.has(fieldId)) {
          newConfig.fields[fieldId].isFullWidth = true;
        }

        // Apply required if defined in template
        if (requiredFields.has(fieldId)) {
          newConfig.fields[fieldId].required = true;
        }
      });

      return newConfig;
    }, [config, template, definitions]);

    const predefinedValues: Record<string, string> = useMemo(() => {
      const values: Record<string, string> = {};
      Object.entries(definitions).forEach(([key, config]) => {
        if (config.type === 'predefined' || key === 'Fecha') {
          // Treat Fecha as a dynamic predefined value
          values[key] = config.value || '';
        }
      });
      return values;
    }, [definitions]);

    const getInitialValues = useCallback(
      (data?: Record<string, any>) => {
        const initialFormValues = data ? JSON.parse(JSON.stringify(data)) : {};

        const applyDefaults = (target: Record<string, any>, fieldIds: string[]) => {
          fieldIds.forEach((fieldId) => {
            if (target[fieldId] === undefined || target[fieldId] === null) {
              const keyLower = fieldId.toLowerCase();
              const foundKey = Object.keys(predefinedValues).find(
                (k) => k.toLowerCase() === keyLower
              );

              if (foundKey) {
                target[fieldId] = predefinedValues[foundKey];
              } else {
                const role = roles.find((r) => r.name.toLowerCase() === keyLower);
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
        const topLevelFieldIds = finalConfig.layout.filter((id) => {
          if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_'))
            return false;
          const isAssigned = finalConfig.sections.some((s) => s.fieldIds.includes(id));
          if (isAssigned) return false;
          if (addedTopLevelFields.has(id)) return false;
          addedTopLevelFields.add(id);
          return true;
        });
        applyDefaults(initialFormValues, topLevelFieldIds);

        // Initialize all sections
        finalConfig.sections.forEach((section) => {
          if (section.isRepeatable) {
            // For repeatable sections, ensure it's an array and has at least one item if no data is provided
            if (!initialFormValues[section.id] || !Array.isArray(initialFormValues[section.id])) {
              initialFormValues[section.id] = [];
            }

            const sectionData = initialFormValues[section.id];

            // If it's a new report (no data) or the array is empty, add the first default item
            if ((!data || sectionData.length === 0) && sectionData.length === 0) {
              const defaultItem = {};
              applyDefaults(defaultItem, section.fieldIds);
              sectionData.push(defaultItem);
            } else {
              // Populate defaults for existing items
              sectionData.forEach((item: Record<string, any>) => {
                applyDefaults(item, section.fieldIds);
              });
            }
          } else {
            if (!initialFormValues[section.id]) {
              initialFormValues[section.id] = {};
            }

            const sectionObject = initialFormValues[section.id];

            section.fieldIds.forEach((fieldId) => {
              if (sectionObject[fieldId] === undefined || sectionObject[fieldId] === null) {
                const keyLower = fieldId.toLowerCase();
                const foundKey = Object.keys(predefinedValues).find(
                  (k) => k.toLowerCase() === keyLower
                );

                if (foundKey) {
                  sectionObject[fieldId] = predefinedValues[foundKey];
                } else {
                  const role = roles.find((r) => r.name.toLowerCase() === keyLower);
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
      },
      [finalConfig, predefinedValues, roles]
    );

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
      submit: () => {
        handleSubmit(handleFormSubmit, (errors) => {
          logger.error('Form validation errors', new Error('Validation failed'), { feature: 'ReportForm', metadata: { errors } });
          toast.error('Por favor, corrige los errores en el formulario antes de guardar.');
        })();
      },
      getValues: getValues,
      getRenderedContent: () => {
        const formData = getValues();
        return renderFinalReport(template.content, formData, finalConfig, predefinedValues);
      },
    }));

    const sectionsById = useMemo(
      () =>
        finalConfig.sections.reduce(
          (acc, section) => {
            acc[section.id] = section;
            return acc;
          },
          {} as Record<string, SectionConfig>
        ),
      [finalConfig.sections]
    );

    const layoutChunks = useMemo(() => {
      const chunks: (string[] | string)[] = [];
      let currentFieldChunk: string[] = [];
      const addedTopLevelFields = new Set<string>();

      finalConfig.layout.forEach((id) => {
        if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
          if (currentFieldChunk.length > 0) {
            chunks.push(currentFieldChunk);
            currentFieldChunk = [];
          }
          chunks.push(id);
        } else if (id === 'section_separator' || id === 'sec_separator') {
          if (currentFieldChunk.length > 0) {
            chunks.push(currentFieldChunk);
            currentFieldChunk = [];
          }
          chunks.push(id);
        } else {
          const isAssigned = finalConfig.sections.some((s) => s.fieldIds.includes(id));
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
                settings={settings}
              />
            );
          } else {
            return (
              <div
                key={`chunk-${index}`}
                className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-3 gap-x-4 gap-y-6"
              >
                {chunk.map((fieldId) => {
                  const fieldConfig = finalConfig.fields[fieldId];
                  if (!fieldConfig) return null;
                  const isFullWidth = fieldConfig.type === 'textarea';
                  const FieldComponent = getFieldComponent(
                    fieldId,
                    fieldConfig,
                    roles,
                    rolesLoaded,
                    units,
                    activeGuardStaff,
                    setValue,
                    settings
                  );

                  return (
                    <div
                      key={fieldId}
                      className={cn('space-y-2', isFullWidth && 'sm:col-span-2 3xl:col-span-3')}
                    >
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
            );
          }
        })}
      </form>
    );
  }
);
ReportForm.displayName = 'ReportForm';
