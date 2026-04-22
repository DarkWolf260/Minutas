'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Report, TemplateConfig } from '@/lib/types';
import { Trash2, Copy, CheckIcon, Eye, Save, FileText, Send } from 'lucide-react';
import { useTemplates } from '@/hooks/use-templates';
import { useSettings } from '@/hooks/use-settings';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { ReportForm, type ReportFormRef } from './report-form';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { debounce, stableStringify, validateTimeHlv } from '@/lib/utils';
import { renderFinalReport } from '@/lib/template-parser';
import { toast } from 'sonner';
import { ReportPreview } from './report-preview';
import { useSyncManager } from '@/hooks/use-sync';

export interface ReportViewerProps {
  report: Report | null;
  onSave: (report: Report) => void;
  onDelete: (id: string) => void;
}

export function ReportViewer({ report, onSave, onDelete }: ReportViewerProps) {
  const isMobile = useIsMobile();
  const formRef = useRef<ReportFormRef>(null);
  const [status, setStatus] = useState<'En proceso' | 'Finalizado'>('En proceso');
  const [copyButtonText, setCopyButtonText] = useState('Copiar');
  const [saveButtonText, setSaveButtonText] = useState('Guardar Cambios');

  const { templates, configs, isLoaded } = useTemplates();
  const { settings } = useSettings();
  const { definitions } = useFieldDefinitions();
  const { isSecondary, sendReport: sendToSync, isSyncing: isSendingSyncReport } = useSyncManager();

  const [previewContent, setPreviewContent] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      Enc: settings.ordenDelDiaDraft?.isJefeEncargado ? '(E)' : ''
    });
    const newTitle = String(formData.titulo || formData.title || template.name);

    // Time validation
    const hora = formData['Hora'];
    const timeValidation = validateTimeHlv(hora, status === 'Finalizado');
    if (!timeValidation.isValid) {
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
  }, [report, template, config, status, onSave]);

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
    const formData = await formRef.current.validate();
    if (!formData) return;

    debouncedSave.cancel();
    await saveLogic(formData);
  };

  const handleStatusChange = async (newStatus: 'En proceso' | 'Finalizado') => {
    if (!formRef.current) return;
    const formData = await formRef.current.validate();
    if (!formData) return;

    const hora = formData['Hora'];
    const timeValidation = validateTimeHlv(hora, newStatus === 'Finalizado');
    
    if (!timeValidation.isValid) {
      toast.error(timeValidation.error);
      return;
    }

    setStatus(newStatus);
    debouncedSave.cancel();

    if (!report || !template) return;
    const content = renderFinalReport(template.content, formData, config, { 
      Estatus: newStatus,
      Enc: settings.ordenDelDiaDraft?.isJefeEncargado ? '(E)' : ''
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

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-card text-center">
        <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
        <h3 className="mt-4 text-lg font-semibold">No hay reporte seleccionado</h3>
        <p className="text-muted-foreground">Selecciona un reporte de la lista.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 bg-muted/5">
        <div className="h-full w-full max-w-[1000px] bg-muted/20 rounded-2xl animate-pulse aspect-video mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Cargando plantilla...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <ScrollArea className="flex-1 w-full" type="always">
          <div className="p-6 text-center max-w-2xl mx-auto">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <h3 className="mt-4 text-lg font-semibold text-destructive">Error en la Plantilla</h3>
            <p className="text-muted-foreground mb-6">La plantilla no se encuentra o tiene un error.</p>
            <div className="text-left">
              <Label>Contenido Original</Label>
              <div className="mt-2 p-4 bg-muted/40 rounded-md border font-mono text-sm whitespace-pre-wrap leading-relaxed min-h-[200px]">
                {report.content}
              </div>
            </div>
            <Button variant="destructive" className="mt-6" onClick={() => onDelete(report.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Reporte
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" id="report-viewer-root">
      {/* Fixed Header */}
      <header className="flex-none flex items-center justify-between border-b p-4 bg-background z-20 shadow-sm min-h-[73px]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(report.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreviewClick} className="bg-background shadow-sm">
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Vista Previa</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger id="report-status" className="h-9 w-[110px] sm:w-[150px] bg-background">
              <SelectValue placeholder="Estatus..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="En proceso">En proceso</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
          {isSecondary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendToSync(report)}
              disabled={isSendingSyncReport}
              className="h-9 px-3 sm:px-4 shadow-sm border-violet-500/40 text-violet-600 hover:bg-violet-500/10"
              title="Enviar al dispositivo principal"
            >
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Enviar al Principal</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isFinalizado || saveButtonText === 'Guardado'}
            className="h-9 px-3 sm:px-4 shadow-sm"
          >
            {saveButtonText === 'Guardado' ? (
              <CheckIcon className="h-4 w-4 sm:mr-2" />
            ) : (
              <Save className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{saveButtonText}</span>
          </Button>
        </div>
      </header>

      {/* Truly Scrollable Area */}
      <ScrollArea 
        className="flex-1 min-h-0 w-full bg-muted/10 pointer-events-auto relative" 
        id="report-scroll-area"
        type="always"
      >
        <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-8 pb-32">
          <Card className="border bg-card shadow-sm">
            <CardHeader className="bg-card/50 border-b">
              <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-4 sm:px-6">
              <ReportForm
                ref={formRef}
                key={report.id}
                reportId={report.id}
                template={template}
                config={config}
                initialData={clonedInitialData}
                onSubmit={() => { }} 
                disabled={isFinalizado}
                onDataChange={handleDataChange}
                controlledValues={{ 
                  Estatus: status,
                  Enc: settings.ordenDelDiaDraft?.isJefeEncargado ? '(E)' : ''
                }}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Shared Preview Component */}
      <ReportPreview
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        content={previewContent}
        copyButtonText={copyButtonText}
        onCopy={handleCopyToClipboard}
        isMobile={isMobile}
        title="Vista Previa"
      />
    </div>
  );
}
