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
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';

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

  // Track last-synced values so we don't create infinite loops
  const lastSynced = useRef<{ activeGuardId?: string; guardPeriod?: string }>({});

  // Sync `periodo` from settings on load / external change
  useEffect(() => {
    if (!settingsLoaded) return;

    const globalPeriod = settings.guardPeriod || '';
    if (lastSynced.current.guardPeriod === globalPeriod) return;

    const effective = globalPeriod || buildFallbackPeriod();
    setPeriodoState(effective);
    lastSynced.current.guardPeriod = globalPeriod;
  }, [settingsLoaded, settings.guardPeriod]);

  // Sync `selectedGuardId` from settings on load / external change
  useEffect(() => {
    if (!settingsLoaded || !guardsLoaded) return;
    const savedId = settings.activeGuardId;
    if (!savedId) return;
    if (lastSynced.current.activeGuardId === savedId) return;
    if (!guards.some((g) => g.id === savedId)) return;

    setSelectedGuardIdState(savedId);
    lastSynced.current.activeGuardId = savedId;
  }, [settingsLoaded, guardsLoaded, settings.activeGuardId, guards]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Change the selected guard in the dropdown.
   * Also persists `activeGuardId` to settings so all modules see the same selection.
   */
  const setSelectedGuardId = useCallback(
    (guardId: string) => {
      if (!guardId) return;
      setSelectedGuardIdState(guardId);
      lastSynced.current.activeGuardId = guardId;
      saveSettings({ ...settings, activeGuardId: guardId });
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
   * Open / activate a guard for the current shift.
   * Optionally accepts overrides; falls back to the local pending state.
   */
  const openGuard = useCallback(
    (guardId?: string, period?: string) => {
      const gId = guardId ?? selectedGuardId;
      const p = period ?? periodo;
      if (!gId) return;
      lastSynced.current.activeGuardId = gId;
      lastSynced.current.guardPeriod = p;
      saveSettings({ isGuardOpen: true, activeGuardId: gId, guardPeriod: p });
    },
    [selectedGuardId, periodo, saveSettings]
  );

  // ── Derived values ────────────────────────────────────────────────────────────

  const isGuardOpen = settings.isGuardOpen || false;
  const activeGuardId = settings.activeGuardId || '';
  const guardPeriod = settings.guardPeriod || '';

  // The full guard object for the currently active (open) guard
  const activeGuard = guards.find((g) => g.id === activeGuardId) ?? null;

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

    // Period (local, synced from settings)
    periodo,
    setPeriodo,

    // Committed / open guard state (from settings)
    isGuardOpen,
    activeGuardId,
    activeGuard,
    guardPeriod,
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
