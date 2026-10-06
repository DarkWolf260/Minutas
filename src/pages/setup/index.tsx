import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSetup } from '@/hooks/configuracion';
import { 
  PasoBienvenida, 
  PasoModulos, 
  PasoEstructura, 
  PasoDone 
} from './steps';

const TOTAL_PUNTOS = 3;

function PuntosProgreso({ actual, total }: { actual: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < actual ? 'bg-primary w-5' : i === actual ? 'bg-primary w-5' : 'bg-muted-foreground/20 w-2.5'
          )}
        />
      ))}
    </div>
  );
}

export default function SetupPage({ onComplete }: { onComplete: (goToTemplates?: boolean) => void }) {
  const hook = useSetup(onComplete);
  const { 
    paso, 
    setPaso, 
    roles, 
    setRoles, 
    departamentos, 
    setDepartamentos, 
    finalizar, 
    saveSettings 
  } = hook;

  const mostrarProgreso = paso >= 0 && paso < TOTAL_PUNTOS;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-background overflow-hidden">
      <div className="relative w-full max-w-lg flex flex-col h-full">
        {mostrarProgreso && (
          <div className="flex items-center justify-between py-3 px-6 shrink-0 border-b bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <PuntosProgreso actual={paso} total={TOTAL_PUNTOS} />
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                Paso {paso + 1} de {TOTAL_PUNTOS}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground h-8 px-2.5 cursor-pointer"
              onClick={() => finalizar()}
            >
              Saltar
            </Button>
          </div>
        )}

        <div className="flex-1 min-h-0">
          {paso === 0 && (
            <PasoBienvenida alSiguiente={() => setPaso(1)} />
          )}
          {paso === 1 && (
            <PasoModulos
              alSiguiente={() => setPaso(2)}
              alAtras={() => setPaso(0)}
              alGuardar={(deshabilitados) => saveSettings({ disabled_modules: deshabilitados })}
            />
          )}
          {paso === 2 && (
            <PasoEstructura 
              alSiguiente={() => finalizar()} 
              alAtras={() => setPaso(1)}
              roles={roles}
              setRoles={setRoles}
              departamentos={departamentos}
              setDepartamentos={setDepartamentos}
            />
          )}
          {paso >= 3 && (
            <PasoDone 
              alFinalizar={() => onComplete(false)}
              alIrAPlantillas={() => onComplete(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
