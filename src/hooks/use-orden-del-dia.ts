import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCenter
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { formatStaffMember } from '@/lib/formatters';
import type { Staff, StaffMember, StaffRole, ManualNovedad } from '@/lib/types';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useSettings } from '@/hooks/use-settings';
import { useGuards } from '@/hooks/use-guards';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

export interface Nota {
  id: string;
  content: string;
}

export const NOTAS_POR_DEFECTO: Nota[] = [
  { id: 'note-1', content: 'ESTA ORDEN DE OPERACIONES DEBE SER CUMPLIDA A CABALIDAD, EL INCUMPLIMIENTO DE LAS MISMAS ACARREARÁ COMO CONSECUENCIA SANCIONES ADMINISTRATIVAS.' },
  { id: 'note-2', content: 'LA ORDEN DE OPERACIONES DEBE SER REALIZADA Y DIFUNDIDA TODOS LOS DÍAS POR EL JEFE DE LOS SERVICIOS DE GUARDIA.' },
  { id: 'note-3', content: 'EL ASEO DE LAS UNIDADES E INSTALACIONES (OFICINAS, CUADRA, BAÑOS Y COCINA) DEBE SER REALIZADA DIARIAMENTE.' },
];

export function useOrdenDelDia(selectedGuard: string, periodo: string, initialData?: Staff, isGuardOpen = false) {
  const { personnel } = usePersonnel();
  const { roles } = useRoles();
  const { guards, isLoaded: guardiasCargadas } = useGuards();
  const { settings, saveSettings } = useSettings();
  const { definitions: definiciones, isLoaded: definicionesCargadas } = useFieldDefinitions();

  const [personalAsignado, setPersonalAsignado] = useState<Staff>({});
  const [esJefeEncargado, setEsJefeEncargado] = useState(false);
  const [actividades, setActividades] = useState<ManualNovedad[]>([]);
  const [notas, setNotas] = useState<Nota[]>(NOTAS_POR_DEFECTO);

  const [idActividadEditando, setIdActividadEditando] = useState<string | null>(null);
  const [esDialogOpenResultado, setEsDialogOpenResultado] = useState(false);
  const [ordenGenerada, setOrdenGenerada] = useState('');
  const [textoBotonCopiar, setTextoBotonCopiar] = useState('Copiar');
  const [estaInicializado, setEstaInicializado] = useState(false);

  const ultimaGuardiaInicializada = useRef<string | null>(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [idActivoDnd, setIdActivoDnd] = useState<string | null>(null);

  const miembroActivoDnd = useMemo(() => {
    if (!idActivoDnd) return null;
    return personnel.find((p: StaffMember) => p.id === idActivoDnd);
  }, [idActivoDnd, personnel]);

  // Inicialización y Carga de Borradores
  useEffect(() => {
    if (!selectedGuard || !guardiasCargadas || !definicionesCargadas) return;

    const esNuevaGuardia = ultimaGuardiaInicializada.current !== selectedGuard;
    const personalEstaVacio = Object.keys(personalAsignado).length === 0;

    if (isGuardOpen) {
      if (esNuevaGuardia || personalEstaVacio) {
        if (settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === selectedGuard) {
          const borrador = settings.ordenDelDiaDraft;
          setPersonalAsignado(borrador.staff || {});

          const actividadesBorrador = borrador.activities || [];
          const actividadesMigradas = actividadesBorrador.map((a: any) => {
            if (a.text !== undefined) return a;
            const timeMatch = a.content ? a.content.match(/(\d{2}:\d{2})/) : null;
            const time = (timeMatch ? timeMatch[1] : '08:00') + ' HLV';
            const text = a.content ? a.content.replace(/^\*?(\d{2}:\d{2})(?:\s+HLV)?\*?\s*/, '').trim() : '';
            return { id: a.id, date: parseFechasDesdePeriodo(periodo).start, time, text } as ManualNovedad;
          });

          setActividades(actividadesMigradas);
          setNotas(borrador.notes || NOTAS_POR_DEFECTO);
          setEsJefeEncargado(!!borrador.esJefeEncargado);
          ultimaGuardiaInicializada.current = selectedGuard;
          setEstaInicializado(true);
          return;
        }
      }
    }

    if (esNuevaGuardia || !isGuardOpen) {
      const guardiaCoincidente = guards.find(g =>
        g.id.trim().toUpperCase() === selectedGuard.trim().toUpperCase()
      );
      const nuevoEstadoPersonal: Staff = {};

      roles.forEach((rol: StaffRole) => {
        let miembrosAsignados: StaffMember[] = [];

        if (guardiaCoincidente && guardiaCoincidente.staff) {
          const staffKey = Object.keys(guardiaCoincidente.staff).find(k => k.toLowerCase() === rol.name.toLowerCase());
          if (staffKey) {
            miembrosAsignados = (guardiaCoincidente.staff as any)[staffKey] || [];
          }
        }

        if (miembrosAsignados.length === 0 && initialData) {
          const initialKey = Object.keys(initialData).find(k => k.toLowerCase() === rol.name.toLowerCase());
          if (initialKey) {
            miembrosAsignados = (initialData as any)[initialKey] || [];
          }
        }

        miembrosAsignados = miembrosAsignados.map((miembro: StaffMember) => {
          const datosRecientes = personnel.find((p: StaffMember) => p.id === miembro.id);
          return datosRecientes || miembro;
        });

        nuevoEstadoPersonal[rol.name] = miembrosAsignados;
      });

      setPersonalAsignado(nuevoEstadoPersonal);
      setEsJefeEncargado(false);
      const { start, end } = parseFechasDesdePeriodo(periodo);
      const estado = buscarCampoInsensible(definiciones, 'Estado');
      setActividades(generarActividadesPorDefecto(start, end, estado));
      setNotas(NOTAS_POR_DEFECTO);
      ultimaGuardiaInicializada.current = selectedGuard;
      setEstaInicializado(true);
    }
  }, [selectedGuard, isGuardOpen, settings.ordenDelDiaDraft, roles, initialData, personnel, periodo, guards, guardiasCargadas, definiciones, definicionesCargadas]);

  useEffect(() => {
    if (selectedGuard !== ultimaGuardiaInicializada.current) {
      setEstaInicializado(false);
    }
  }, [selectedGuard]);

  // Auto-guardado
  useEffect(() => {
    if (!selectedGuard || !estaInicializado || !isGuardOpen) return;

    const timer = setTimeout(() => {
      const ahoraIso = new Date().toISOString();
      saveSettings({
        ordenDelDiaDraft: {
          guardId: selectedGuard,
          staff: personalAsignado,
          esJefeEncargado,
          activities: actividades,
          notes: notas,
          updatedAt: ahoraIso,
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [personalAsignado, esJefeEncargado, actividades, notas, selectedGuard, saveSettings, estaInicializado, isGuardOpen]);

  const manejarUpdatePersonalRol = useCallback((nombreRol: string, miembros: StaffMember[]) => {
    setPersonalAsignado((prev) => ({
      ...prev,
      [nombreRol]: miembros,
    }));
  }, []);

  const manejarAñadirActividad = useCallback((actividad: Omit<ManualNovedad, 'id'>) => {
    setActividades((prev) => [
      ...prev,
      { ...actividad, id: generateId('activity') },
    ]);
  }, []);

  const manejarGuardarEdicionActividad = useCallback((actualizada: ManualNovedad) => {
    setActividades((prev) =>
      prev.map((act) => (act.id === actualizada.id ? actualizada : act))
    );
    setIdActividadEditando(null);
  }, []);

  const manejarEliminarActividad = useCallback((id: string) => {
    setActividades((prev) => prev.filter((act) => act.id !== id));
    if (idActividadEditando === id) setIdActividadEditando(null);
  }, [idActividadEditando]);

  const manejarEditarActividad = useCallback((actividad: ManualNovedad) => {
    setIdActividadEditando(actividad.id);
  }, []);

  const manejarCancelarEdicionActividad = useCallback(() => {
    setIdActividadEditando(null);
  }, []);

  const manejarUpdateNota = useCallback((id: string, content: string) => {
    setNotas((prev) =>
      prev.map((nota) => (nota.id === id ? { ...nota, content } : nota))
    );
  }, []);

  const manejarEliminarNota = useCallback((id: string) => {
    setNotas((prev) => prev.filter((nota) => nota.id !== id));
  }, []);

  const manejarAñadirNota = useCallback(() => {
    setNotas((prev) => [
      ...prev,
      { id: generateId('note'), content: '' },
    ]);
  }, []);

  const manejarRestaurarActividades = () => {
    const { start, end } = parseFechasDesdePeriodo(periodo);
    const estado = buscarCampoInsensible(definiciones, 'Estado');
    setActividades(generarActividadesPorDefecto(start, end, estado));
    toast.success('Actividades restauradas con las fechas del periodo');
  };

  const manejarRestaurarNotas = () => {
    setNotas(NOTAS_POR_DEFECTO);
    toast.success('Notas restauradas por defecto');
  };

  const actividadesOrdenadas = useMemo(() => {
    return [...actividades].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [actividades]);

  const manejarDragStart = (event: DragStartEvent) => {
    setIdActivoDnd(event.active.id as string);
  };

  const manejarDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIdActivoDnd(null);
    if (!over) return;

    const idActivo = active.id as string;
    const idSobre = over.id as string;

    let contenedorActivo: string | null = null;
    for (const [nombreRol, miembros] of Object.entries(personalAsignado)) {
      if (miembros.some((m) => m.id === idActivo)) {
        contenedorActivo = nombreRol;
        break;
      }
    }

    let contenedorSobre: string | null = null;
    if (personalAsignado[idSobre]) {
      contenedorSobre = idSobre;
    } else {
      for (const [nombreRol, miembros] of Object.entries(personalAsignado)) {
        if (miembros.some((m) => m.id === idSobre)) {
          contenedorSobre = nombreRol;
          break;
        }
      }
    }

    if (!contenedorActivo || !contenedorSobre) return;

    if (contenedorActivo === contenedorSobre) {
      const miembrosContenedor = personalAsignado[contenedorActivo];
      if (!miembrosContenedor) return;

      const oldIndex = miembrosContenedor.findIndex((m) => m.id === idActivo);
      const newIndex = miembrosContenedor.findIndex((m) => m.id === idSobre);
      if (oldIndex !== -1 && newIndex !== -1) {
        manejarUpdatePersonalRol(contenedorActivo, arrayMove(miembrosContenedor, oldIndex, newIndex));
      }
    } else {
      const miembrosOrigen = personalAsignado[contenedorActivo];
      if (!miembrosOrigen) return;
      const indiceActivo = miembrosOrigen.findIndex((m) => m.id === idActivo);
      const itemActivo = miembrosOrigen[indiceActivo];
      if (!itemActivo) return;

      const miembrosDestino = personalAsignado[contenedorSobre] || [];
      const indiceSobre = miembrosDestino.findIndex((m) => m.id === idSobre);
      const rolDestino = roles.find((r: StaffRole) => r.name === contenedorSobre);

      setPersonalAsignado((prev) => {
        const nuevoPersonal = { ...prev };
        nuevoPersonal[contenedorActivo!] = (prev[contenedorActivo!] || []).filter((m) => m.id !== idActivo);

        if (rolDestino?.isSingle) {
          nuevoPersonal[contenedorSobre!] = [itemActivo];
        } else {
          const miembrosDestinoActualizados = [...(prev[contenedorSobre!] || [])];
          if (indiceSobre === -1) {
            miembrosDestinoActualizados.push(itemActivo);
          } else {
            miembrosDestinoActualizados.splice(indiceSobre, 0, itemActivo);
          }
          nuevoPersonal[contenedorSobre!] = miembrosDestinoActualizados;
        }
        return nuevoPersonal;
      });
    }
  };

  const manejarGenerarOrden = () => {
    const jefeDeOperaciones = (() => {
      const key = Object.keys(personalAsignado).find((k) => k.toLowerCase() === 'jefe de operaciones');
      if (key) {
        const lista = personalAsignado[key];
        if (lista && lista.length > 0) {
          const primero = lista[0];
          if (primero) return formatStaffMember(primero).trim();
        }
      }
      return '';
    })();

    const director = (() => {
      const key = Object.keys(personalAsignado).find((k) => k.toLowerCase() === 'director');
      if (key) {
        const lista = personalAsignado[key];
        if (lista && lista.length > 0) {
          const primero = lista[0];
          if (primero) return formatStaffMember(primero).trim();
        }
      }
      return '';
    })();

    const municipio = buscarCampoInsensible(definiciones, 'Municipio');
    const estado = buscarCampoInsensible(definiciones, 'Estado');

    const partesReporte = [
      `*ORDEN DEL DÍA DEL INSTITUTO AUTONOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES DEL MUNICIPIO ${(municipio || '').toUpperCase()} ESTADO ${(estado || '').toUpperCase()}*`,
      ``,
    ];

    if (director) partesReporte.push(`*DIRECTOR*`, director, ``);
    if (jefeDeOperaciones) partesReporte.push(`*JEFE DE OPERACIONES*`, jefeDeOperaciones, ``);

    partesReporte.push(
      `*GRUPO DE GUARDIA:* “${selectedGuard}”`,
      ``,
      `*PERIODO:* ${periodo}`
    );

    const rolesOrdenadosParaReporte = [...roles]
      .sort((a, b) => (a.hierarchyOrder ?? a.order ?? 0) - (b.hierarchyOrder ?? b.order ?? 0));

    rolesOrdenadosParaReporte.forEach((rol) => {
      const nombreRolBajo = rol.name.toLowerCase();
      if (nombreRolBajo === 'director' || nombreRolBajo === 'jefe de operaciones') return;

      const listaPersonal = personalAsignado[rol.name];
      if (listaPersonal && listaPersonal.length > 0 && listaPersonal.some((p: StaffMember) => p.name.trim() !== '')) {
        const esJefeServicios = nombreRolBajo === 'jefe de los servicios';
        const rolAMostrar = esJefeServicios && esJefeEncargado ? `${rol.name.toUpperCase()} (E)` : rol.name.toUpperCase();
        partesReporte.push(``, `*${rolAMostrar}*`, listaPersonal.map(m => formatStaffMember(m, false, true)).join('\n'));
      }
    });

    const orden = partesReporte.join('\n').trim();
    const partesSecundarias: string[] = [];

    if (actividadesOrdenadas.length > 0) {
      partesSecundarias.push(``, `*ACTIVIDADES DEL DÍA*`);
      actividadesOrdenadas.forEach(act => {
        if (act.text.trim()) partesSecundarias.push(``, `- *${act.time}* ${act.text.trim()}`);
      });
    }

    if (notas.length > 0) {
      partesSecundarias.push(``, `*NOTA:*`);
      notas.forEach(nota => {
        if (nota.content.trim()) partesSecundarias.push(``, `*${nota.content.trim()}*`);
      });
    }

    const textoPie = municipio ? `*PROTECCIÓN CIVIL ${municipio.toUpperCase()}*` : '*PROTECCIÓN CIVIL*';
    const reporteFinal = [orden, ...partesSecundarias, '', textoPie].join('\n').trim();
    setOrdenGenerada(reporteFinal);
    setEsDialogOpenResultado(true);
    setTextoBotonCopiar('Copiar');
  };

  const manejarCopiadoAlPortapapeles = () => {
    navigator.clipboard.writeText(ordenGenerada);
    setTextoBotonCopiar('¡Copiado!');
    toast.success('Copiado al portapapeles');
    setTimeout(() => setTextoBotonCopiar('Copiar'), 2000);
  };

  return {
    // Estado
    personalAsignado,
    esJefeEncargado,
    setEsJefeEncargado,
    actividades: actividadesOrdenadas,
    notas,
    idActividadEditando,
    esDialogOpenResultado,
    setEsDialogOpenResultado,
    ordenGenerada,
    textoBotonCopiar,
    estaInicializado,
    idActivoDnd,
    miembroActivoDnd,
    roles,
    sensores,

    // Acciones
    manejarUpdatePersonalRol,
    manejarAñadirActividad,
    manejarGuardarEdicionActividad,
    manejarEliminarActividad,
    manejarEditarActividad,
    manejarCancelarEdicionActividad,
    manejarUpdateNota,
    manejarEliminarNota,
    manejarAñadirNota,
    manejarRestaurarActividades,
    manejarRestaurarNotas,
    manejarDragStart,
    manejarDragEnd,
    manejarGenerarOrden,
    manejarCopiadoAlPortapapeles,
    collisionDetection: closestCenter
  };
}

// Utilidades internas
function buscarCampoInsensible(definiciones: Record<string, any>, clave: string): string {
  if (!definiciones) return '';
  const claveBaja = clave.toLowerCase();
  const claveEncontrada = Object.keys(definiciones).find((k) => k.toLowerCase() === claveBaja);
  if (!claveEncontrada) return '';
  return definiciones[claveEncontrada]?.value || '';
}

function parseFechasDesdePeriodo(periodo: string) {
  const coincidencias = periodo.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
  if (!coincidencias || coincidencias.length < 2) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    return { start: hoy.toISOString(), end: mañana.toISOString() };
  }
  const parsear = (s: string) => {
    const [d, m, y] = s.split('/').map(Number);
    const fecha = new Date(y!, m! - 1, d!);
    fecha.setHours(0, 0, 0, 0);
    return fecha.toISOString();
  };
  return { start: parsear(coincidencias[0]!), end: parsear(coincidencias[1]!) };
}

function generarActividadesPorDefecto(startDate: string, endDate: string, nombreEstado?: string): ManualNovedad[] {
  const estado = nombreEstado || 'Anzoátegui';
  return [
    { id: 'def-1', date: startDate, time: '08:00 HLV', text: 'Se realiza cambio y recepción de Guardia' },
    { id: 'def-3', date: startDate, time: '08:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-4', date: startDate, time: '12:00 HLV - 13:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
    { id: 'def-5', date: startDate, time: '14:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-6', date: startDate, time: '16:00 HLV', text: `Se envía segundo corte de novedades diarias a la central de Protección Civil ${estado}.` },
    { id: 'def-7', date: startDate, time: '17:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-8', date: startDate, time: '18:00 HLV - 19:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
    { id: 'def-9', date: startDate, time: '20:00 HLV', text: 'Se realiza mantenimiento limpieza de las unidades e instalaciones de la sede.' },
    { id: 'def-10', date: startDate, time: '20:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-11', date: startDate, time: '21:00 HLV', text: 'Se inicia el periodo de descanso del personal.' },
    { id: 'def-12', date: endDate, time: '03:00 HLV', text: `Se envía primer corte de novedades diarias a la central de Protección Civil ${estado}.` },
    { id: 'def-13', date: endDate, time: '04:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
    { id: 'def-14', date: endDate, time: '06:00 HLV - 07:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
    { id: 'def-15', date: endDate, time: '06:00 HLV', text: 'Culmina el periodo de descanso del personal.' },
    { id: 'def-17', date: endDate, time: '08:00 HLV', text: 'Se envía reporte final de novedades correspondiente a la guardia de 24 Horas del día a la dirección estadal y ZOEDAN / Se da culminación a la guardia de 24 Horas.' },
  ];
}
