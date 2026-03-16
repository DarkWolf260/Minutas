'use client';

import { useMemo, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  FieldType,
  SectionConfig,
  StaffMember,
  FormDataRecord,
} from '@/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { Label } from '@/components/ui/label';
import { parseTemplate, renderFinalReport } from '@/lib/template-parser';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useRoles } from '@/hooks/use-roles';
import { useGuards } from '@/hooks/use-guards';
import { useUnits } from '@/hooks/use-units';
import { useSettings } from '@/hooks/use-settings';
import { usePersonnel } from '@/hooks/use-personnel';
import { formatStaffMember, formatStaffMemberForDisplay, formatStaffReporta } from '@/lib/formatters';
import { toast } from 'sonner';

import { FieldRenderer } from './field-renderer';
import { SectionRenderer } from './section-renderer';

export interface ReportFormRef {
  submit: () => void;
  validate: () => Promise<FormDataRecord | null>;
  getValues: () => FormDataRecord;
  getRenderedContent: () => string;
}

export interface ReportFormProps {
  template: Template;
  config: TemplateConfig;
  initialData?: FormDataRecord;
  onSubmit: (formData: FormDataRecord, content: string, title: string) => void;
  disabled?: boolean;
  onDataChange?: (formData: FormDataRecord) => void;
}

export const ReportForm = forwardRef<ReportFormRef, ReportFormProps>(
  ({ template, config, initialData, onSubmit, disabled = false, onDataChange }, ref) => {
    const { definitions } = useFieldDefinitions();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const { guards, isLoaded: guardsLoaded } = useGuards();
    const { settings, isLoaded: settingsLoaded } = useSettings();
    const { units } = useUnits();
    const { personnel } = usePersonnel();

    const activeGuardStaff = useMemo(() => {
      if (!settingsLoaded || !guardsLoaded || !settings?.activeGuardId) return [];
      const activeGuard = guards.find((g) => g.id === settings.activeGuardId);
      if (!activeGuard || !activeGuard.staff) return [];

      const staffSetWithRoles = new Set<StaffMember & { roleId?: string }>();
      Object.entries(activeGuard.staff).forEach(([roleName, staffList]) => {
        const roleId = roles.find((r: any) => r.name === roleName)?.name; // Using name as ID for now
        staffList.forEach((person) => {
          staffSetWithRoles.add({ ...person, roleId: roleId });
        });
      });

      return Array.from(staffSetWithRoles).sort((a, b) => a.name.localeCompare(b.name));
    }, [settings?.activeGuardId, guards, settingsLoaded, guardsLoaded, roles]);

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
        defaultValues,
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

        // Apply fallback parsed default value
        if (defaultValues.has(fieldId)) {
          newConfig.fields[fieldId].defaultValue = defaultValues.get(fieldId);
        }

        if (templateOptions.has(fieldId)) {
          newConfig.fields[fieldId].snippetOptions = templateOptions.get(fieldId);
          // A mapping block [?{campo}] implicitly makes this a dropdown
          if (newConfig.fields[fieldId].type === 'text') {
            newConfig.fields[fieldId].type = 'dropdown';
          }
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
      (data?: FormDataRecord) => {
        const initialFormValues: FormDataRecord = data ? JSON.parse(JSON.stringify(data)) : {};

        const activeGuard = settings?.activeGuardId 
          ? guards.find((g) => g.id === settings.activeGuardId) 
          : null;

        const rehydrate = (member: any) => {
          const latest = personnel.find(p => p.id === member.id);
          return latest || member;
        };

        const applyDefaults = (target: FormDataRecord, fieldIds: string[]) => {
          if (!target) return;
          fieldIds.forEach((fieldId) => {
            if (target[fieldId] === undefined || target[fieldId] === null) {
              const keyLower = fieldId.toLowerCase();
              const foundKey = Object.keys(predefinedValues).find(
                (k) => k.toLowerCase() === keyLower
              );

              if (foundKey && predefinedValues[foundKey]) {
                target[fieldId] = predefinedValues[foundKey];
              } else if (finalConfig.fields[fieldId]?.defaultValue !== undefined) {
                target[fieldId] = finalConfig.fields[fieldId].defaultValue;
              } else {
                const MANUAL_FIELDS = ['técnico', 'auxiliar', 'conductor'];
                const role = roles.find((r: any) => r.name.toLowerCase() === keyLower);
                
                if (role && !MANUAL_FIELDS.includes(keyLower)) {
                  let initialStaff: any[] = [];
                  if (activeGuard && activeGuard.staff) {
                    const staffList = activeGuard.staff[role.name];
                    if (staffList && staffList.length > 0) {
                      const isReporta = keyLower === 'reporta';
                      initialStaff = isReporta 
                        ? staffList.map((s) => rehydrate(s))
                        : staffList.map((s) => formatStaffMember(rehydrate(s)));
                    }
                  }

                  // Fallback for Leader Roles (Director, Jefe de Operaciones) if guard list is empty
                  if (initialStaff.length === 0) {
                    const roleLower = role.name.toLowerCase();
                    if (roleLower === 'director' || roleLower === 'jefe de operaciones' || roleLower === 'jefe de los servicios') {
                      const globalMatches = personnel.filter(
                        (p) => p.roleId?.toLowerCase() === roleLower
                      );
                      if (globalMatches.length > 0) {
                        const isReporta = keyLower === 'reporta';
                        initialStaff = isReporta
                          ? globalMatches
                          : globalMatches.map((p) => formatStaffMember(p));
                      }
                    }
                  }

                  target[fieldId] = initialStaff;
                } else if (
                  keyLower === 'guardia' ||
                  keyLower === 'grupo' ||
                  keyLower === 'grupo de guardia' ||
                  keyLower === 'guardia de servicio'
                ) {
                  target[fieldId] = settings?.activeGuardId || '';
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

        const initializeSection = (sectionId: string, target: FormDataRecord, seenIds = new Set<string>()) => {
          if (seenIds.has(sectionId)) {
            logger.error('Circular dependency detected in template sections', new Error('Infinite recursion in initializeSection'), { 
              feature: 'ReportForm', 
              metadata: { sectionId, seenIds: Array.from(seenIds) } 
            });
            return;
          }
          
          const section = finalConfig.sections.find((s) => s.id === sectionId);
          if (!section) return;

          seenIds.add(sectionId);

          if (section.isRepeatable) {
            if (!target[section.id] || !Array.isArray(target[section.id])) {
              target[section.id] = [];
            }

            const sectionData = target[section.id] as FormDataRecord[];

            if ((!data || sectionData.length === 0) && sectionData.length === 0) {
              const defaultItem: FormDataRecord = {};
              applyDefaults(defaultItem, section.fieldIds);
              (section.layout || section.fieldIds).forEach((id) => {
                if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                  initializeSection(id, defaultItem, new Set(seenIds));
                }
              });
              sectionData.push(defaultItem);
            } else {
              sectionData.forEach((item: FormDataRecord) => {
                if (!item) return;
                applyDefaults(item, section.fieldIds);
                (section.layout || section.fieldIds).forEach((id) => {
                  if (
                    id.startsWith('section_') ||
                    id.startsWith('sec_') ||
                    id.startsWith('cond_')
                  ) {
                    initializeSection(id, item, new Set(seenIds));
                  }
                });
              });
            }
          } else {
            if (section.id === 'section_separator') return;

            // Since we flattened pathPrefix for single sections in section-renderer to support
            // global conditionals, we must also apply defaults at the root target instead of nesting.
            applyDefaults(target, section.fieldIds);
            (section.layout || section.fieldIds).forEach((id) => {
              if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                initializeSection(id, target, seenIds);
              }
            });
          }
        };

        // Initialize from top-level layout
        finalConfig.layout.forEach((id) => {
          if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
            initializeSection(id, initialFormValues);
          }
        });

        return initialFormValues;
      },
      [finalConfig, predefinedValues, roles, guards, settings?.activeGuardId, personnel]
    );


    const methods = useForm<Record<string, any>>({
      defaultValues: getInitialValues(initialData) as Record<string, unknown>,
    });
    const { handleSubmit, control, watch, reset, getValues, setValue, trigger } = methods;

    // forceRender is used to trigger re-renders when the form values change.
    // We cannot rely on useWatch({ control }) without a name because it may not
    // detect dynamically registered fields (fields mounted inside conditionals).
    // Instead, we use RHF's watch() subscription (more reliable for dynamic fields)
    // combined with getValues() to always read the latest store state.
    const [, forceRender] = useState(0);

    useEffect(() => {
      // eslint-disable-next-line react-hooks/incompatible-library
      const subscription = watch((value, { name, type }) => {
        // Force parent re-render so conditionValue props get recalculated
        forceRender((n) => n + 1);
        if (type !== 'change' || !name) return;
        if (onDataChange) {
          onDataChange(getValues());
        }
      });
      return () => subscription.unsubscribe();
    }, [watch, onDataChange, getValues]);

    // Always read current values — getValues() is always up-to-date
    const allFormValues = getValues() as Record<string, any>;

    useEffect(() => {
      const formValues = getInitialValues(initialData);
      reset(formValues);
    }, [initialData, finalConfig, getInitialValues, reset]);

    const handleFormSubmit = (data: FormDataRecord) => {
      const finalContent = renderFinalReport(template.content, data, finalConfig, predefinedValues);
      const title = String(data.titulo || data.title || template.name);
      onSubmit(data, finalContent, title);
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(handleFormSubmit, (errors) => {
          logger.error('Form validation errors', new Error('Validation failed'), { feature: 'ReportForm', metadata: { errors } });
          toast.error('Por favor, corrige los errores en el formulario antes de guardar.');
        })();
      },
      validate: async () => {
        const isValid = await trigger();
        if (isValid) {
          return getValues() as FormDataRecord;
        }
        return null;
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
          chunks.push('section_separator');
        } else {
          // It's a field
          // Check if it's already in a section
          const isAssignedToSection = finalConfig.sections.some((s) => s.fieldIds.includes(id));
          if (!isAssignedToSection) {
            // Check if it's already added to avoid duplicates if layout has duplicates
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

      // Include fields from mapping conditionals that are in fieldNames but not in any layout/section
      // These are {campo} references inside mapping values like: FUNC=el funcionario {nombre}
      const allLayoutFields = new Set<string>();
      finalConfig.layout.forEach((id) => { if (!id.startsWith('section_') && !id.startsWith('sec_') && !id.startsWith('cond_')) allLayoutFields.add(id); });
      finalConfig.sections.forEach((s) => s.fieldIds.forEach((id) => allLayoutFields.add(id)));

      const orphanFields = Object.keys(finalConfig.fields).filter(
        (id) => !allLayoutFields.has(id) && finalConfig.fields[id]
      );
      if (orphanFields.length > 0) {
        chunks.push(orphanFields);
      }

      return chunks;
    }, [finalConfig]);

    return (
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" autoComplete="off">
          {layoutChunks.map((chunk, index) => {
            if (typeof chunk === 'string') {
              if (chunk === 'section_separator') {
                return <div key={`sep-${index}`} className="border-b pt-6"></div>;
              }
              const section = sectionsById[chunk];
              if (!section) return null;
              const condVal = section.condition ? allFormValues?.[section.condition.fieldId] : undefined;
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
                  pathPrefix=""
                  conditionValue={condVal}
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

                    return (
                      <div
                        key={fieldId}
                        className={cn('space-y-2', isFullWidth && 'sm:col-span-2 3xl:col-span-3')}
                      >
                        <Label htmlFor={fieldId}>{fieldConfig.label || fieldId}</Label>
                        <Controller
                          name={fieldId}
                          control={control}
                          render={({ field }) => (
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
                              name={field.name}
                              disabled={disabled}
                            />
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            }
          })}
        </form>
      </FormProvider>
    );
  }
);
ReportForm.displayName = 'ReportForm';
