import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetup } from '@/hooks/use-setup';
import { 
  PasoBienvenida, 
  PasoAreaTrabajo, 
  PasoPreferencias,
  PasoModulos, 
  PasoEstructura, 
  PasoJerarquia, 
  PasoPlantillas, 
  PasoPrimeraVez, 
  PasoGuia, 
  PasoDone 
} from './steps';

const TOTAL_PUNTOS = 8;

function PuntosProgreso({ actual, total }: { actual: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < actual ? 'bg-primary w-6' : i === actual ? 'bg-primary/60 w-4' : 'bg-muted w-3'
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
    nombreWorkspace, 
    roles, 
    setRoles, 
    departamentos, 
    setDepartamentos, 
    finalizar, 
    saveSettings 
  } = hook;

  const mostrarProgreso = paso >= 1 && paso <= 7;
  const progresoActual = paso - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-background overflow-hidden">
      <div className="relative w-full max-w-lg flex flex-col h-full">
        {mostrarProgreso && (
          <div className="flex items-center justify-between py-4 px-6 shrink-0 border-b bg-background/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <PuntosProgreso actual={progresoActual} total={TOTAL_PUNTOS} />
              <span className="text-xs text-muted-foreground tabular-nums">
                Paso {paso} de {TOTAL_PUNTOS}
              </span>
            </div>
            {paso < 8 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-foreground h-8 px-2"
                onClick={() => finalizar()}
              >
                Saltar
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0">
          {paso === 0 && <PasoBienvenida alSiguiente={() => setPaso(1)} />}
          {paso === 1 && (
            <PasoPreferencias 
              alSiguiente={() => setPaso(2)} 
              alAtras={() => setPaso(0)} 
            />
          )}
          {paso === 2 && (
            <PasoModulos
              alSiguiente={() => setPaso(3)}
              alAtras={() => setPaso(1)}
              alGuardar={(deshabilitados) => saveSettings({ disabled_modules: deshabilitados })}
            />
          )}
          {paso === 3 && (
            <PasoEstructura 
              alSiguiente={() => setPaso(4)} 
              alAtras={() => setPaso(2)}
              roles={roles}
              setRoles={setRoles}
              departamentos={departamentos}
              setDepartamentos={setDepartamentos}
            />
          )}
          {paso === 4 && (
            <PasoJerarquia
              alSiguiente={() => setPaso(5)}
              alAtras={() => setPaso(3)}
              roles={roles}
              setRoles={setRoles}
              departamentos={departamentos}
              setDepartamentos={setDepartamentos}
            />
          )}
          {paso === 5 && (
            <PasoPlantillas
              alSiguiente={() => { localStorage.setItem('minutas-template-bootstrap-ok', 'true'); setPaso(6); }}
              alAtras={() => setPaso(4)}
              alOmitir={() => setPaso(6)}
            />
          )}
          {paso === 6 && (
            <PasoPrimeraVez
              alPrimero={() => setPaso(7)}
              alRegresar={() => finalizar(false, false)}
              alAtras={() => setPaso(5)}
            />
          )}
          {paso === 7 && <PasoGuia alSiguiente={() => finalizar(false, true)} />}
          {paso === 8 && <PasoDone nombreWorkspace={nombreWorkspace} alFinalizar={() => onComplete(false)} />}
        </div>
      </div>
    </div>
  );
}

