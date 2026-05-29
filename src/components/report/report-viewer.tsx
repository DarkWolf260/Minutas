'use client';

import React, { useState } from 'react';
import type { Report } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportPreview } from './report-preview';
import { useWhatsAppBot } from '@/hooks/use-whatsapp-bot';
import { useScheduledMessages } from '@/hooks/use-scheduled-messages';
import { toast } from 'sonner';

// Componentes extraídos (SOLID)
import { useWorkspaceManager } from '@/lib/db/db-context';
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

  const { isCloud } = useWorkspaceManager();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const { scheduleMessage } = useScheduledMessages();
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleWhatsAppSend = async () => {
    if (!formRef.current) return;
    const content = formRef.current.getRenderedContent();
    const photos = formRef.current.getPhotos() || [];
    const chatIds = settings?.whatsapp_default_chat_ids || [];
    
    if (chatIds.length === 0) {
      toast.error('No has configurado grupos destino.', { 
        description: 'Ve a Configuración > Sincronización para seleccionar al menos un chat.' 
      });
      return;
    }

    setIsSendingWhatsApp(true);
    const loadingToast = toast.loading('Enviando reporte con imágenes a WhatsApp...');
    
    try {
      // Enviar a todos los chats configurados
      for (const chatId of chatIds) {
        await bot.sendMessage(chatId, content, photos);
      }
      toast.success(`Enviado a ${chatIds.length} chat(s) en WhatsApp`, { id: loadingToast });
    } catch (error: any) {
      toast.error('Error al enviar mensaje', { 
        id: loadingToast,
        description: error.message || 'El bot local falló al procesar el mensaje o los adjuntos'
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleWhatsAppSchedule = async (scheduledTime: Date) => {
    if (!report || !formRef.current) return;
    const content = formRef.current.getRenderedContent();
    const photos = formRef.current.getPhotos() || [];
    const chatIds = settings?.whatsapp_default_chat_ids || [];
    
    if (chatIds.length === 0) {
      toast.error('No has configurado grupos destino.', { 
        description: 'Ve a Configuración > Sincronización para seleccionar al menos un chat.' 
      });
      return;
    }

    try {
      for (const chatId of chatIds) {
        await scheduleMessage(chatId, content, scheduledTime, report.title, photos);
      }
      toast.success(`Mensaje programado para ${scheduledTime.toLocaleString()}`);
    } catch (error: any) {
      toast.error('Error al programar mensaje', { 
        description: error.message || 'No se pudo guardar la programación' 
      });
    }
  };

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
        onWhatsAppSend={handleWhatsAppSend}
        onWhatsAppSchedule={handleWhatsAppSchedule}
        isWhatsAppAvailable={bot.isAvailable && bot.status.isReady}
        isSendingWhatsApp={isSendingWhatsApp}
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
