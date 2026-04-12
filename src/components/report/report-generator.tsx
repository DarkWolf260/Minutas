'use client';

import { useState, useRef, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember } from '@/lib/types';
import { ReportForm, type ReportFormRef } from './report-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Copy, CheckIcon, Save, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useDrafts } from '@/hooks/use-drafts';
import { debounce } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/use-settings';
import { useGuards } from '@/hooks/use-guards';
import { usePersonnel } from '@/hooks/use-personnel';
import { formatStaffMember } from '@/lib/formatters';
import { parseTemplate } from '@/lib/template-parser';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { cn } from '@/lib/utils';
import { ReportPreview } from './report-preview';

export interface ReportGeneratorRef {
  submit: () => void;
  cancel: () => void;
}

interface ReportGeneratorProps {
  template: Template;
  config: TemplateConfig;
  initialData?: Record<string, any>;
  onCancel: () => void;
  onSave: (report: Report) => void;
  hideHeader?: boolean;
}

export const ReportGenerator = forwardRef<ReportGeneratorRef, ReportGeneratorProps>(
  ({ template, config, initialData, onCancel, onSave, hideHeader = false }, ref) => {
    const isMobile = useIsMobile();
    const { saveDraft, clearDraft } = useDrafts();
    const formRef = useRef<ReportFormRef>(null);
    const hasCompleted = useRef(false);

    useImperativeHandle(ref, () => ({
      submit: () => {
        formRef.current?.submit();
      },
      cancel: () => {
        hasCompleted.current = true;
        debouncedSaveDraft.cancel();
      }
    }));

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
        return {
          sections: initialSections,
          allTemplateFields: initialFieldNames,
          finalInitialData: newInitialData
        };
      }

      // Determine the active staff to use (Draft from Orden del Día or Static Config)
      const activeStaff = (settings?.activeGuardId && settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === settings.activeGuardId)
        ? settings.ordenDelDiaDraft.staff
        : guards.find((g) => g.id === settings.activeGuardId)?.staff;

      if (!activeStaff) {
        return {
          sections: initialSections,
          allTemplateFields: initialFieldNames,
          finalInitialData: newInitialData
        };
      }

      const dataToInject: Record<string, any> = {};

      const rehydrate = (member: StaffMember) => {
        const latest = personnel.find(p => p.id === member.id);
        const val = latest || member;
        try {
          return JSON.parse(JSON.stringify(val));
        } catch (e) {
          return val;
        }
      };

      const jefeDeServiciosKey = Object.keys(activeStaff).find(
        (k) => k.toLowerCase() === 'jefe de los servicios'
      );
      if (jefeDeServiciosKey) {
        const staffList = activeStaff[jefeDeServiciosKey] || [];
        if (staffList.length > 0 && staffList[0]) {
          const firstMember = rehydrate(staffList[0] as StaffMember);
          if (firstMember) {
            dataToInject[jefeDeServiciosKey] = [formatStaffMember(firstMember)];
          }
        }
      }

      if (settings.reportaRoleIds && settings.reportaRoleIds.length > 0) {
        const reportingPersonnel: StaffMember[] = [];
        // Follow the order of reportaRoleIds (priority)
        settings.reportaRoleIds.forEach((roleId) => {
          const roleStaff = activeStaff[roleId] || [];
          reportingPersonnel.push(...roleStaff);
        });

        // Deduplicate and take ONLY the first one (single-choice field)
        const uniqueReportingIds = Array.from(new Set(reportingPersonnel.map(p => p.id)));
        if (uniqueReportingIds.length > 0) {
          const firstPersonId = uniqueReportingIds[0];
          const firstPerson = reportingPersonnel.find(p => p.id === firstPersonId);
          if (firstPerson) {
            dataToInject['Reporta'] = [rehydrate(firstPerson as StaffMember)];
          }
        }
      }

      dataToInject['Guardia'] = settings.activeGuardId;

      initialFieldNames.forEach((templateFieldKey: string) => {
        const lowerTemplateFieldKey = templateFieldKey.toLowerCase();
        const canonicalKey = Object.keys(dataToInject).find(
          (k) => k.toLowerCase() === lowerTemplateFieldKey
        );

        if (canonicalKey) {
          const valueToInject = dataToInject[canonicalKey];
          if (valueToInject === undefined) return;

          const parentSection = initialSections.find((s: any) =>
            s.fieldIds.some((sf: string) => sf.toLowerCase() === lowerTemplateFieldKey)
          );

          if (parentSection) {
            if (!parentSection.isRepeatable) {
              if (newInitialData[templateFieldKey] === undefined) {
                newInitialData[templateFieldKey] = valueToInject;
              }
            }
          } else {
            if (newInitialData[templateFieldKey] === undefined) {
              newInitialData[templateFieldKey] = valueToInject;
            }
          }
        }
      });

      // Ensure the final data is a clean, mutable clone
      let finalData = newInitialData;
      try {
        finalData = JSON.parse(JSON.stringify(newInitialData));
      } catch (e) {
        console.error('[ReportGenerator] Failed to clone finalInitialData', e);
      }

      return {
        sections: initialSections,
        allTemplateFields: initialFieldNames,
        finalInitialData: finalData
      };
    }, [template.content, initialData, settings, guards, personnel]);

    const saveDraftLogic = useCallback(async (formData: Record<string, any>) => {
      if (template && formData) {
        const draft: ReportDraft = {
          templateId: template.id,
          workspaceId: template.workspaceId,
          formData
        };
        await saveDraft(draft);
      }
    }, [template, saveDraft]);

    const debouncedSaveDraft = useMemo(
      () => debounce((formData: Record<string, any>) => saveDraftLogic(formData), 30000),
      [saveDraftLogic]
    );

    useEffect(() => {
      return () => {
        if (!hasCompleted.current) {
          debouncedSaveDraft.flush();
        }
      };
    }, [debouncedSaveDraft]);

    const handleDataChange = useCallback(
      (formData: Record<string, any>) => {
        debouncedSaveDraft(formData);
      },
      [debouncedSaveDraft]
    );

    const handleCreateReport = async (
      formData: Record<string, any>,
      content: string,
      title: string
    ) => {
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

    const handleSaveClick = () => {
      formRef.current?.submit();
    };

    const handleCopyToClipboard = () => {
      navigator.clipboard.writeText(previewContent);
      setCopyButtonText('¡Copiado!');
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopyButtonText('Copiar'), 2000);
    };

    const handlePreviewClick = () => {
      if (!formRef.current) return;
      const content = formRef.current.getRenderedContent();
      setPreviewContent(content);
      setCopyButtonText('Copiar');
      setIsPreviewOpen(true);
    };

    const formContent = (
      <div className={cn("w-full max-w-[1000px] mx-auto", !hideHeader && "p-4 sm:p-8 pb-32")}>
        <Card className={cn("border bg-card shadow-sm font-inherit", hideHeader && "border-none shadow-none bg-transparent")}>
          {!hideHeader && (
            <CardHeader className="bg-card/50 border-b">
              <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
            </CardHeader>
          )}
          <CardContent className={cn("pt-8", hideHeader && "pt-0 p-0")}>
            <ReportForm
              ref={formRef}
              reportId={`new-${template.id}`}
              template={template}
              config={config}
              initialData={finalInitialData}
              onSubmit={handleCreateReport}
              onDataChange={handleDataChange}
              controlledValues={{ 
              Estatus: 'En proceso',
              Enc: settings.ordenDelDiaDraft?.isJefeEncargado ? '(E)' : ''
            }}
            />
          </CardContent>
        </Card>
      </div>
    );

    return (
      <div className="flex flex-col h-full w-full overflow-hidden relative" id="report-generator-root">
        {/* Fixed Header - Only if not hidden */}
        {!hideHeader && (
          <header className="flex-none flex items-center justify-between border-b p-4 bg-background z-20 shadow-sm min-h-[73px]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Nuevo Reporte
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviewClick} className="bg-background shadow-sm">
                <Eye className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Vista Previa</span>
              </Button>
              <Button size="sm" onClick={handleSaveClick} className="h-9 px-3 sm:px-4 shadow-sm">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Guardar Reporte</span>
              </Button>
            </div>
          </header>
        )}

        {/* Scrollable Area - Only if not hidden (let modal handle scroll otherwise) */}
        {!hideHeader ? (
          <ScrollArea className="flex-1 min-h-0 w-full bg-muted/20 pointer-events-auto" id="generator-scroll-area" type="always">
            {formContent}
          </ScrollArea>
        ) : (
          <div className="flex-1 w-full bg-transparent">
            {formContent}
            {/* Footer actions for modal view */}
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-muted/20">
              <Button variant="outline" onClick={handlePreviewClick} className="shadow-sm">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button onClick={handleSaveClick} className="shadow-sm px-6">
                <Save className="h-4 w-4 mr-2" />
                Guardar Reporte
              </Button>
            </div>
          </div>
        )}

        {/* Shared Preview Component */}
        <ReportPreview
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          content={previewContent}
          copyButtonText={copyButtonText}
          onCopy={handleCopyToClipboard}
          isMobile={isMobile}
          title="Vista Previa del Reporte"
        />
      </div>
    );
  }
);

ReportGenerator.displayName = 'ReportGenerator';
