'use client';

import { useState, useEffect, useRef } from 'react';
import { closestCenter } from '@dnd-kit/core';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useSettings } from '@/hooks/use-settings';
import { useGuards } from '@/hooks/use-guards';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { stableStringify } from '@/lib/utils-pure';
import { logger } from '@/lib/logger';
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
  const lastUpdateRef = useRef<string>(new Date(0).toISOString());

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
        if (settings.orden_del_dia_draft && settings.orden_del_dia_draft.guard_id === selectedGuard) {
          const borrador = settings.orden_del_dia_draft;
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
          setEsJefeEncargado(!!borrador.es_jefe_encargado);
          
          if (borrador.updated_at) {
            lastUpdateRef.current = borrador.updated_at;
          }
          
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
  }, [selectedGuard, isGuardOpen, roles, initialData, personnel, periodo, guards, guardiasCargadas, definiciones, definicionesCargadas]); // Removed settings.orden_del_dia_draft dependency from init

  // NEW: Reactive Sync from Cloud
  useEffect(() => {
    if (!estaInicializado || !isGuardOpen || !settings.orden_del_dia_draft) return;
    if (settings.orden_del_dia_draft.guard_id !== selectedGuard) return;
    
    const borrador = settings.orden_del_dia_draft;
    const cloudUpdate = borrador.updated_at || new Date(0).toISOString();
    
    // Solo actualizar si la versión de la nube es diferente a la nuestra
    if (cloudUpdate !== lastUpdateRef.current) {
      // Solo aplicamos si la nube es realmente más reciente para evitar "reversiones"
      if (cloudUpdate > lastUpdateRef.current) {
        const staff = borrador.staff || {};
        
        personnelAssign.setPersonalAsignado(staff);
        activities.setActividades(borrador.activities || []);
        notes.setNotas(borrador.notes || NOTAS_POR_DEFECTO);
        setEsJefeEncargado(!!borrador.es_jefe_encargado);
        lastUpdateRef.current = cloudUpdate;
      }
    }
  }, [settings.orden_del_dia_draft, selectedGuard, isGuardOpen, estaInicializado]);

  useEffect(() => {
    if (selectedGuard !== ultimaGuardiaInicializada.current) {
      setEstaInicializado(false);
    }
  }, [selectedGuard]);

  // Auto-save with deep equality check
  useEffect(() => {
    if (!selectedGuard || !estaInicializado || !isGuardOpen) return;

    // Comparar estado actual con el último borrador guardado
    const currentDraft = {
      guard_id: selectedGuard,
      staff: personnelAssign.personalAsignado,
      es_jefe_encargado: esJefeEncargado,
      activities: activities.actividades,
      notes: notes.notas,
    };

    const currentStr = stableStringify(currentDraft);
    
    // Omitimos updated_at de la comparación para evitar bucles infinitos
    const lastSaved = { ...settings.orden_del_dia_draft };
    delete (lastSaved as any).updated_at;
    const lastSavedStr = stableStringify(lastSaved);

    // Si son iguales (excluyendo updated_at), no guardar
    if (currentStr === lastSavedStr) return;

    const timer = setTimeout(() => {
      const ahoraIso = new Date().toISOString();
      lastUpdateRef.current = ahoraIso;
      
      saveSettings({
        orden_del_dia_draft: {
          ...currentDraft,
          updated_at: ahoraIso,
        },
      });
    }, 2000); // 2s debounce for draft saving

    return () => clearTimeout(timer);
  }, [personnelAssign.personalAsignado, esJefeEncargado, activities.actividades, notes.notas, selectedGuard, saveSettings, estaInicializado, isGuardOpen, settings.orden_del_dia_draft]);

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

