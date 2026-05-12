import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SectionRenderer } from '../section-renderer';
import { FieldRenderer } from '../field-renderer';
import type { TemplateConfig, SectionConfig } from '@/lib/types';

interface FormLayoutProps {
  finalConfig: TemplateConfig;
  controlledValues?: Record<string, string>;
  allFormValues: Record<string, any>;
  control: any;
  disabled: boolean;
  roles: any[];
  rolesLoaded: boolean;
  activeGuardStaff: any[];
  predefinedValues: Record<string, string>;
  units: any[];
  setValue: any;
  settings: any;
}

export const FormLayout = ({
  finalConfig,
  controlledValues,
  allFormValues,
  control,
  disabled,
  roles,
  rolesLoaded,
  activeGuardStaff,
  predefinedValues,
  units,
  setValue,
  settings
}: FormLayoutProps) => {
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
        const systemTags = ['enc', 'pie', 'usuario', 'estatus'];
        const isControlled = (controlledValues && Object.keys(controlledValues).some(
          (k) => k.toLowerCase() === id.toLowerCase()
        )) || systemTags.includes(id.toLowerCase());

        if (isControlled || id.includes('.')) return;
        const isAssignedToSection = finalConfig.sections.some((s) => s.field_ids.includes(id));
        if (!isAssignedToSection) {
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

    const allLayoutFields = new Set<string>();
    finalConfig.layout.forEach((id) => { if (!id.startsWith('section_') && !id.startsWith('sec_') && !id.startsWith('cond_')) allLayoutFields.add(id); });
    finalConfig.sections.forEach((s) => s.field_ids.forEach((id) => allLayoutFields.add(id)));

    const systemTags = ['enc', 'pie', 'usuario', 'estatus'];
    const orphanFields = Object.keys(finalConfig.fields).filter(
      (id) => {
        const isControlled = (controlledValues && Object.keys(controlledValues).some(
          (k) => k.toLowerCase() === id.toLowerCase()
        )) || systemTags.includes(id.toLowerCase());
        const isDerived = id.includes('.');

        return !allLayoutFields.has(id) && finalConfig.fields[id] && !isControlled && !isDerived;
      }
    );
    if (orphanFields.length > 0) {
      chunks.push(orphanFields);
    }

    return chunks;
  }, [finalConfig, controlledValues]);

  if (!control || !control.register) {
    return null;
  }

  return (
    <>
      {layoutChunks.map((chunk, index) => {
        if (typeof chunk === 'string') {
          if (chunk === 'section_separator') {
            return <div key={`sep-${index}`} className="border-b pt-6"></div>;
          }
          const section = sectionsById[chunk];
          if (!section) return null;
          const condVal = section.condition ? allFormValues?.[section.condition.field_id] : undefined;
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
              {chunk.map((field_id) => {
                const fieldConfig = finalConfig.fields[field_id];
                if (!fieldConfig) return null;

                const isFullWidth = fieldConfig.type === 'textarea';

                return (
                  <div
                    key={field_id}
                    className={cn('space-y-2', isFullWidth && 'sm:col-span-2 3xl:col-span-3')}
                  >
                    <Label htmlFor={field_id}>{fieldConfig.label || field_id}</Label>
                    <Controller
                      name={field_id}
                      control={control}
                      render={({ field }) => (
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
    </>
  );
};

