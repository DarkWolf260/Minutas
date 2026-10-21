import React, { useRef, useEffect, useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MessageSquare,
  Shield,
  Loader2,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { WhatsAppChatHeader } from './whatsapp-chat-header';
import { WhatsAppChatBubble } from './whatsapp-chat-bubble';
import { WhatsAppChatInput } from './whatsapp-chat-input';
import {
  useWhatsAppChat,
  type UseWhatsAppChatOptions
} from '@/hooks/whatsapp';
import type { Report } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

export interface WhatsAppChatViewProps extends UseWhatsAppChatOptions {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onOpenCreateDialog?: () => void;
  className?: string;
}

export function WhatsAppChatView({
  reports,
  templates,
  selectedReportId,
  onSelectReport,
  guardiaAbierta,
  isExpanded,
  onToggleExpand,
  onOpenCreateDialog,
  className
}: WhatsAppChatViewProps) {
  const navigate = useNavigate();
  const chatHook = useWhatsAppChat({
    reports,
    templates,
    selectedReportId,
    onSelectReport,
    guardiaAbierta
  });

  const {
    currentChat,
    realMessages,
    isLoadingMessages,
    isBotReady,
    bot,
    handleSendReportToChat
  } = chatHook;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on mount or new messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [currentChat.id, realMessages.length, reports.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  // Sort reports chronologically for chat stream (oldest first at top, newest at bottom like WhatsApp)
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });
  }, [reports]);

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full bg-[#efeae2]/40 dark:bg-[#0b141a] overflow-hidden relative',
        className
      )}
    >
      {/* Background Wallpaper Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.045] bg-repeat z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header */}
      <WhatsAppChatHeader
        chatHook={chatHook}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      {/* Messages Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-1 sm:px-2 py-3 z-10 space-y-2 relative"
      >
        {/* Date / Shift Banner */}
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-background/80 text-muted-foreground shadow-xs border border-border/40 backdrop-blur-xs">
            {currentChat.isGuardNovedades
              ? 'HOY — NOVEDADES DE LA GUARDIA ACTIVA'
              : currentChat.name.toUpperCase()}
          </span>
        </div>

        {/* CASE 1: Guard Novedades Feed */}
        {currentChat.isGuardNovedades && (
          <>
            {sortedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center my-8 text-muted-foreground max-w-xs mx-auto">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Sin novedades registradas</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Las novedades que tú o tu equipo registren en este turno aparecerán aquí como una conversación de WhatsApp.
                </p>
                {onOpenCreateDialog && guardiaAbierta && (
                  <Button
                    size="sm"
                    onClick={onOpenCreateDialog}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs rounded-xl shadow-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Registrar Novedad
                  </Button>
                )}
              </div>
            ) : (
              sortedReports.map(report => (
                <WhatsAppChatBubble
                  key={report.id}
                  report={report}
                  isSelected={report.id === selectedReportId}
                  onSelectReport={onSelectReport}
                  onSendReportToChat={handleSendReportToChat}
                  isBotReady={isBotReady}
                />
              ))
            )}
          </>
        )}

        {/* CASE 2: Real WhatsApp Chat Feed */}
        {!currentChat.isGuardNovedades && (
          <>
            {/* If bot is not ready: show offline / QR helper */}
            {!isBotReady ? (
              <div className="p-4 my-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm text-center space-y-3">
                {bot.status.needsAuth && bot.status.qr ? (
                  <div className="space-y-3">
                    <div className="font-bold text-xs text-foreground">
                      Escanea para vincular WhatsApp
                    </div>
                    <div className="p-3 bg-white rounded-xl inline-block shadow-xs border">
                      <QRCodeSVG value={bot.status.qr} size={160} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Abre WhatsApp en tu teléfono &gt; Dispositivos vinculados &gt; Vincular dispositivo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs text-foreground">Bot de WhatsApp Desconectado</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Para leer y enviar mensajes reales a {currentChat.name}, enciende el bot local con <code>iniciar-bot.bat</code> o verifica la URL.
                    </p>
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bot.checkStatus(true)}
                        className="h-7 text-xs"
                      >
                        Reintentar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/settings?tab=sync')}
                        className="h-7 text-xs text-emerald-600"
                      >
                        Configuración
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : isLoadingMessages && realMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs">Cargando mensajes...</span>
              </div>
            ) : realMessages.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground my-8">
                No se encontraron mensajes recientes en este chat.
              </div>
            ) : (
              realMessages.map(msg => (
                <WhatsAppChatBubble
                  key={msg.id}
                  message={msg}
                />
              ))
            )}
          </>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute right-4 bottom-16 z-20 h-8 w-8 rounded-full bg-background/90 text-foreground border shadow-md flex items-center justify-center hover:bg-muted transition-transform active:scale-95"
          title="Bajar al último mensaje"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* Bottom Input */}
      <WhatsAppChatInput
        chatHook={chatHook}
        onOpenCreateDialog={onOpenCreateDialog}
      />
    </div>
  );
}
