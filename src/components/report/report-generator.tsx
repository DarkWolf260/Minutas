'use client';

import { useState, useRef, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember } from '@/types';
import { ReportForm, type ReportFormRef } from './report-form';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Copy, CheckIcon, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useDrafts } from '@/hooks/use-drafts';
import { debounce } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/use-settings';
import { useGuards } from '@/hooks/use-guards';
import { usePersonnel } from '@/hooks/use-personnel';
import { formatStaffMember, formatStaffReporta } from '@/lib/formatters';
import { parseTemplate } from '@/lib/template-parser';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';

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
}

export const ReportGenerator = forwardRef<ReportGeneratorRef, ReportGeneratorProps>(
  ({ template, config, initialData, onCancel, onSave }, ref) => {
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
    const initialFieldNames = Array.from(parsedTemplate.fieldNames);
    const newInitialData = initialData ? JSON.parse(JSON.stringify(initialData)) : {};

    if (!settings?.activeGuardId || !guards || !personnel) {
      return {
        sections: initialSections,
        allTemplateFields: initialFieldNames,
        finalInitialData: newInitialData
      };
    }

    const activeGuard = guards.find((g) => g.id === settings.activeGuardId);
    if (!activeGuard) {
      return {
        sections: initialSections,
        allTemplateFields: initialFieldNames,
        finalInitialData: newInitialData
      };
    }

    const dataToInject: Record<string, any> = {};

    // Helper to rehydrate staff member from database
    const rehydrate = (member: StaffMember) => {
      const latest = personnel.find(p => p.id === member.id);
      return latest || member;
    };

    // Get Jefe de los servicios
    const jefeDeServiciosKey = Object.keys(activeGuard.staff || {}).find(
      (k) => k.toLowerCase() === 'jefe de los servicios'
    );
    if (jefeDeServiciosKey) {
      const jefeStaff = activeGuard.staff[jefeDeServiciosKey] || [];
      if (jefeStaff.length > 0) {
        dataToInject['Jefe de los Servicios'] = jefeStaff.map((member) => formatStaffMember(rehydrate(member)));
      }
    }

    // Get Reporting Personnel (Multi-role with priority)
    if (settings.reportaRoleIds && settings.reportaRoleIds.length > 0) {
      const reportingPersonnel: StaffMember[] = [];
      settings.reportaRoleIds.forEach((roleId) => {
        const roleStaff = activeGuard.staff[roleId] || [];
        reportingPersonnel.push(...roleStaff);
      });
      dataToInject['Reporta'] = reportingPersonnel.map(p => rehydrate(p));
    }

    // Explicitly add Guardia ID to be injected
    dataToInject['Guardia'] = activeGuard.id;

    initialFieldNames.forEach((templateFieldKey) => {
      const lowerTemplateFieldKey = templateFieldKey.toLowerCase();

      const canonicalKey = Object.keys(dataToInject).find(
        (k) => k.toLowerCase() === lowerTemplateFieldKey
      );

      if (canonicalKey) {
        const valueToInject = dataToInject[canonicalKey];
        if (valueToInject === undefined) return;

        const parentSection = initialSections.find((s) =>
          s.fieldIds.some((sf) => sf.toLowerCase() === lowerTemplateFieldKey)
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

    return {
      sections: initialSections,
      allTemplateFields: initialFieldNames,
      finalInitialData: newInitialData
    };
  }, [
    template.content,
    initialData,
    settings,
    guards,
    personnel
  ]);

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
      formData: formData,
    };

    onSave(newReport);
  };

  const handleCancel = () => {
    hasCompleted.current = true;
    debouncedSaveDraft.cancel();
    onCancel();
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

  return (
    <>
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="hidden sm:inline-flex"
            >
              Cancelar
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreviewClick}>
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Vista Previa</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveClick}>
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Crear Novedad</span>
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 pb-32 sm:p-6 lg:p-8">
            <Card>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>Completa los campos para generar el reporte.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReportForm
                  ref={formRef}
                  template={template}
                  config={config}
                  initialData={finalInitialData}
                  onSubmit={handleCreateReport}
                  onDataChange={handleDataChange}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Preview Dialog - Responsive */}
      {isMobile ? (
        <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Vista Previa del Reporte</SheetTitle>
              <SheetDescription>
                Revisa el reporte generado. Puedes copiar el texto para usarlo donde necesites.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto mt-4 px-1">
              <Textarea
                readOnly
                value={previewContent}
                className="w-full h-full min-h-[60vh] bg-muted/50 font-mono text-sm whitespace-pre-wrap rounded-lg p-3"
              />
            </div>
            <SheetFooter className="mt-4 flex-row gap-2">
              <Button className="flex-1" type="button" onClick={handleCopyToClipboard}>
                {copyButtonText === 'Copiar' ? (
                  <Copy className="mr-2 h-4 w-4" />
                ) : (
                  <CheckIcon className="mr-2 h-4 w-4" />
                )}
                {copyButtonText}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-3xl flex flex-col">
            <DialogHeader>
              <DialogTitle>Vista Previa del Reporte</DialogTitle>
              <DialogDescription>
                Revisa el reporte generado. Puedes copiar el texto para usarlo donde necesites.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <Textarea
                readOnly
                value={previewContent}
                className="w-full h-full min-h-[50vh] bg-muted/50 font-mono text-sm whitespace-pre-wrap"
              />
            </div>
            <DialogFooter className="mt-auto pt-4">
              <Button type="button" onClick={handleCopyToClipboard}>
                {copyButtonText === 'Copiar' ? (
                  <Copy className="mr-2 h-4 w-4" />
                ) : (
                  <CheckIcon className="mr-2 h-4 w-4" />
                )}
                {copyButtonText}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});
