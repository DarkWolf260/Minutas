
'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Template, TemplateConfig, Report, ReportDraft, StaffMember } from '@/types';
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
import { useSettings } from '@/hooks/use-settings';
import { useGuards } from '@/hooks/use-guards';
import { parseTemplate } from '@/lib/template-parser';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

interface ReportGeneratorProps {
    template: Template, 
    config: TemplateConfig, 
    initialData?: Record<string, any>,
    onCancel: () => void,
    onSave: (report: Report) => void,
}

const formatStaffMemberForAutocomplete = (member: StaffMember, withCedula: boolean): string => {
    if (withCedula && member.cedula) {
        return `${member.name} ${member.cedula}`;
    }
    return member.name;
};

export function ReportGenerator({ template, config, initialData, onCancel, onSave }: ReportGeneratorProps) {
    const { saveDraft, clearDraft } = useDrafts();
    const formRef = useRef<ReportFormRef>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copiar');
    const { settings } = useSettings();
    const { guards } = useGuards();
    const { definitions } = useFieldDefinitions();
    
    const finalInitialData = useMemo(() => {
        const newInitialData = initialData ? JSON.parse(JSON.stringify(initialData)) : {};

        const { sections, fieldNames: allTemplateFields } = parseTemplate(template.content);
        
        const activeGuard = guards.find(g => g.id === settings.activeGuardId);
        if (!activeGuard) {
            return newInitialData;
        }

        const dataToInject: Record<string, any> = {};

        // Get Jefe de los servicios
        const jefeDeServiciosKey = Object.keys(activeGuard.staff || {}).find(k => k.toLowerCase() === 'jefe de los servicios');
        if (jefeDeServiciosKey) {
            const jefeStaff = activeGuard.staff[jefeDeServiciosKey] || [];
            if(jefeStaff.length > 0) {
                 dataToInject['Jefe de los Servicios'] = jefeStaff.map(member => member.name);
            }
        }
        
        // Get Reporta
        if (settings.reportaRoleId) {
            const reportaStaff = activeGuard.staff[settings.reportaRoleId] || [];
            dataToInject['Reporta'] = reportaStaff; // Keep as StaffMember[]
        }
        
        // Get Analista
        if (settings.analistaRoleId) {
            const analistaStaff = activeGuard.staff[settings.analistaRoleId] || [];
            dataToInject['Analista'] = analistaStaff; // Keep as StaffMember[]
        }
        
        // Explicitly add Guardia ID to be injected
        dataToInject['Guardia'] = activeGuard.id;

        allTemplateFields.forEach(templateFieldKey => {
            const lowerTemplateFieldKey = templateFieldKey.toLowerCase();
            const canonicalKey = Object.keys(dataToInject).find(k => k.toLowerCase() === lowerTemplateFieldKey);
            
            if (canonicalKey) {
                const valueToInject = dataToInject[canonicalKey];
                if (valueToInject === undefined) return;

                const parentSection = sections.find(s => s.fieldIds.some(sf => sf.toLowerCase() === lowerTemplateFieldKey));
                
                if (parentSection) {
                    if (!parentSection.isRepeatable) {
                        if (!newInitialData[parentSection.id]) {
                            newInitialData[parentSection.id] = {};
                        }
                        if (newInitialData[parentSection.id][templateFieldKey] === undefined) {
                            newInitialData[parentSection.id][templateFieldKey] = valueToInject;
                        }
                    }
                } else {
                    if (newInitialData[templateFieldKey] === undefined) {
                        newInitialData[templateFieldKey] = valueToInject;
                    }
                }
            }
        });

        return newInitialData;
    }, [template.content, initialData, settings.activeGuardId, settings.reportaRoleId, settings.analistaRoleId, guards]);

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
                                    initialData={finalInitialData}
                                    onSubmit={handleCreateReport}
                                    onDataChange={handleDataChange}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </div>
            
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
