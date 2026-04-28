'use client';

import { useState, useEffect, useRef } from 'react';
import { closestCenter } from '@dnd-kit/core';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useSettings } from '@/hooks/use-settings';
import { useGuards } from '@/hooks/use-guards';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import type { Staff, StaffMember, StaffRole } from '@/lib/types';

// Sub-hooks
import { useOrdenDelDiaActivities } from './orden-del-dia/use-orden-del-dia-activities';
import { useOrdenDelDiaNotes, NOTAS_POR_DEFECTO } from './orden-del-dia/use-orden-del-dia-notes';
import { useOrdenDelDiaPersonnel } from './orden-del-dia/use-orden-del-dia-personnel';
import { useOrdenDelDiaGenerator } from './orden-del-dia/use-orden-del-dia-generator';

export function useOrdenDelDia(selectedGuard: string, periodo: string, initialData?: Staff, isGuardOpen = false) {
  const { personnel } = usePersonnel();
  const { roles } = useRoles();
  const { guards, isLoaded: guardiasCargadas } = useGuards();
  const { settings, saveSettings } = useSettings();
  const { definitions: definiciones, isLoaded: definicionesCargadas } = useFieldDefinitions();

  const [esJefeEncargado, setEsJefeEncargado] = useState(false);
  const [estaInicializado, setEstaInicializado] = useState(false);
  const ultimaGuardiaInicializada = useRef<string | null>(null);

  // 1. Specialized Hooks
  const activities = useOrdenDelDiaActivities(periodo, definiciones);
  const notes = useOrdenDelDiaNotes();
  const personnelAssign = useOrdenDelDiaPersonnel(personnel, roles);
  
  const generator = useOrdenDelDiaGenerator({
    personalAsignado: personnelAssign.personalAsignado,
    esJefeEncargado,
    actividadesOrdenadas: activities.actividadesOrdenadas,
    notas: notes.notas,
    selectedGuard,
    periodo,
    roles,
    definiciones,
    buscarCampoInsensible: activities.buscarCampoInsensible
  });

  // Initialization and Draft Loading
  useEffect(() => {
    if (!selectedGuard || !guardiasCargadas || !definicionesCargadas) return;

    const esNuevaGuardia = ultimaGuardiaInicializada.current !== selectedGuard;
    const personalEstaVacio = Object.keys(personnelAssign.personalAsignado).length === 0;

    if (isGuardOpen) {
      if (esNuevaGuardia || personalEstaVacio) {
        if (settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === selectedGuard) {
          const borrador = settings.ordenDelDiaDraft;
          personnelAssign.setPersonalAsignado(borrador.staff || {});

          const actividadesBorrador = borrador.activities || [];
          const actividadesMigradas = actividadesBorrador.map((a: any) => {
            if (a.text !== undefined) return a;
            const timeMatch = a.content ? a.content.match(/(\d{2}:\d{2})/) : null;
            const time = (timeMatch ? timeMatch[1] : '08:00') + ' HLV';
            const text = a.content ? a.content.replace(/^\*?(\d{2}:\d{2})(?:\s+HLV)?\*?\s*/, '').trim() : '';
            return { id: a.id, date: activities.parseFechasDesdePeriodo(periodo).start, time, text };
          });

          activities.setActividades(actividadesMigradas);
          notes.setNotas(borrador.notes || NOTAS_POR_DEFECTO);
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

      personnelAssign.setPersonalAsignado(nuevoEstadoPersonal);
      setEsJefeEncargado(false);
      const { start, end } = activities.parseFechasDesdePeriodo(periodo);
      const estado = activities.buscarCampoInsensible(definiciones, 'Estado');
      activities.setActividades(activities.generarActividadesPorDefecto(start, end, estado));
      notes.setNotas(NOTAS_POR_DEFECTO);
      ultimaGuardiaInicializada.current = selectedGuard;
      setEstaInicializado(true);
    }
  }, [selectedGuard, isGuardOpen, settings.ordenDelDiaDraft, roles, initialData, personnel, periodo, guards, guardiasCargadas, definiciones, definicionesCargadas]);

  useEffect(() => {
    if (selectedGuard !== ultimaGuardiaInicializada.current) {
      setEstaInicializado(false);
    }
  }, [selectedGuard]);

  // Auto-save
  useEffect(() => {
    if (!selectedGuard || !estaInicializado || !isGuardOpen) return;

    const timer = setTimeout(() => {
      const ahoraIso = new Date().toISOString();
      saveSettings({
        ordenDelDiaDraft: {
          guardId: selectedGuard,
          staff: personnelAssign.personalAsignado,
          esJefeEncargado,
          activities: activities.actividades,
          notes: notes.notas,
          updatedAt: ahoraIso,
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [personnelAssign.personalAsignado, esJefeEncargado, activities.actividades, notes.notas, selectedGuard, saveSettings, estaInicializado, isGuardOpen]);

  return {
    ...activities,
    ...notes,
    ...personnelAssign,
    ...generator,
    
    esJefeEncargado,
    setEsJefeEncargado,
    estaInicializado,
    roles,
    collisionDetection: closestCenter
  };
}
