import { FileText, Eye, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeneratorHeaderProps {
  onPreview: () => void;
  onSave: () => void;
  onDiscard?: () => void;
}

export const GeneratorHeader = ({ onPreview, onSave, onDiscard }: GeneratorHeaderProps) => {
  return (
    <header className="flex-none flex items-center justify-between border-b px-3 py-2 sm:px-4 sm:py-2.5 bg-background z-20 shadow-xs min-h-[52px]">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onDiscard && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDiscard}
            className="hidden sm:flex text-muted-foreground hover:text-foreground h-8 w-8"
            title="Cerrar y descartar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5 ml-1 text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Nuevo Reporte
        </h2>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button variant="outline" size="sm" onClick={onPreview} className="bg-background shadow-xs h-8 px-2.5 text-xs">
          <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Vista Previa</span>
        </Button>
        <Button size="sm" onClick={onSave} className="h-8 px-3 text-xs shadow-xs font-semibold">
          <Save className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Crear Reporte</span>
        </Button>
      </div>
    </header>
  );
};
