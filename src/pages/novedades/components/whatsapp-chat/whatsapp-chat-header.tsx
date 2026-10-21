import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  User,
  Shield,
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronDown,
  Check,
  Search,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ChatItem } from '@/hooks/whatsapp';
import type { UseWhatsAppChatReturn } from '@/hooks/whatsapp';
import { useNavigate } from 'react-router-dom';

interface WhatsAppChatHeaderProps {
  chatHook: UseWhatsAppChatReturn;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function WhatsAppChatHeader({
  chatHook,
  isExpanded,
  onToggleExpand
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

  const handleRefresh = async () => {
    setIsRotating(true);
    await refreshMessages();
    setTimeout(() => setIsRotating(false), 500);
  };

  const filteredChatList = chatList.filter(c =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b bg-card/95 backdrop-blur-sm z-10">
      {/* Left: Chat Avatar & Selector Popover */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-left p-1 -ml-1 rounded-xl hover:bg-muted/80 transition-colors group max-w-[220px] sm:max-w-[260px]"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105',
                    currentChat.isGuardNovedades
                      ? 'bg-emerald-600 text-white'
                      : currentChat.isGroup
                        ? 'bg-teal-600/15 text-teal-700 dark:text-teal-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  )}
                >
                  {currentChat.isGuardNovedades ? (
                    <Shield className="h-5 w-5" />
                  ) : currentChat.isGroup ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                {/* Online indicator */}
                {isBotReady && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background ring-1 ring-emerald-500/20" />
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {currentChat.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-transform" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                  {currentChat.isGuardNovedades ? (
                    <span>{reports.length} reportes en guardia</span>
                  ) : isBotReady ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      en línea
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Bot desconectado</span>
                  )}
                </div>
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

              <ScrollArea className="max-h-60">
                <div className="space-y-1 pr-1">
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
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px]',
                              chat.isGuardNovedades
                                ? 'bg-emerald-600 text-white'
                                : chat.isGroup
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {chat.isGuardNovedades ? (
                              <Shield className="h-3 w-3" />
                            ) : chat.isGroup ? (
                              <Users className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                          </div>
                          <span className="truncate">{chat.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                  {filteredChatList.length === 0 && (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No se encontraron chats
                    </div>
                  )}
                </div>
              </ScrollArea>

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

      {/* Right Controls: Bot indicator, Refresh, Expand */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Status pill */}
        <div
          title={isBotReady ? 'Bot de WhatsApp conectado' : 'Bot no detectado en localhost:3001'}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
            isBotReady
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-muted text-muted-foreground border-border/40'
          )}
        >
          {isBotReady ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
          <span className="hidden sm:inline">{isBotReady ? 'Conectado' : 'Offline'}</span>
        </div>

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
      </div>
    </div>
  );
}
