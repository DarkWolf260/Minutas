import { useState, useMemo, useCallback } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Staff, StaffMember, StaffRole } from '@/lib/types';

export function useOrdenDelDiaPersonnel(personnel: StaffMember[], roles: StaffRole[]) {
  const [personalAsignado, setPersonalAsignado] = useState<Staff>({});
  const [idActivoDnd, setIdActivoDnd] = useState<string | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const miembroActivoDnd = useMemo(() => {
    if (!idActivoDnd) return null;
    return personnel.find((p) => p.id === idActivoDnd);
  }, [idActivoDnd, personnel]);

  const manejarUpdatePersonalRol = useCallback((nombreRol: string, miembros: StaffMember[]) => {
    setPersonalAsignado((prev) => ({
      ...prev,
      [nombreRol]: miembros,
    }));
  }, []);

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
      const rolDestino = roles.find((r) => r.name === contenedorSobre);

      setPersonalAsignado((prev) => {
        const nuevoPersonal = { ...prev };
        nuevoPersonal[contenedorActivo!] = (prev[contenedorActivo!] || []).filter((m) => m.id !== idActivo);

        if (rolDestino?.is_single) {
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

  return {
    personalAsignado,
    setPersonalAsignado,
    idActivoDnd,
    miembroActivoDnd,
    sensores,
    manejarUpdatePersonalRol,
    manejarDragStart,
    manejarDragEnd
  };
}

