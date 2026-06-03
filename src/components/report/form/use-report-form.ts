import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  FieldType,
  StaffMember,
  form_dataRecord,
} from '@/lib/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { parseTemplate } from '@/lib/template-parser';
import { logger } from '@/lib/logger';
import { stableStringify } from '@/lib/utils';
import { useRoles } from '@/hooks/use-roles';
import { useGuards } from '@/hooks/use-guards';
import { useUnits } from '@/hooks/use-units';
import { useSettings } from '@/hooks/use-settings';
import { usePersonnel } from '@/hooks/use-personnel';
import { useOrdenDelDiaDraft } from '@/hooks/use-orden-del-dia-draft';
import { formatStaffMember } from '@/lib/formatters';

interface UseReportFormProps {
  reportId?: string;
  template: Template;
  config: TemplateConfig;
  initialData?: form_dataRecord;
  controlledValues?: Record<string, string>;
  onDataChange?: (form_data: form_dataRecord) => void;
}

export function useReportForm({
  reportId,
  template,
  config,
  initialData,
  controlledValues,
  onDataChange
}: UseReportFormProps) {
  const { definitions } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { units } = useUnits();
  const { draft: cloudDraft, isLoaded: draftLoaded } = useOrdenDelDiaDraft();
  const { personnel, isLoaded: personnelLoaded } = usePersonnel();

  // 1. Staff calculation
  const activeGuardStaff = useMemo(() => {
    if (!settingsLoaded || !guardsLoaded || !draftLoaded || !personnelLoaded || !settings?.active_guard_id) return [];

    // Prioridad 1: Borrador independiente (solo si coincide con la guardia activa)
    // Prioridad 2: Borrador en settings (solo si coincide)
    // Prioridad 3: Plantilla de la guardia
    const activeStaff = (cloudDraft && cloudDraft.guard_id === settings.active_guard_id)
      ? cloudDraft.staff
      : (settings?.orden_del_dia_draft && settings.orden_del_dia_draft.guard_id === settings.active_guard_id)
        ? settings.orden_del_dia_draft.staff
        : guards.find((g) => g.id === settings.active_guard_id)?.staff;

    if (!activeStaff) return [];

    const staffMap = new Map<string, StaffMember & { role_id?: string }>();
    Object.entries(activeStaff as Record<string, any[]>).forEach(([roleName, staffList]) => {
      const role_id = roles.find((r: any) => r.name.trim().toLowerCase() === roleName.trim().toLowerCase())?.name || roleName;
      (staffList as any[]).forEach((person: any) => {
        if (!staffMap.has(person.id)) {
          const latest = personnel.find(p => p.id === person.id);
          const rehydratedPerson = latest ? { ...latest } : { ...person };
          staffMap.set(person.id, { ...rehydratedPerson, role_id });
        }
      });
    });

    return Array.from(staffMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [settings?.active_guard_id, settings?.orden_del_dia_draft, cloudDraft, guards, settingsLoaded, guardsLoaded, draftLoaded, roles, personnel, personnelLoaded]);

  // 2. Template Parsing (Memoized separately)
  const parsedTemplate = useMemo(() => {
    if (!template?.content) return null;
    return parseTemplate(template.content);
  }, [template?.content]);

  // 3. Final Config Merging
  const finalConfig = useMemo(() => {
    if (!config || !template || !parsedTemplate) return { fields: {}, sections: [], layout: [] };

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
    } = parsedTemplate;

    const filteredLayout = layout.filter(
      (id) => id.toLowerCase() !== 'photos' && id.toLowerCase() !== 'fotos'
    );

    const newConfig: TemplateConfig = {
      fields: {},
      sections: sections.map((sec) => ({
        ...sec,
        field_ids: sec.field_ids.filter((id) => id.toLowerCase() !== 'photos' && id.toLowerCase() !== 'fotos'),
        layout: sec.layout
          ? sec.layout.filter((id) => id.toLowerCase() !== 'photos' && id.toLowerCase() !== 'fotos')
          : undefined,
      })),
      layout: filteredLayout,
    };

    let timeHlvFieldInConfig: string | null = null;
    const templateConfigFields = config.fields || {};

    if (config.fields) {
      timeHlvFieldInConfig =
        Object.keys(config.fields).find((k) => config.fields[k]?.type === 'time-hlv') || null;
    }

    fieldNames.forEach((field_id: string) => {
      if (field_id.toLowerCase() === 'photos' || field_id.toLowerCase() === 'fotos') return;
      const templateFieldConfig = templateConfigFields[field_id];
      const globalDef = definitions[field_id];
      const typeFromTemplate = fieldTypes.get(field_id);

      const mergedConfig = { ...(globalDef || {}), ...(templateFieldConfig || {}) };
      let fieldType: FieldType = 'text';

      if (typeFromTemplate && typeFromTemplate !== 'text') {
        fieldType = typeFromTemplate;
      } else if (field_id.toLowerCase() === 'fecha') {
        fieldType = 'date';
      } else if (field_id.toLowerCase() === 'hora') {
        if (!timeHlvFieldInConfig || timeHlvFieldInConfig === field_id) {
          fieldType = 'time-hlv';
          if (!timeHlvFieldInConfig) timeHlvFieldInConfig = field_id;
        } else {
          fieldType = 'text';
        }
      } else if (typeFromTemplate) {
        fieldType = typeFromTemplate;
      } else if (templateFieldConfig?.type) {
        fieldType = templateFieldConfig.type;
      } else if (globalDef?.type) {
        fieldType = globalDef.type;
      } else if ((mergedConfig as any).type) {
        fieldType = (mergedConfig as any).type;
      }

      newConfig.fields[field_id] = {
        ...mergedConfig,
        type: fieldType,
        label: (mergedConfig as any).label || field_id,
      } as FieldConfig;

      if (defaultValues.has(field_id)) {
        newConfig.fields[field_id].default_value = defaultValues.get(field_id);
      }

      if (templateOptions.has(field_id)) {
        newConfig.fields[field_id].snippet_options = templateOptions.get(field_id);
        if (newConfig.fields[field_id].type === 'text') {
          newConfig.fields[field_id].type = 'dropdown';
        }
      }

      if (fieldModifiers.has(field_id)) {
        newConfig.fields[field_id].modifiers = fieldModifiers.get(field_id) as any;
      } else if ((mergedConfig as any).modifier) {
        newConfig.fields[field_id].modifiers = [(mergedConfig as any).modifier];
      }

      if (fieldWidths.has(field_id)) {
        newConfig.fields[field_id].is_full_width = true;
      }

      if (requiredFields.has(field_id)) {
        newConfig.fields[field_id].required = true;
      }
    });

    return newConfig;
  }, [config, template, definitions, parsedTemplate]);

  // 3. Predefined Values
  const predefinedValues: Record<string, string> = useMemo(() => {
    const values: Record<string, string> = {};
    Object.entries(definitions).forEach(([key, config]) => {
      if (config.type === 'predefined' || key === 'Fecha') {
        values[key] = config.value || '';
      }
    });
    if (controlledValues) {
      Object.assign(values, controlledValues);
    }
    return values;
  }, [definitions, controlledValues]);

  // 4. Initial Values Logic
  const getInitialValues = useCallback(
    (data?: form_dataRecord) => {
      const safeClone = <T extends unknown>(v: T): T => {
        if (v === undefined || v === null) return v;
        try {
          return JSON.parse(JSON.stringify(v));
        } catch (e) {
          return v;
        }
      };

      const rehydrate = (member: any, assignedRole?: string) => {
        const latest = personnel.find(p => p.id === member.id);
        const rehydrated = safeClone(latest || member);
        if (assignedRole) {
          rehydrated.role_id = assignedRole;
        }
        return rehydrated;
      };

      const rehydrateValue = (val: any): any => {
        if (!val) return val;
        if (Array.isArray(val)) {
          return val.map(item => rehydrateValue(item));
        }
        if (typeof val === 'object' && val !== null) {
          if ('id' in val && 'name' in val) {
            const latest = personnel.find(p => p.id === val.id);
            if (latest) {
              return { ...safeClone(latest), role_id: val.role_id || latest.role_id };
            }
          }
          return val;
        }
        return val;
      };

      const initialFormValues: form_dataRecord = {};
      if (data) {
        Object.entries(data).forEach(([key, val]) => {
          initialFormValues[key] = rehydrateValue(val);
        });
      }

      const activeStaff = (cloudDraft && cloudDraft.guard_id === settings?.active_guard_id)
        ? cloudDraft.staff
        : (settings?.active_guard_id && settings.orden_del_dia_draft && settings.orden_del_dia_draft.guard_id === settings.active_guard_id)
          ? settings.orden_del_dia_draft.staff
          : (settings?.active_guard_id ? guards.find((g) => g.id === settings.active_guard_id)?.staff : null);

      const MANUAL_FIELDS = ['técnico', 'auxiliar', 'conductor'];

      const applyDefaults = (target: form_dataRecord, field_ids: string[]) => {
        if (!target) return;
        field_ids.forEach((field_id) => {
          const keyLower = field_id.toLowerCase();
          const role = roles.find((r: any) => r.name.toLowerCase() === keyLower);
          const isReporta = keyLower === 'reporta';
          const isLeadershipRole = keyLower === 'director' || keyLower === 'jefe de operaciones' || keyLower === 'jefe de los servicios';
          
          // Case-insensitive lookup of existing value in target
          const existingKey = Object.keys(target).find(k => k.toLowerCase() === keyLower);
          const currentValue = existingKey ? target[existingKey] : undefined;

          const isEmpty = currentValue === undefined || currentValue === null;
          const isEmptyRoleArray = Array.isArray(currentValue) && currentValue.length === 0 && (role || isReporta) && !MANUAL_FIELDS.includes(keyLower);

          if (!isEmpty && !isEmptyRoleArray) return;

          if ((role || isReporta) && !MANUAL_FIELDS.includes(keyLower)) {
            let initialStaff: any[] = [];
            
            if (isReporta && settings?.reportarole_ids && activeStaff) {
              // Special logic for Reporta: find first available person in configured roles
              for (const roleName of settings.reportarole_ids) {
                const staffKey = Object.keys(activeStaff).find(k => k.toLowerCase() === roleName.toLowerCase());
                const staffList = staffKey ? activeStaff[staffKey] : undefined;
                if (staffList && staffList.length > 0) {
                  initialStaff = [rehydrate(staffList[0], staffKey || roleName)];
                  break;
                }
              }

              // Fallback for Reporta if not found in active guard
              if (initialStaff.length === 0) {
                const globalMatches = personnel.filter(p => 
                  settings.reportarole_ids!.some(roleName => 
                    p.role_id?.toLowerCase() === roleName.toLowerCase() || 
                    p.cargo?.toLowerCase() === roleName.toLowerCase()
                  )
                );
                if (globalMatches.length > 0) {
                  initialStaff = [globalMatches[0]];
                }
              }
            } else if ((role || isLeadershipRole) && activeStaff) {
              const staffKey = Object.keys(activeStaff).find(k => k.toLowerCase() === keyLower);
              const staffList = staffKey ? activeStaff[staffKey] : undefined;

              if (Array.isArray(staffList) && staffList.length > 0) {
                initialStaff = staffList.map((s: any) => rehydrate(s, staffKey || keyLower));
              } else if (typeof (staffList as any) === 'string' && (staffList as any).trim() !== '') {
                initialStaff = [staffList as any];
              }
            }

            if (initialStaff.length === 0 && isLeadershipRole) {
              const globalMatches = personnel.filter(
                (p) => p.role_id?.toLowerCase() === keyLower || p.cargo?.toLowerCase() === keyLower
              );
              if (globalMatches.length > 0) {
                // Solo tomamos el primero para evitar cargar todos en la vista previa
                initialStaff = [safeClone(globalMatches[0])];
              }
            }

            if (initialStaff.length > 0) {
              target[field_id] = initialStaff;
              return;
            }
          }

          if (!isEmpty) return;

          const foundKey = Object.keys(predefinedValues).find(
            (k) => k.toLowerCase() === keyLower
          );

          if (foundKey && predefinedValues[foundKey]) {
            target[field_id] = safeClone(predefinedValues[foundKey]);
          } else if (finalConfig.fields[field_id]?.default_value !== undefined) {
            target[field_id] = safeClone(finalConfig.fields[field_id].default_value);
          } else if (role && !MANUAL_FIELDS.includes(keyLower)) {
            target[field_id] = [];
          } else if (
            keyLower === 'guardia' ||
            keyLower === 'grupo' ||
            keyLower === 'grupo de guardia' ||
            keyLower === 'guardia de servicio'
          ) {
            target[field_id] = settings?.active_guard_id || '';
          } else if (field_id === 'Unidad') {
            target[field_id] = [];
          } else {
            target[field_id] = '';
          }
        });
      };

      const initializeSection = (sectionId: string, target: form_dataRecord, seenIds = new Set<string>()) => {
        if (seenIds.has(sectionId)) return;
        const section = finalConfig.sections.find((s) => s.id === sectionId);
        if (!section) return;
        seenIds.add(sectionId);

        if (section.is_repeatable) {
          if (!target[section.id] || !Array.isArray(target[section.id])) {
            target[section.id] = [];
          }
          const sectionData = target[section.id] as form_dataRecord[];
          if (sectionData.length === 0) {
            const defaultItem: form_dataRecord = {};
            applyDefaults(defaultItem, section.field_ids);
            (section.layout || section.field_ids).forEach((id) => {
              if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                initializeSection(id, defaultItem, new Set(seenIds));
              }
            });
            sectionData.push(defaultItem);
          } else {
            sectionData.forEach((item: form_dataRecord) => {
              if (!item) return;
              applyDefaults(item, section.field_ids);
              (section.layout || section.field_ids).forEach((id) => {
                if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                  initializeSection(id, item, new Set(seenIds));
                }
              });
            });
          }
        } else {
          if (section.id === 'section_separator') return;
          applyDefaults(target, section.field_ids);
          (section.layout || section.field_ids).forEach((id) => {
            if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
              initializeSection(id, target, seenIds);
            }
          });
        }
      };

      finalConfig.layout.forEach((id) => {
        if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
          initializeSection(id, initialFormValues);
        } else {
          applyDefaults(initialFormValues, [id]);
        }
      });

      return initialFormValues;
    },
    [finalConfig, predefinedValues, roles, guards, settings?.active_guard_id, settings?.orden_del_dia_draft, personnel, settingsLoaded, guardsLoaded]
  );

  // 5. RHF and Sync logic
  const methods = useForm<Record<string, any>>({
    defaultValues: {},
  });
  const { watch, reset, getValues, setValue, trigger, control } = methods;

  const [, forceRender] = useState(0);
  const lastDataHash = useRef<string>('');
  const lastPropReportId = useRef<string | undefined>(reportId);
  const isFocused = useRef<boolean>(false);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      forceRender((n) => n + 1);
      if (type !== 'change' || !name) return;
      if (onDataChange) {
        const currentValues = getValues();
        const dataHash = stableStringify(currentValues);
        if (dataHash !== lastDataHash.current) {
          lastDataHash.current = dataHash;
          const timer = setTimeout(() => {
            // Clone the values to prevent RxDB from deeply freezing RHF's internal state
            onDataChange(JSON.parse(JSON.stringify(currentValues)));
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, getValues]);

  useEffect(() => {
    if (!controlledValues) return;
    Object.entries(controlledValues).forEach(([key, value]) => {
      setValue(key, value, { shouldDirty: false, shouldValidate: false });
    });
  }, [controlledValues, setValue]);

  const hasInitialized = useRef<boolean>(false);
  const lastBaseDataHash = useRef<string>('');

  useEffect(() => {
    const didIdChange = reportId !== lastPropReportId.current;
    if (didIdChange) {
      lastPropReportId.current = reportId;
      hasInitialized.current = false;
      lastBaseDataHash.current = '';
    }

    if (!hasInitialized.current) {
      lastPropReportId.current = reportId;
      hasInitialized.current = true;
      const formValues = getInitialValues(initialData);
      reset(formValues);
      if (reportId && !reportId.startsWith('new-')) {
        trigger();
      }
      return;
    }

    const baseDataLoaded = rolesLoaded && guardsLoaded && settingsLoaded && personnelLoaded;
    if (!baseDataLoaded) return;

    const currentInitialDataHash = stableStringify(initialData || {});
    
    const currentTemplateHash = stableStringify(template.content);
    // Optimizamos la clave: solo reseteamos si cambia la guardia activa, la data inicial, la plantilla o el personal
    const baseDataState = `${currentInitialDataHash}:${settings?.active_guard_id}:${currentTemplateHash}:${personnel.length}`;

    const baseDataChanged = baseDataState !== lastBaseDataHash.current;

    if (baseDataChanged && (!methods.formState.isDirty || template.id === 'preview') && !isFocused.current) {
      const formValues = getInitialValues(initialData);
      const currentValues = getValues();
      const isDataMatching = stableStringify(formValues) === stableStringify(currentValues);

      if (!isDataMatching) {
        logger.info('Resetting form due to base data or template change', {
          feature: 'useReportForm',
          metadata: {
            reportId,
            prevHash: lastBaseDataHash.current,
            newHash: baseDataState
          }
        });
        reset(formValues);
      }
      lastBaseDataHash.current = baseDataState;
    }
  }, [reportId, initialData, getInitialValues, reset, methods.formState.isDirty, rolesLoaded, guardsLoaded, settingsLoaded, settings?.active_guard_id, trigger]);

  return {
    methods,
    control,
    getValues,
    setValue,
    trigger,
    finalConfig,
    predefinedValues,
    activeGuardStaff,
    roles,
    rolesLoaded,
    units,
    settings,
    cloudDraft,
    isFocused,
    isLoaded: rolesLoaded && guardsLoaded && settingsLoaded && personnelLoaded
  };
}



