'use client';

import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Module definitions ────────────────────────────────────────────────────────

const MODULE_DEFS: {
  id: AppModuleId;
  label: string;
  description: string;
  icon: any;
  color: string;
}[] = [
  { id: 'novedades',     label: 'Novedades',     description: 'Registra reportes del turno activo',               icon: Newspaper,    color: 'text-blue-600 bg-blue-500/10' },
  { id: 'orden-del-dia', label: 'Orden del Día',  description: 'Distribuye personal y planifica actividades',       icon: ClipboardList, color: 'text-emerald-600 bg-emerald-500/10' },
  { id: 'reporte-final', label: 'Reporte Final',  description: 'Genera y archiva el cierre de guardia',            icon: History,       color: 'text-violet-600 bg-violet-500/10' },
  { id: 'personal',      label: 'Personal',       description: 'Gestiona efectivos y asignación de guardias',      icon: Users,         color: 'text-amber-600 bg-amber-500/10' },
  { id: 'estadisticas',  label: 'Estadísticas',   description: 'Panel de métricas e indicadores históricos',       icon: BarChart2,     color: 'text-rose-600 bg-rose-500/10' },
  { id: 'plantillas',    label: 'Plantillas',     description: 'Crea y gestiona plantillas de novedades',          icon: FileText,      color: 'text-slate-600 bg-slate-500/10' },
];

// Modules disabled in each preset (novedades is always enabled)
const PRESET_DESKTOP: AppModuleId[] = [];
const PRESET_MOBILE: AppModuleId[]  = ['estadisticas', 'plantillas'];

function matchesPreset(disabled: AppModuleId[], preset: AppModuleId[]) {
  return (
    disabled.length === preset.length &&
    [...disabled].sort().join(',') === [...preset].sort().join(',')
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsModulesPage() {
  const navigate = useNavigate();
  const { settings, saveSettings, isLoaded } = useSettings();

  const disabledModules: AppModuleId[] = settings.disabledModules || [];

  const isEnabled  = (id: AppModuleId) => !disabledModules.includes(id);
  const toggle     = (id: AppModuleId) => {
    const next = disabledModules.includes(id)
      ? disabledModules.filter((m) => m !== id)
      : [...disabledModules, id];
    saveSettings({ disabledModules: next });
  };
  const applyPreset = (preset: AppModuleId[]) =>
    saveSettings({ disabledModules: preset });

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

        {/* Presets */}
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
                matchesPreset(disabledModules, PRESET_DESKTOP)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                matchesPreset(disabledModules, PRESET_DESKTOP)
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
                matchesPreset(disabledModules, PRESET_MOBILE)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                matchesPreset(disabledModules, PRESET_MOBILE)
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

        {/* Module list */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Módulos individuales
          </p>
          <div className="rounded-2xl border overflow-hidden divide-y shadow-sm">
            {MODULE_DEFS.map(({ id, label, description, icon: Icon, color }) => {
              const enabled = isEnabled(id);
              const locked  = id === 'novedades';
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
                    disabled={locked || !isLoaded}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
            Los módulos desactivados se ocultan de la navegación. Sus datos se conservan.
          </p>
        </div>

      </div>
    </ScrollArea>
  );
}
