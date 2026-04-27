'use client';

import { cn } from '@/lib/utils';
import { useSetup } from '@/hooks/use-setup';
import { 
  PasoBienvenida, 
  PasoTema, 
  PasoAreaTrabajo, 
  PasoAjustesGenerales, 
  PasoModulos, 
  PasoEstructura, 
  PasoJerarquia, 
  PasoPlantillas, 
  PasoPrimeraVez, 
  PasoGuia, 
  PasoFeedback, 
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
    workspaces, 
    roles, 
    setRoles, 
    departamentos, 
    setDepartamentos, 
    finalizar, 
    manejarContinuarWorkspace, 
    saveSettings 
  } = hook;

  const mostrarProgreso = paso >= 1 && paso <= 7;
  const progresoActual = paso - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto py-8">
        {mostrarProgreso && (
          <div className="flex items-center justify-between mb-8 px-1">
            <PuntosProgreso actual={progresoActual} total={TOTAL_PUNTOS} />
            <span className="text-xs text-muted-foreground tabular-nums">
              Paso {paso} de {TOTAL_PUNTOS}
            </span>
          </div>
        )}

        {paso === 0 && <PasoBienvenida alSiguiente={() => setPaso(1)} />}
        {paso === 1 && <PasoTema alSiguiente={() => setPaso(2)} alAtras={() => setPaso(0)} />}
        {paso === 2 && (
          <PasoAreaTrabajo
            workspacesExistentes={workspaces}
            alSiguiente={manejarContinuarWorkspace}
            alAtras={() => setPaso(1)}
          />
        )}
        {paso === 3 && (
          <div className="animate-in fade-in duration-500">
            <PasoAjustesGenerales alSiguiente={() => setPaso(4)} alAtras={() => setPaso(2)} />
          </div>
        )}
        {paso === 4 && (
          <PasoModulos
            alSiguiente={() => setPaso(5)}
            alAtras={() => setPaso(3)}
            alGuardar={(deshabilitados) => saveSettings({ disabledModules: deshabilitados })}
          />
        )}
        {paso === 5 && (
          <PasoEstructura 
            alSiguiente={() => setPaso(6)} 
            alAtras={() => setPaso(4)}
            roles={roles}
            setRoles={setRoles}
            departamentos={departamentos}
            setDepartamentos={setDepartamentos}
          />
        )}
        {paso === 6 && (
          <PasoJerarquia
            alSiguiente={() => setPaso(7)}
            alAtras={() => setPaso(5)}
            roles={roles}
            setRoles={setRoles}
            departamentos={departamentos}
            setDepartamentos={setDepartamentos}
          />
        )}
        {paso === 7 && (
          <PasoPlantillas
            alSiguiente={() => { localStorage.setItem('minutas-template-bootstrap-ok', 'true'); setPaso(8); }}
            alAtras={() => setPaso(6)}
            alOmitir={() => setPaso(8)}
          />
        )}
        {paso === 8 && (
          <PasoPrimeraVez
            alPrimero={() => setPaso(9)}
            alRegresar={() => setPaso(10)}
            alAtras={() => setPaso(7)}
          />
        )}
        {paso === 9 && <PasoGuia alSiguiente={() => setPaso(10)} />}
        {paso === 10 && <PasoFeedback alFinalizar={() => finalizar(false)} />}
        {paso === 11 && <PasoDone nombreWorkspace={nombreWorkspace} />}
      </div>
    </div>
  );
}
