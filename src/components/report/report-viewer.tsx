'use client';

import React from 'react';
import type { Report } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportPreview } from './report-preview';

// Componentes extraídos (SOLID)
import { useReportViewer } from './viewer/use-report-viewer';
import { ViewerHeader } from './viewer/viewer-header';
import { ViewerContent } from './viewer/viewer-content';
import { ViewerEmpty, ViewerLoading, ViewerError } from './viewer/viewer-states';

export interface ReportViewerProps {
  report: Report | null;
  onSave: (report: Report) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function ReportViewer({ report, onSave, onDelete, onClose }: ReportViewerProps) {
  const isMobile = useIsMobile();
  const hook = useReportViewer({ report, onSave });

  const {
    formRef,
    status,
    saveButtonText,
    isPreviewOpen,
    setIsPreviewOpen,
    previewContent,
    copyButtonText,
    template,
    config,
    isLoaded,
    isFinalizado,
    clonedInitialData,
    handleCopyToClipboard,
    handleSave,
    handleStatusChange,
    handlePreviewClick,
    handleDataChange,
    isSecondary,
    sendToSync,
    isSendingSyncReport,
    settings
  } = hook;

  // Estados Excepcionales (SRP)
  if (!report) return <ViewerEmpty />;
  if (!isLoaded) return <ViewerLoading />;
  if (!template) return <ViewerError report={report} onDelete={onDelete} />;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" id="report-viewer-root">
      {/* Cabezal de Acciones */}
      <ViewerHeader 
        status={status}
        onStatusChange={handleStatusChange}
        onDelete={() => onDelete(report.id)}
        onPreview={handlePreviewClick}
        onSave={handleSave}
        onClose={onClose}
        saveButtonText={saveButtonText}
        isFinalizado={isFinalizado}
        isSecondary={isSecondary}
        sendToSync={() => sendToSync(report)}
        isSendingSyncReport={isSendingSyncReport}
      />

      {/* Contenido Principal y Formulario */}
      <ViewerContent 
        report={report}
        template={template}
        config={config}
        formRef={formRef}
        clonedInitialData={clonedInitialData}
        isFinalizado={isFinalizado}
        onDataChange={handleDataChange}
        status={status}
        settings={settings}
      />

      {/* Vista Previa Compartida */}
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
