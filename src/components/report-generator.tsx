'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Template, TemplateConfig, Report, ReportDraft } from '@/types';
import { ReportForm, type ReportFormRef } from './report-form';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Copy, CheckIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useDrafts } from '@/hooks/use-drafts';
import { debounce } from '@/lib/utils';


interface ReportGeneratorProps {
    template: Template, 
    config: TemplateConfig, 
    initialData?: Record<string, any>,
    onCancel: () => void,
    onSave: (report: Report) => void,
}

export function ReportGenerator({ template, config, initialData, onCancel, onSave }: ReportGeneratorProps) {
    const { saveDraft, clearDraft } = useDrafts();
    const formRef = useRef<ReportFormRef>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copiar');
    
    const saveDraftLogicRef = useRef<((formData: Record<string, any>) => void) | null>(null);
    
    useEffect(() => {
        saveDraftLogicRef.current = (formData: Record<string, any>) => {
            if (template && formData) {
                const draft: ReportDraft = { templateId: template.id, formData };
                saveDraft(draft);
            }
        };
    }, [template, saveDraft]);

    const debouncedSaveDraft = useMemo(
        () => debounce((formData: Record<string, any>) => {
            saveDraftLogicRef.current?.(formData);
        }, 30000),
        []
    );

    useEffect(() => {
        return () => {
            debouncedSaveDraft.flush();
        };
    }, [debouncedSaveDraft]);

    const handleDataChange = useCallback((formData: Record<string, any>) => {
        debouncedSaveDraft(formData);
    }, [debouncedSaveDraft]);
    
    const handleCreateReport = (formData: Record<string, any>, content: string, title: string) => {
        debouncedSaveDraft.cancel();
        clearDraft();
        
        const newReport: Report = {
            id: `report_${Date.now()}`,
            templateId: template.id,
            title: title,
            timestamp: new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }),
            content: content,
            isRelevant: template.type === 'relevante',
            status: 'En proceso',
            formData: formData,
        };
        
        onSave(newReport);
    };

    const handleCancel = () => {
        debouncedSaveDraft.flush();
        onCancel();
    };

    const handleSaveClick = () => {
        formRef.current?.submit();
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(previewContent);
        setCopyButtonText('¡Copiado!');
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
            <div className="flex h-full flex-col">
                 <div className="flex items-center justify-between border-b p-3">
                     <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={handleCancel}>
                            Cancelar
                        </Button>
                         <Button variant="outline" size="sm" onClick={handlePreviewClick}>
                            <Eye className="mr-2 h-4 w-4" />
                            Vista Previa
                        </Button>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={handleSaveClick}>
                            Crear Novedad
                        </Button>
                    </div>
                </div>
                 <ScrollArea className="flex-1">
                    <div className="p-4 sm:p-6 lg:p-8">
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
                                    initialData={initialData}
                                    onSubmit={handleCreateReport}
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
