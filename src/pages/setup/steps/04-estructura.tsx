import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Layers, Check, Network, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StaffRole, Department } from '@/lib/types';
import { SetupStepLayout } from './layout';
import { DEFAULT_DEPARTMENTS, DEFAULT_ROLES, EXTENDED_DEPARTMENTS, EXTENDED_ROLES } from '@/lib/constants/structure';
import { DEPARTMENT_IDS, generateDepartmentId } from '@/lib/constants/departments';

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
  const [nombreMonitoreo, setNombreMonitoreo] = useState('Sala de Monitoreo');

  const aplicarPreset = (id: 'base' | 'extendido', customNombre?: string) => {
    const nombreActual = customNombre || nombreMonitoreo;
    if (id === 'base') {
      setDepartamentos(DEFAULT_DEPARTMENTS);
      setRoles(DEFAULT_ROLES);
    } else {
      const cemupradId = DEPARTMENT_IDS.SALA_MONITOREO;
      const nuevoId = generateDepartmentId(nombreActual);
      const deptsPersonalizados = EXTENDED_DEPARTMENTS.map((d) =>
        d.id === cemupradId || d.id === 'sala-de-monitoreo' ? { ...d, id: nuevoId, name: nombreActual } : d
      );
      const rolesPersonalizados = EXTENDED_ROLES.map((r) => ({
        ...r,
        name: r.name.replace(/Sala de Monitoreo/gi, nombreActual),
        department_scope: r.department_scope.map((scope) =>
          scope === cemupradId || scope === 'sala-de-monitoreo' ? nuevoId : scope
        ),
      }));
      setDepartamentos(deptsPersonalizados);
      setRoles(rolesPersonalizados);
    }
  };

  useEffect(() => {
    if (presetSeleccionado !== 'extendido') return;
    const timer = setTimeout(() => {
      aplicarPreset('extendido');
    }, 300);
    return () => clearTimeout(timer);
  }, [nombreMonitoreo, presetSeleccionado]);

  useEffect(() => {
    if (departamentos.length === 0) {
      aplicarPreset('base');
    }
  }, []);

  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={alSiguiente}
      sigTexto="Finalizar Configuración"
    >
      <div className="space-y-6 py-2">
        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">Estructura Institucional</h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px]">
              Elige el esquema organizativo para tu personal y guardias.
            </p>
          </div>
        </div>

        {/* Tarjetas de Presets */}
        <div className="grid grid-cols-1 gap-3.5">
          {/* Preset Base */}
          <button
            type="button"
            onClick={() => {
              setPresetSeleccionado('base');
              aplicarPreset('base');
            }}
            className={cn(
              'flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all text-left cursor-pointer',
              presetSeleccionado === 'base'
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-border/70 bg-muted/10 hover:bg-muted/30'
            )}
          >
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
              presetSeleccionado === 'base' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm tracking-tight">Estructura Estándar</p>
                {presetSeleccionado === 'base' && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                Ideal para destacamentos de bomberos, estaciones de ambulancia y auxilio.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {['Dirección', 'Operaciones', 'Telecomunicaciones', 'Despacho', 'Logística'].map((dept) => (
                  <Badge key={dept} variant="secondary" className="text-[10px] px-2 py-0 font-medium">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          </button>

          {/* Preset Extendido */}
          <button
            type="button"
            onClick={() => {
              setPresetSeleccionado('extendido');
              aplicarPreset('extendido');
            }}
            className={cn(
              'flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all text-left cursor-pointer',
              presetSeleccionado === 'extendido'
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-border/70 bg-muted/10 hover:bg-muted/30'
            )}
          >
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
              presetSeleccionado === 'extendido' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm tracking-tight">Modo Extendido (con Sala Situacional)</p>
                {presetSeleccionado === 'extendido' && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                Para centros de comando integrados, monitoreo por cámaras y salas situacionales.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {['Dirección', 'Operaciones', 'Sala de Monitoreo', 'Telecomunicaciones', 'Despacho'].map((dept) => (
                  <Badge key={dept} variant="secondary" className="text-[10px] px-2 py-0 font-medium">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* Input del nombre de sala situacional cuando se elige extendido */}
        {presetSeleccionado === 'extendido' && (
          <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border border-border/60 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="monitor-room-name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Nombre de la Sala de Monitoreo / Situacional
            </Label>
            <Input
              id="monitor-room-name"
              value={nombreMonitoreo}
              onChange={(e) => setNombreMonitoreo(e.target.value)}
              placeholder="Ej: Sala Situacional, CEMUPRAD..."
              className="h-10 bg-background"
            />
          </div>
        )}

        {/* Nota informativa de gestión posterior */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Los cargos (Director, Jefes de Operaciones, Operadores, Conductores) y jerarquías se cargarán automáticamente. Podrás editarlos o añadir nuevos en cualquier momento desde el módulo de <strong>Personal</strong>.
          </p>
        </div>
      </div>
    </SetupStepLayout>
  );
}
