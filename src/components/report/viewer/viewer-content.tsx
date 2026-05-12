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
  onDataChange: (data: any) => void;
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
              onDataChange={onDataChange}
              controlledValues={{ 
                Estatus: status,
                Enc: settings.orden_del_dia_draft?.es_jefe_encargado ? '(E)' : ''
              }}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};
