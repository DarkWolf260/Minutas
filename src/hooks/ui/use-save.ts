'use client';

import { useState, useCallback, useRef } from 'react';

export interface SaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface UseSaveReturn extends SaveState {
  /**
   * Wraps an async save operation, tracking loading and last-saved state.
   *
   * @example
   * ```tsx
   * const { save, isSaving, lastSaved } = useSave();
   *
   * const handleSave = () =>
   *   save(() => saveSettings({ name: 'value' }));
   * ```
   */
  save: <T>(fn: () => Promise<T>) => Promise<T | null>;
  /** Resets error and lastSaved state. */
  reset: () => void;
}

/**
 * Hook for tracking the state of async save operations.
 *
 * Provides `isSaving`, `lastSaved`, and `error` state, plus a `save()`
 * wrapper that updates these automatically.
 *
 * Multiple concurrent calls are safe: `isSaving` becomes `true` as long
 * as any operation is pending.
 */
export function useSave(): UseSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingCount = useRef(0);

  const save = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    pendingCount.current += 1;
    setIsSaving(true);
    setError(null);

    try {
      const result = await fn();
      setLastSaved(new Date());
      return result;
    } catch (err: any) {
      const msg = err?.message ?? 'Error al guardar';
      setError(msg);
      return null;
    } finally {
      pendingCount.current -= 1;
      if (pendingCount.current === 0) {
        setIsSaving(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setLastSaved(null);
    setError(null);
  }, []);

  return { isSaving, lastSaved, error, save, reset };
}
