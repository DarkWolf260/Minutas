import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2, Layers, ChevronRight, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StructureManager } from '@/components/structure/structure-manager';
import type { StaffRole, Department } from '@/lib/types';
import { SetupStepLayout } from './layout';
import { DEFAULT_DEPARTMENTS, DEFAULT_ROLES, EXTENDED_DEPARTMENTS, EXTENDED_ROLES } from '@/lib/constants/structure';



export function PasoEstructura({
  alSiguiente,
  alAtras,
  roles,
  setRoles,
  departamentos,
  setDepartamentos,
}: {
  alSiguiente: () => void;
  alAtras: () => void;
  roles: StaffRole[];
  setRoles: (r: StaffRole[]) => void;
  departamentos: Department[];
  setDepartamentos: (d: Department[]) => void;
}) {
  const [presetSeleccionado, setPresetSeleccionado] = useState<'base' | 'extendido'>('base');
  const [nombreMonitoreo, setNombreMonitoreo] = useState('CEMUPRAD');

  const aplicarPreset = (id: 'base' | 'extendido', customNombre?: string) => {
    const nombreActual = customNombre || nombreMonitoreo;
    if (id === 'base') {
      setDepartamentos(DEFAULT_DEPARTMENTS);
      setRoles(DEFAULT_ROLES);
    } else {
      const deptsPersonalizados = EXTENDED_DEPARTMENTS.map(d => 
        d.id === 'cemuprad' ? { ...d, name: nombreActual } : d
      );
      const rolesPersonalizados = EXTENDED_ROLES.map(r => ({
        ...r,
        name: r.name.replace('CEMUPRAD', nombreActual)
      }));
      setDepartamentos(deptsPersonalizados);
      setRoles(rolesPersonalizados);
    }
  };

  // Sincronizar nombre con debounce para evitar lag al escribir
  useEffect(() => {
    if (presetSeleccionado !== 'extendido') return;

    const timer = setTimeout(() => {
      aplicarPreset('extendido');
    }, 300);

    return () => clearTimeout(timer);
  }, [nombreMonitoreo, presetSeleccionado]);

  // Inicializar solo una vez si está vacío
  useEffect(() => {
    if (departamentos.length === 0) {
      aplicarPreset('base');
    }
  }, []);

  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={alSiguiente}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Estructura Institucional</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              setPresetSeleccionado('base');
              aplicarPreset('base');
            }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              presetSeleccionado === 'base' 
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                : "border-border bg-muted/5 hover:border-muted-foreground/30"
            )}
          >
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight">Estructura Base</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Departamentos estándar</p>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-colors", presetSeleccionado === 'base' ? "text-primary" : "text-muted-foreground")} />
          </button>

          <button
            onClick={() => {
              setPresetSeleccionado('extendido');
              aplicarPreset('extendido');
            }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              presetSeleccionado === 'extendido' 
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                : "border-border bg-muted/5 hover:border-muted-foreground/30"
            )}
          >
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight">Modo Extendido</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Incluye Sala de Monitoreo</p>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-colors", presetSeleccionado === 'extendido' ? "text-primary" : "text-muted-foreground")} />
          </button>
        </div>

        {presetSeleccionado === 'extendido' && (
          <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <Label htmlFor="monitor-room-name" className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground ml-1">Nombre de la Sala de Monitoreo</Label>
              <Input 
                id="monitor-room-name"
                value={nombreMonitoreo}
                onChange={e => setNombreMonitoreo(e.target.value)}
                placeholder="Ej: CEMUPRAD, Sala Situacional..."
                className="h-11 bg-background focus-visible:ring-primary shadow-sm"
              />
            </div>
          </div>
        )}

        <div className="min-h-[300px]">
          <StructureManager 
            compact={true}
            roles={roles}
            departments={departamentos}
            onRolesChange={setRoles}
            onDepartmentsChange={setDepartamentos}
            onSave={() => {}}
            rolesLoaded={true}
            deptsLoaded={true}
            initialTab="departments"
          />
        </div>
      </div>
    </SetupStepLayout>
  );
}
