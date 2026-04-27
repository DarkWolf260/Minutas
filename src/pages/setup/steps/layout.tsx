import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SetupStepLayout({ 
  children, 
  alAtras, 
  alSiguiente, 
  sigTexto = 'Continuar',
  deshabilitado = false,
  cargando = false,
  omitirTexto,
  alOmitir,
  ocultarSiguiente = false,
  sinFooter = false
}: { 
  children: React.ReactNode; 
  alAtras?: () => void; 
  alSiguiente?: () => void;
  sigTexto?: string;
  deshabilitado?: boolean;
  cargando?: boolean;
  omitirTexto?: string;
  alOmitir?: () => void;
  ocultarSiguiente?: boolean;
  sinFooter?: boolean;
}) {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-24 scrollbar-none">
        {children}
      </div>
      {!sinFooter && (
        <div className="p-6 pb-10 mt-auto border-t bg-background/80 backdrop-blur-xl flex flex-col gap-3 shrink-0">
          <div className="flex gap-3">
            {alAtras && (
              <Button variant="outline" onClick={alAtras} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />Atrás
              </Button>
            )}
            {!ocultarSiguiente && alSiguiente && (
              <Button 
                className="flex-1" 
                onClick={alSiguiente} 
                disabled={deshabilitado || cargando}
              >
                {cargando ? 'Guardando...' : sigTexto}
                {!cargando && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            )}
          </div>
          {omitirTexto && alOmitir && (
            <Button variant="ghost" onClick={alOmitir} className="h-10 text-sm text-muted-foreground hover:text-foreground font-medium">
              {omitirTexto}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
