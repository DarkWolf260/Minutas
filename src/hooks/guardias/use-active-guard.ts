/**
 * Central hook for the active guard state.
 *
 * This is the single source of truth for "which guard is active right now"
 * across all modules (Orden del Día, Novedades, Reporte de Cierre).
 * Any page can consume this hook and work independently, without depending
 * on other pages having been visited first.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGuards } from '@/hooks/guardias';
import { useSettings } from '@/hooks/configuracion';
import { useRoles } from '@/hooks/personal';
import { getPeriodDurationHours } from '@/lib/formatters';

function buildFallbackPeriod(): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${fmt(today)} AL ${fmt(tomorrow)}`;
}

export function useActiveGuard() {
  const { guards, saveGuards, isLoaded: guardsLoaded } = useGuards();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { isLoaded: rolesLoaded } = useRoles();

  // ── Local "pending" selection (user picked but hasn't opened the guard yet) ──
  const [selectedGuardId, setSelectedGuardIdState] = useState<string>('');
  const [periodo, setPeriodoState] = useState<string>('');
  const [duracion, setDuracionState] = useState<number>(24);

  // Track last-synced values so we don't create infinite loops
  const lastSynced = useRef<{ active_guard_id?: string; guard_period?: string }>({});

  // Sync `periodo` and `duracion` from settings on load / external change
  useEffect(() => {
    if (!settingsLoaded) return;

    const globalPeriod = settings.guard_period || '';
    if (lastSynced.current.guard_period !== globalPeriod) {
      const effective = globalPeriod || buildFallbackPeriod();
      setPeriodoState(effective);
      lastSynced.current.guard_period = globalPeriod;
    }

    const savedDuration = settings.guard_shift_duration;
    if (savedDuration === 24 || savedDuration === 48) {
      setDuracionState(savedDuration);
    } else if (globalPeriod) {
      setDuracionState(getPeriodDurationHours(globalPeriod));
    }
  }, [settingsLoaded, settings.guard_period, settings.guard_shift_duration]);

  // Sync `selectedGuardId` from settings on load / external change
  useEffect(() => {
    if (!settingsLoaded || !guardsLoaded) return;
    const savedId = settings.active_guard_id;
    if (!savedId) return;
    if (lastSynced.current.active_guard_id === savedId) return;
    if (!guards.some((g) => g.id === savedId)) return;

    setSelectedGuardIdState(savedId);
    lastSynced.current.active_guard_id = savedId;
  }, [settingsLoaded, guardsLoaded, settings.active_guard_id, guards]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Change the selected guard in the dropdown.
   * Also persists `active_guard_id` to settings so all modules see the same selection.
   */
  const setSelectedGuardId = useCallback(
    (guardId: string) => {
      if (!guardId) return;
      setSelectedGuardIdState(guardId);
      lastSynced.current.active_guard_id = guardId;
      saveSettings({ ...settings, active_guard_id: guardId });
    },
    [settings, saveSettings]
  );

  /**
   * Change the period string locally (before committing via openGuard).
   */
  const setPeriodo = useCallback((p: string) => {
    setPeriodoState(p);
  }, []);

  /**
   * Change the guard duration (24 or 48 hours).
   */
  const setDuracion = useCallback((d: number) => {
    setDuracionState(d);
  }, []);

  /**
   * Open / activate a guard for the current shift.
   * Optionally accepts overrides; falls back to the local pending state.
   */
  const openGuard = useCallback(
    (guardId?: string, period?: string, duration?: number) => {
      const gId = guardId ?? selectedGuardId;
      const p = period ?? periodo;
      const d = duration ?? duracion;
      if (!gId) return;
      lastSynced.current.active_guard_id = gId;
      lastSynced.current.guard_period = p;
      saveSettings({
        is_guard_open: true,
        active_guard_id: gId,
        guard_period: p,
        guard_shift_duration: d,
      });
    },
    [selectedGuardId, periodo, duracion, saveSettings]
  );

  // ── Derived values ────────────────────────────────────────────────────────────

  const isGuardOpen = settings.is_guard_open || false;
  const active_guard_id = settings.active_guard_id || '';
  const guard_period = settings.guard_period || '';

  // The full guard object for the currently active (open) guard
  const activeGuard = guards.find((g) => g.id === active_guard_id) ?? null;

  // The full guard object for whatever the user has selected (may differ from active)
  const selectedGuard = guards.find((g) => g.id === selectedGuardId) ?? null;

  const isLoaded = guardsLoaded && rolesLoaded && settingsLoaded;

  return {
    // Guard list
    guards,
    saveGuards,

    // Pending selection (local, not yet "opened")
    selectedGuardId,
    setSelectedGuardId,
    selectedGuard,

    // Period & Duration (local, synced from settings)
    periodo,
    setPeriodo,
    duracion,
    setDuracion,

    // Committed / open guard state (from settings)
    isGuardOpen,
    active_guard_id,
    activeGuard,
    guard_period,
    openGuard,

    // Raw settings access (for modules that need it)
    settings,
    saveSettings,

    // Loading state
    isLoaded,
    guardsLoaded,
    settingsLoaded,
    rolesLoaded,
  };
}
