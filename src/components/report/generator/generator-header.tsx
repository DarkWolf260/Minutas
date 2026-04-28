import React from 'react';
import { FileText, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeneratorHeaderProps {
  onPreview: () => void;
  onSave: () => void;
}

export const GeneratorHeader = ({ onPreview, onSave }: GeneratorHeaderProps) => {
  return (
    <header className="flex-none flex items-center justify-between border-b p-4 bg-background z-20 shadow-sm min-h-[73px]">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Nuevo Reporte
      </h2>
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
