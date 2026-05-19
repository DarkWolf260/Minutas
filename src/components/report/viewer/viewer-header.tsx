import { Trash2, Eye, Save, CheckIcon, Send, X, MessageSquare, ChevronDown, Clock, Calendar as CalendarIcon } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { useScheduledMessages } from '@/hooks/use-scheduled-messages';

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
  onWhatsAppSchedule?: (date: Date) => void;
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("12:00");

  const { scheduledMessages, cancelMessage } = useScheduledMessages();

  const pendingCount = scheduledMessages.filter(m => m.status === 'pending').length;

  const handleScheduleConfirm = () => {
    if (!selectedDate || !onWhatsAppSchedule) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateToSchedule = new Date(selectedDate);
    dateToSchedule.setHours(hours ?? 12, minutes ?? 0, 0, 0);

    onWhatsAppSchedule(dateToSchedule);
    setIsScheduleDialogOpen(false);
  };

  return (
    <header className="flex-none flex items-center justify-between border-b p-4 bg-background z-20 shadow-sm min-h-[73px]">
      <div className="flex items-center gap-2">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hidden sm:flex text-muted-foreground hover:text-foreground h-9 w-9 mr-1"
            title="Cerrar reporte"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 h-9 w-9"
          onClick={onDelete}
          title="Eliminar reporte"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onPreview} className="bg-background shadow-sm">
          <Eye className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Vista Previa</span>
        </Button>
        {isWhatsAppAvailable && (
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onWhatsAppSend}
              disabled={isSendingWhatsApp}
              className="bg-background shadow-sm text-green-600 border-green-500/30 hover:bg-green-500/10 rounded-r-none h-9"
              title="Enviar por WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:mr-2">
                <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.73.44 3.4 1.28 4.88L2.05 22l5.26-1.38C8.73 21.43 10.35 21.87 12 21.87c5.52 0 10-4.48 10-10S17.52 2 12.004 2zm0 18c-1.5 0-2.95-.38-4.23-1.1l-.3-.17-3.15.83.84-3.07-.19-.31c-.78-1.25-1.2-2.7-1.2-4.18 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.56-6.32c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.23.25-.39.08-.15.04-.29-.02-.41-.06-.12-.56-1.35-.77-1.85-.2-.5-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
              </svg>
              <span className="hidden sm:inline">Enviar</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background shadow-sm text-green-600 border-green-500/30 hover:bg-green-500/10 rounded-l-none px-2 border-l-0 h-9"
                  title="Opciones de programación"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Programar Envío</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsListDialogOpen(true)} className="justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Ver Programados</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-amber-500/20 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="report-status" className="h-9 w-[110px] sm:w-[150px] bg-background">
            <SelectValue placeholder="Estatus..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="En proceso">En proceso</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>

        {isSecondary && (
          <Button
            variant="outline"
            size="sm"
            onClick={sendToSync}
            disabled={isSendingSyncReport}
            className="h-9 px-3 sm:px-4 shadow-sm border-violet-500/40 text-violet-600 hover:bg-violet-500/10"
            title="Enviar al dispositivo principal"
          >
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Enviar al Principal</span>
          </Button>
        )}

        <Button
          size="sm"
          onClick={onSave}
          disabled={isFinalizado || saveButtonText === 'Guardado'}
          className="h-9 px-3 sm:px-4 shadow-sm"
        >
          {saveButtonText === 'Guardado' ? (
            <CheckIcon className="h-4 w-4 sm:mr-2" />
          ) : (
            <Save className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">{saveButtonText}</span>
        </Button>
      </div>

      {/* Diálogo para Programar */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Programar Envío de WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    if (year !== undefined && month !== undefined && day !== undefined) {
                      const date = new Date();
                      date.setFullYear(year, month - 1, day);
                      setSelectedDate(date);
                    }
                  } else {
                    setSelectedDate(undefined);
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Hora</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleScheduleConfirm} disabled={!selectedDate}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Listar/Cancelar */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mensajes Programados</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {scheduledMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay mensajes programados.
              </p>
            ) : (
              <div className="space-y-4">
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
                ).map((group: any) => {
                  const status = group.anyPending ? 'pending' : (group.anyFailed ? 'failed' : 'sent');
                  return (
                    <div key={group.ids[0]} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {group.title || 'Sin título'}
                          </span>
                          {group.chatCount > 1 && (
                            <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                              {group.chatCount} chats
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-1">
                            {new Date(group.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${status === 'pending' ? 'text-amber-500' :
                            status === 'sent' ? 'text-emerald-500' : 'text-destructive'
                          }`}>
                          {status === 'pending' ? 'Pendiente' :
                            status === 'sent' ? 'Enviado' : 'Fallido'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          group.ids.forEach((id: string) => cancelMessage(id));
                        }}
                        title="Cancelar mensaje"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsListDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
