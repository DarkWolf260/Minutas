// Shared data used across about sub-pages

import {
  Users,
  Shield,
  ClipboardCheck,
  PlayCircle,
  Sparkles,
  Bug,
  Zap,
} from 'lucide-react';

// ─── Workflow guide ───────────────────────────────────────────────────────────

export const WORKFLOW_STEPS = [
  {
    icon: Users,
    color: 'bg-blue-500/10 text-blue-600',
    title: '1. Lista de Personal',
    desc: 'Registra el equipo que trabaja en tu área. Ve a Personal y añade a cada miembro con su cargo y jerarquía.',
    link: '/personal',
    linkLabel: 'Ir a Personal',
  },
  {
    icon: Shield,
    color: 'bg-violet-500/10 text-violet-600',
    title: '2. Configurar Guardias',
    desc: 'Define los grupos de guardia (Guardia A, B, etc.) y asigna el personal a cada turno en la misma sección de Personal.',
    link: '/personal',
    linkLabel: 'Configurar Guardias',
  },
  {
    icon: ClipboardCheck,
    color: 'bg-amber-500/10 text-amber-600',
    title: '3. Orden del Día',
    desc: 'Antes de empezar el turno, completa la Orden del Día: relevo de guardia, actividades y observaciones.',
    link: '/orden-del-dia',
    linkLabel: 'Ir a Orden del Día',
  },
  {
    icon: PlayCircle,
    color: 'bg-green-500/10 text-green-600',
    title: '4. Abrir la Guardia',
    desc: 'Con la Orden del Día completa, abre la guardia. Desde ese momento podrás registrar novedades y generar reportes.',
    link: '/orden-del-dia',
    linkLabel: 'Abrir Guardia',
  },
];

// ─── Changelog ────────────────────────────────────────────────────────────────

export type ChangeType = 'nueva' | 'mejora' | 'corrección';

export interface ChangeEntry {
  type: ChangeType;
  text: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangeEntry[];
}

export const APP_VERSION = '1.1.0';

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '23/04/2026',
    changes: [
      { type: 'nueva', text: 'Página dedicada de Módulos en Ajustes: activa o desactiva secciones de la app desde /settings/modules.' },
      { type: 'nueva', text: 'Nuevo tipo de campo {Campo:cedula} en plantillas: renderiza el input de cédula venezolana con formato automático.' },
      { type: 'nueva', text: 'Scroll con estilo Radix en el dropdown del multi-input.' },
      { type: 'nueva', text: 'Scroll en la tarjeta "Otros ajustes" de Configuración.' },
      { type: 'mejora', text: 'Búsqueda insensible a mayúsculas y acentos en campos de personal, direcciones y autocompletado de reportes (García = Garcia, José = Jose).' },
      { type: 'mejora', text: 'Los módulos desactivados excluyen su personal de los reportes: si Orden del Día está desactivada, se usa el personal de la guardia directamente.' },
      { type: 'corrección', text: 'Campos del sistema (Enc, Pie, Usuario, Estatus) ya no aparecen como inputs en el formulario, sin importar dónde estén en la plantilla.' },
      { type: 'corrección', text: 'Presionar Enter en campos de personal (Director, Jefe de los servicios) ya no borra el valor seleccionado.' },
    ],
  },
  {
    version: '1.0.1',
    date: '22/04/2026',
    changes: [
      { type: 'nueva', text: 'Flujo de configuración inicial en pantalla completa (onboarding de 7 pasos).' },
      { type: 'nueva', text: 'Selector de tema (Claro / Sistema / Oscuro) en el onboarding.' },
      { type: 'nueva', text: 'Guía de primeros pasos integrada en el onboarding y en Acerca de.' },
      { type: 'nueva', text: 'Historial de cambios (esta sección).' },
      { type: 'nueva', text: 'Continuación del onboarding al reabrir la app si se cerró a mitad.' },
      { type: 'mejora', text: 'El reporte de cierre ahora incluye todos los reportes de la guardia, sin filtro de horario.' },
      { type: 'mejora', text: 'Director y Jefe de Operaciones toman sus valores exclusivamente de la Orden del Día.' },
      { type: 'corrección', text: 'Dropdowns de Ajustes Generales en el onboarding ya visibles (z-index corregido).' },
      { type: 'corrección', text: 'Errores CONFLICT de RxDB al iniciar con un workspace ya existente.' },
    ],
  },
  {
    version: '1.0.0',
    date: '07/04/2026',
    changes: [
      { type: 'nueva', text: 'Lanzamiento inicial de Minutas.' },
      { type: 'nueva', text: 'Módulos: Novedades, Orden del Día, Personal, Plantillas, Reporte Final, Estadísticas.' },
      { type: 'nueva', text: 'Sistema de plantillas personalizables con campos condicionales.' },
      { type: 'nueva', text: 'Sincronización entre dispositivos vía Supabase Realtime.' },
      { type: 'nueva', text: 'Soporte offline como PWA instalable.' },
      { type: 'nueva', text: 'Múltiples áreas de trabajo (multi-workspace).' },
      { type: 'nueva', text: 'Historial de reportes de guardia archivados.' },
    ],
  },
];

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; icon: typeof Sparkles; className: string }> = {
  nueva:      { label: 'Nueva',      icon: Sparkles, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  mejora:     { label: 'Mejora',     icon: Zap,      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  corrección: { label: 'Corrección', icon: Bug,      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};
