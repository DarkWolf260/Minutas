'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportForm } from './report-form';
import { ReportPreview } from './report-preview';

// Componentes y Hooks extraídos (SOLID)
import { useReportGenerator } from './generator/use-report-generator';
import { GeneratorHeader } from './generator/generator-header';

export interface ReportGeneratorRef {
  submit: () => void;
  cancel: () => void;
}

interface ReportGeneratorProps {
  template: any;
  config: any;
  initialData?: Record<string, any>;
  onCancel: () => void;
  onSave: (report: any) => void;
  hideHeader?: boolean;
}

export const ReportGenerator = forwardRef<ReportGeneratorRef, ReportGeneratorProps>(
  ({ template, config, initialData, onCancel, onSave, hideHeader = false }, ref) => {
    const isMobile = useIsMobile();
    const hook = useReportGenerator({ template, initialData, onSave });

    const {
      formRef,
      sessionKey,
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
    } = hook;

    useImperativeHandle(ref, () => ({
      submit: () => {
        formRef.current?.submit();
      },
      cancel: () => {
        hasCompleted.current = true;
        debouncedSaveDraft.cancel();
      }
    }));

    const handleSaveClick = () => {
      formRef.current?.save();
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
              reportId={sessionKey}
              template={template}
              config={config}
              initialData={finalInitialData}
              onSubmit={handleCreateReport}
              onDataChange={handleDataChange}
              controlledValues={{
                Estatus: 'En proceso',
                Enc: settings.orden_del_dia_draft?.es_jefe_encargado ? '(E)' : ''
              }}
            />
          </CardContent>
        </Card>
      </div>
    );

    return (
      <div className="flex flex-col h-full w-full overflow-hidden relative" id="report-generator-root">
        {!hideHeader && (
          <GeneratorHeader onPreview={handlePreviewClick} onSave={handleSaveClick} />
        )}

        {!hideHeader ? (
          <ScrollArea className="flex-1 min-h-0 w-full bg-muted/20 pointer-events-auto" id="generator-scroll-area" type="always">
            {formContent}
          </ScrollArea>
        ) : (
          <div className="flex-1 w-full bg-transparent">
            {formContent}
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
