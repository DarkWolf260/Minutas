import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  LayoutGrid,
  ClipboardList,
  History,
  Users,
  BarChart2,
  FileText,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppModuleId } from '@/lib/types';
import { SetupStepLayout } from './layout';

const DEF_MODULOS: { id: AppModuleId; label: string; description: string; icon: any; color: string }[] = [
  { id: 'orden-del-dia', label: 'Orden del Día', description: 'Distribuye personal y planifica actividades', icon: ClipboardList, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'reporte-final', label: 'Reporte Final', description: 'Genera y archiva el cierre de guardia', icon: History, color: 'text-violet-500 bg-violet-500/10' },
  { id: 'personal', label: 'Personal', description: 'Gestiona efectivos y asignación de guardias', icon: Users, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'estadisticas', label: 'Estadísticas', description: 'Panel de métricas e indicadores históricos', icon: BarChart2, color: 'text-rose-500 bg-rose-500/10' },
  { id: 'plantillas', label: 'Plantillas', description: 'Crea y gestiona plantillas de novedades', icon: FileText, color: 'text-primary bg-primary/10' },
];

const PRESET_ESCRITORIO: AppModuleId[] = [];
const PRESET_MOVIL: AppModuleId[] = ['estadisticas', 'plantillas'];

export function PasoModulos({
  alSiguiente,
  alAtras,
  alGuardar,
}: {
  alSiguiente: () => void;
  alAtras: () => void;
  alGuardar: (deshabilitados: AppModuleId[]) => void;
}) {
  const [modulosDeshabilitados, setModulosDeshabilitados] = useState<AppModuleId[]>([]);
  const [preset, setPreset] = useState<'desktop' | 'mobile' | 'custom'>('desktop');

  const estaHabilitado = (id: AppModuleId) => !modulosDeshabilitados.includes(id);
  const toggle = (id: AppModuleId) => {
    setPreset('custom');
    setModulosDeshabilitados((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const aplicarPreset = (id: 'desktop' | 'mobile') => {
    setPreset(id);
    setModulosDeshabilitados(id === 'desktop' ? PRESET_ESCRITORIO : PRESET_MOVIL);
  };

  const manejarContinuar = () => {
    alGuardar(modulosDeshabilitados);
    alSiguiente();
  };

  return (
    <SetupStepLayout 
      alAtras={alAtras} 
      alSiguiente={manejarContinuar}
      sigTexto="Continuar a Estructura"
    >
      <div className="space-y-5 py-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">Módulos de Operación</h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px]">
              Activa las herramientas necesarias para tu servicio.
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => aplicarPreset('desktop')}
            className={cn(
              "flex flex-col items-center text-center p-3.5 rounded-xl border-2 transition-all gap-1.5 cursor-pointer",
              preset === 'desktop'
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 font-semibold shadow-sm"
                : "border-border/70 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <Monitor className="h-5 w-5" />
            <div>
              <p className="font-bold text-xs">Escritorio (Completo)</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Todos los módulos activos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => aplicarPreset('mobile')}
            className={cn(
              "flex flex-col items-center text-center p-3.5 rounded-xl border-2 transition-all gap-1.5 cursor-pointer",
              preset === 'mobile'
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 font-semibold shadow-sm"
                : "border-border/70 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <Smartphone className="h-5 w-5" />
            <div>
              <p className="font-bold text-xs">Móvil (Ligero)</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Novedades y Guardias</p>
            </div>
          </button>
        </div>

        {/* Lista de módulos */}
        <div className="border border-border/70 rounded-2xl bg-muted/20 divide-y divide-border/60 overflow-hidden">
          {DEF_MODULOS.map((mod) => (
            <div
              key={mod.id}
              className={cn(
                "flex items-center gap-3.5 p-3.5 transition-opacity",
                !estaHabilitado(mod.id) && "opacity-50"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", mod.color)}>
                <mod.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] tracking-tight">{mod.label}</p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight">{mod.description}</p>
              </div>
              <Switch
                checked={estaHabilitado(mod.id)}
                onCheckedChange={() => toggle(mod.id)}
                className="scale-90 data-[state=checked]:bg-primary"
              />
            </div>
          ))}
        </div>
      </div>
    </SetupStepLayout>
  );
}
