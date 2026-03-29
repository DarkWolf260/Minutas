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
import type { Report, TemplateConfig } from '@/types';
import { Trash2, Copy, CheckIcon, Eye, Save, FileText } from 'lucide-react';
import { useTemplates } from '@/hooks/use-templates';
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
import { debounce, stableStringify } from '@/lib/utils';
import { renderFinalReport } from '@/lib/template-parser';
import { toast } from 'sonner';

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

  const saveLogic = useCallback(async (formData: Record<string, any>) => {
    if (!report || !template) return;

    const content = renderFinalReport(template.content, formData, config, {});
    const newTitle = String(formData.titulo || formData.title || template.name);

    if (
      report.content === content &&
      report.title === newTitle &&
      report.status === status &&
      stableStringify(report.formData) === stableStringify(formData)
    ) {
      setSaveButtonText('Guardado');
      return;
    }

    const finalReport: Report = {
      ...report,
      title: newTitle,
      content: content,
      formData: formData,
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

    setStatus(newStatus);
    debouncedSave.cancel();

    if (!report || !template) return;
    const content = renderFinalReport(template.content, formData, config, {});
    const newTitle = String(formData.titulo || formData.title || template.name);
    const finalReport: Report = {
      ...report,
      title: newTitle,
      content: content,
      formData: formData,
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
        <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-8 pb-60">
          <Card className="shadow-xl border-none ring-1 ring-border/50">
            <CardHeader className="bg-card/50 border-b">
              <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-4 sm:px-6">
              <ReportForm
                ref={formRef}
                key={report.id}
                template={template}
                config={config}
                initialData={report.formData}
                onSubmit={() => { }} 
                disabled={isFinalizado}
                onDataChange={handleDataChange}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Preview overlays */}
      {isMobile ? (
        <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Vista Previa</SheetTitle>
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
              <Button className="flex-1" onClick={handleCopyToClipboard}>{copyButtonText}</Button>
              <SheetClose asChild><Button variant="secondary">Cerrar</Button></SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl flex flex-col p-6">
            <DialogHeader className="pb-4">
              <DialogTitle>Vista Previa</DialogTitle>
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
