import { Trash2, Eye, Save, CheckIcon, Send, X } from 'lucide-react';
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
  isSendingSyncReport
}: ViewerHeaderProps) => {
  return (
    <header className="flex-none flex items-center justify-between border-b p-4 bg-background z-20 shadow-sm min-h-[73px]">
      <div className="flex items-center gap-2">
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-9 w-9 mr-1"
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
