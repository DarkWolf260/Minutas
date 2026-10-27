import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  User,
  RefreshCw,
  Maximize2,
  Minimize2,
  Check,
  Search,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn, normalizeString } from '@/lib/utils';
import { type ChatItem, type UseWhatsAppChatReturn, getCleanAvatarUrl } from '@/hooks/whatsapp';
import { useNavigate } from 'react-router-dom';

function ChatAvatar({ chat }: { chat: ChatItem }) {
  const [hasError, setHasError] = useState(false);
  const cleanUrl = getCleanAvatarUrl(chat.avatarUrl);

  useEffect(() => {
    setHasError(false);
  }, [chat.id, cleanUrl]);

  if (cleanUrl && !hasError) {
    return (
      <img
        src={cleanUrl}
        alt={chat.name}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return chat.isGroup ? (
    <Users className="h-3 w-3" />
  ) : (
    <User className="h-3 w-3" />
  );
}

interface WhatsAppChatHeaderProps {
  chatHook: UseWhatsAppChatReturn;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onBack?: () => void;
  onCollapse?: () => void;
}

export function WhatsAppChatHeader({
  chatHook,
  isExpanded,
  onToggleExpand,
  onBack,
  onCollapse
}: WhatsAppChatHeaderProps) {
  const navigate = useNavigate();
  const {
    currentChat,
    chatList,
    activeChatId,
    setActiveChatId,
    isBotReady,
    bot,
    refreshMessages,
    reports
  } = chatHook;


  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const [headerAvatarError, setHeaderAvatarError] = useState(false);
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(null);

  // Reset error when switching chats
  useEffect(() => {
    setHeaderAvatarError(false);
  }, [currentChat?.id, currentChat?.avatarUrl]);

  // Si currentChat no tiene avatarUrl aún definido (o es null), intentar resolver bajo demanda una sola vez
  useEffect(() => {
    if (!currentChat?.id || !isBotReady) return;

    const currentClean = getCleanAvatarUrl(currentChat.avatarUrl);
    if (currentClean) {
      setResolvedAvatar(currentClean);
      return;
    }
    if (currentChat.avatarUrl === null) {
      setResolvedAvatar(null);
      return;
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttps) {
      // En HTTPS (Vercel), no consultar rutas relativas /api/whatsapp que no están proxificadas
      return;
    }

    let isMounted = true;
    fetch(`/api/whatsapp/chats/${encodeURIComponent(currentChat.id)}/avatar`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (isMounted) {
          const url = getCleanAvatarUrl(data?.avatarUrl);
          setResolvedAvatar(url);
          currentChat.avatarUrl = url;
        }
      })
      .catch(() => {
        if (isMounted) {
          currentChat.avatarUrl = null;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentChat?.id, currentChat?.avatarUrl, isBotReady]);

  const displayAvatar = getCleanAvatarUrl(currentChat?.avatarUrl || resolvedAvatar);

  const handleRefresh = async () => {
    setIsRotating(true);
    await refreshMessages();
    setTimeout(() => setIsRotating(false), 500);
  };

  const searchFilterNorm = normalizeString(searchFilter);
  const filteredChatList = chatList.filter(c => {
    if (!searchFilterNorm) return true;
    return (
      normalizeString(c.name || '').includes(searchFilterNorm) ||
      normalizeString(c.id || '').includes(searchFilterNorm)
    );
  });

  return (
    <div className="flex items-center justify-between gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 border-b bg-card/95 backdrop-blur-sm z-10 min-w-0">
      {/* Left: Chat Avatar & Selector Popover */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg gap-1 shrink-0"
            title="Volver a la lista de chats"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-semibold hidden xs:inline">Chats</span>
          </Button>
        )}
        <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-left p-1 -ml-1 rounded-xl hover:bg-muted/80 transition-colors group min-w-0 flex-1 overflow-hidden"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105 overflow-hidden',
                    currentChat?.isGroup
                      ? 'bg-teal-600/15 text-teal-700 dark:text-teal-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  )}
                >
                  {displayAvatar && !headerAvatarError ? (
                    <img
                      src={displayAvatar}
                      alt={currentChat?.name || 'Chat'}
                      className="w-full h-full object-cover"
                      onError={() => setHeaderAvatarError(true)}
                    />
                  ) : currentChat?.isGroup ? (
                    <Users className="h-4 w-4" />
                  ) : currentChat ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate block">
                  {currentChat?.name || 'Seleccionar chat'}
                </span>
                {!isBotReady && (
                  <div className="text-[10px] text-muted-foreground truncate">
                    Bot desconectado
                  </div>
                )}
              </div>
            </button>
          </PopoverTrigger>

          {/* Selector Dropdown Content */}
          <PopoverContent className="w-72 p-2" align="start">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Buscar chat o grupo..."
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="text-[10px] font-semibold text-muted-foreground px-2 pt-1 uppercase tracking-wider">
                Chats Disponibles
              </div>

              <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-1 pr-1 overscroll-contain">
                {filteredChatList.map(chat => {
                  const isSelected = chat.id === activeChatId;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setIsSelectorOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors',
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-medium'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] bg-muted text-muted-foreground overflow-hidden">
                          <ChatAvatar chat={chat} />
                        </div>
                        <span className="truncate flex-1">{chat.name}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
                {filteredChatList.length === 0 && (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No se encontraron chats
                  </div>
                )}
              </div>

              {/* Bot status notice inside popover */}
              {!isBotReady && (
                <div className="p-2 border-t mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Bot de WhatsApp offline</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/settings?tab=sync')}
                    className="h-auto p-0 text-emerald-600 text-[11px]"
                  >
                    Configurar
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right Controls: Refresh, Expand */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Refresh button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          title="Actualizar mensajes"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRotating && 'animate-spin')} />
        </Button>

        {/* Expand / Collapse toggle */}
        {onToggleExpand && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
            title={isExpanded ? 'Restaurar a la barra lateral' : 'Expandir a pantalla completa'}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        )}

        {/* Collapse toggle (used in right panel mode) */}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            title="Ocultar panel lateral"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
