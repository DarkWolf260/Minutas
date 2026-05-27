import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { debounce, validateTimeHlv } from '@/lib/utils';
import { renderFinalReport, resolveTemplateTitle } from '@/lib/template-parser';
import { useTemplates } from '@/hooks/use-templates';
import { useSettings } from '@/hooks/use-settings';
import { useSyncManager } from '@/hooks/use-sync';
import type { Report, TemplateConfig, Template } from '@/lib/types';
import type { ReportFormRef } from '../report-form';

interface UseReportViewerProps {
  report: Report | null;
  onSave: (report: Report) => void;
}

export function useReportViewer({ report, onSave }: UseReportViewerProps) {
  const formRef = useRef<ReportFormRef>(null);
  const [status, setStatus] = useState<'En proceso' | 'Finalizado'>('En proceso');
  const [copyButtonText, setCopyButtonText] = useState('Copiar');
  const [saveButtonText, setSaveButtonText] = useState('Guardar Cambios');
  const [previewContent, setPreviewContent] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { templates, configs, isLoaded } = useTemplates();
  const { settings } = useSettings();
  const { isSecondary, sendReport: sendToSync, isSyncing: isSendingSyncReport } = useSyncManager();

  const template = useMemo(
    () => (report ? templates.find((t) => t.id === report.template_id) : null),
    [report, templates]
  );

  const config = useMemo<TemplateConfig>(
    () =>
      report
        ? configs[report.template_id] || { fields: {}, sections: [], layout: [] }
        : { fields: {}, sections: [], layout: [] },
    [report, configs]
  );

  const isFinalizado = useMemo(() => status === 'Finalizado', [status]);

  const clonedInitialData = useMemo(() => {
    if (!report?.form_data) return undefined;
    try {
      return JSON.parse(JSON.stringify(report.form_data));
    } catch (e) {
      return report.form_data;
    }
  }, [report?.id, report?.form_data]);

  const saveLogic = useCallback(async (form_data: Record<string, any>) => {
    if (!report || !template) return;

    const borradorObj = (settings.orden_del_dia_draft as any) || (settings as any).ordenDelDiaDraft;
    const esJefeEncargado = borradorObj?.es_jefe_encargado ?? borradorObj?.esJefeEncargado;

    const content = renderFinalReport(template.content, form_data, config, {}, false, { 
      Estatus: status,
      Enc: esJefeEncargado ? '(E)' : ''
    });
    const newTitle = String(form_data.titulo || form_data.title || resolveTemplateTitle(template.name, form_data));

    const timeHlvFieldId = Object.keys(config.fields).find(id => config.fields[id]?.type === 'time-hlv') || 'Hora';
    const timeHlvField = config.fields[timeHlvFieldId];
    const allowSingle = (timeHlvField?.modifiers as unknown as string[])?.includes('single') || false;

    const hora = form_data[timeHlvFieldId];
    const timeValidation = validateTimeHlv(hora, status === 'Finalizado', allowSingle);
    if (!timeValidation.isValid && status === 'Finalizado') {
      toast.error(timeValidation.error);
      return;
    }

    const finalReport: Report = {
      ...report,
      title: newTitle,
      content: content,
      form_data: JSON.parse(JSON.stringify(form_data)),
      status: status,
      timestamp: new Date().toISOString(),
    };
    await onSave(finalReport);
    setSaveButtonText('Guardado');
  }, [report, template, config, status, onSave, settings.orden_del_dia_draft, (settings as any).ordenDelDiaDraft]);

  // Use a ref to always execute the latest saveLogic inside debouncedSave without recreating it,
  // preventing premature flushes and race conditions when status or other dependencies change.
  const saveLogicRef = useRef(saveLogic);
  useEffect(() => {
    saveLogicRef.current = saveLogic;
  }, [saveLogic]);

  const debouncedSave = useMemo(
    () => debounce((form_data: Record<string, any>) => saveLogicRef.current(form_data), 30000),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  useEffect(() => {
    if (report) {
      setStatus(report.status || 'En proceso');
      setSaveButtonText('Guardar Cambios');
    }
  }, [report]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewContent);
    setCopyButtonText('¡Copiado!');
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopyButtonText('Copiar'), 2000);
  };

  const handleSave = async () => {
    if (!formRef.current) return;
    let form_data = formRef.current.getValues();
    if (status === 'Finalizado') {
      const validData = await formRef.current.validate();
      if (!validData) return;
      form_data = validData;
    }
    debouncedSave.cancel();
    await saveLogic(form_data);
  };

  const handleStatusChange = async (newStatus: 'En proceso' | 'Finalizado') => {
    if (!formRef.current) return;
    
    let form_data: Record<string, any> | null = null;
    
    if (newStatus === 'Finalizado') {
      // Set Estatus temporarily to trigger required rules
      const currentFormValues = formRef.current.getValues();
      currentFormValues.Estatus = 'Finalizado';
      
      setStatus(newStatus);
      
      // Wait for React to render the new status and RHF to update rules
      await new Promise(resolve => setTimeout(resolve, 150));
      
      form_data = await formRef.current.validate();
      if (!form_data) {
        setStatus('En proceso'); // Revert
        return;
      }
      
      const timeHlvFieldId = Object.keys(config.fields).find(id => config.fields[id]?.type === 'time-hlv') || 'Hora';
      const timeHlvField = config.fields[timeHlvFieldId];
      const allowSingle = (timeHlvField?.modifiers as unknown as string[])?.includes('single') || false;

      const hora = form_data[timeHlvFieldId];
      const timeValidation = validateTimeHlv(hora, true, allowSingle);
      if (!timeValidation.isValid) {
        toast.error(timeValidation.error);
        setStatus('En proceso'); // Revert
        return;
      }
    } else {
      form_data = formRef.current.getValues();
      setStatus(newStatus);
    }
    debouncedSave.cancel();

    if (!report || !template) return;
    
    const borradorObj = (settings.orden_del_dia_draft as any) || (settings as any).ordenDelDiaDraft;
    const esJefeEncargado = borradorObj?.es_jefe_encargado ?? borradorObj?.esJefeEncargado;

    const content = renderFinalReport(template.content, form_data, config, {}, false, { 
      Estatus: newStatus,
      Enc: esJefeEncargado ? '(E)' : ''
    });
    const newTitle = String(form_data.titulo || form_data.title || resolveTemplateTitle(template.name, form_data));
    const finalReport: Report = {
      ...report,
      title: newTitle,
      content: content,
      form_data: JSON.parse(JSON.stringify(form_data)),
      status: newStatus,
      timestamp: new Date().toISOString(),
    };
    await onSave(finalReport);

    // Auto-sync if secondary device to ensure immediate update in cloud/primary
    if (isSecondary && newStatus === 'Finalizado') {
      try {
        await sendToSync(finalReport);
        toast.success('Reporte finalizado y enviado al sistema principal');
      } catch (err) {
        console.error('Failed to auto-sync finalized report', err);
      }
    }

    setSaveButtonText('Guardado');
  };

  const handlePreviewClick = () => {
    if (!formRef.current) return;
    const content = formRef.current.getRenderedContent();
    setPreviewContent(content);
    setCopyButtonText('Copiar');
    setIsPreviewOpen(true);
  };

  const handleDataChange = useCallback(
    (form_data: Record<string, any>) => {
      setSaveButtonText('Guardar Cambios');
      debouncedSave(form_data);
    },
    [debouncedSave]
  );

  return {
    formRef,
    status,
    setStatus,
    copyButtonText,
    saveButtonText,
    previewContent,
    isPreviewOpen,
    setIsPreviewOpen,
    template,
    config,
    isLoaded,
    isFinalizado,
    clonedInitialData,
    handleCopyToClipboard,
    handleSave,
    handleStatusChange,
    handlePreviewClick,
    handleDataChange,
    isSecondary,
    sendToSync,
    isSendingSyncReport,
    settings
  };
}
