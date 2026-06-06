'use client';

import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import type {
  Template,
  TemplateConfig,
  form_dataRecord,
  ReportPhoto,
} from '@/lib/types';
import { renderFinalReport, resolveTemplateTitle, parseTemplate } from '@/lib/template-parser';
import { logger } from '@/lib/logger';
import { validateTimeHlv } from '@/lib/utils';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAddresses } from '@/hooks/use-addresses';
import { obtenerCategoriasReporte } from '@/lib/estadisticas-utils';

// Componentes y Hooks extraídos (SOLID)
import { useReportForm } from './form/use-report-form';
import { FormLayout } from './form/form-layout';
import { ReportPhotos } from './report-photos';

export interface ReportFormRef {
  submit: () => void;
  save: () => void;
  validate: () => Promise<form_dataRecord | null>;
  getValues: () => form_dataRecord;
  getRenderedContent: () => string;
  getPhotos: () => ReportPhoto[];
}

export interface ReportFormProps {
  reportId?: string;
  template: Template;
  config: TemplateConfig;
  initialData?: form_dataRecord;
  onSubmit: (form_data: form_dataRecord, content: string, title: string, photos: ReportPhoto[]) => void;
  disabled?: boolean;
  onDataChange?: (form_data: form_dataRecord, photos: ReportPhoto[]) => void;
  controlledValues?: Record<string, string>;
  initialPhotos?: ReportPhoto[];
}

export const ReportForm = forwardRef<ReportFormRef, ReportFormProps>(
  ({ reportId, template, config, initialData, onSubmit, disabled = false, onDataChange, controlledValues, initialPhotos = [] }, ref) => {
    const [photos, setPhotos] = useState<ReportPhoto[]>(initialPhotos);

    // Sync when reportId changes (switching reports)
    useEffect(() => {
      setPhotos(initialPhotos || []);
    }, [reportId]);

    // Handle async loading of initialPhotos (when they load from DB)
    useEffect(() => {
      if (initialPhotos && initialPhotos.length > 0 && photos.length === 0) {
        setPhotos(initialPhotos);
      }
    }, [initialPhotos]);

    const handlePhotosChange = (newPhotos: ReportPhoto[]) => {
      setPhotos(newPhotos);
      if (onDataChange) {
        onDataChange(getValues(), newPhotos);
      }
    };

    const handleFormValuesChange = (form_data: form_dataRecord) => {
      if (onDataChange) {
        onDataChange(form_data, photos);
      }
    };

    const supportsPhotos = useMemo(() => {
      if (!template?.content) return false;
      const parsed = parseTemplate(template.content);
      return parsed.fieldNames.has('photos') || parsed.fieldNames.has('fotos');
    }, [template?.content]);

    const hook = useReportForm({
      reportId,
      template,
      config,
      initialData,
      controlledValues,
      onDataChange: onDataChange ? handleFormValuesChange : undefined
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
      cloudDraft,
      isFocused,
      isLoaded
    } = hook;

    const { handleSubmit } = methods;
    const { addresses } = useAddresses();

    const formValues = getValues();
    const mockReport = useMemo(() => ({
      id: reportId || '',
      template_id: template.id,
      title: String(formValues.titulo || formValues.title || ''),
      form_data: formValues,
      status: controlledValues?.Estatus || 'Finalizado',
      timestamp: new Date().toISOString(),
      workspace_id: '',
      content: ''
    } as any), [reportId, template.id, formValues, controlledValues?.Estatus]);

    const reportCategories = useMemo(() => {
      return obtenerCategoriasReporte(mockReport, template, finalConfig, predefinedValues, addresses);
    }, [mockReport, template, finalConfig, predefinedValues, addresses]);

    const uniqueCategories = useMemo(() => {
      const counts: Record<string, number> = {};
      reportCategories.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts);
    }, [reportCategories]);

    // Helper: resolves the correct encargado flag prioritizing cloudDraft
    const getEsJefeEncargado = () => {
      const borrador = (cloudDraft && cloudDraft.guard_id === settings?.active_guard_id)
        ? cloudDraft
        : ((settings?.orden_del_dia_draft as any) || (settings as any)?.ordenDelDiaDraft);
      return !!(borrador?.es_jefe_encargado ?? borrador?.esJefeEncargado);
    };

    const handleFormSubmit = (data: form_dataRecord) => {
      const dynamicPredefinedValues = {
        ...controlledValues,
        Enc: getEsJefeEncargado() ? '(E)' : '',
      };
      const finalContent = renderFinalReport(template.content, data, finalConfig, predefinedValues, false, dynamicPredefinedValues);
      const title = String(data.titulo || data.title || resolveTemplateTitle(template.name, data, finalConfig));
      onSubmit(data, finalContent, title, photos);
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
        const dynamicPredefinedValues = {
          ...controlledValues,
          Enc: getEsJefeEncargado() ? '(E)' : '',
        };
        return renderFinalReport(template.content, form_data, finalConfig, predefinedValues, false, dynamicPredefinedValues);
      },
      getPhotos: () => photos,
    }));

    if (!isLoaded) return null;

    return (
      <FormProvider {...methods}>
        <div className="space-y-8">
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

          {/* Galería de fotos del reporte */}
          {supportsPhotos && (
            <ReportPhotos
              photos={photos}
              onChange={handlePhotosChange}
              disabled={disabled}
            />
          )}

          {/* Estadísticas a sumar */}
          {uniqueCategories.length > 0 && (
            <div className="pt-6 border-t flex flex-wrap items-center gap-2 text-xs text-muted-foreground animate-in fade-in duration-200">
              {uniqueCategories.map(([cat, count], idx) => (
                <Badge key={idx} variant="outline" className="font-semibold bg-primary/5 text-primary border-primary/20 shadow-sm">
                  {cat} (+{count})
                </Badge>
              ))}
            </div>
          )}
        </div>
      </FormProvider>
    );
  }
);

ReportForm.displayName = 'ReportForm';

