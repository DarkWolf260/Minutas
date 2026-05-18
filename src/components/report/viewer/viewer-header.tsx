import { Trash2, Eye, Save, CheckIcon, Send, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  isWhatsAppAvailable,
  isSendingWhatsApp
}: ViewerHeaderProps) => {
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
          <Button
            variant="outline"
            size="sm"
            onClick={onWhatsAppSend}
            disabled={isSendingWhatsApp}
            className="bg-background shadow-sm text-green-600 border-green-500/30 hover:bg-green-500/10"
            title="Enviar por WhatsApp"
          >
            <span className="hidden sm:inline">Enviar</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="h-3.5 w-3.5 sm:ml-0">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.6-16.1-37.7-17.9-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.5-27.5-16.4-14.6-27.5-32.7-30.7-38.2-3.2-5.5-.3-8.5 2.5-11.2 2.5-2.6 5.5-6.5 8.3-9.8 2.8-3.2 3.7-5.5 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.5 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.6-13.3 37.2-26.2 4.6-12.9 4.6-24 3.2-26.2-1.3-2.2-5-3.3-10.5-6.1z" />
            </svg>
          </Button>
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
    </header>
  );
};
