import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { debounce, validateTimeHlv } from '@/lib/utils';
import { renderFinalReport } from '@/lib/template-parser';
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
    () => (report ? templates.find((t) => t.id === report.templateId) : null),
    [report, templates]
  );

  const config = useMemo<TemplateConfig>(
    () =>
      report
        ? configs[report.templateId] || { fields: {}, sections: [], layout: [] }
        : { fields: {}, sections: [], layout: [] },
    [report, configs]
  );

  const isFinalizado = useMemo(() => status === 'Finalizado', [status]);

  const clonedInitialData = useMemo(() => {
    if (!report?.formData) return undefined;
    try {
      return JSON.parse(JSON.stringify(report.formData));
    } catch (e) {
      return report.formData;
    }
  }, [report?.id, report?.formData]);

  const saveLogic = useCallback(async (formData: Record<string, any>) => {
    if (!report || !template) return;

    const content = renderFinalReport(template.content, formData, config, { 
      Estatus: status,
      Enc: settings.ordenDelDiaDraft?.esJefeEncargado ? '(E)' : ''
    });
    const newTitle = String(formData.titulo || formData.title || template.name);

    const hora = formData['Hora'];
    const timeValidation = validateTimeHlv(hora, status === 'Finalizado');
    if (!timeValidation.isValid && status === 'Finalizado') {
      toast.error(timeValidation.error);
      return;
    }

    const finalReport: Report = {
      ...report,
      title: newTitle,
      content: content,
      formData: JSON.parse(JSON.stringify(formData)),
      status: status,
      timestamp: new Date().toISOString(),
    };
    await onSave(finalReport);
    setSaveButtonText('Guardado');
  }, [report, template, config, status, onSave, settings.ordenDelDiaDraft?.esJefeEncargado]);

  const debouncedSave = useMemo(
    () => debounce((formData: Record<string, any>) => saveLogic(formData), 30000),
    [saveLogic]
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
    let formData = formRef.current.getValues();
    if (status === 'Finalizado') {
      const validData = await formRef.current.validate();
      if (!validData) return;
      formData = validData;
    }
    debouncedSave.cancel();
    await saveLogic(formData);
  };

  const handleStatusChange = async (newStatus: 'En proceso' | 'Finalizado') => {
    if (!formRef.current) return;
    
    let formData: Record<string, any> | null = null;
    
    if (newStatus === 'Finalizado') {
      // Set Estatus temporarily to trigger required rules
      const currentFormValues = formRef.current.getValues();
      currentFormValues.Estatus = 'Finalizado';
      
      // We pass the new status in the data temporarily so it re-renders ReportFormField rules
      // But we can't easily force re-render from outside without state change,
      // actually `status` state change below will cause re-render of `viewer-content.tsx` -> `ReportForm` -> `FormLayout`.
      // Let's do it directly:
      setStatus(newStatus);
      
      // Wait for React to render the new status and RHF to update rules
      await new Promise(resolve => setTimeout(resolve, 150));
      
      formData = await formRef.current.validate();
      if (!formData) {
        setStatus('En proceso'); // Revert
        return;
      }
      
      const hora = formData['Hora'];
      const timeValidation = validateTimeHlv(hora, true);
      if (!timeValidation.isValid) {
        toast.error(timeValidation.error);
        setStatus('En proceso'); // Revert
        return;
      }
    } else {
      formData = formRef.current.getValues();
      setStatus(newStatus);
    }
    debouncedSave.cancel();

    if (!report || !template) return;
    const content = renderFinalReport(template.content, formData, config, { 
      Estatus: newStatus,
      Enc: settings.ordenDelDiaDraft?.esJefeEncargado ? '(E)' : ''
    });
    const newTitle = String(formData.titulo || formData.title || template.name);
    const finalReport: Report = {
      ...report,
      title: newTitle,
      content: content,
      formData: JSON.parse(JSON.stringify(formData)),
      status: newStatus,
      timestamp: new Date().toISOString(),
    };
    await onSave(finalReport);
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
    (formData: Record<string, any>) => {
      setSaveButtonText('Guardar Cambios');
      debouncedSave(formData);
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
