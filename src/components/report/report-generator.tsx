'use client';

import { useState, useRef, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember } from '@/types';
import { ReportForm, type ReportFormRef } from './report-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Copy, CheckIcon, Save, FileText } from 'lucide-react';
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
import { formatStaffMember } from '@/lib/formatters';
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
        return latest || member;
      };

      const jefeDeServiciosKey = Object.keys(activeStaff).find(
        (k) => k.toLowerCase() === 'jefe de los servicios'
      );
      if (jefeDeServiciosKey) {
        const jefeStaff = activeStaff[jefeDeServiciosKey] || [];
        if (jefeStaff.length > 0) {
          dataToInject['Jefe de los Servicios'] = jefeStaff.map((member) => formatStaffMember(rehydrate(member)));
        }
      }

      if (settings.reportaRoleIds && settings.reportaRoleIds.length > 0) {
        const reportingPersonnel: StaffMember[] = [];
        settings.reportaRoleIds.forEach((roleId) => {
          const roleStaff = activeStaff[roleId] || [];
          reportingPersonnel.push(...roleStaff);
        });
        dataToInject['Reporta'] = reportingPersonnel.map(p => rehydrate(p));
      }

      dataToInject['Guardia'] = settings.activeGuardId;

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
        formData: formData,
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

    return (
      <div className="flex flex-col h-full w-full overflow-hidden relative" id="report-generator-root">
        {/* Fixed Header */}
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

        {/* Scrollable Area */}
        <ScrollArea className="flex-1 min-h-0 w-full bg-muted/20 pointer-events-auto" id="generator-scroll-area" type="always">
          <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-8 pb-40">
            <Card className="shadow-xl border-none ring-1 ring-border/50 font-inherit">
              <CardHeader className="bg-card/50 border-b">
                <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
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

        {/* Dialogs */}
        {isMobile ? (
          <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
              <SheetHeader className="text-left">
                <SheetTitle>Vista Previa del Reporte</SheetTitle>
                <SheetDescription>Revisa el reporte generado.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 min-h-0 mt-4 border rounded-md bg-muted/50 overflow-hidden">
                <ScrollArea className="h-full w-full" type="always">
                  <div className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {previewContent}
                  </div>
                </ScrollArea>
              </div>
              <SheetFooter className="mt-4 flex-row gap-2">
                <Button className="flex-1" onClick={handleCopyToClipboard}>
                  {copyButtonText}
                </Button>
                <SheetClose asChild><Button variant="secondary">Cerrar</Button></SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-h-[90vh] max-w-3xl flex flex-col p-6">
              <DialogHeader className="pb-4">
                <DialogTitle>Vista Previa del Reporte</DialogTitle>
                <DialogDescription>Revisa el reporte generado.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 border rounded-md bg-muted/50 overflow-hidden">
                <ScrollArea className="h-full w-full" type="always">
                  <div className="p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {previewContent}
                  </div>
                </ScrollArea>
              </div>
              <DialogFooter className="mt-auto pt-6">
                <Button onClick={handleCopyToClipboard} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {copyButtonText}
                </Button>
                <DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }
);

ReportGenerator.displayName = 'ReportGenerator';
