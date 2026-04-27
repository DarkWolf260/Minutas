import { useState } from 'react';
import { FileDown, FileText, ChevronRight, FileStack, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetupStepLayout } from './layout';

export function PasoPlantillas({ alSiguiente, alAtras, alOmitir }: { alSiguiente: () => void; alAtras: () => void; alOmitir: () => void }) {
  const [seleccion, setSeleccion] = useState<'cloud' | 'later'>('cloud');

  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={seleccion === 'cloud' ? alSiguiente : alOmitir}
      sigTexto="Continuar"
    >
      <div className="space-y-5 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileStack className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Plantillas</h2>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            ¿Quieres empezar con algunas plantillas preconfiguradas?
          </p>
        </div>

        <div className="grid gap-3">
          <button
            onClick={() => setSeleccion('cloud')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              seleccion === 'cloud' 
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                : "border-border bg-muted/5 hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
              seleccion === 'cloud' ? "bg-primary/10" : "bg-muted/20"
            )}>
              <FileDown className={cn("h-5 w-5", seleccion === 'cloud' ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight">Descargar Plantillas de Nube</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Plantillas listas de la comunidad</p>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-colors", seleccion === 'cloud' ? "text-primary" : "text-muted-foreground")} />
          </button>

          <button
            onClick={() => setSeleccion('later')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              seleccion === 'later' 
                ? "border-blue-500 bg-blue-500/5 shadow-sm ring-1 ring-blue-500/20" 
                : "border-border bg-muted/5 hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
              seleccion === 'later' ? "bg-blue-500/10" : "bg-muted/20"
            )}>
              <FileX className={cn("h-5 w-5", seleccion === 'later' ? "text-blue-500" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight">Lo haré más tarde</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Empezar sin plantillas</p>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-colors", seleccion === 'later' ? "text-blue-500" : "text-muted-foreground")} />
          </button>
        </div>
      </div>
    </SetupStepLayout>
  );
}
