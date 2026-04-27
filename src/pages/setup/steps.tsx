'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';
import { toast } from 'sonner';
import { StructureManager } from '@/components/structure/structure-manager';
import { generateId } from '@/lib/utils/id';
import { DEFAULT_DEPARTMENTS, DEFAULT_ROLES } from '@/lib/constants/structure';
import type { AppModuleId, StaffRole, Department } from '@/lib/types';

// --- Paso 0: Bienvenida ---

export function PasoBienvenida({ alSiguiente }: { alSiguiente: () => void }) {
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
        ].map((texto, i) => (
          <div key={i} className="flex items-center gap-3 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span>{texto}</span>
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full text-base h-12 shadow-md" onClick={alSiguiente}>
        Comenzar configuración
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}

// --- Paso 1: Tema ---

const OPCIONES_TEMA = [
  { value: 'light' as const, label: 'Claro', icon: Sun, desc: 'Fondo blanco, ideal para luz del día' },
  { value: 'system' as const, label: 'Sistema', icon: Monitor, desc: 'Sigue la preferencia del dispositivo' },
  { value: 'dark' as const, label: 'Oscuro', icon: Moon, desc: 'Fondo oscuro, más cómodo de noche' },
];

export function PasoTema({ alSiguiente, alAtras }: { alSiguiente: () => void; alAtras: () => void }) {
  const { theme: tema, setTheme: setTema } = useTheme();
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
        {OPCIONES_TEMA.map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTema(value)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              tema === value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
            )}
          >
            <Icon className={cn('h-7 w-7', tema === value ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn('text-sm font-semibold', tema === value ? 'text-primary' : 'text-foreground')}>
              {label}
            </span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{desc}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={alAtras} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={alSiguiente}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// --- Paso 2: Área de Trabajo ---

export function PasoAreaTrabajo({
  workspacesExistentes,
  alSiguiente,
  alAtras,
}: {
  workspacesExistentes: string[];
  alSiguiente: (nombre: string, esExistente: boolean) => void;
  alAtras: () => void;
}) {
  const [modo, setModo] = useState<'new' | 'existing'>(
    workspacesExistentes.length > 0 ? 'existing' : 'new'
  );
  const [nombre, setNombre] = useState('');
  const [seleccionado, setSeleccionado] = useState(workspacesExistentes[0] ?? '');

  const manejarContinuar = () => {
    if (modo === 'new' && nombre.trim()) alSiguiente(nombre.trim(), false);
    if (modo === 'existing' && seleccionado) alSiguiente(seleccionado, true);
  };

  const puedeContinuar = modo === 'new' ? !!nombre.trim() : !!seleccionado;

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

      {workspacesExistentes.length > 0 && (
        <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
          {(['existing', 'new'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={cn(
                'flex-1 text-sm py-1.5 rounded-md transition-all font-medium',
                modo === m ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
              )}
            >
              {m === 'existing' ? 'Usar existente' : 'Crear nueva'}
            </button>
          ))}
        </div>
      )}

      {modo === 'new' ? (
        <div className="space-y-2">
          <Label htmlFor="ws-name" className="text-sm font-medium">Nombre del área</Label>
          <Input
            id="ws-name"
            placeholder='Ej. "Puesto Norte", "Guardia Nocturna"'
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && puedeContinuar && manejarContinuar()}
            autoFocus
            className="h-11"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seleccionar área de trabajo</Label>
          <Select value={seleccionado} onValueChange={setSeleccionado}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Elige un área..." /></SelectTrigger>
            <SelectContent className="z-[200]">
              {workspacesExistentes.map((ws) => (
                <SelectItem key={ws} value={ws}>{ws}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={alAtras} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" disabled={!puedeContinuar} onClick={manejarContinuar}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// --- Paso 3: Ajustes Generales ---

const META_CAMPOS_GENERALES: { key: string; label: string; options?: { label: string; value: string }[] }[] = [
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
const VALORES_GENERALES_DEFECTO: Record<string, string> = {
  Municipio: '', Estado: 'Anzoátegui', REDAN: 'Oriente', ZOEDAN: 'Anzoátegui',
};
const CENTINELA_NINGUNO = '__none__';

export function PasoAjustesGenerales({ alSiguiente, alAtras }: { alSiguiente: () => void; alAtras: () => void }) {
  const { definitions: definiciones, saveDefinitions: guardarDefiniciones, isLoaded: definicionesCargadas } = useFieldDefinitions();
  const { isLoaded: settingsCargados } = useSettings();
  const [valoresLocales, setValoresLocales] = useState<Record<string, string>>(VALORES_GENERALES_DEFECTO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!definicionesCargadas) return;
    setValoresLocales((prev) => {
      const mezclado = { ...prev };
      META_CAMPOS_GENERALES.forEach(({ key }) => {
        const almacenado = definiciones[key]?.value;
        if (almacenado !== undefined) mezclado[key] = almacenado;
      });
      return mezclado;
    });
  }, [definicionesCargadas, definiciones]);

  const manejarGuardarYContinuar = async () => {
    setGuardando(true);
    try {
      const nuevasDefs = { ...definiciones };
      META_CAMPOS_GENERALES.forEach(({ key }) => {
        nuevasDefs[key] = {
          ...(nuevasDefs[key] ?? { label: key, type: 'predefined', sectionId: 'default' }),
          value: valoresLocales[key] ?? '',
        };
      });
      await guardarDefiniciones(nuevasDefs);
      alSiguiente();
    } catch { toast.error('Error al guardar la configuración.'); }
    finally { setGuardando(false); }
  };

  if (!definicionesCargadas || !settingsCargados) {
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
        {META_CAMPOS_GENERALES.map(({ key, label, options }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`gen-${key}`} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {label}
            </Label>
            {options ? (
              <Select
                value={valoresLocales[key] === '' ? CENTINELA_NINGUNO : (valoresLocales[key] ?? CENTINELA_NINGUNO)}
                onValueChange={(v) => setValoresLocales((p) => ({ ...p, [key]: v === CENTINELA_NINGUNO ? '' : v }))}
              >
                <SelectTrigger id={`gen-${key}`} className="h-9 bg-background text-sm w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value === '' ? CENTINELA_NINGUNO : opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`gen-${key}`}
                value={valoresLocales[key] ?? ''}
                onChange={(e) => setValoresLocales((p) => ({ ...p, [key]: e.target.value }))}
                className="h-9 bg-background text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={alAtras} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={manejarGuardarYContinuar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar y Continuar'}<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// --- Paso 4: Módulos ---

const DEF_MODULOS: { id: AppModuleId; label: string; description: string; icon: any; color: string }[] = [
  { id: 'novedades',     label: 'Novedades',      description: 'Registra reportes del turno activo',              icon: Newspaper,    color: 'text-blue-600 bg-blue-500/10' },
  { id: 'orden-del-dia', label: 'Orden del Día',  description: 'Distribuye personal y planifica actividades',       icon: ClipboardList, color: 'text-emerald-600 bg-emerald-500/10' },
  { id: 'reporte-final', label: 'Reporte Final',  description: 'Genera y archiva el cierre de guardia',            icon: History,       color: 'text-violet-600 bg-violet-500/10' },
  { id: 'personal',      label: 'Personal',       description: 'Gestiona efectivos y asignación de guardias',      icon: Users,         color: 'text-amber-600 bg-amber-500/10' },
  { id: 'estadisticas',  label: 'Estadísticas',   description: 'Panel de métricas e indicadores históricos',      icon: BarChart2,     color: 'text-rose-600 bg-rose-500/10' },
  { id: 'plantillas',    label: 'Plantillas',     description: 'Crea y gestiona plantillas de novedades',          icon: FileText,      color: 'text-slate-600 bg-slate-500/10' },
];

const PRESET_ESCRITORIO: AppModuleId[] = []; 
const PRESET_MOVIL: AppModuleId[]  = ['estadisticas', 'plantillas'];

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

  const estaHabilitado = (id: AppModuleId) => !modulosDeshabilitados.includes(id);
  const toggle = (id: AppModuleId) => {
    setModulosDeshabilitados((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const aplicarPreset = (preset: AppModuleId[]) => setModulosDeshabilitados(preset);

  const manejarContinuar = () => {
    alGuardar(modulosDeshabilitados);
    alSiguiente();
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

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => aplicarPreset(PRESET_ESCRITORIO)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
            modulosDeshabilitados.length === PRESET_ESCRITORIO.length && modulosDeshabilitados.every(m => PRESET_ESCRITORIO.includes(m))
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
          onClick={() => aplicarPreset(PRESET_MOVIL)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
            JSON.stringify([...modulosDeshabilitados].sort()) === JSON.stringify([...PRESET_MOVIL].sort())
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

      <div className="rounded-xl border divide-y overflow-hidden">
        {DEF_MODULOS.map(({ id, label, description, icon: Icon, color }) => (
          <div
            key={id}
            className={cn(
              'flex items-center justify-between px-4 py-3 transition-colors',
              estaHabilitado(id) ? 'bg-background hover:bg-muted/20' : 'bg-muted/30 opacity-60'
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
              checked={estaHabilitado(id)}
              onCheckedChange={() => toggle(id)}
              disabled={id === 'novedades'}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={alAtras} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={manejarContinuar}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// --- Paso 5: Estructura ---

const PRESETS_ESTRUCTURA = [
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

export function PasoEstructura({ 
  alSiguiente, 
  alAtras,
  roles,
  setRoles,
  departamentos,
  setDepartamentos
}: { 
  alSiguiente: () => void; 
  alAtras: () => void;
  roles: StaffRole[];
  setRoles: (r: StaffRole[]) => void;
  departamentos: Department[];
  setDepartamentos: (d: Department[]) => void;
}) {
  const [nombreMonitoreo, setNombreMonitoreo] = useState('CEMUPRAD');
  const [presetSeleccionado, setPresetSeleccionado] = useState<'comun' | 'extendido' | null>(null);

  const aplicarPreset = (presetId: 'comun' | 'extendido') => {
    setPresetSeleccionado(presetId);
    const p = PRESETS_ESTRUCTURA.find(x => x.id === presetId);
    if (!p) return;

    const nombreActualMonitoreo = nombreMonitoreo.trim() || 'Sala de Monitoreo';

    const nuevosDeptos = p.departments.map((d: any) => ({
      id: d.id || generateId('dept'),
      name: (typeof d === 'string' ? d : d.name).replace('{MONITORING_ROOM}', nombreActualMonitoreo),
      staff: d.staff || {}
    }));

    const nuevosRoles = p.roles.map((r: any, index: number) => ({
      ...r,
      name: r.name.replace('{MONITORING_ROOM}', nombreActualMonitoreo),
      order: index
    }));

    setDepartamentos(nuevosDeptos);
    setRoles(nuevosRoles);
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

      <div className="grid grid-cols-2 gap-3">
        {PRESETS_ESTRUCTURA.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => aplicarPreset(p.id as any)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left",
              presetSeleccionado === p.id 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
            )}
          >
            <p.icon className={cn("h-6 w-6", presetSeleccionado === p.id ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-semibold text-[13px] leading-tight">{p.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">{p.description}</p>
            </div>
          </button>
        ))}
      </div>

      {presetSeleccionado === 'extendido' && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 space-y-3 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <Label className="text-xs font-bold uppercase tracking-wider text-primary">Nombre de la Sala de Monitoreo</Label>
          </div>
          <div className="flex gap-2">
            <Input 
              value={nombreMonitoreo}
              onChange={e => setNombreMonitoreo(e.target.value)}
              placeholder="Ej: CEMUPRAD, Sala Situacional..."
              className="h-9 bg-background border-primary/20 focus-visible:ring-primary"
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight">
            Se usará el nombre <span className="text-primary font-medium">{nombreMonitoreo}</span> para el departamento y cargos correspondientes.
          </p>
        </div>
      )}

      <div className="bg-background/50 border rounded-xl overflow-hidden min-h-[300px]">
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

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={alAtras} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={alSiguiente}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// --- Paso 6: Jerarquía ---

export function PasoJerarquia({ 
  alSiguiente, 
  alAtras,
  roles,
  setRoles,
  departamentos,
  setDepartamentos
}: { 
  alSiguiente: () => void; 
  alAtras: () => void;
  roles: StaffRole[];
  setRoles: (r: StaffRole[]) => void;
  departamentos: Department[];
  setDepartamentos: (d: Department[]) => void;
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
          departments={departamentos}
          onRolesChange={setRoles}
          onDepartmentsChange={setDepartamentos}
          onSave={() => {}}
          rolesLoaded={true}
          deptsLoaded={true}
          initialTab="roles"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={alAtras} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />Atrás
        </Button>
        <Button className="flex-1" onClick={alSiguiente}>
          Continuar<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// --- Paso 7: Plantillas ---

export function PasoPlantillas({ alSiguiente, alAtras, alOmitir }: { alSiguiente: () => void; alAtras: () => void; alOmitir: () => void }) {
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
        <button type="button" onClick={alSiguiente}
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
        <button type="button" onClick={alOmitir}
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
      <Button variant="ghost" onClick={alAtras} className="self-start -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" />Atrás
      </Button>
    </div>
  );
}

// --- Paso 8: ¿Primera vez? ---

export function PasoPrimeraVez({
  alPrimero,
  alRegresar,
  alAtras,
}: {
  alPrimero: () => void;
  alRegresar: () => void;
  alAtras: () => void;
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
        <button type="button" onClick={alPrimero}
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
        <button type="button" onClick={alRegresar}
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
      <Button variant="ghost" onClick={alAtras} className="self-start -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" />Atrás
      </Button>
    </div>
  );
}

// --- Paso 9: Guía de Flujo ---

const DATOS_PASOS_FLUJO = [
  { icon: Users,        color: 'bg-blue-500/10 text-blue-600',   title: '1. Lista de Personal',   desc: 'Registra el equipo que trabaja en tu área. Ve a Personal y añade a cada miembro con su cargo y jerarquía.' },
  { icon: Shield,       color: 'bg-violet-500/10 text-violet-600', title: '2. Configurar Guardias', desc: 'Define los grupos de guardia (Guardia A, B, etc.) y asigna el personal a cada turno.' },
  { icon: ClipboardList,color: 'bg-amber-500/10 text-amber-600',  title: '3. Orden del Día',       desc: 'Antes de empezar el turno, completa la Orden del Día: relevo, actividades y observaciones.' },
  { icon: PlayCircle,   color: 'bg-green-500/10 text-green-600',  title: '4. Abrir la Guardia',    desc: 'Con la Orden del Día completa, abre la guardia. Desde ese momento podrás registrar novedades y generar reportes.' },
];

export function PasoGuia({ alSiguiente }: { alSiguiente: () => void }) {
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
        {DATOS_PASOS_FLUJO.map(({ icon: Icon, color, title, desc }) => (
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

      <Button className="w-full h-11" onClick={alSiguiente}>
        Continuar<ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// --- Paso 10: Feedback ---

export function PasoFeedback({ alFinalizar }: { alFinalizar: () => void }) {
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
        ].map((texto, i) => (
          <div key={i} className="flex items-center gap-3 text-muted-foreground">
            <Heart className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>{texto}</span>
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full text-base h-12 shadow-md" onClick={alFinalizar}>
        ¡Entendido, empezar!
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}

// --- Paso 11: Finalizado ---

export function PasoDone({ nombreWorkspace }: { nombreWorkspace: string }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="h-24 w-24 rounded-3xl bg-green-500/10 flex items-center justify-center shadow-lg ring-1 ring-green-500/20">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">¡Listo!</h2>
        <p className="text-muted-foreground leading-relaxed">
          El área de trabajo{' '}
          <strong className="text-foreground">"{nombreWorkspace}"</strong> está configurada. Ya puedes comenzar.
        </p>
      </div>
    </div>
  );
}
