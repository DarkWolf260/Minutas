import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember } from '@/lib/types';
import { useDrafts } from '@/hooks/use-drafts';
import { debounce } from '@/lib/utils';
import { generateId } from '@/lib/utils/id';
import { useSettings } from '@/hooks/use-settings';
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
  const { guards } = useGuards();
  const { personnel } = usePersonnel();

  const { finalInitialData } = useMemo(() => {
    const parsedTemplate = parseTemplate(template.content);
    const initialSections = parsedTemplate.sections;
    const initialFieldNames = Array.from(parsedTemplate.fieldNames) as string[];
    const newInitialData = initialData ? JSON.parse(JSON.stringify(initialData)) : {};

    if (!settings?.activeGuardId || !guards || !personnel) {
      return { finalInitialData: newInitialData };
    }

    const activeStaff = (settings?.activeGuardId && settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === settings.activeGuardId)
      ? settings.ordenDelDiaDraft.staff
      : guards.find((g) => g.id === settings.activeGuardId)?.staff;

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

    if (settings.reportaRoleIds && settings.reportaRoleIds.length > 0) {
      const reportingPersonnel: StaffMember[] = [];
      settings.reportaRoleIds.forEach((roleId) => {
        const roleStaff = activeStaff[roleId] || [];
        reportingPersonnel.push(...roleStaff);
      });
      const uniqueReportingIds = Array.from(new Set(reportingPersonnel.map(p => p.id)));
      if (uniqueReportingIds.length > 0) {
        const firstPerson = reportingPersonnel.find(p => p.id === uniqueReportingIds[0]);
        if (firstPerson) {
          dataToInject['Reporta'] = [rehydrate(firstPerson as StaffMember)];
        }
      }
    }

    dataToInject['Guardia'] = settings.activeGuardId;

    initialFieldNames.forEach((templateFieldKey: string) => {
      const lowerTemplateFieldKey = templateFieldKey.toLowerCase();
      const canonicalKey = Object.keys(dataToInject).find(k => k.toLowerCase() === lowerTemplateFieldKey);

      if (canonicalKey && newInitialData[templateFieldKey] === undefined) {
        newInitialData[templateFieldKey] = dataToInject[canonicalKey];
      }
    });

    return { finalInitialData: newInitialData };
  }, [template.content, initialData, settings, guards, personnel]);

  const saveDraftLogic = useCallback(async (formData: Record<string, any>) => {
    if (template && formData) {
      await saveDraft({
        templateId: template.id,
        workspaceId: template.workspaceId,
        formData
      });
    }
  }, [template, saveDraft]);

  const debouncedSaveDraft = useMemo(
    () => debounce((formData: Record<string, any>) => saveDraftLogic(formData), 30000),
    [saveDraftLogic]
  );

  useEffect(() => {
    return () => {
      if (!hasCompleted.current) debouncedSaveDraft.flush();
    };
  }, [debouncedSaveDraft]);

  const handleDataChange = useCallback((formData: Record<string, any>) => {
    debouncedSaveDraft(formData);
  }, [debouncedSaveDraft]);

  const handleCreateReport = async (formData: Record<string, any>, content: string, title: string) => {
    hasCompleted.current = true;
    debouncedSaveDraft.cancel();
    await clearDraft();

    const newReport: Report = {
      id: generateId('report'),
      workspaceId: template.workspaceId,
      templateId: template.id,
      title: title,
      timestamp: new Date().toISOString(),
      content: content,
      isRelevant: template.type === 'relevante',
      status: 'En proceso',
      formData: JSON.parse(JSON.stringify(formData)),
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
