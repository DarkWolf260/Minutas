/**
 * Base repository utilities.
 *
 * Centralizes the try/catch + logger + toast pattern shared across
 * all repository operations.
 */

import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';

export interface SafeWriteOptions {
  /** Toast message shown on success. If omitted, no success toast is shown. */
  successMessage?: string;
  /** Toast message shown on error. Defaults to a user-friendly error extraction. */
  errorMessage?: string;
  /** Feature tag for the logger. */
  feature?: string;
  /** If true, the error is re-thrown after handling. */
  rethrow?: boolean;
  /** If true, no error toast is shown. Useful for silent background saves. */
  silent?: boolean;
}

/**
 * Executes a write operation with centralized error handling.
 *
 * @returns The result of the operation, or `null` if it failed and
 *          `rethrow` is false.
 *
 * @example
 * ```ts
 * const result = await safeWrite(
 *   () => db.configs.upsert(payload),
 *   { successMessage: 'Guardado.', feature: 'Settings' }
 * );
 * ```
 */
export async function safeWrite<T>(
  operation: () => Promise<T>,
  options: SafeWriteOptions = {}
): Promise<T | null> {
  const { successMessage, errorMessage, feature, rethrow = false, silent = false } = options;
  try {
    const result = await operation();
    if (successMessage) toast.success(successMessage);
    return result;
  } catch (error) {
    const msg = errorMessage ?? getUserFriendlyErrorMessage(error);
    logger.error(msg, error, { feature });
    if (!silent) toast.error(msg);
    if (rethrow) throw error;
    return null;
  }
}

/**
 * Same as `safeWrite` but never shows a toast (silent background operation).
 */
export async function silentWrite<T>(
  operation: () => Promise<T>,
  options: Omit<SafeWriteOptions, 'silent'> = {}
): Promise<T | null> {
  return safeWrite(operation, { ...options, silent: true });
}
