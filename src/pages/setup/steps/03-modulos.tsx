import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  LayoutGrid,
  Newspaper,
  ClipboardList,
  History,
  Users,
  BarChart2,
  FileText,
  Monitor,
  Smartphone,
  CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppModuleId } from '@/lib/types';
import { SetupStepLayout } from './layout';

const DEF_MODULOS: { id: AppModuleId; label: string; description: string; icon: any; color: string }[] = [
  { id: 'orden-del-dia', label: 'Orden del Día', description: 'Distribuye personal y planifica actividades', icon: ClipboardList, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'reporte-final', label: 'Reporte Final', description: 'Genera y archiva el cierre de guardia', icon: History, color: 'text-violet-500 bg-violet-500/10' },
  { id: 'personal', label: 'Personal', description: 'Gestiona efectivos y asignación de guardias', icon: Users, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'estadisticas', label: 'Estadísticas', description: 'Panel de métricas e indicadores históricos', icon: BarChart2, color: 'text-rose-500 bg-rose-500/10' },
  { id: 'plantillas', label: 'Plantillas', description: 'Crea y gestiona plantillas de novedades', icon: FileText, color: 'text-slate-500 bg-slate-500/10' },
  { id: 'actividades', label: 'Tablón de Actividades', description: 'Visualiza y gestiona las actividades planificadas, preventivos y tareas del área', icon: CalendarClock, color: 'text-orange-500 bg-orange-500/10' },
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
    <SetupStepLayout alAtras={alAtras} alSiguiente={manejarContinuar}>
      <div className="space-y-4 py-1">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-bold tracking-tight">Módulos</h2>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px]">
                Activa solo las secciones que necesitas.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => aplicarPreset('desktop')}
            className={cn(
              "flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all gap-2",
              preset === 'desktop'
                ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                : "border-border hover:border-muted-foreground/30 bg-muted/20"
            )}
          >
            <Monitor className={cn("h-6 w-6", preset === 'desktop' ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-bold text-xs">Escritorio</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">Todos los módulos activos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => aplicarPreset('mobile')}
            className={cn(
              "flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all gap-2",
              preset === 'mobile'
                ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                : "border-border hover:border-muted-foreground/30 bg-muted/20"
            )}
          >
            <Smartphone className={cn("h-6 w-6", preset === 'mobile' ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-bold text-xs">Móvil</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">Novedades, Personal, Orden y Reporte</p>
            </div>
          </button>
        </div>

        <div className="border rounded-xl bg-muted/50 divide-y divide-border overflow-hidden shadow-2xl">
          {DEF_MODULOS.map((mod) => (
            <div
              key={mod.id}
              className={cn(
                "flex items-center gap-3 p-3 transition-opacity",
                !estaHabilitado(mod.id) && "opacity-50"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", mod.color)}>
                <mod.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] tracking-tight">{mod.label}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{mod.description}</p>
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
