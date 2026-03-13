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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
import { debounce } from '@/lib/utils';
import { renderFinalReport } from '@/lib/template-parser';
import { toast } from 'sonner';

interface ReportViewerProps {
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

  const { templates, configs } = useTemplates();

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
    const formData = formRef.current.getValues();
    debouncedSave.cancel();
    await saveLogic(formData);
  };

  const handleStatusChange = async (newStatus: 'En proceso' | 'Finalizado') => {
    setStatus(newStatus);

    if (!formRef.current) return;
    const formData = formRef.current.getValues();
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
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay reporte seleccionado</h3>
        <p className="text-muted-foreground">
          Selecciona un reporte de la lista para verlo o editarlo.
        </p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-full flex-col min-h-0">
        <ScrollArea className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center bg-card text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-destructive">Error en la Plantilla</h3>
            <p className="text-muted-foreground">
              La plantilla de este reporte tiene un error o no se encuentra. No se puede editar,
              pero puedes ver su contenido original o eliminarlo.
            </p>
            <div className="mt-4 w-full max-w-2xl text-left">
              <Label>Contenido del Reporte Original</Label>
              <Textarea
                readOnly
                value={report.content}
                className="mt-2 font-mono text-sm flex-1 min-h-0"
                autoSize
              />
            </div>
            <Button variant="destructive" className="mt-6" onClick={() => onDelete(report.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Reporte
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col min-h-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onDelete(report.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreviewClick}>
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Vista Previa</span>
            </Button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id="report-status" className="w-[110px] sm:w-[150px] text-xs sm:text-sm">
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
              className="px-2 sm:px-4"
            >
              {saveButtonText === 'Guardado' ? (
                <CheckIcon className="h-4 w-4 sm:mr-2" />
              ) : (
                <Save className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{saveButtonText}</span>
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 pb-32 sm:p-6 lg:p-8">
            <Card>
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportForm
                  ref={formRef}
                  key={report.id}
                  template={template}
                  config={config}
                  initialData={report.formData}
                  onSubmit={() => { }} // Not used here, handled by manual save
                  disabled={isFinalizado}
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
}
