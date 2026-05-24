'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { FormProvider } from 'react-hook-form';
import type {
  Template,
  TemplateConfig,
  form_dataRecord,
} from '@/lib/types';
import { renderFinalReport } from '@/lib/template-parser';
import { logger } from '@/lib/logger';
import { validateTimeHlv } from '@/lib/utils';
import { toast } from 'sonner';

// Componentes y Hooks extraídos (SOLID)
import { useReportForm } from './form/use-report-form';
import { FormLayout } from './form/form-layout';

export interface ReportFormRef {
  submit: () => void;
  save: () => void;
  validate: () => Promise<form_dataRecord | null>;
  getValues: () => form_dataRecord;
  getRenderedContent: () => string;
}

export interface ReportFormProps {
  reportId?: string;
  template: Template;
  config: TemplateConfig;
  initialData?: form_dataRecord;
  onSubmit: (form_data: form_dataRecord, content: string, title: string) => void;
  disabled?: boolean;
  onDataChange?: (form_data: form_dataRecord) => void;
  controlledValues?: Record<string, string>;
}

export const ReportForm = forwardRef<ReportFormRef, ReportFormProps>(
  ({ reportId, template, config, initialData, onSubmit, disabled = false, onDataChange, controlledValues }, ref) => {
    const hook = useReportForm({
      reportId,
      template,
      config,
      initialData,
      controlledValues,
      onDataChange
    });

    const {
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
      isLoaded
    } = hook;

    const { handleSubmit } = methods;

    const handleFormSubmit = (data: form_dataRecord) => {
      const finalContent = renderFinalReport(template.content, data, finalConfig, predefinedValues);
      const title = String(data.titulo || data.title || template.name);
      onSubmit(data, finalContent, title);
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        const values = getValues();
        const hora = values['Hora'];
        if (hora) {
          const timeValidation = validateTimeHlv(hora, false);
          if (!timeValidation.isValid) {
            toast.error(timeValidation.error);
            return;
          }
        }

        handleSubmit(handleFormSubmit, (errors) => {
          logger.error('Form validation errors', new Error('Validation failed'), { feature: 'ReportForm', metadata: { errors } });
          toast.success('Por favor, corrige los errores en el formulario antes de guardar.');
        })();
      },
      save: () => {
        const values = getValues();
        handleFormSubmit(values);
      },
      validate: async () => {
        const isValid = await trigger();
        if (isValid) {
          const values = getValues();
          const hora = values['Hora'];
          if (hora) {
            const timeValidation = validateTimeHlv(hora, false);
            if (!timeValidation.isValid) {
              toast.error(timeValidation.error);
              return null;
            }
          }
          return values as form_dataRecord;
        }
        return null;
      },
      getValues: getValues,
      getRenderedContent: () => {
        const form_data = getValues();
        const borradorObj = (settings.orden_del_dia_draft as any) || (settings as any).ordenDelDiaDraft;
        const esJefeEncargado = borradorObj?.es_jefe_encargado ?? borradorObj?.esJefeEncargado;

        const dynamicPredefinedValues = {
          ...controlledValues,
          Enc: esJefeEncargado ? '(E)' : '',
        };
        return renderFinalReport(template.content, form_data, finalConfig, predefinedValues, false, dynamicPredefinedValues);
      },
    }));

    if (!isLoaded) return null;

    return (
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6"
          autoComplete="off"
          onFocusCapture={() => {
            isFocused.current = true;
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              isFocused.current = false;
            }
          }}
        >
          <FormLayout
            finalConfig={finalConfig}
            controlledValues={controlledValues}
            allFormValues={getValues()}
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
        </form>
      </FormProvider>
    );
  }
);

ReportForm.displayName = 'ReportForm';

