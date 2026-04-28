import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlantillasHeaderProps {
  estaAutenticado: boolean;
  usuario: any;
  cerrarSesion: () => void;
}

export const PlantillasHeader = ({ estaAutenticado, usuario, cerrarSesion }: PlantillasHeaderProps) => {
  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-4 w-full border-b bg-card sm:bg-transparent sm:border-0 shrink-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/settings" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col gap-1 sm:gap-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Plantillas</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground leading-tight sm:leading-normal">
              Gestiona y construye plantillas para reportes internos.
            </p>
          </div>
        </div>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="editor" className="flex-1 sm:flex-initial">
            Gestionar
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex-1 sm:flex-initial">
            Constructor
          </TabsTrigger>
        </TabsList>
        
        {estaAutenticado && (
          <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-primary/10 transition-all hover:bg-muted animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-primary uppercase leading-tight">Admin Nube</span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">{usuario?.email}</span>
            </div>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={cerrarSesion}
              title="Cerrar sesión de nube"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
