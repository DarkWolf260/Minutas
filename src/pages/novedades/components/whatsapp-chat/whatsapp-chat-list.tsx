'use client';

import React, { useState } from 'react';
import {
  Search,
  Users,
  User,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import type { WhatsAppChat } from '@/hooks/whatsapp';
import type { useWhatsAppBot } from '@/hooks/whatsapp';

interface WhatsAppChatListProps {
  bot: ReturnType<typeof useWhatsAppBot>;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  className?: string;
}

function ChatAvatarItem({ chat }: { chat: WhatsAppChat }) {
  const [hasError, setHasError] = useState(false);

  if (chat.avatarUrl && !hasError) {
    return (
      <img
        src={chat.avatarUrl}
        alt={chat.name}
        className="w-full h-full object-cover rounded-full"
        onError={() => setHasError(true)}
      />
    );
  }

  return chat.isGroup ? (
    <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
  ) : (
    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
  );
}

export function WhatsAppChatList({
  bot,
  activeChatId,
  onSelectChat,
  className
}: WhatsAppChatListProps) {
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await bot.loadChats();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const isBotReady = bot.isAvailable && bot.status.isReady;

  const filteredChats = (bot.chats || []).filter(c =>
    (c.name || c.id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn('flex flex-col h-full w-full bg-card overflow-hidden', className)}>
      {/* Cabecera estilo WhatsApp Móvil: Título y Buscador */}
      <div className="p-3 sm:p-4 border-b space-y-3 shrink-0 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              Chats
            </h3>
            {isBotReady && (
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none text-[10px] font-semibold px-2 py-0.5 rounded-full"
              >
                {filteredChats.length}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={!bot.isAvailable || isRefreshing}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            title="Actualizar lista de chats"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar chat o grupo..."
            className="pl-9 h-9 text-xs bg-muted/40 rounded-xl border-border/60 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Estado del Bot: Desconectado o QR */}
      {!isBotReady && (
        <div className="p-4 m-3 bg-muted/30 rounded-2xl border text-center space-y-2 shrink-0">
          {bot.status.needsAuth && bot.status.qr ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">Vincular dispositivo</span>
              <div className="p-2 bg-white rounded-lg inline-block mx-auto">
                <QRCodeSVG value={bot.status.qr} size={130} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Escanea el código QR con WhatsApp para ver tus chats.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
              <div className="text-xs font-bold text-foreground">Bot de WhatsApp Desconectado</div>
              <p className="text-[11px] text-muted-foreground">
                Inicia el bot local o verifica la conexión para ver tus chats.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bot.checkStatus(true)}
                className="h-7 text-xs rounded-lg mt-1"
              >
                Reintentar conexión
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lista de Chats estilo WhatsApp Móvil */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30 custom-scrollbar overscroll-contain">
        {bot.isLoading && filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-xs">Cargando chats...</span>
          </div>
        ) : filteredChats.length === 0 && isBotReady ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {search ? 'No se encontraron chats con ese nombre.' : 'No hay chats disponibles en WhatsApp.'}
          </div>
        ) : (
          filteredChats.map(chat => {
            const isSelected = chat.id === activeChatId;
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer group select-none',
                  isSelected
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-l-4 border-emerald-500'
                    : 'hover:bg-muted/50'
                )}
              >
                {/* Avatar circular estilo WhatsApp */}
                <div
                  className={cn(
                    'h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-2xs overflow-hidden',
                    chat.isGroup
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  )}
                >
                  <ChatAvatarItem chat={chat} />
                </div>

                {/* Información del chat */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-semibold truncate text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors',
                        isSelected && 'text-emerald-700 dark:text-emerald-300 font-bold'
                      )}
                    >
                      {chat.name}
                    </span>
                    {chat.isGroup && (
                      <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded shrink-0">
                        Grupo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {chat.isGroup
                      ? 'Toca para abrir la conversación grupal'
                      : 'Toca para abrir la conversación'}
                  </div>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WhatsAppChatList;
