'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useSettings } from '@/hooks/use-settings';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  FileText,
  ArrowRight,
  Settings2,
  Sun,
  Moon,
  Monitor,
  Palette,
  Users,
  Shield,
  ClipboardList,
  PlayCircle,
  Zap,
  BookOpen,
  MessageSquarePlus,
  Heart,
  LayoutGrid,
  Newspaper,
  History,
  BarChart2,
  Laptop,
  Smartphone,
  Building2,
  Plus,
  Trash2,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AppModuleId, StaffRole, Department } from '@/lib/types';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { usePersonnel } from '@/hooks/use-personnel';
import { StructureManager } from '@/components/structure-manager';
import { generateId } from '@/lib/utils/id';
import { DEFAULT_DEPARTMENTS, DEFAULT_ROLES } from '@/lib/constants/structure';

// ─── Storage helpers ──────────────────────────────────────────────────────────

export const SETUP_DONE_KEY = 'minutas-setup-complete-v1';
export const SETUP_STEP_KEY = 'minutas-setup-step';
export const SETUP_WS_KEY   = 'minutas-setup-workspace';
export const SETUP_ROLES_KEY = 'minutas-setup-roles-v1';
export const SETUP_DEPTS_KEY = 'minutas-setup-depts-v1';

export function tryGet(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return sessionStorage.getItem(key); }
}
export function trySet(key: string, val: string) {
  try { localStorage.setItem(key, val); }
  catch { sessionStorage.setItem(key, val); }
}
export function tryRemove(key: string) {
  try { localStorage.removeItem(key); }
  catch { sessionStorage.removeItem(key); }
}

// ─── Progress dots ────────────────────────────────────────────────────────────
// Steps 1–5 show dots (5 total)

const TOTAL_DOTS = 8;

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < current ? 'bg-primary w-6' : i === current ? 'bg-primary/60 w-4' : 'bg-muted w-3'
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl scale-110" />
        <img
          src="/icons/icon-192x192.png"
          alt="Minutas"
          className="relative h-32 w-32 rounded-3xl shadow-2xl ring-2 ring-white/20 object-contain"
        />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a Minutas</h1>
        <p className="text-muted-foreground leading-relaxed">
          Tu app de gestión de reportes y novedades. Configura tu espacio de trabajo en unos pocos pasos.
        </p>
      </div>
      <div className="w-full bg-muted/40 rounded-xl p-4 text-left space-y-2.5 border text-sm">
        {[
          'Todo se guarda localmente en tu dispositivo',
          'Ningún dato se comparte con terceros',
          'Puedes sincronizar entre dispositivos opcionalmente',
        ].map((text, i) => (
          <div key={i} className="flex items-center gap-3 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full text-base h-12 shadow-md" onClick={onNext}>
        Comenzar configuración
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}

// ─── Step 1: Theme ────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: 'light'  as const, label: 'Claro',  icon: Sun,     desc: 'Fondo blanco, ideal para luz del día' },
  { value: 'system' as const, label: 'Sistema', icon: Monitor, desc: 'Sigue la preferencia del dispositivo' },
  { value: 'dark'   as const, label: 'Oscuro',  icon: Moon,    desc: 'Fondo oscuro, más cómodo de noche' },
];

function StepTheme({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <Palette className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Apariencia</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Elige el tema visual de la aplicación. Puedes cambiarlo en cualquier momento.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              theme === value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
            )}
          >
            <Icon className={cn('h-7 w-7', theme === value ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn('text-sm font-semibold', theme === value ? 'text-primary' : 'text-foreground')}>
              {label}
            </span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{desc}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Workspace ────────────────────────────────────────────────────────

function StepWorkspace({
  existingWorkspaces,
  onNext,
  onBack,
}: {
  existingWorkspaces: string[];
  onNext: (name: string, isExisting: boolean) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<'new' | 'existing'>(
    existingWorkspaces.length > 0 ? 'existing' : 'new'
  );
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(existingWorkspaces[0] ?? '');

  const handleContinue = () => {
    if (mode === 'new' && name.trim()) onNext(name.trim(), false);
    if (mode === 'existing' && selected) onNext(selected, true);
  };

  const canContinue = mode === 'new' ? !!name.trim() : !!selected;

  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
          <Layers className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Área de Trabajo</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Organiza tus reportes, plantillas y personal por área. Puedes crear varias (ej. por puesto o turno).
        </p>
      </div>

      {existingWorkspaces.length > 0 && (
        <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
          {(['existing', 'new'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 text-sm py-1.5 rounded-md transition-all font-medium',
                mode === m ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
              )}
            >
              {m === 'existing' ? 'Usar existente' : 'Crear nueva'}
            </button>
          ))}
        </div>
      )}

      {mode === 'new' ? (
        <div className="space-y-2">
          <Label htmlFor="ws-name" className="text-sm font-medium">Nombre del área</Label>
          <Input
            id="ws-name"
            placeholder='Ej. "Puesto Norte", "Guardia Nocturna"'
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canContinue && handleContinue()}
            autoFocus
            className="h-11"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seleccionar área de trabajo</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Elige un área..." /></SelectTrigger>
            <SelectContent className="z-[200]">
              {existingWorkspaces.map((ws) => (
                <SelectItem key={ws} value={ws}>{ws}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" disabled={!canContinue} onClick={handleContinue}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: General Settings ─────────────────────────────────────────────────

const GENERAL_FIELD_META: { key: string; label: string; options?: { label: string; value: string }[] }[] = [
  {
    key: 'Municipio', label: 'Municipio',
    options: [
      { label: '(Ninguno)', value: '' },
      { label: 'Guanta', value: 'Guanta' },
      { label: 'Juan Antonio Sotillo', value: 'Juan Antonio Sotillo' },
      { label: 'Urbaneja', value: 'Urbaneja' },
    ],
  },
  { key: 'Estado', label: 'Estado',  options: [{ label: 'Anzoátegui', value: 'Anzoátegui' }] },
  { key: 'REDAN',  label: 'REDAN',   options: [{ label: 'Oriente', value: 'Oriente' }] },
  { key: 'ZOEDAN', label: 'ZOEDAN',  options: [{ label: 'Anzoátegui', value: 'Anzoátegui' }] },
];
const DEFAULT_GENERAL_VALUES: Record<string, string> = {
  Municipio: '', Estado: 'Anzoátegui', REDAN: 'Oriente', ZOEDAN: 'Anzoátegui',
};
const NONE_SENTINEL = '__none__';

function StepGeneralSettings({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { definitions, saveDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { isLoaded: settingsLoaded } = useSettings();
  const [localValues, setLocalValues] = useState<Record<string, string>>(DEFAULT_GENERAL_VALUES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!definitionsLoaded) return;
    setLocalValues((prev) => {
      const merged = { ...prev };
      GENERAL_FIELD_META.forEach(({ key }) => {
        const stored = definitions[key]?.value;
        if (stored !== undefined) merged[key] = stored;
      });
      return merged;
    });
  }, [definitionsLoaded, definitions]);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const newDefs = { ...definitions };
      GENERAL_FIELD_META.forEach(({ key }) => {
        newDefs[key] = {
          ...(newDefs[key] ?? { label: key, type: 'predefined', sectionId: 'default' }),
          value: localValues[key] ?? '',
        };
      });
      await saveDefinitions(newDefs);
      onNext();
    } catch { toast.error('Error al guardar la configuración.'); }
    finally { setIsSaving(false); }
  };

  if (!definitionsLoaded || !settingsLoaded) {
    return (
      <div className="flex flex-col max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Settings2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Ajustes Generales</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Estos valores se usarán automáticamente en tus reportes. Puedes cambiarlos en cualquier momento.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {GENERAL_FIELD_META.map(({ key, label, options }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`gen-${key}`} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {label}
            </Label>
            {options ? (
              <Select
                value={localValues[key] === '' ? NONE_SENTINEL : (localValues[key] ?? NONE_SENTINEL)}
                onValueChange={(v) => setLocalValues((p) => ({ ...p, [key]: v === NONE_SENTINEL ? '' : v }))}
              >
                <SelectTrigger id={`gen-${key}`} className="h-9 bg-background text-sm w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value === '' ? NONE_SENTINEL : opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`gen-${key}`}
                value={localValues[key] ?? ''}
                onChange={(e) => setLocalValues((p) => ({ ...p, [key]: e.target.value }))}
                className="h-9 bg-background text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={handleSaveAndContinue} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar y Continuar'}<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Structure (Organigrama) ──────────────────────────────────────────

const STRUCTURE_PRESETS = [
  {
    id: 'comun',
    label: 'Organigrama Común',
    description: 'Estructura estándar sin sala de monitoreo.',
    icon: Building2,
    departments: DEFAULT_DEPARTMENTS.filter(d => d.id !== 'cemuprad' && d.id !== 'it'),
    roles: DEFAULT_ROLES.filter(r => !r.departmentScope?.includes('cemuprad') && !r.isStatus)
  },
  {
    id: 'extendido',
    label: 'Organigrama Extendido',
    description: 'Estructura completa con Sala de Monitoreo.',
    icon: Shield,
    departments: DEFAULT_DEPARTMENTS.map(d => ({
      ...d,
      name: d.name === 'CEMUPRAD' ? '{MONITORING_ROOM}' : d.name
    })),
    roles: DEFAULT_ROLES.map(r => ({
      ...r,
      name: r.name.replace('CEMUPRAD', '{MONITORING_ROOM}')
    })).filter(r => !r.isStatus)
  }
];

function StepStructure({ 
  onNext, 
  onBack,
  roles,
  setRoles,
  departments,
  setDepartments
}: { 
  onNext: () => void; 
  onBack: () => void;
  roles: StaffRole[];
  setRoles: (r: StaffRole[]) => void;
  departments: Department[];
  setDepartments: (d: Department[]) => void;
}) {
  const [monitoringInput, setMonitoringInput] = useState('CEMUPRAD');
  const [selectedPreset, setSelectedPreset] = useState<'comun' | 'extendido' | null>(null);

  const applyPreset = (presetId: 'comun' | 'extendido') => {
    setSelectedPreset(presetId);
    const p = STRUCTURE_PRESETS.find(x => x.id === presetId);
    if (!p) return;

    const currentMonitoringName = monitoringInput.trim() || 'Sala de Monitoreo';

    const newDepts = p.departments.map((d: any) => ({
      id: d.id || generateId('dept'),
      name: (typeof d === 'string' ? d : d.name).replace('{MONITORING_ROOM}', currentMonitoringName),
      staff: d.staff || {}
    }));

    const newRoles = p.roles.map((r: any, index: number) => ({
      ...r,
      name: r.name.replace('{MONITORING_ROOM}', currentMonitoringName),
      order: index
    }));

    setDepartments(newDepts);
    setRoles(newRoles);
  };

  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Estructura Institucional</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Selecciona una base para comenzar. El modo extendido incluye sala de monitoreo.
        </p>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 gap-3">
        {STRUCTURE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id as any)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left",
              selectedPreset === p.id 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
            )}
          >
            <p.icon className={cn("h-6 w-6", selectedPreset === p.id ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-semibold text-[13px] leading-tight">{p.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">{p.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Monitoring Room Config - Only if extended is selected */}
      {selectedPreset === 'extendido' && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 space-y-3 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <Label className="text-xs font-bold uppercase tracking-wider text-primary">Nombre de la Sala de Monitoreo</Label>
          </div>
          <div className="flex gap-2">
            <Input 
              value={monitoringInput}
              onChange={e => setMonitoringInput(e.target.value)}
              placeholder="Ej: CEMUPRAD, Sala Situacional..."
              className="h-9 bg-background border-primary/20 focus-visible:ring-primary"
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight">
            Se usará el nombre <span className="text-primary font-medium">{monitoringInput}</span> para el departamento y cargos correspondientes.
          </p>
        </div>
      )}

      <div className="bg-background/50 border rounded-xl overflow-hidden min-h-[300px]">
        <StructureManager 
          compact={true}
          roles={roles}
          departments={departments}
          onRolesChange={setRoles}
          onDepartmentsChange={setDepartments}
          onSave={() => {}}
          rolesLoaded={true}
          deptsLoaded={true}
          initialTab="departments"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function StepHierarchy({ 
  onNext, 
  onBack,
  roles,
  setRoles,
  departments,
  setDepartments
}: { 
  onNext: () => void; 
  onBack: () => void;
  roles: StaffRole[];
  setRoles: (r: StaffRole[]) => void;
  departments: Department[];
  setDepartments: (d: Department[]) => void;
}) {
  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Jerarquía de Cargos</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Organiza la jerarquía de los cargos. Este será el orden que se utilizará por defecto al crear las guardias y en los reportes.
        </p>
      </div>

      <div className="bg-background/50 border rounded-xl overflow-hidden min-h-[400px]">
        <StructureManager 
          compact={true}
          roles={roles}
          departments={departments}
          onRolesChange={setRoles}
          onDepartmentsChange={setDepartments}
          onSave={() => {}}
          rolesLoaded={true}
          deptsLoaded={true}
          initialTab="roles"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 5: Modules ──────────────────────────────────────────────────────────

const ALL_MODULE_DEFS: { id: AppModuleId; label: string; description: string; icon: any; color: string }[] = [
  { id: 'novedades',     label: 'Novedades',      description: 'Registra reportes del turno activo',              icon: Newspaper,    color: 'text-blue-600 bg-blue-500/10' },
  { id: 'orden-del-dia', label: 'Orden del Día',  description: 'Distribuye personal y planifica actividades',       icon: ClipboardList, color: 'text-emerald-600 bg-emerald-500/10' },
  { id: 'reporte-final', label: 'Reporte Final',  description: 'Genera y archiva el cierre de guardia',            icon: History,       color: 'text-violet-600 bg-violet-500/10' },
  { id: 'personal',      label: 'Personal',       description: 'Gestiona efectivos y asignación de guardias',      icon: Users,         color: 'text-amber-600 bg-amber-500/10' },
  { id: 'estadisticas',  label: 'Estadísticas',   description: 'Panel de métricas e indicadores históricos',      icon: BarChart2,     color: 'text-rose-600 bg-rose-500/10' },
  { id: 'plantillas',    label: 'Plantillas',     description: 'Crea y gestiona plantillas de novedades',          icon: FileText,      color: 'text-slate-600 bg-slate-500/10' },
];

// Modules disabled in each preset (novedades is always enabled)
const PRESET_DESKTOP: AppModuleId[] = []; // all enabled
const PRESET_MOBILE: AppModuleId[]  = ['estadisticas', 'plantillas'];

function StepModules({
  onNext,
  onBack,
  onSave,
}: {
  onNext: () => void;
  onBack: () => void;
  onSave: (disabled: AppModuleId[]) => void;
}) {
  const [disabledModules, setDisabledModules] = useState<AppModuleId[]>([]);

  const isEnabled = (id: AppModuleId) => !disabledModules.includes(id);
  const toggle = (id: AppModuleId) => {
    setDisabledModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const applyPreset = (preset: AppModuleId[]) => setDisabledModules(preset);

  const handleContinue = () => {
    onSave(disabledModules);
    onNext();
  };

  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <LayoutGrid className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Módulos</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Activa solo las secciones que necesitas. Puedes cambiarlas en cualquier momento desde Configuración.
        </p>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => applyPreset(PRESET_DESKTOP)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
            disabledModules.length === PRESET_DESKTOP.length && disabledModules.every(m => PRESET_DESKTOP.includes(m))
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
          )}
        >
          <Laptop className="h-7 w-7 text-primary" />
          <div>
            <p className="font-semibold text-sm">Escritorio</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Todos los módulos activos</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyPreset(PRESET_MOBILE)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
            JSON.stringify([...disabledModules].sort()) === JSON.stringify([...PRESET_MOBILE].sort())
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
          )}
        >
          <Smartphone className="h-7 w-7 text-primary" />
          <div>
            <p className="font-semibold text-sm">Móvil</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Novedades, Personal, Orden y Reporte</p>
          </div>
        </button>
      </div>

      {/* Module toggles */}
      <div className="rounded-xl border divide-y overflow-hidden">
        {ALL_MODULE_DEFS.map(({ id, label, description, icon: Icon, color }) => (
          <div
            key={id}
            className={cn(
              'flex items-center justify-between px-4 py-3 transition-colors',
              isEnabled(id) ? 'bg-background hover:bg-muted/20' : 'bg-muted/30 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</p>
              </div>
            </div>
            <Switch
              id={`setup-module-${id}`}
              checked={isEnabled(id)}
              onCheckedChange={() => toggle(id)}
              disabled={id === 'novedades'}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={handleContinue}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 5: Templates ────────────────────────────────────────────────────────

function StepTemplates({ onNext, onBack, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Plantillas de Reporte</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Las plantillas definen la estructura de tus reportes. Descarga plantillas base o créalas desde cero.
        </p>
      </div>
      <div className="space-y-3">
        <button type="button" onClick={onNext}
          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Descargar Plantillas de Nube</p>
            <p className="text-xs text-muted-foreground">Plantillas listas para usar de la comunidad</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
        </button>
        <button type="button" onClick={onSkip}
          className="w-full flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left group">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Lo haré más tarde</p>
            <p className="text-xs text-muted-foreground">Empezar sin plantillas y agregarlas después</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
        </button>
      </div>
      <Button variant="ghost" onClick={onBack} className="self-start -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" />Atrás
      </Button>
    </div>
  );
}

// ─── Step 5: First time? ──────────────────────────────────────────────────────

function StepFirstTime({
  onFirstTime,
  onReturning,
  onBack,
}: {
  onFirstTime: () => void;
  onReturning: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <Zap className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">¿Primera vez?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cuéntanos un poco sobre tu experiencia con Minutas para mostrarte la información más relevante.
        </p>
      </div>
      <div className="space-y-3">
        <button type="button" onClick={onFirstTime}
          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left group">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Sí, es mi primera vez</p>
            <p className="text-xs text-muted-foreground">Quiero ver cómo funciona el flujo de trabajo</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
        </button>
        <button type="button" onClick={onReturning}
          className="w-full flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left group">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Ya he usado Minutas antes</p>
            <p className="text-xs text-muted-foreground">Saltar la guía e ir directamente a la app</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
        </button>
      </div>
      <Button variant="ghost" onClick={onBack} className="self-start -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" />Atrás
      </Button>
    </div>
  );
}

// ─── Step 6: Workflow guide (first-time only) ─────────────────────────────────

const WORKFLOW_STEPS_DATA = [
  { icon: Users,        color: 'bg-blue-500/10 text-blue-600',   title: '1. Lista de Personal',   desc: 'Registra el equipo que trabaja en tu área. Ve a Personal y añade a cada miembro con su cargo y jerarquía.' },
  { icon: Shield,       color: 'bg-violet-500/10 text-violet-600', title: '2. Configurar Guardias', desc: 'Define los grupos de guardia (Guardia A, B, etc.) y asigna el personal a cada turno.' },
  { icon: ClipboardList,color: 'bg-amber-500/10 text-amber-600',  title: '3. Orden del Día',       desc: 'Antes de empezar el turno, completa la Orden del Día: relevo, actividades y observaciones.' },
  { icon: PlayCircle,   color: 'bg-green-500/10 text-green-600',  title: '4. Abrir la Guardia',    desc: 'Con la Orden del Día completa, abre la guardia. Desde ese momento podrás registrar novedades y generar reportes.' },
];

function StepGuide({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
          <BookOpen className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Flujo de Trabajo</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Antes de generar tu primer reporte, sigue estos pasos en orden:
        </p>
      </div>

      <div className="space-y-3">
        {WORKFLOW_STEPS_DATA.map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex gap-4 p-4 rounded-xl border bg-muted/20">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
        💡 <strong className="text-foreground">Consejo:</strong> Puedes volver a esta guía en cualquier momento desde{' '}
        <span className="font-medium text-foreground">Configuración → Acerca de → Guía</span>.
      </div>

      <Button className="w-full h-11" onClick={onNext}>
        Continuar<ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// ─── Step 7: Feedback CTA ─────────────────────────────────────────────────────

function StepFeedback({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center">
        <MessageSquarePlus className="h-10 w-10 text-indigo-600" />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">¡Tu opinión importa!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Si encuentras algún error, tienes una sugerencia o simplemente quieres compartir tu experiencia,
          puedes enviarnos un comentario en cualquier momento desde{' '}
          <strong className="text-foreground">Configuración → Enviar Comentarios</strong>.
        </p>
      </div>
      <div className="w-full bg-muted/40 rounded-xl p-4 text-left space-y-2.5 border text-sm">
        {[
          'Puedes enviar tantos comentarios como necesites',
          'Reporta errores, bugs o comportamientos inesperados',
          'Propón nuevas funciones o mejoras',
          'Cada mensaje es leído y tomado en cuenta',
        ].map((text, i) => (
          <div key={i} className="flex items-center gap-3 text-muted-foreground">
            <Heart className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full text-base h-12 shadow-md" onClick={onFinish}>
        ¡Entendido, empezar!
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}

// ─── Step 8: Done ─────────────────────────────────────────────────────────────

function StepDone({ workspaceName }: { workspaceName: string }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="h-24 w-24 rounded-3xl bg-green-500/10 flex items-center justify-center shadow-lg ring-1 ring-green-500/20">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">¡Listo!</h2>
        <p className="text-muted-foreground leading-relaxed">
          El área de trabajo{' '}
          <strong className="text-foreground">"{workspaceName}"</strong> está configurada. Ya puedes comenzar.
        </p>
      </div>
    </div>
  );
}

// ─── Main Setup Page ──────────────────────────────────────────────────────────
/**
 * Steps:
 *  0  Welcome
 *  1  Theme
 *  2  Workspace
 *  3  General Settings
 *  4  Templates
 *  5  First-time question
 *  6  Guide (first-time only)
 *  7  Feedback CTA (first-time only; skipped for returning users)
 *  8  Done
 *
 * Progress dots shown for steps 1–5 (TOTAL_DOTS = 5).
 * Current step persists in localStorage so users resume after reload.
 */

export default function SetupPage({ onComplete }: { onComplete: (goToTemplates?: boolean) => void }) {
  const [step, setStepState] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('');
  const { createWorkspace, switchWorkspace, workspaces } = useWorkspaceManager();
  const { saveSettings, isLoaded } = useSettings();

  const { roles: dbRoles, saveRoles, isLoaded: rolesLoaded } = useRoles();
  const { departments: dbDepts, saveDepartments, isLoaded: deptsLoaded } = useDepartments();

  const [roles, setRolesState] = useState<StaffRole[]>([]);
  const [departments, setDepartmentsState] = useState<Department[]>([]);
  const initialized = useRef(false);

  const setRoles = (r: StaffRole[]) => {
    setRolesState(r);
    trySet(SETUP_ROLES_KEY, JSON.stringify(r));
  };
  const setDepartments = (d: Department[]) => {
    setDepartmentsState(d);
    trySet(SETUP_DEPTS_KEY, JSON.stringify(d));
  };

  // Sync with DB or LocalStorage once loaded
  useEffect(() => {
    if (!initialized.current && rolesLoaded && deptsLoaded) {
      const savedRoles = tryGet(SETUP_ROLES_KEY);
      const savedDepts = tryGet(SETUP_DEPTS_KEY);
      
      if (savedRoles) setRolesState(JSON.parse(savedRoles));
      else if (dbRoles.length > 0) setRolesState(dbRoles);

      if (savedDepts) setDepartmentsState(JSON.parse(savedDepts));
      else if (dbDepts.length > 0) setDepartmentsState(dbDepts);

      initialized.current = true;
    }
  }, [rolesLoaded, deptsLoaded, dbRoles, dbDepts]);

  const setStep = (s: number) => {
    setStepState(s);
    trySet(SETUP_STEP_KEY, String(s));
  };

  // Restore persisted step on mount (the gate in welcome-gate.tsx already verified setup is not done)
  useEffect(() => {
    if (!isLoaded) return;
    const savedStep = tryGet(SETUP_STEP_KEY);
    const savedWs   = tryGet(SETUP_WS_KEY);
    if (savedStep) setStepState(Number(savedStep));
    if (savedWs)   setWorkspaceName(savedWs);
  }, [isLoaded]);

  const markDone = () => {
    trySet(SETUP_DONE_KEY, 'true');
    tryRemove(SETUP_STEP_KEY);
    tryRemove(SETUP_WS_KEY);
    tryRemove(SETUP_ROLES_KEY);
    tryRemove(SETUP_DEPTS_KEY);
  };

  const finish = async (goToTemplates = false) => {
    // Save pending structure only at the end
    if (roles.length > 0) await saveRoles(roles);
    if (departments.length > 0) await saveDepartments(departments);

    markDone();
    if (goToTemplates) trySet('minutas-template-bootstrap-ok', 'true');
    setStepState(10); // done screen
    setTimeout(() => onComplete(goToTemplates), 1800);
  };

  const handleWorkspaceContinue = async (name: string, isExisting: boolean) => {
    setWorkspaceName(name);
    trySet(SETUP_WS_KEY, name);
    try {
      if (isExisting) {
        await switchWorkspace(name);
      } else {
        await createWorkspace(name);
        await switchWorkspace(name);
      }
    } catch {
      toast.error('No se pudo configurar el área de trabajo.');
      return;
    }
    setStep(3);
  };

  // Step 2 & 3 need the database. Step 0, 1, 4-8 do not strictly need it to render,
  // though Step 4-8 are usually reached after Step 2 which ensures DB is ready.

  const showProgress = step >= 1 && step <= 7;
  const progressCurrent = step - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">

      <div className="relative w-full max-w-lg my-auto py-8">
        {showProgress && (
          <div className="flex items-center justify-between mb-8 px-1">
            <ProgressDots current={progressCurrent} total={TOTAL_DOTS} />
            <span className="text-xs text-muted-foreground tabular-nums">
              Paso {step} de {TOTAL_DOTS}
            </span>
          </div>
        )}

        {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
        {step === 1 && <StepTheme onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && (
          <StepWorkspace
            existingWorkspaces={workspaces}
            onNext={handleWorkspaceContinue}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <div className="animate-in fade-in duration-500">
            <StepGeneralSettings onNext={() => setStep(4)} onBack={() => setStep(2)} />
          </div>
        )}
        {step === 4 && (
          <StepModules
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
            onSave={(disabled) => saveSettings({ disabledModules: disabled })}
          />
        )}
        {step === 5 && (
          <StepStructure 
            onNext={() => setStep(6)} 
            onBack={() => setStep(4)}
            roles={roles}
            setRoles={setRoles}
            departments={departments}
            setDepartments={setDepartments}
          />
        )}
        {step === 6 && (
          <StepHierarchy
            onNext={() => setStep(7)}
            onBack={() => setStep(5)}
            roles={roles}
            setRoles={setRoles}
            departments={departments}
            setDepartments={setDepartments}
          />
        )}
        {step === 7 && (
          <StepTemplates
            onNext={() => { trySet('minutas-template-bootstrap-ok', 'true'); setStep(8); }}
            onBack={() => setStep(6)}
            onSkip={() => setStep(8)}
          />
        )}
        {step === 8 && (
          <StepFirstTime
            onFirstTime={() => setStep(9)}
            onReturning={() => setStep(10)}
            onBack={() => setStep(7)}
          />
        )}
        {step === 9 && <StepGuide onNext={() => setStep(10)} />}
        {step === 10 && <StepFeedback onFinish={() => finish(false)} />}
        {step === 11 && <StepDone workspaceName={workspaceName} />}
      </div>
    </div>
  );
}
