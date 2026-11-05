import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportForm } from '../report-form';
import type { Report, Template, TemplateConfig } from '@/lib/types';

interface ViewerContentProps {
  report: Report;
  template: Template;
  config: TemplateConfig;
  formRef: any;
  clonedInitialData: any;
  isFinalizado: boolean;
  onDataChange: (data: any, photos?: any[]) => void;
  status: string;
  settings: any;
}

export const ViewerContent = ({
  report,
  template,
  config,
  formRef,
  clonedInitialData,
  isFinalizado,
  onDataChange,
  status,
  settings
}: ViewerContentProps) => {
  return (
    <ScrollArea 
      className="flex-1 min-h-0 w-full bg-background sm:bg-muted/30 pointer-events-auto relative" 
      id="report-scroll-area"
      type="always"
    >
      <div className="w-full max-w-4xl mx-auto p-0 sm:p-6 lg:p-8 pb-32">
        <Card className="border-0 sm:border rounded-none sm:rounded-2xl bg-card shadow-none sm:shadow-xs overflow-hidden">
          <CardHeader className="border-b py-3 px-3 sm:px-6 bg-card">
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">{report.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <ReportForm
              ref={formRef}
              key={report.id}
              reportId={report.id}
              template={template}
              config={config}
              initialData={clonedInitialData}
              onSubmit={() => { }} 
              disabled={isFinalizado}
              onDataChange={onDataChange}
              controlledValues={{ 
                Estatus: status,
                Enc: settings.orden_del_dia_draft?.es_jefe_encargado ? '(E)' : '',
              }}
              initialPhotos={report.photos}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};
