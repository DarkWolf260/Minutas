import React, { useState } from 'react';
import {
  MessageSquare,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Report, Template } from '@/lib/types';
import { useWhatsAppBot } from '@/hooks/whatsapp';
import { WhatsAppChatView } from './whatsapp-chat-view';
import { WhatsAppChatList } from './whatsapp-chat-list';

export interface WhatsAppRightPanelProps {
  bot: ReturnType<typeof useWhatsAppBot>;
  reports: Report[];
  templates: Template[];
  selectedReportId: string | null;
  onSelectReport: (id: string | null, isBack?: boolean) => void;
  guardiaAbierta: boolean;
  onOpenCreateDialog: () => void;
  isChatExpanded: boolean;
  onToggleExpandChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function WhatsAppRightPanel({
  bot,
  reports,
  templates,
  selectedReportId,
  onSelectReport,
  guardiaAbierta,
  onOpenCreateDialog,
  isChatExpanded,
  onToggleExpandChat,
  isCollapsed,
  onToggleCollapse,
  className
}: WhatsAppRightPanelProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return localStorage.getItem('minutas_active_whatsapp_chat') || null;
  });

  const [subVista, setSubVista] = useState<'chats' | 'conversacion'>(() => {
    return activeChatId ? 'conversacion' : 'chats';
  });

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    localStorage.setItem('minutas_active_whatsapp_chat', chatId);
    setSubVista('conversacion');
  };

  const isBotReady = (bot.isAvailable && bot.status.isReady) || bot.isCloudActive;

  // Si está colapsado, mostrar barra lateral delgada con botón para expandir
  if (isCollapsed) {
    return (
      <aside
        className={cn(
          "w-12 bg-card border-l border-border/80 flex flex-col items-center py-3 shrink-0 h-full select-none transition-all duration-300 relative z-20 group",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          title="Expandir panel de WhatsApp"
          className="h-9 w-9 rounded-xl hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 relative"
        >
          <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {isBotReady && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </Button>

        {/* Texto vertical rotado */}
        <div
          onClick={onToggleCollapse}
          className="flex-1 flex items-center justify-center cursor-pointer mt-4"
        >
          <span
            className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Chat WhatsApp
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          title="Expandir panel de WhatsApp"
          className="h-8 w-8 text-muted-foreground hover:text-foreground mt-auto"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "w-80 lg:w-96 bg-card border-l border-border/80 flex flex-col shrink-0 h-full min-h-0 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300",
        className
      )}
    >
      {subVista === 'chats' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Header de la lista de chats */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b bg-card">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-foreground tracking-wide">
                WhatsApp
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              title="Ocultar panel lateral"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>

          <WhatsAppChatList
            bot={bot}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <WhatsAppChatView
            reports={reports}
            templates={templates}
            selectedReportId={selectedReportId}
            onSelectReport={onSelectReport}
            guardiaAbierta={guardiaAbierta}
            isExpanded={false}
            externalActiveChatId={activeChatId}
            onChatChange={(id) => {
              setActiveChatId(id);
              if (id) localStorage.setItem('minutas_active_whatsapp_chat', id);
            }}
            onToggleExpand={onToggleExpandChat}
            onOpenCreateDialog={onOpenCreateDialog}
            onBack={() => setSubVista('chats')}
            onCollapse={onToggleCollapse}
            className="h-full"
          />
        </div>
      )}
    </aside>
  );
}
