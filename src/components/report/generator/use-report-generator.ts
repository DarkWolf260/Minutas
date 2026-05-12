import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember } from '@/lib/types';
import { useDrafts } from '@/hooks/use-drafts';
import { debounce } from '@/lib/utils';
import { generateId } from '@/lib/utils/id';
import { useSettings } from '@/hooks/use-settings';
import { useOrdenDelDiaDraft } from '@/hooks/use-orden-del-dia-draft';
import { useGuards } from '@/hooks/use-guards';
import { usePersonnel } from '@/hooks/use-personnel';
import { parseTemplate } from '@/lib/template-parser';
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

    const rehydrate = (member: StaffMember) => {
      const latest = personnel.find(p => p.id === member.id);
      return JSON.parse(JSON.stringify(latest || member));
    };

    // Inject specific roles
    const rolesToInject = ['jefe de los servicios', 'director', 'jefe de operaciones'];
    rolesToInject.forEach(role => {
      const canonicalKey = Object.keys(activeStaff).find(k => k.toLowerCase() === role);
      if (canonicalKey) {
        const staffList = activeStaff[canonicalKey] || [];
        if (staffList.length > 0 && staffList[0]) {
          dataToInject[canonicalKey] = [rehydrate(staffList[0] as StaffMember)];
        }
      }
    });

    if (settings.reportarole_ids && settings.reportarole_ids.length > 0) {
      const reportingPersonnel: StaffMember[] = [];
      settings.reportarole_ids.forEach((roleName) => {
        const staffKey = Object.keys(activeStaff).find(k => k.toLowerCase() === roleName.toLowerCase());
        const roleStaff = staffKey ? (activeStaff[staffKey] || []) : [];
        reportingPersonnel.push(...roleStaff);
      });
      const uniqueReportingIds = Array.from(new Set(reportingPersonnel.map(p => p.id)));
      if (uniqueReportingIds.length > 0) {
        const firstPerson = reportingPersonnel.find(p => p.id === uniqueReportingIds[0]);
        if (firstPerson) {
          dataToInject['Reporta'] = [rehydrate(firstPerson as StaffMember)];
        }
      } else {
        // Fallback: search in global personnel if activeStaff didn't yield results
        const globalMatches = personnel.filter(p => 
          settings.reportarole_ids!.some(roleName => 
            p.role_id?.toLowerCase() === roleName.toLowerCase() || 
            p.cargo?.toLowerCase() === roleName.toLowerCase()
          )
        );
        if (globalMatches.length > 0) {
          dataToInject['Reporta'] = [globalMatches[0]];
        }
      }
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

  const handleCreateReport = async (form_data: Record<string, any>, content: string, title: string) => {
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
    settings
  };
}




