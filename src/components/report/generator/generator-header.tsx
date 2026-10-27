import { FileText, Eye, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeneratorHeaderProps {
  onPreview: () => void;
  onSave: () => void;
  onDiscard?: () => void;
  templateName?: string;
}

export const GeneratorHeader = ({ onPreview, onSave, onDiscard, templateName }: GeneratorHeaderProps) => {
  return (
    <header className="app-toolbar-header">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {onDiscard && (
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={onDiscard}
            className="text-muted-foreground hover:text-foreground shrink-0"
            title="Cerrar y descartar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0 flex items-center gap-2 ml-1">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
            {templateName ? `Nuevo: ${templateName}` : 'Nuevo Reporte'}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onPreview} className="bg-background shadow-2xs h-9 px-3 text-xs sm:text-sm">
          <Eye className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Vista Previa</span>
        </Button>
        <Button size="sm" onClick={onSave} className="h-9 px-3.5 text-xs sm:text-sm font-semibold shadow-xs">
          <Save className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Crear Reporte</span>
        </Button>
      </div>
    </header>
  );
};
