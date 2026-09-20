'use client';

/**
 * useSyncManager — public API.
 * Re-exports useSyncContext so all callers share the single SyncProvider instance.
 */

export { useSyncContext as useSyncManager } from '@/lib/sync/sync-context';
