import { Trash2, Eye, Save, CheckIcon, Send, X, MessageSquare, Clock, MoreVertical, Users, User, Check, Layers, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { useState, useEffect, useMemo } from 'react';
import { useScheduledMessages, useWhatsAppBot } from '@/hooks/whatsapp';
import { useSettings } from '@/hooks/configuracion';
import { cn } from '@/lib/utils';

interface ViewerHeaderProps {
  status: 'En proceso' | 'Finalizado';
  onStatusChange: (status: 'En proceso' | 'Finalizado') => void;
  onDelete: () => void;
  onPreview: () => void;
  onSave: () => void;
  onClose?: () => void;
  saveButtonText: string;
  isFinalizado: boolean;
  isSecondary: boolean;
  sendToSync: () => void;
  isSendingSyncReport: boolean;
  onWhatsAppSend?: () => void;
  onWhatsAppSchedule?: (date: Date, targetChatIds?: string[]) => void;
  isWhatsAppAvailable?: boolean;
  isSendingWhatsApp?: boolean;
}

export const ViewerHeader = ({
  status,
  onStatusChange,
  onDelete,
  onPreview,
  onSave,
  onClose,
  saveButtonText,
  isFinalizado,
  isSecondary,
  sendToSync,
  isSendingSyncReport,
  onWhatsAppSend,
  onWhatsAppSchedule,
  isWhatsAppAvailable,
  isSendingWhatsApp
}: ViewerHeaderProps) => {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);

  const getLocalTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalTodayString());
  const [selectedTime, setSelectedTime] = useState("12:00");

  const { settings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const defaultChatIds = useMemo(() => settings?.whatsapp_default_chat_ids || [], [settings?.whatsapp_default_chat_ids]);
  const recipientGroups = useMemo(() => settings?.whatsapp_recipient_groups || [], [settings?.whatsapp_recipient_groups]);

  const [selectedChatIdsForSchedule, setSelectedChatIdsForSchedule] = useState<string[]>([]);

  useEffect(() => {
    if (isScheduleDialogOpen) {
      if (defaultChatIds.length > 0) {
        setSelectedChatIdsForSchedule([...defaultChatIds]);
      } else if (recipientGroups.length > 0 && recipientGroups[0]?.chatIds) {
        setSelectedChatIdsForSchedule([...recipientGroups[0].chatIds]);
      } else {
        setSelectedChatIdsForSchedule([]);
      }
    }
  }, [isScheduleDialogOpen, defaultChatIds, recipientGroups]);

  const allCandidateChats = useMemo(() => {
    const idSet = new Set<string>([...defaultChatIds, ...recipientGroups.flatMap(g => g.chatIds)]);
    return Array.from(idSet).map(chatId => {
      const found = (bot.chats || []).find(c => c.id === chatId);
      return {
        id: chatId,
        name: found?.name || chatId.replace(/@.*$/, ''),
        isGroup: found?.isGroup ?? chatId.endsWith('@g.us')
      };
    });
  }, [defaultChatIds, recipientGroups, bot.chats]);

  const handleToggleGroup = (groupChatIds: string[]) => {
    if (groupChatIds.length === 0) return;
    const isAllIncluded = groupChatIds.every((id) => selectedChatIdsForSchedule.includes(id));
    if (isAllIncluded) {
      setSelectedChatIdsForSchedule((prev) => prev.filter((id) => !groupChatIds.includes(id)));
    } else {
      setSelectedChatIdsForSchedule((prev) => Array.from(new Set([...prev, ...groupChatIds])));
    }
  };

  const resolveChatName = (chatId: string) => {
    const found = (bot.chats || []).find((c) => c.id === chatId);
    if (found?.name) return found.name;
    return chatId.replace(/@.*$/, '');
  };

  const { scheduledMessages, cancelMessage } = useScheduledMessages();

  const pendingCount = scheduledMessages.filter(m => m.status === 'pending').length;

  const handleScheduleConfirm = () => {
    if (!selectedDateStr || !onWhatsAppSchedule || selectedChatIdsForSchedule.length === 0) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    
    if (year !== undefined && month !== undefined && day !== undefined) {
      const dateToSchedule = new Date();
      dateToSchedule.setFullYear(year, month - 1, day);
      dateToSchedule.setHours(hours ?? 12, minutes ?? 0, 0, 0);
      onWhatsAppSchedule(dateToSchedule, selectedChatIdsForSchedule);
      setIsScheduleDialogOpen(false);
    }
  };

  return (
    <header className="app-toolbar-header">
      {/* Lado izquierdo: Navegación, Estatus y Previsualización */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0"
            title="Cerrar reporte"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="report-status" className="h-9 text-xs sm:text-sm w-[110px] sm:w-[130px] bg-background">
            <SelectValue placeholder="Estatus..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="En proceso">En proceso</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="bg-background shadow-2xs h-9 px-2.5 text-xs sm:text-sm"
        >
          <Eye className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Vista Previa</span>
        </Button>
      </div>

      {/* Lado derecho: Acciones principales y Menú de más opciones */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {isWhatsAppAvailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={onWhatsAppSend}
            disabled={isSendingWhatsApp}
            className="bg-background shadow-2xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 h-9 px-2.5 text-xs sm:text-sm font-medium"
            title="Enviar por WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:mr-1.5">
              <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.73.44 3.4 1.28 4.88L2.05 22l5.26-1.38C8.73 21.43 10.35 21.87 12 21.87c5.52 0 10-4.48 10-10S17.52 2 12.004 2zm0 18c-1.5 0-2.95-.38-4.23-1.1l-.3-.17-3.15.83.84-3.07-.19-.31c-.78-1.25-1.2-2.7-1.2-4.18 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.56-6.32c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.23.25-.39.08-.15.04-.29-.02-.41-.06-.12-.56-1.35-.77-1.85-.2-.5-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
            </svg>
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={isFinalizado || saveButtonText === 'Guardado'}
          className="h-9 px-3.5 text-xs sm:text-sm shadow-xs font-semibold"
        >
          {saveButtonText === 'Guardado' ? (
            <CheckIcon className="h-4 w-4 sm:mr-1.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Save className="h-4 w-4 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">{saveButtonText}</span>
        </Button>

        {/* Menú de Más Opciones (Opciones secundarias y destructivas) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground relative"
              title="Más opciones"
            >
              <MoreVertical className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isWhatsAppAvailable && (
              <>
                <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Programar Envío WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsListDialogOpen(true)} className="justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Ver Programados</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </DropdownMenuItem>
              </>
            )}

            {isSecondary && (
              <DropdownMenuItem onClick={sendToSync} disabled={isSendingSyncReport}>
                <Send className="mr-2 h-4 w-4 text-violet-600" />
                <span>Enviar al Principal</span>
              </DropdownMenuItem>
            )}

            {(isWhatsAppAvailable || isSecondary) && <DropdownMenuSeparator />}

            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Eliminar reporte</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Diálogo para Programar */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>Programar Envío de WhatsApp</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Fecha de envío</label>
                <DatePicker
                  value={selectedDateStr}
                  onChange={(val) => setSelectedDateStr(val)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Hora (24h)</label>
                <input
                  type="text"
                  placeholder="--:--"
                  value={selectedTime}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    let formatted = digits;
                    if (digits.length > 2) {
                      formatted = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
                    }
                    setSelectedTime(formatted);
                  }}
                  onBlur={() => {
                    const digits = selectedTime.replace(/\D/g, '');
                    if (!digits) return;
                    
                    let hours = parseInt(digits.slice(0, 2), 10);
                    let minutes = parseInt(digits.slice(2, 4), 10);
                    
                    if (isNaN(hours)) hours = 12;
                    if (hours > 23) hours = 23;
                    
                    if (isNaN(minutes)) minutes = 0;
                    if (minutes > 59) minutes = 59;
                    
                    const formattedHours = String(hours).padStart(2, '0');
                    const formattedMinutes = String(minutes).padStart(2, '0');
                    setSelectedTime(`${formattedHours}:${formattedMinutes}`);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                />
              </div>
            </div>

            {/* SELECCIÓN DE DESTINATARIOS Y GRUPOS EN LA MISMA LISTA */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Destinatarios del reporte</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {selectedChatIdsForSchedule.length} chat(s) seleccionado(s)
                </span>
              </div>

              {/* Lista única con scroll que contiene grupos y destinatarios individuales */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {/* 1. SECCIÓN GRUPOS DE ENVÍO */}
                {recipientGroups.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-0.5">
                      <Layers className="h-3 w-3 text-primary" />
                      Grupos de Envío ({recipientGroups.length})
                    </span>

                    <div className="space-y-1.5">
                      {recipientGroups.map(group => {
                        const isGroupSelected =
                          group.chatIds.length > 0 &&
                          group.chatIds.every(id => selectedChatIdsForSchedule.includes(id));
                        const isPartiallySelected =
                          !isGroupSelected &&
                          group.chatIds.some(id => selectedChatIdsForSchedule.includes(id));

                        return (
                          <div
                            key={group.id}
                            onClick={() => handleToggleGroup(group.chatIds)}
                            className={cn(
                              "p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 select-none",
                              isGroupSelected
                                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50 shadow-2xs"
                                : isPartiallySelected
                                  ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                                  : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                  "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                  isGroupSelected
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  <Layers className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-bold truncate">
                                  {group.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.2 rounded font-medium shrink-0">
                                  {group.chatIds.length} chats
                                </span>
                              </div>

                              <div className={cn(
                                "h-4 w-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                                isGroupSelected
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                                  : isPartiallySelected
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                                    : "border-border/80 bg-background"
                              )}>
                                {isGroupSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                {isPartiallySelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                              </div>
                            </div>

                            {/* Chips de contactos miembros del grupo */}
                            <div className="flex flex-wrap gap-1">
                              {group.chatIds.map(chatId => {
                                const name = resolveChatName(chatId);
                                return (
                                  <span
                                    key={chatId}
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate max-w-[150px]",
                                      isGroupSelected
                                        ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {chatId.endsWith('@g.us') ? (
                                      <Users className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                    ) : (
                                      <User className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                  </div>
                )}

                {/* 2. SECCIÓN DESTINATARIOS INDIVIDUALES */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-0.5">
                    <User className="h-3 w-3 text-emerald-600" />
                    Destinatarios individuales ({allCandidateChats.length})
                  </span>

                  <div className="divide-y divide-border/40 border rounded-xl p-1 bg-muted/20">
                    {allCandidateChats.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3 text-center">
                        No hay destinatarios configurados.
                      </p>
                    ) : (
                      allCandidateChats.map(chat => {
                        const isChecked = selectedChatIdsForSchedule.includes(chat.id);
                        return (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setSelectedChatIdsForSchedule(prev =>
                                isChecked
                                  ? prev.filter(id => id !== chat.id)
                                  : [...prev, chat.id]
                              );
                            }}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs select-none",
                              isChecked
                                ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold"
                                : "hover:bg-muted/70 text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {chat.isGroup ? (
                                <Users className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              ) : (
                                <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span className="truncate flex-1">{chat.name}</span>
                            </div>
                            <div className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                              isChecked ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs" : "border-border/80 bg-background"
                            )}>
                              {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleScheduleConfirm}
              disabled={!selectedDateStr || selectedChatIdsForSchedule.length === 0}
            >
              Confirmar Programación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Listar/Cancelar */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>Mensajes Programados</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {scheduledMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay mensajes programados actualmente.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.values(
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
                        anyPending: msg.status === 'pending',
                        error: msg.error
                      };
                    } else {
                      acc[key].ids.push(msg.id);
                      acc[key].uniqueChats.add(msg.chatId);
                      acc[key].chatCount = acc[key].uniqueChats.size;
                      if (msg.status === 'sent') acc[key].allSent = acc[key].allSent && true;
                      else acc[key].allSent = false;
                      if (msg.status === 'failed') acc[key].anyFailed = true;
                      if (msg.status === 'pending') acc[key].anyPending = true;
                      if (msg.error) acc[key].error = msg.error;
                    }
                    return acc;
                  }, {} as Record<string, any>)
                ).map((group: any) => {
                  const status = group.anyPending ? 'pending' : (group.anyFailed ? 'failed' : 'sent');
                  const recipientList = Array.from(group.uniqueChats as Set<string>).map(chatId => {
                    const found = (bot.chats || []).find(c => c.id === chatId);
                    return {
                      id: chatId,
                      name: found?.name || chatId.replace(/@.*$/, ''),
                      isGroup: found?.isGroup ?? chatId.endsWith('@g.us')
                    };
                  });

                  return (
                    <div key={group.ids[0]} className="p-3 border rounded-xl bg-card space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0 pr-1">
                          <span className="text-sm font-semibold truncate">
                            {group.title || 'Sin título'}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 text-emerald-600" />
                            <span>
                              {new Date(group.scheduledTime).toLocaleDateString([], { day: '2-digit', month: 'short' })}{' '}
                              a las {new Date(group.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                            status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' :
                            group.error?.includes('Descartado') ? 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400' : 'bg-destructive/10 text-destructive'
                          )}
                          title={group.error || undefined}
                          >
                            {status === 'pending' ? 'Pendiente' : status === 'sent' ? 'Enviado' : (group.error?.includes('Descartado') ? 'Descartado' : 'Fallido')}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => {
                              group.ids.forEach((id: string) => cancelMessage(id));
                            }}
                            title="Cancelar mensaje"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Destinatarios específicos */}
                      <div className="pt-2 border-t border-border/40 space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground block">
                          Destinatarios ({recipientList.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {recipientList.map(r => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 text-[10px] bg-muted/80 text-foreground px-2 py-0.5 rounded-md font-medium border border-border/50 max-w-[180px] truncate"
                            >
                              {r.isGroup ? (
                                <Users className="h-2.5 w-2.5 text-teal-600 shrink-0" />
                              ) : (
                                <User className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                              )}
                              <span className="truncate">{r.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsListDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
