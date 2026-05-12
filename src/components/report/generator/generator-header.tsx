import { FileText, Eye, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeneratorHeaderProps {
  onPreview: () => void;
  onSave: () => void;
  onDiscard?: () => void;
}

export const GeneratorHeader = ({ onPreview, onSave, onDiscard }: GeneratorHeaderProps) => {
  return (
    <header className="flex-none flex items-center justify-between border-b p-4 bg-background z-20 shadow-sm min-h-[73px]">
      <div className="flex items-center gap-2">
        {onDiscard && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDiscard}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            title="Cerrar y descartar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold flex items-center gap-2 ml-1">
          <FileText className="h-5 w-5 text-primary" />
          Nuevo Reporte
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreview} className="bg-background shadow-sm">
          <Eye className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Vista Previa</span>
        </Button>
        <Button size="sm" onClick={onSave} className="h-9 px-3 sm:px-4 shadow-sm">
          <Save className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Crear Reporte</span>
        </Button>
      </div>
    </header>
  );
};
