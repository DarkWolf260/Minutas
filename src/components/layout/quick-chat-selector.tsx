'use client';

import React, { useState } from 'react';
import { MessageSquare, Search, Users, User, Check, Loader2, AlertTriangle, RefreshCw, Clock, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useWhatsAppBot } from '@/hooks/use-whatsapp-bot';
import { useSettings } from '@/hooks/use-settings';
import { useScheduledMessages } from '@/hooks/use-scheduled-messages';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickChatSelectorProps {
  className?: string;
}

export function QuickChatSelector({ className }: QuickChatSelectorProps) {
  const { settings, saveSettings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const { scheduledMessages, cancelMessage, isLoading: isScheduledLoading } = useScheduledMessages();
  
  const [activeTab, setActiveTab] = useState<'chats' | 'scheduled'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedIds = settings?.whatsapp_default_chat_ids || [];
  const selectedCount = selectedIds.length;
  const pendingCount = scheduledMessages.filter(m => m.status === 'pending').length;

  const handleToggleGroup = async (groupId: string, name: string) => {
    if (!settings) return;
    
    let newIds;
    if (selectedIds.includes(groupId)) {
      newIds = selectedIds.filter(id => id !== groupId);
      toast.success(`Chat "${name}" deseleccionado`);
    } else {
      if (selectedCount >= 5) {
        toast.error('Límite alcanzado: Máximo 5 chats para evitar bloqueo de WhatsApp.');
        return;
      }
      newIds = [...selectedIds, groupId];
      toast.success(`Chat "${name}" seleccionado para envíos`);
    }
    await saveSettings({ whatsapp_default_chat_ids: newIds });
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await bot.loadChats();
      toast.success('Chats de WhatsApp actualizados');
    } catch (error) {
      toast.error('Error al actualizar los chats');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelGroup = async (ids: string[], title: string) => {
    try {
      await Promise.all(ids.map(id => cancelMessage(id)));
      toast.success(`Mensaje "${title}" cancelado con éxito`);
    } catch (error) {
      toast.error('Error al cancelar el mensaje');
    }
  };

  // Filter groups and contacts
  const filteredChats = bot.chats.filter(c => 
    (c.name || c.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const groupChats = filteredChats.filter(c => c.isGroup);
  const contactChats = filteredChats.filter(c => !c.isGroup);

  // Group and filter scheduled messages
  const groupedScheduled = Object.values(
    scheduledMessages.reduce((acc, msg) => {
      const key = `${msg.title}-${msg.scheduledTime}`;
      if (!acc[key]) {
        acc[key] = {
          ...msg,
          ids: [msg.id],
          uniqueChats: new Set([msg.chatId]),
          chatCount: 1,
          allSent: msg.status === 'sent',
          anyFailed: msg.status === 'failed',
          anyPending: msg.status === 'pending'
        };
      } else {
        acc[key].ids.push(msg.id);
        acc[key].uniqueChats.add(msg.chatId);
        acc[key].chatCount = acc[key].uniqueChats.size;
        if (msg.status === 'sent') acc[key].allSent = acc[key].allSent && true;
        else acc[key].allSent = false;
        if (msg.status === 'failed') acc[key].anyFailed = true;
        if (msg.status === 'pending') acc[key].anyPending = true;
      }
      return acc;
    }, {} as Record<string, any>)
  );

  const filteredScheduled = groupedScheduled.filter(g => 
    (g.title || 'Sin título').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative h-9 w-9 rounded-lg transition-all hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400", className)}
          title="Gestión de WhatsApp"
        >
          <MessageSquare className="h-5 w-5" />
          {(selectedCount > 0 || pendingCount > 0) && (
            <Badge
              className={cn(
                "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] text-white font-bold animate-in zoom-in border border-background",
                pendingCount > 0 ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
              )}
            >
              {pendingCount > 0 ? pendingCount : selectedCount}
            </Badge>
          )}
          <span className="sr-only">Gestión de WhatsApp</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 border-emerald-500/20 shadow-xl rounded-2xl overflow-hidden" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              Bot de WhatsApp
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {bot.status.isReady ? 'Servidor Conectado' : 'Servidor Desconectado'}
            </p>
          </div>
          
          {activeTab === 'chats' && bot.status.isReady && bot.chats.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Recargar chats de WhatsApp"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-emerald-500/10 bg-muted/10 p-1">
          <button
            onClick={() => {
              setActiveTab('chats');
              setSearchQuery('');
            }}
            className={cn(
              "flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === 'chats' 
                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10 font-black" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Destinatarios
          </button>
          <button
            onClick={() => {
              setActiveTab('scheduled');
              setSearchQuery('');
            }}
            className={cn(
              "flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === 'scheduled' 
                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10 font-black" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Programados
            {pendingCount > 0 && (
              <Badge className="h-4 px-1 text-[9px] bg-amber-500 text-white font-bold rounded-full">
                {pendingCount}
              </Badge>
            )}
          </button>
        </div>

        {/* Content body */}
        <div className="p-3">
          {activeTab === 'chats' ? (
            bot.isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <p className="text-xs text-muted-foreground text-center">Verificando conexión con el bot...</p>
              </div>
            ) : !bot.isAvailable ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Bot de WhatsApp desconectado</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Inicia el servidor del bot de WhatsApp o configura su dirección en los ajustes generales para poder elegir chats.
                  </p>
                </div>
              </div>
            ) : bot.status.needsAuth ? (
              <div className="flex flex-col items-center justify-center py-4 px-4 text-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Requiere Autenticación
                </div>
                
                {bot.status.qr ? (
                  <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
                    <div className="p-3 bg-white rounded-xl border-2 border-dashed border-emerald-500/30">
                      <QRCodeSVG value={bot.status.qr} size={150} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center max-w-[200px] leading-normal">
                      Escanea este código QR con la app de WhatsApp en tu teléfono para vincular la cuenta.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-background/50 text-xs text-muted-foreground gap-2 w-full">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    <span>Generando código QR...</span>
                  </div>
                )}
                
                <Button size="sm" variant="outline" onClick={() => bot.checkStatus(true)} className="w-full text-xs h-8 border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-600">
                  Verificar estado
                </Button>
              </div>
            ) : !bot.status.isReady ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <p className="text-xs font-bold text-foreground">
                  {bot.status.statusMessage || 'Conectando con WhatsApp...'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Espera a que se establezca la sesión de WhatsApp en el servidor.
                </p>
              </div>
            ) : bot.chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                <p className="text-xs text-muted-foreground text-center">Cargando lista de chats...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar chat o grupo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-muted/30 focus-visible:ring-emerald-500/30 border-muted/50 h-8 text-xs"
                  />
                </div>

                {/* Scrollable list */}
                <ScrollArea className="h-60 border rounded-xl overflow-hidden bg-muted/10 p-1">
                  <div className="space-y-2 p-1">
                    {/* Groups */}
                    {groupChats.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Grupos
                        </div>
                        {groupChats.map((chat) => {
                          const isChecked = selectedIds.includes(chat.id);
                          return (
                            <div 
                              key={chat.id} 
                              onClick={() => handleToggleGroup(chat.id, chat.name || chat.id)}
                              className={cn(
                                "flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer text-xs mt-0.5",
                                isChecked ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold' : 'hover:bg-muted/70 text-foreground'
                              )}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className={cn(
                                  "p-1.5 rounded-full shrink-0", 
                                  isChecked ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                                )}>
                                  <Users className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate pr-1">{chat.name || chat.id}</span>
                              </div>
                              <div className={cn(
                                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30'
                              )}>
                                {isChecked && <Check className="h-2.5 w-2.5" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Contacts */}
                    {contactChats.length > 0 && (
                      <div className={cn(groupChats.length > 0 && "mt-3")}>
                        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Contactos
                        </div>
                        {contactChats.map((chat) => {
                          const isChecked = selectedIds.includes(chat.id);
                          return (
                            <div 
                              key={chat.id} 
                              onClick={() => handleToggleGroup(chat.id, chat.name || chat.id)}
                              className={cn(
                                "flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer text-xs mt-0.5",
                                isChecked ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold' : 'hover:bg-muted/70 text-foreground'
                              )}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className={cn(
                                  "p-1.5 rounded-full shrink-0", 
                                  isChecked ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                                )}>
                                  <User className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate pr-1">{chat.name || chat.id}</span>
                              </div>
                              <div className={cn(
                                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30'
                              )}>
                                {isChecked && <Check className="h-2.5 w-2.5" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {filteredChats.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No se encontraron chats
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          ) : (
            // Scheduled Messages Tab
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar reporte programado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-muted/30 focus-visible:ring-emerald-500/30 border-muted/50 h-8 text-xs"
                />
              </div>

              {/* Scrollable list */}
              <ScrollArea className="h-60 border rounded-xl overflow-hidden bg-muted/10 p-1">
                <div className="p-1.5 space-y-2">
                  {isScheduledLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      <p className="text-xs text-muted-foreground">Cargando programados...</p>
                    </div>
                  ) : filteredScheduled.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground gap-2">
                      <Clock className="h-8 w-8 opacity-30 text-emerald-500" />
                      <span>No hay mensajes programados</span>
                    </div>
                  ) : (
                    filteredScheduled.map((group: any) => {
                      const status = group.anyPending ? 'pending' : (group.anyFailed ? 'failed' : 'sent');
                      return (
                        <div 
                          key={group.ids[0]} 
                          className="flex items-center justify-between p-2 rounded-xl bg-background border shadow-sm transition-all hover:shadow-md animate-in fade-in duration-300"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 pr-1">
                            <span className="text-xs font-bold text-foreground truncate max-w-[170px]">
                              {group.title || 'Sin título'}
                            </span>
                            
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0 text-emerald-500/60" />
                              <span className="truncate">
                                {new Date(group.scheduledTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} a las {new Date(group.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse' :
                                status === 'sent' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              )}>
                                {status === 'pending' ? 'Pendiente' :
                                  status === 'sent' ? 'Enviado' : 'Fallido'}
                              </span>

                              {group.chatCount > 1 && (
                                <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                                  {group.chatCount} chats
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 rounded-lg"
                            onClick={() => handleCancelGroup(group.ids, group.title || 'Sin título')}
                            title="Cancelar mensaje"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
