import { useState } from 'react';
import { GraduationCap, Rocket, ChevronRight, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetupStepLayout } from './layout';

export function PasoPrimeraVez({
  alPrimero,
  alRegresar,
  alAtras,
}: {
  alPrimero: () => void;
  alRegresar: () => void;
  alAtras: () => void;
}) {
  const [seleccion, setSeleccion] = useState<'first' | 'returning'>('first');

  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={seleccion === 'first' ? alPrimero : alRegresar}
    >
      <div className="space-y-5 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">¿Es tu primera vez?</h2>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Cuéntanos un poco sobre tu experiencia con Minutas.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            onClick={() => setSeleccion('first')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              seleccion === 'first' 
                ? "border-amber-500 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/20" 
                : "border-border bg-muted/5 hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
              seleccion === 'first' ? "bg-amber-500/10" : "bg-muted/20"
            )}>
              <GraduationCap className={cn("h-5 w-5", seleccion === 'first' ? "text-amber-600" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight text-amber-600/90">Sí, es mi primera vez</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Quiero ver cómo funciona el flujo</p>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-colors", seleccion === 'first' ? "text-amber-600" : "text-muted-foreground")} />
          </button>

          <button
            onClick={() => setSeleccion('returning')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              seleccion === 'returning' 
                ? "border-emerald-500 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20" 
                : "border-border bg-muted/5 hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
              seleccion === 'returning' ? "bg-emerald-500/10" : "bg-muted/20"
            )}>
              <Rocket className={cn("h-5 w-5", seleccion === 'returning' ? "text-emerald-600" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight text-emerald-600/90">Ya he usado Minutas antes</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Saltar la guía e ir a la app</p>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-colors", seleccion === 'returning' ? "text-emerald-600" : "text-muted-foreground")} />
          </button>
        </div>
      </div>
    </SetupStepLayout>
  );
}
