import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember, ReportPhoto } from '@/lib/types';
import { useDrafts } from '@/hooks/novedades';
import { debounce } from '@/lib/utils';
import { generateId } from '@/lib/utils/id';
import { useSettings } from '@/hooks/configuracion';
import { useOrdenDelDiaDraft } from '@/hooks/orden-del-dia';
import { useGuards } from '@/hooks/guardias';
import { usePersonnel } from '@/hooks/personal';
import { parseTemplate } from '@/lib/template-parser';
import { getFirstReportingPerson } from '@/lib/constants/roles';
import { toast } from 'sonner';
import type { ReportFormRef } from '../report-form';

interface UseReportGeneratorProps {
  template: Template;
  initialData?: Record<string, any>;
  onSave: (report: Report) => void;
}

export function useReportGenerator({ template, initialData, onSave }: UseReportGeneratorProps) {
  const { saveDraft, clearDraft } = useDrafts();
  const formRef = useRef<ReportFormRef>(null);
  const hasCompleted = useRef(false);
  const sessionKey = useRef(`new-${template.id}-${Date.now()}`);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copiar');
  
  const { settings } = useSettings();
  const { draft: cloudDraft } = useOrdenDelDiaDraft();
  const { guards } = useGuards();
  const { personnel } = usePersonnel();

  const { finalInitialData } = useMemo(() => {
    const parsedTemplate = parseTemplate(template.content);
    const initialSections = parsedTemplate.sections;
    const initialFieldNames = Array.from(parsedTemplate.fieldNames) as string[];
    const newInitialData = initialData ? JSON.parse(JSON.stringify(initialData)) : {};

    if (!settings?.active_guard_id || !guards || !personnel) {
      return { finalInitialData: newInitialData };
    }

    const activeStaff = (cloudDraft && cloudDraft.guard_id === settings.active_guard_id)
      ? cloudDraft.staff
      : (settings?.active_guard_id && settings.orden_del_dia_draft && settings.orden_del_dia_draft.guard_id === settings.active_guard_id)
        ? settings.orden_del_dia_draft.staff
        : guards.find((g) => g.id === settings.active_guard_id)?.staff;

    if (!activeStaff) {
      return { finalInitialData: newInitialData };
    }

    const dataToInject: Record<string, any> = {};

    const rehydrate = (member: StaffMember, assignedRole?: string) => {
      const latest = personnel.find(p => p.id === member.id);
      const rehydrated = JSON.parse(JSON.stringify(latest || member));
      if (assignedRole) {
        rehydrated.role_id = assignedRole;
      }
      return rehydrated;
    };

    // Inject specific roles
    const rolesToInject = ['jefe de los servicios', 'director', 'jefe de operaciones'];
    rolesToInject.forEach(role => {
      const canonicalKey = Object.keys(activeStaff).find(k => k.toLowerCase() === role);
      if (canonicalKey) {
        const staffList = activeStaff[canonicalKey] || [];
        if (staffList.length > 0 && staffList[0]) {
          dataToInject[canonicalKey] = [rehydrate(staffList[0] as StaffMember, canonicalKey)];
        }
      }
    });

    const firstReporting = getFirstReportingPerson(
      activeStaff,
      settings?.reportarole_ids,
      undefined,
      personnel
    );
    if (firstReporting) {
      dataToInject['Reporta'] = [rehydrate(firstReporting, firstReporting.role_id || 'Reporta')];
    }

    dataToInject['Guardia'] = settings.active_guard_id;

    initialFieldNames.forEach((templateFieldKey: string) => {
      const lowerTemplateFieldKey = templateFieldKey.toLowerCase();
      const canonicalKey = Object.keys(dataToInject).find(k => k.toLowerCase() === lowerTemplateFieldKey);

      if (canonicalKey && newInitialData[templateFieldKey] === undefined) {
        newInitialData[templateFieldKey] = dataToInject[canonicalKey];
      }
    });

    return { finalInitialData: newInitialData };
  }, [template.content, initialData, settings, guards, personnel]);

  const saveDraftLogic = useCallback(async (form_data: Record<string, any>) => {
    if (template && form_data) {
      await saveDraft({
        template_id: template.id,
        workspace_id: template.workspace_id || '',
        form_data
      });
    }
  }, [template, saveDraft]);

  const debouncedSaveDraft = useMemo(
    () => debounce((form_data: Record<string, any>) => saveDraftLogic(form_data), 30000),
    [saveDraftLogic]
  );

  useEffect(() => {
    return () => {
      if (!hasCompleted.current) debouncedSaveDraft.flush();
    };
  }, [debouncedSaveDraft]);

  const handleDataChange = useCallback((form_data: Record<string, any>) => {
    debouncedSaveDraft(form_data);
  }, [debouncedSaveDraft]);

  const handleCreateReport = async (form_data: Record<string, any>, content: string, title: string, photos?: ReportPhoto[]) => {
    hasCompleted.current = true;
    debouncedSaveDraft.cancel();
    await clearDraft();

    const newReport: Report = {
      id: generateId('report'),
      workspace_id: template.workspace_id || '',
      template_id: template.id,
      title: title,
      timestamp: new Date().toISOString(),
      content: content,
      is_relevant: template.type === 'relevante',
      status: 'En proceso',
      form_data: JSON.parse(JSON.stringify(form_data)),
      photos: photos || [],
    };

    onSave(newReport);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewContent);
    setCopyButtonText('¡Copiado!');
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopyButtonText('Copiar'), 2000);
  };

  const handlePreviewClick = () => {
    if (!formRef.current) return;
    setPreviewContent(formRef.current.getRenderedContent());
    setCopyButtonText('Copiar');
    setIsPreviewOpen(true);
  };

  return {
    formRef,
    sessionKey: sessionKey.current,
    finalInitialData,
    isPreviewOpen,
    setIsPreviewOpen,
    previewContent,
    copyButtonText,
    handleDataChange,
    handleCreateReport,
    handleCopyToClipboard,
    handlePreviewClick,
    hasCompleted,
    debouncedSaveDraft,
    settings,
    cloudDraft
  };
}




