'use client';

import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { useAdmin } from '@/hooks/use-admin';
import { useGlobalConfig } from '@/hooks/use-global-config';
import type { AppModuleId } from '@/lib/types';
import {
  ChevronLeft,
  LayoutGrid,
  Newspaper,
  ClipboardList,
  History,
  Users,
  BarChart2,
  FileText,
  Laptop,
  Smartphone,
  ShieldAlert,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Module definitions ────────────────────────────────────────────────────────

export const MODULE_DEFS: {
  id: AppModuleId;
  label: string;
  description: string;
  icon: any;
  color: string;
}[] = [
    { id: 'novedades', label: 'Novedades', description: 'Registra reportes del turno activo', icon: Newspaper, color: 'text-blue-600 bg-blue-500/10' },
    { id: 'orden-del-dia', label: 'Orden del Día', description: 'Distribuye personal y planifica actividades', icon: ClipboardList, color: 'text-emerald-600 bg-emerald-500/10' },
    { id: 'reporte-final', label: 'Reporte Final', description: 'Genera y archiva el cierre de guardia', icon: History, color: 'text-violet-600 bg-violet-500/10' },
    { id: 'personal', label: 'Personal', description: 'Gestiona efectivos y asignación de guardias', icon: Users, color: 'text-amber-600 bg-amber-500/10' },
    { id: 'estadisticas', label: 'Estadísticas', description: 'Panel de métricas e indicadores históricos', icon: BarChart2, color: 'text-rose-600 bg-rose-500/10' },
    { id: 'plantillas', label: 'Plantillas', description: 'Crea y gestiona plantillas de novedades', icon: FileText, color: 'text-slate-600 bg-slate-500/10' },
    { id: 'actividades', label: 'Tablón de Actividades', description: 'Visualiza y gestiona las actividades planificadas, preventivos y tareas del área', icon: CalendarClock, color: 'text-orange-600 bg-orange-500/10' },
  ];

const COMING_SOON_MODULES: {
  label: string;
  description: string;
  icon: any;
  color: string;
}[] = [];

// Modules disabled in each preset (novedades is always enabled)
const PRESET_DESKTOP: AppModuleId[] = [];
const PRESET_MOBILE: AppModuleId[] = ['estadisticas', 'plantillas'];

function matchesPreset(disabled: AppModuleId[], preset: AppModuleId[]) {
  return (
    disabled.length === preset.length &&
    [...disabled].sort().join(',') === [...preset].sort().join(',')
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsModulesPage() {
  const navigate = useNavigate();
  const { settings, isLoaded } = useSettings();
  const { isAdmin } = useAdmin();
  const { config: globalConfig, loading: globalConfigLoading, updateConfig } = useGlobalConfig();

  // If user is admin, they configure disabled_modules_admins.
  // Otherwise, they view disabled_modules.
  const disabled_modules: AppModuleId[] = isAdmin
    ? (globalConfig.disabled_modules_admins || [])
    : (settings.disabled_modules || []);

  const isEnabled = (id: AppModuleId) => !disabled_modules.includes(id);

  const toggle = (id: AppModuleId) => {
    if (!isAdmin) return;
    const next = disabled_modules.includes(id)
      ? disabled_modules.filter((m) => m !== id)
      : [...disabled_modules, id];
    updateConfig('disabled_modules_admins', next);
  };

  const applyPreset = (preset: AppModuleId[]) => {
    if (!isAdmin) return;
    updateConfig('disabled_modules_admins', preset);
  };

  const isLoadedCombined = isLoaded && !globalConfigLoading;

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-32 sm:pb-16 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => navigate('/settings')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Módulos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Activa o desactiva secciones para adaptar la app a tu flujo de trabajo.
            </p>
          </div>
        </div>

        {/* Warning banner for non-admins */}
        {!isAdmin && isLoaded && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 animate-in fade-in duration-300">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Vista de solo lectura</p>
              <p className="text-xs text-amber-600/80 leading-relaxed mt-0.5">
                La configuración de módulos para tu área de trabajo es administrada centralmente. Comunícate con un administrador si necesitas habilitar o deshabilitar alguna herramienta.
              </p>
            </div>
          </div>
        )}

        {/* Presets (Only visible to Admins) */}
        {isAdmin && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              Configuración rápida
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => applyPreset(PRESET_DESKTOP)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                  matchesPreset(disabled_modules, PRESET_DESKTOP)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  matchesPreset(disabled_modules, PRESET_DESKTOP)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Escritorio</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Todos los módulos activos</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(PRESET_MOBILE)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                  matchesPreset(disabled_modules, PRESET_MOBILE)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  matchesPreset(disabled_modules, PRESET_MOBILE)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Móvil</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Sin Estadísticas ni Plantillas</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Module list */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Módulos individuales
          </p>
          <div className="rounded-2xl border overflow-hidden divide-y shadow-sm">
            {MODULE_DEFS.map(({ id, label, description, icon: Icon, color }) => {
              const enabled = isEnabled(id);
              const locked = id === 'novedades';
              return (
                <div
                  key={id}
                  className={cn(
                    'flex items-center justify-between px-4 py-3.5 transition-colors',
                    enabled ? 'bg-card hover:bg-muted/20' : 'bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity',
                      color,
                      !enabled && 'opacity-40'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className={cn('transition-opacity', !enabled && 'opacity-40')}>
                      <p className="text-sm font-medium leading-tight">{label}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</p>
                    </div>
                    {locked && (
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-muted border px-1.5 py-0.5 rounded text-muted-foreground ml-1">
                        Requerido
                      </span>
                    )}
                  </div>
                  <Switch
                    id={`module-${id}`}
                    checked={enabled}
                    onCheckedChange={() => toggle(id)}
                    disabled={locked || !isLoadedCombined || !isAdmin}
                  />
                </div>
              );
            })}
          </div>
          {/* Coming soon modules */}
          {COMING_SOON_MODULES.map(({ label, description, icon: Icon, color }) => (
            <div
              key={label}
              title="Función futura..."
              className="flex items-center justify-between px-4 py-3.5 bg-muted/20 opacity-50 cursor-not-allowed rounded-2xl border mt-2 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
                      PRÓXIMAMENTE
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
            Los módulos desactivados se ocultan de la navegación. Sus datos se conservan.
          </p>
        </div>

      </div>
    </ScrollArea>
  );
}

