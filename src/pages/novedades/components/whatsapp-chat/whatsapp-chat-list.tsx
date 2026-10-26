'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  User,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  Loader2,
  Check,
  PanelRightClose,
  Send,
  Clock,
  Trash2,
  Calendar,
  X,
  Plus,
  Edit2,
  Layers,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { cn, normalizeString } from '@/lib/utils';
import type { WhatsAppChat, useWhatsAppBot } from '@/hooks/whatsapp';
import { useSettings } from '@/hooks/configuracion';
import { useScheduledMessages } from '@/hooks/whatsapp';
import type { Report, WhatsAppRecipientGroup } from '@/lib/types';
import { toast } from 'sonner';

interface WhatsAppChatListProps {
  bot: ReturnType<typeof useWhatsAppBot>;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onToggleCollapse?: () => void;
  reports?: Report[];
  className?: string;
}

function formatChatTime(timestamp?: number) {
  if (!timestamp) return null;
  const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function ChatAvatarItem({ chat }: { chat: WhatsAppChat }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [chat.id, chat.avatarUrl]);

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
  onToggleCollapse,
  reports,
  className
}: WhatsAppChatListProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'destinatarios' | 'programados'>('chats');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal unificado para Agregar Destinatario o Crear/Editar Grupo
  const [modalMode, setModalMode] = useState<'recipient' | 'group' | null>(null);
  const [editingGroup, setEditingGroup] = useState<WhatsAppRecipientGroup | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [modalSelectedChatIds, setModalSelectedChatIds] = useState<string[]>([]);
  const [modalChatSearch, setModalChatSearch] = useState('');

  const { settings, saveSettings } = useSettings();
  const { scheduledMessages, cancelMessage, isLoading: isScheduledLoading } = useScheduledMessages();

  const selectedIds = settings?.whatsapp_default_chat_ids || [];
  const selectedCount = selectedIds.length;
  const recipientGroups: WhatsAppRecipientGroup[] = settings?.whatsapp_recipient_groups || [];
  const pendingCount = scheduledMessages.filter(m => m.status === 'pending').length;

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

  const handleToggleRecipient = async (chatId: string, name: string) => {
    if (!settings) return;
    const cleanName = name.replace(/@.*$/, '');
    let newIds: string[];
    if (selectedIds.includes(chatId)) {
      newIds = selectedIds.filter(id => id !== chatId);
      toast.success(`Chat "${cleanName}" deseleccionado`);
    } else {
      if (selectedCount >= 5) {
        toast.error('Límite alcanzado: Máximo 5 destinatarios para evitar bloqueo de WhatsApp.');
        return;
      }
      newIds = [...selectedIds, chatId];
      toast.success(`Chat "${cleanName}" agregado como destinatario`);
    }
    await saveSettings({ whatsapp_default_chat_ids: newIds });
  };

  const handleClearAllRecipients = async () => {
    if (!settings || selectedCount === 0) return;
    await saveSettings({ whatsapp_default_chat_ids: [] });
    toast.success('Se vació la lista de destinatarios');
  };

  // Manejo del Modal Unificado (Agregar Destinatarios / Grupos)
  const handleOpenAddRecipient = () => {
    setModalMode('recipient');
    setEditingGroup(null);
    setGroupNameInput('');
    setModalSelectedChatIds([...selectedIds]);
    setModalChatSearch('');
  };

  const handleOpenCreateGroup = () => {
    setModalMode('group');
    setEditingGroup(null);
    setGroupNameInput('');
    setModalSelectedChatIds(selectedIds.length > 0 ? [...selectedIds] : []);
    setModalChatSearch('');
  };

  const handleOpenEditGroup = (group: WhatsAppRecipientGroup) => {
    setModalMode('group');
    setEditingGroup(group);
    setGroupNameInput(group.name);
    setModalSelectedChatIds([...group.chatIds]);
    setModalChatSearch('');
  };

  const handleToggleModalChat = (chatId: string) => {
    setModalSelectedChatIds(prev => {
      if (prev.includes(chatId)) {
        return prev.filter(id => id !== chatId);
      } else {
        if (modalMode === 'recipient' && prev.length >= 5) {
          toast.error('Límite alcanzado: Máximo 5 destinatarios para evitar bloqueo.');
          return prev;
        }
        return [...prev, chatId];
      }
    });
  };

  const handleSaveModal = async () => {
    if (modalMode === 'recipient') {
      await saveSettings({ whatsapp_default_chat_ids: modalSelectedChatIds });
      toast.success(`Destinatarios actualizados (${modalSelectedChatIds.length})`);
      setModalMode(null);
      return;
    }

    if (modalMode === 'group') {
      const trimmed = groupNameInput.trim();
      if (!trimmed) {
        toast.error('Ingresa un nombre para el grupo');
        return;
      }
      if (modalSelectedChatIds.length === 0) {
        toast.error('Selecciona al menos un chat para este grupo');
        return;
      }

      let updatedGroups: WhatsAppRecipientGroup[];
      if (editingGroup) {
        updatedGroups = recipientGroups.map(g =>
          g.id === editingGroup.id
            ? { ...g, name: trimmed, chatIds: modalSelectedChatIds }
            : g
        );
        toast.success(`Grupo "${trimmed}" actualizado`);
      } else {
        const newGroup: WhatsAppRecipientGroup = {
          id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: trimmed,
          chatIds: modalSelectedChatIds,
          createdAt: new Date().toISOString()
        };
        updatedGroups = [...recipientGroups, newGroup];
        toast.success(`Grupo "${trimmed}" creado con éxito`);
      }

      await saveSettings({ whatsapp_recipient_groups: updatedGroups });
      setModalMode(null);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const updated = recipientGroups.filter(g => g.id !== groupId);
    await saveSettings({ whatsapp_recipient_groups: updated });
    toast.success(`Grupo "${groupName}" eliminado`);
  };

  const handleApplyGroupAsActive = async (group: WhatsAppRecipientGroup) => {
    if (!settings) return;
    await saveSettings({ whatsapp_default_chat_ids: group.chatIds });
    toast.success(`Grupo "${group.name}" activado como destinatarios principales (${group.chatIds.length} chats)`);
  };

  // 1. Filtrar chats válidos para la lista general: ORDENADOS POR RECENCIA (NO SEPARADOS EN GRUPOS Y CONTACTOS)
  const searchNorm = normalizeString(search);
  const filteredChats = useMemo(() => {
    return (bot.chats || [])
      .filter(c => {
        if (!c.id) return false;
        const lower = c.id.toLowerCase().trim();
        if (
          lower === 'status@broadcast' ||
          lower.startsWith('status@') ||
          lower.includes('@broadcast') ||
          lower.includes('@newsletter')
        ) {
          return false;
        }
        if (!searchNorm) return true;
        return (
          normalizeString(c.name || '').includes(searchNorm) ||
          normalizeString(c.id || '').includes(searchNorm)
        );
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [bot.chats, searchNorm]);

  // 2. Destinatarios: MOSTRAR SOLO LOS QUE ESTÁN SELECCIONADOS
  const selectedRecipientChats = useMemo(() => {
    return selectedIds
      .map(id => {
        const found = (bot.chats || []).find(c => c.id === id);
        if (found) return found;
        return {
          id,
          name: id.replace(/@.*$/, ''),
          isGroup: id.endsWith('@g.us'),
          avatarUrl: null
        } as WhatsAppChat;
      })
      .filter(c => {
        if (!searchNorm) return true;
        return (
          normalizeString(c.name || '').includes(searchNorm) ||
          normalizeString(c.id || '').includes(searchNorm)
        );
      });
  }, [selectedIds, bot.chats, searchNorm]);

  // 3. Programados: Agrupar y resolver chats seleccionados
  const groupedScheduled = useMemo(() => {
    return Object.values(
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
  }, [scheduledMessages]);

  const filteredScheduled = useMemo(() => {
    if (!searchNorm) return groupedScheduled;
    return groupedScheduled.filter((g: any) =>
      normalizeString(g.title || 'Sin título').includes(searchNorm)
    );
  }, [groupedScheduled, searchNorm]);

  const handleCancelGroup = async (ids: string[], title: string) => {
    try {
      await Promise.all(ids.map(id => cancelMessage(id)));
      toast.success(`Mensaje "${title}" cancelado con éxito`);
    } catch (error) {
      toast.error('Error al cancelar el mensaje');
    }
  };


  // Chats para el modal unificado (Agregar Destinatarios / Grupos)
  const modalChatSearchNorm = normalizeString(modalChatSearch);
  const availableModalChats = useMemo(() => {
    return (bot.chats || [])
      .filter(c => {
        if (!c.id) return false;
        const lower = c.id.toLowerCase().trim();
        if (
          lower === 'status@broadcast' ||
          lower.startsWith('status@') ||
          lower.includes('@broadcast') ||
          lower.includes('@newsletter')
        ) {
          return false;
        }
        if (!modalChatSearchNorm) return true;
        return (
          normalizeString(c.name || '').includes(modalChatSearchNorm) ||
          normalizeString(c.id || '').includes(modalChatSearchNorm)
        );
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [bot.chats, modalChatSearchNorm]);

  return (
    <div className={cn('flex flex-col h-full w-full bg-card overflow-hidden', className)}>
      {/* Cabecera superior */}
      <div className="p-3 sm:p-4 border-b space-y-3 shrink-0 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              {activeTab === 'chats'
                ? 'Chats Recientes'
                : activeTab === 'destinatarios'
                ? 'Destinatarios'
                : 'Programados'}
            </h3>
            {activeTab === 'chats' && isBotReady && (
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none text-[10px] font-semibold px-2 py-0.5 rounded-full"
              >
                {filteredChats.length}
              </Badge>
            )}
            {activeTab === 'destinatarios' && (
              <Badge
                variant="secondary"
                className={cn(
                  'border-none text-[10px] font-bold px-2 py-0.5 rounded-full',
                  selectedCount >= 5
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                )}
              >
                {selectedCount}/5 activos
              </Badge>
            )}
            {activeTab === 'programados' && pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white border-none text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={!bot.isAvailable || isRefreshing}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              title="Actualizar chats"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                title="Ocultar panel lateral"
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Barra de pestañas segmentadas */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('chats');
              setSearch('');
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'chats'
                ? 'bg-background text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Chats</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('destinatarios');
              setSearch('');
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'destinatarios'
                ? 'bg-background text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Send className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Destinatarios</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('programados');
              setSearch('');
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'programados'
                ? 'bg-background text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Programados</span>
            {pendingCount > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>
        </div>

        {/* Buscador contextual */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              activeTab === 'chats'
                ? 'Buscar en chats recientes...'
                : activeTab === 'destinatarios'
                ? 'Buscar entre destinatarios seleccionados...'
                : 'Buscar reporte programado...'
            }
            className="pl-9 pr-8 h-9 text-xs bg-muted/40 rounded-xl border-border/60 focus-visible:ring-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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

      {/* PESTAÑA 1: CHATS MÁS RECIENTES (LISTA UNIFICADA, SIN SEPARAR GRUPOS Y CONTACTOS) */}
      {activeTab === 'chats' && (
        <div className="flex-1 overflow-y-auto divide-y divide-border/30 custom-scrollbar overscroll-contain">
          {bot.isLoading && filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs">Cargando chats más recientes...</span>
            </div>
          ) : filteredChats.length === 0 && isBotReady ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {search ? 'No se encontraron chats con ese nombre.' : 'No hay chats disponibles en WhatsApp.'}
            </div>
          ) : (
            filteredChats.map(chat => {
              const isSelected = chat.id === activeChatId;
              const isRecipient = selectedIds.includes(chat.id);
              const chatTime = formatChatTime(chat.timestamp);
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left transition-colors cursor-pointer group select-none',
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-l-4 border-emerald-500'
                      : 'hover:bg-muted/50'
                  )}
                >
                  {/* Avatar circular */}
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
                      {chatTime && (
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {chatTime}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="text-[11px] text-muted-foreground truncate">
                        {chat.isGroup ? 'Conversación grupal' : 'Chat individual'}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.isGroup && (
                          <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded shrink-0">
                            Grupo
                          </span>
                        )}
                        {isRecipient && (
                          <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                            <Check className="h-2.5 w-2.5" /> Destinatario
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de fila */}
                  {/* Indicador de chat seleccionado */}
                  {isSelected && (
                    <div className="flex items-center shrink-0 ml-1">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PESTAÑA 2: DESTINATARIOS (SOLO LOS SELECCIONADOS + GRUPOS DE DESTINATARIOS) */}
      {activeTab === 'destinatarios' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar overscroll-contain">

          {/* SUBSECCIÓN 1: GRUPOS DE DESTINATARIOS (LISTAS DE DISTRIBUCIÓN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Grupos de Envío ({recipientGroups.length})
              </span>
              <span className="text-[10px] text-muted-foreground">
                Para repartir envíos
              </span>
            </div>

            {recipientGroups.length === 0 ? (
              <div className="p-3 bg-muted/20 border border-border/60 rounded-xl text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  Aún no has creado grupos de destinatarios.
                </p>
                <p className="text-[10px] text-muted-foreground/80">
                  Arma grupos como "Guardia", "Directiva" o "Supervisión" para enviar reportes a unos u otros.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recipientGroups.map(group => {
                  const isGroupActive =
                    group.chatIds.length > 0 &&
                    group.chatIds.length === selectedIds.length &&
                    group.chatIds.every(id => selectedIds.includes(id));

                  return (
                    <div
                      key={group.id}
                      className={cn(
                        "p-2.5 rounded-xl border bg-card shadow-2xs space-y-2 transition-all",
                        isGroupActive
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-border/80 hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            isGroupActive ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
                          )}>
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold text-foreground truncate">
                            {group.name}
                          </span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                            {group.chatIds.length} chats
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isGroupActive ? (
                            <span
                              className="h-6 px-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-md flex items-center gap-1 shadow-2xs"
                              title="Este grupo está actualmente activo para el envío de reportes"
                            >
                              <Check className="h-2.5 w-2.5 stroke-[3]" /> Activo
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApplyGroupAsActive(group)}
                              title="Establecer estos chats como los destinatarios principales de reportes"
                              className="h-6 px-2 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/10 rounded-md"
                            >
                              Activar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditGroup(group)}
                            title="Editar grupo"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-md"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            title="Eliminar grupo"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-md"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Lista de chips de chats en el grupo */}
                      <div className="flex flex-wrap gap-1">
                        {group.chatIds.map(chatId => {
                          const chat = (bot.chats || []).find(c => c.id === chatId);
                          const name = chat?.name || chatId.replace(/@.*$/, '');
                          return (
                            <span
                              key={chatId}
                              className="inline-flex items-center gap-1 text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md truncate max-w-[150px]"
                            >
                              {chatId.endsWith('@g.us') ? (
                                <Users className="h-2.5 w-2.5 text-teal-600" />
                              ) : (
                                <User className="h-2.5 w-2.5 text-emerald-600" />
                              )}
                              <span className="truncate">{name}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUBSECCIÓN 2: DESTINATARIOS ACTIVOS (SOLO LOS SELECCIONADOS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Send className="h-3 w-3" />
                Destinatarios Seleccionados ({selectedRecipientChats.length})
              </span>
            </div>

            {selectedRecipientChats.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-3 bg-muted/10 border border-dashed rounded-xl">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <Send className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">
                    No hay destinatarios seleccionados
                  </p>
                  <p className="text-[10px] text-muted-foreground max-w-[220px] mx-auto">
                    Selecciona chats para tus reportes o activa un grupo de envío arriba.
                  </p>
                </div>
                <div className="space-y-2 pt-1 flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddRecipient}
                    className="h-8 text-xs font-semibold gap-1.5 border-dashed border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 w-full max-w-[200px]"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>+ Agregar Destinatario</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCreateGroup}
                    className="h-8 text-xs font-semibold gap-1.5 border-dashed border-primary/40 hover:bg-primary/10 text-primary w-full max-w-[200px]"
                  >
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>+ Crear Grupo de Envío</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  {selectedRecipientChats.map(chat => {
                    return (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100 shadow-2xs select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            <ChatAvatarItem chat={chat} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate block">{chat.name}</span>
                              {chat.isGroup ? (
                                <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1 py-0.2 rounded shrink-0">
                                  Grupo
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded shrink-0">
                                  Contacto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSelectChat(chat.id)}
                            title="Abrir conversación"
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/15 rounded-lg"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleRecipient(chat.id, chat.name || chat.id)}
                            title="Quitar de destinatarios"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddRecipient}
                    className="flex-1 h-7.5 text-xs font-semibold gap-1.5 border-dashed border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  >
                    <Plus className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>+ Agregar Destinatario</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCreateGroup}
                    className="flex-1 h-7.5 text-xs font-semibold gap-1.5 border-dashed border-primary/40 hover:bg-primary/10 text-primary"
                  >
                    <Layers className="h-3 w-3 text-primary" />
                    <span>+ Crear Grupo de Envío</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PROGRAMADOS (MUESTRA LOS CHATS DESTINATARIOS ESPECÍFICOS) */}
      {activeTab === 'programados' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar overscroll-contain">
          {isScheduledLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs">Cargando mensajes programados...</span>
            </div>
          ) : filteredScheduled.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">
                  Sin mensajes programados
                </span>
                <p className="text-[11px] text-muted-foreground max-w-[220px]">
                  {search
                    ? 'No se encontraron reportes con ese título.'
                    : 'No hay reportes ni minutas programados para envío automático.'}
                </p>
              </div>
            </div>
          ) : (
            filteredScheduled.map((group: any) => {
              const status = group.anyPending
                ? 'pending'
                : group.anyFailed
                ? 'failed'
                : 'sent';

              // Resolver los destinatarios específicos seleccionados para este reporte
              const recipientList = Array.from(group.uniqueChats as Set<string>).map(chatId => {
                const found = (bot.chats || []).find(c => c.id === chatId);
                return {
                  id: chatId,
                  name: found?.name || chatId.replace(/@.*$/, ''),
                  isGroup: found?.isGroup ?? chatId.endsWith('@g.us')
                };
              });

              return (
                <div
                  key={group.ids[0]}
                  className="p-3 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2 transition-all hover:border-emerald-500/30 animate-in fade-in duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0 pr-1">
                      <span className="text-xs font-bold text-foreground truncate max-w-[210px]">
                        {group.title || 'Sin título'}
                      </span>

                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">
                          {new Date(group.scheduledTime).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short'
                          })}{' '}
                          a las{' '}
                          {new Date(group.scheduledTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                          status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                            : status === 'sent'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        )}
                      >
                        {status === 'pending'
                          ? 'Pendiente'
                          : status === 'sent'
                          ? 'Enviado'
                          : 'Fallido'}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0 rounded-lg"
                        onClick={() => handleCancelGroup(group.ids, group.title || 'Sin título')}
                        title="Cancelar envío programado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* DESTINATARIOS SELECCIONADOS PARA ESTE REPORTE */}
                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground block">
                      Destinatarios seleccionados ({recipientList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {recipientList.map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] bg-muted/80 text-foreground px-2 py-0.5 rounded-md font-medium border border-border/50 max-w-[180px] truncate"
                        >
                          {r.isGroup ? (
                            <Users className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          ) : (
                            <User className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          <span className="truncate">{r.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DIÁLOGO UNIFICADO: AGREGAR DESTINATARIOS O CREAR/EDITAR GRUPO */}
      <Dialog open={modalMode !== null} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {modalMode === 'group' ? (
                <>
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{editingGroup ? 'Editar Grupo de Envío' : 'Crear Grupo de Envío'}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Agregar Destinatarios</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 flex-1 min-h-0 flex flex-col">
            {/* Solo en modo grupo: Campo para el nombre del grupo */}
            {modalMode === 'group' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Nombre del grupo
                </label>
                <Input
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  placeholder="Ej: Grupo Directiva, Guardia Nocturna, Supervisión..."
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>
            )}

            {/* Buscador idéntico */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={modalChatSearch}
                onChange={e => setModalChatSearch(e.target.value)}
                placeholder="Buscar chat o grupo para agregar..."
                className="pl-9 h-9 text-xs"
                autoFocus={modalMode === 'recipient'}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {modalMode === 'group'
                  ? 'Selecciona los chats para este grupo:'
                  : 'Selecciona hasta 5 destinatarios:'}
              </span>
              <span className="font-semibold text-foreground">
                {modalSelectedChatIds.length}{modalMode === 'recipient' ? '/5' : ''} seleccionados
              </span>
            </div>

            {/* Lista unificada de chats con ChatAvatarItem, badges y checkbox circular */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 pr-1 max-h-[50vh] custom-scrollbar">
              {availableModalChats.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No se encontraron chats disponibles.
                </div>
              ) : (
                availableModalChats.map(chat => {
                  const isChecked = modalSelectedChatIds.includes(chat.id);
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleToggleModalChat(chat.id)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                        isChecked
                          ? modalMode === 'group'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold'
                          : 'hover:bg-muted/70 text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          <ChatAvatarItem chat={chat} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate block">
                              {chat.name}
                            </span>
                            {chat.isGroup ? (
                              <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1 py-0.2 rounded shrink-0">
                                Grupo
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded shrink-0">
                                Contacto
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all',
                          isChecked
                            ? modalMode === 'group'
                              ? 'bg-primary border-primary text-white shadow-2xs'
                              : 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'border-border/80 bg-background'
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalMode(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveModal}
              disabled={modalMode === 'group' && (!groupNameInput.trim() || modalSelectedChatIds.length === 0)}
              className={modalMode === 'recipient' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {modalMode === 'group'
                ? `Guardar Grupo (${modalSelectedChatIds.length})`
                : `Listo (${modalSelectedChatIds.length}/5)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WhatsAppChatList;
