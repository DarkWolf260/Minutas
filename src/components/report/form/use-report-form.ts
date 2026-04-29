import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  FieldType,
  StaffMember,
  FormDataRecord,
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
import { formatStaffMember } from '@/lib/formatters';

interface UseReportFormProps {
  reportId?: string;
  template: Template;
  config: TemplateConfig;
  initialData?: FormDataRecord;
  controlledValues?: Record<string, string>;
  onDataChange?: (formData: FormDataRecord) => void;
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
  const { personnel } = usePersonnel();

  // 1. Staff calculation
  const activeGuardStaff = useMemo(() => {
    if (!settingsLoaded || !guardsLoaded || !settings?.activeGuardId) return [];

    const activeStaff = (settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === settings.activeGuardId)
      ? settings.ordenDelDiaDraft.staff
      : guards.find((g) => g.id === settings.activeGuardId)?.staff;

    if (!activeStaff) return [];

    const staffMap = new Map<string, StaffMember & { roleId?: string }>();
    Object.entries(activeStaff).forEach(([roleName, staffList]) => {
      const roleId = roles.find((r: any) => r.name === roleName)?.name;
      staffList.forEach((person) => {
        if (!staffMap.has(person.id)) {
          staffMap.set(person.id, { ...person, roleId });
        }
      });
    });

    return Array.from(staffMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [settings?.activeGuardId, settings?.ordenDelDiaDraft, guards, settingsLoaded, guardsLoaded, roles]);

  // 2. Final Config Merging
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

    fieldNames.forEach((fieldId: string) => {
      const templateFieldConfig = templateConfigFields[fieldId];
      const globalDef = definitions[fieldId];
      const typeFromTemplate = fieldTypes.get(fieldId);

      const mergedConfig = { ...(globalDef || {}), ...(templateFieldConfig || {}) };
      let fieldType: FieldType = 'text';

      if (typeFromTemplate && typeFromTemplate !== 'text') {
        fieldType = typeFromTemplate;
      } else if (fieldId.toLowerCase() === 'fecha') {
        fieldType = 'date';
      } else if (fieldId.toLowerCase() === 'hora') {
        if (!timeHlvFieldInConfig || timeHlvFieldInConfig === fieldId) {
          fieldType = 'time-hlv';
          if (!timeHlvFieldInConfig) timeHlvFieldInConfig = fieldId;
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

      newConfig.fields[fieldId] = {
        ...mergedConfig,
        type: fieldType,
        label: (mergedConfig as any).label || fieldId,
      } as FieldConfig;

      if (defaultValues.has(fieldId)) {
        newConfig.fields[fieldId].defaultValue = defaultValues.get(fieldId);
      }

      if (templateOptions.has(fieldId)) {
        newConfig.fields[fieldId].snippetOptions = templateOptions.get(fieldId);
        if (newConfig.fields[fieldId].type === 'text') {
          newConfig.fields[fieldId].type = 'dropdown';
        }
      }

      if (fieldModifiers.has(fieldId)) {
        newConfig.fields[fieldId].modifiers = fieldModifiers.get(fieldId) as any;
      } else if ((mergedConfig as any).modifier) {
        newConfig.fields[fieldId].modifiers = [(mergedConfig as any).modifier];
      }

      if (fieldWidths.has(fieldId)) {
        newConfig.fields[fieldId].isFullWidth = true;
      }

      if (requiredFields.has(fieldId)) {
        newConfig.fields[fieldId].required = true;
      }
    });

    return newConfig;
  }, [config, template, definitions]);

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
    (data?: FormDataRecord) => {
      const initialFormValues: FormDataRecord = data ? JSON.parse(JSON.stringify(data)) : {};

      const activeStaff = (settings?.activeGuardId && settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === settings.activeGuardId)
        ? settings.ordenDelDiaDraft.staff
        : (settings?.activeGuardId ? guards.find((g) => g.id === settings.activeGuardId)?.staff : null);

      const safeClone = <T extends unknown>(v: T): T => {
        if (v === undefined || v === null) return v;
        try {
          return JSON.parse(JSON.stringify(v));
        } catch (e) {
          return v;
        }
      };

      const rehydrate = (member: any) => {
        const latest = personnel.find(p => p.id === member.id);
        return safeClone(latest || member);
      };

      const MANUAL_FIELDS = ['técnico', 'auxiliar', 'conductor'];

      const applyDefaults = (target: FormDataRecord, fieldIds: string[]) => {
        if (!target) return;
        fieldIds.forEach((fieldId) => {
          const keyLower = fieldId.toLowerCase();
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
            
            if (isReporta && settings?.reportaRoleIds && activeStaff) {
              // Special logic for Reporta: find first available person in configured roles
              for (const roleName of settings.reportaRoleIds) {
                const staffKey = Object.keys(activeStaff).find(k => k.toLowerCase() === roleName.toLowerCase());
                const staffList = staffKey ? activeStaff[staffKey] : undefined;
                if (staffList && staffList.length > 0) {
                  initialStaff = [rehydrate(staffList[0])];
                  break;
                }
              }
            } else if (role && activeStaff) {
              const staffKey = Object.keys(activeStaff).find(k => k.toLowerCase() === keyLower);
              const staffList = staffKey ? activeStaff[staffKey] : undefined;

              if (staffList && staffList.length > 0) {
                initialStaff = staffList.map((s: any) => rehydrate(s));
              }
            }

            if (initialStaff.length === 0 && isLeadershipRole) {
              const globalMatches = personnel.filter(
                (p) => p.roleId?.toLowerCase() === keyLower || p.cargo?.toLowerCase() === keyLower
              );
              if (globalMatches.length > 0) {
                initialStaff = globalMatches.map((p) => safeClone(p));
              }
            }

            if (initialStaff.length > 0) {
              target[fieldId] = initialStaff;
              return;
            }
          }

          if (!isEmpty) return;

          const foundKey = Object.keys(predefinedValues).find(
            (k) => k.toLowerCase() === keyLower
          );

          if (foundKey && predefinedValues[foundKey]) {
            target[fieldId] = safeClone(predefinedValues[foundKey]);
          } else if (finalConfig.fields[fieldId]?.defaultValue !== undefined) {
            target[fieldId] = safeClone(finalConfig.fields[fieldId].defaultValue);
          } else if (role && !MANUAL_FIELDS.includes(keyLower)) {
            target[fieldId] = [];
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
        });
      };

      const initializeSection = (sectionId: string, target: FormDataRecord, seenIds = new Set<string>()) => {
        if (seenIds.has(sectionId)) return;
        const section = finalConfig.sections.find((s) => s.id === sectionId);
        if (!section) return;
        seenIds.add(sectionId);

        if (section.isRepeatable) {
          if (!target[section.id] || !Array.isArray(target[section.id])) {
            target[section.id] = [];
          }
          const sectionData = target[section.id] as FormDataRecord[];
          if (sectionData.length === 0) {
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
                if (id.startsWith('section_') || id.startsWith('sec_') || id.startsWith('cond_')) {
                  initializeSection(id, item, new Set(seenIds));
                }
              });
            });
          }
        } else {
          if (section.id === 'section_separator') return;
          applyDefaults(target, section.fieldIds);
          (section.layout || section.fieldIds).forEach((id) => {
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
    [finalConfig, predefinedValues, roles, guards, settings?.activeGuardId, settings?.ordenDelDiaDraft, personnel, settingsLoaded, guardsLoaded]
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
            onDataChange(currentValues);
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

    const baseDataLoaded = rolesLoaded && guardsLoaded && settingsLoaded;
    if (!baseDataLoaded) return;

    const currentInitialDataHash = stableStringify(initialData || {});
    const currentDraftKey = settings?.ordenDelDiaDraft?.updatedAt || 'no-draft';
    const baseDataState = `${currentInitialDataHash}:${settings?.activeGuardId}:${currentDraftKey}:${roles.length}:${personnel.length}`;

    const baseDataChanged = baseDataState !== lastBaseDataHash.current;

    if (!hasInitialized.current) {
      lastPropReportId.current = reportId;
      lastBaseDataHash.current = baseDataState;
      hasInitialized.current = true;
      const formValues = getInitialValues(initialData);
      reset(formValues);
      if (reportId && !reportId.startsWith('new-')) {
        trigger();
      }
      return;
    }

    if (baseDataChanged && !methods.formState.isDirty && !isFocused.current) {
      lastBaseDataHash.current = baseDataState;
      const formValues = getInitialValues(initialData);
      reset(formValues);
    }
  }, [reportId, initialData, getInitialValues, reset, methods.formState.isDirty, rolesLoaded, guardsLoaded, settingsLoaded, roles, personnel, settings?.activeGuardId, settings?.ordenDelDiaDraft?.updatedAt, trigger]);

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
    isFocused,
    isLoaded: rolesLoaded && guardsLoaded && settingsLoaded
  };
}
