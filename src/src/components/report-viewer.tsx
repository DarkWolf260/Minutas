
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { Report, Template } from '@/types';
import { Trash2, Copy, CheckIcon, FileText, Eye, Save } from 'lucide-react';
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
import { debounce } from '@/lib/utils';

interface ReportViewerProps {
  report: Report | null;
  onSave: (report: Report) => void;
  onDelete: (id: string) => void;
}

export function ReportViewer({ report, onSave, onDelete }: ReportViewerProps) {
    const formRef = useRef<ReportFormRef>(null);
    const [status, setStatus] = useState<'En proceso' | 'Finalizado'>('En proceso');
    const [copyButtonText, setCopyButtonText] = useState('Copiar');
    const [saveButtonText, setSaveButtonText] = useState('Guardar Cambios');
    
    const { templates, configs } = useTemplates();

    const [previewContent, setPreviewContent] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const template = useMemo(() => report ? templates.find(t => t.id === report.templateId) : null, [report, templates]);
    const config = useMemo(() => report ? configs[report.templateId] || {} : {}, [report, configs]);
    const isFinalizado = useMemo(() => status === 'Finalizado', [status]);

    const saveLogicRef = useRef<() => void>();
    const isDirtyRef = useRef(false);

    // This effect updates the save logic on every render to capture the latest state and props
    useEffect(() => {
        saveLogicRef.current = () => {
            if (formRef.current && report && template) {
                const formData = formRef.current.getValues();
                const content = formRef.current.getRenderedContent();
                const newTitle = formData.titulo || formData.title || template.name;
                
                const finalReport: Report = {
                    ...report,
                    title: newTitle,
                    content: content,
                    formData: formData,
                    status: status,
                    timestamp: new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }),
                };
                onSave(finalReport);
                setSaveButtonText('Guardado');
                isDirtyRef.current = false;
            }
        };
    });

    const debouncedSave = useMemo(
        () => debounce(() => {
            saveLogicRef.current?.();
        }, 30000),
        []
    );

    // This is the key effect for saving on navigation.
    // It runs a cleanup function when the component unmounts or when `report` changes.
    useEffect(() => {
        return () => {
            // When leaving the report, if there are pending changes, save them immediately.
            if (isDirtyRef.current) {
                saveLogicRef.current?.();
            }
        };
    }, [report]);


    useEffect(() => {
        if (report) {
            setStatus(report.status || 'En proceso');
            setSaveButtonText('Guardar Cambios');
            isDirtyRef.current = false; // Reset dirty flag for the new report.
        }
    }, [report]);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(previewContent);
        setCopyButtonText('¡Copiado!');
        setTimeout(() => setCopyButtonText('Copiar'), 2000);
    };

    const handleSave = () => {
        debouncedSave.cancel();
        saveLogicRef.current?.();
    };
    
    const handleStatusChange = (newStatus: 'En proceso' | 'Finalizado') => {
        debouncedSave.cancel();
        setStatus(newStatus);

        if (!report || !template || !formRef.current) return;
        
        const formData = formRef.current.getValues();
        const content = formRef.current.getRenderedContent();
        const newTitle = formData.titulo || formData.title || template.name;
        
        const finalReport: Report = {
            ...report,
            title: newTitle,
            content: content,
            formData: formData,
            status: newStatus, // Use the new status directly
            timestamp: new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }),
        };
        onSave(finalReport);
        setSaveButtonText('Guardado');
        isDirtyRef.current = false;
    }
    
    const handlePreviewClick = () => {
        if (!formRef.current) return;

        const content = formRef.current.getRenderedContent();
        setPreviewContent(content);
        setCopyButtonText('Copiar');
        setIsPreviewOpen(true);
    };

    const handleDataChange = useCallback(() => {
        isDirtyRef.current = true;
        setSaveButtonText('Guardar Cambios');
        debouncedSave();
    }, [debouncedSave]);

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
            <div className="flex h-full flex-col items-center justify-center bg-card p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-destructive">Plantilla no encontrada</h3>
                <p className="text-muted-foreground">
                  La plantilla original de este reporte no existe y no se puede editar.
                </p>
                <div className="mt-4 w-full max-w-2xl text-left">
                    <Label>Contenido del Reporte Original</Label>
                    <Textarea readOnly value={report.content} className="mt-2 h-64 font-mono text-sm" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-3">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(report.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="sm" onClick={handlePreviewClick}>
                            <Eye className="mr-2 h-4 w-4" />
                            Vista Previa
                        </Button>
                    </div>
                     <div className="flex items-center gap-2">
                        <Select value={status} onValueChange={handleStatusChange}>
                            <SelectTrigger id="report-status" className="w-[180px]">
                               <SelectValue placeholder="Estatus..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="En proceso">En proceso</SelectItem>
                                <SelectItem value="Finalizado">Finalizado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} disabled={isFinalizado || saveButtonText === 'Guardado'}>
                            {saveButtonText === 'Guardado' ? <CheckIcon className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            {saveButtonText}
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                     <div className="p-4 sm:p-6 lg:p-8">
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
                                    onSubmit={() => {}} // Not used here, handled by manual save
                                    disabled={isFinalizado}
                                    onDataChange={handleDataChange}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Vista Previa del Reporte</DialogTitle>
                        <DialogDescription>
                            Revisa el reporte generado. Puedes copiar el texto para usarlo donde necesites.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            readOnly
                            value={previewContent}
                            className="h-[60vh] bg-muted/50 font-mono text-sm whitespace-pre-wrap"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleCopyToClipboard}>
                            {copyButtonText === 'Copiar' ? <Copy className="mr-2 h-4 w-4" /> : <CheckIcon className="mr-2 h-4 w-4" />}
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
        </>
    );
}
