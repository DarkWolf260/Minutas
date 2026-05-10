/**
 * Sync Service — Supabase operations for multi-device report synchronization.
 *
 * Wraps Supabase calls for:
 *  - Creating/deleting sync channels (primary device)
 *  - Joining a channel by code (secondary device)
 *  - Sending a report to a channel (secondary)
 *  - Fetching pending reports from a channel (primary)
 *  - Marking reports as received / deleting them (primary)
 *  - Subscribing to real-time incoming reports (primary)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Report } from '@/lib/types';
import type { SyncChannel, SyncReport } from './sync-types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generates a random 6-character alphanumeric code (uppercase). */
export function generateChannelCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ─── Channel Operations ──────────────────────────────────────────────────────

/**
 * Creates a new sync channel owned by the current authenticated user.
 * Called by the PRIMARY device during setup.
 */
export async function createChannel(name: string): Promise<SyncChannel> {
  const code = generateChannelCode();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para crear un canal de sincronización.');

  const { data, error } = await supabase
    .from('sync_channels')
    .insert({ code, name, owner_user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create sync channel', error, { feature: 'Sync' });
    throw new Error('No se pudo crear el canal de sincronización.');
  }

  return {
    id: data.id,
    code: data.code,
    name: data.name,
    ownerUserId: data.owner_user_id,
    created_at: data.created_at,
  };
}

/**
 * Looks up a channel by its 6-character code.
 * Called by the SECONDARY device during setup.
 */
export async function joinChannelByCode(code: string): Promise<SyncChannel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para unirte a un canal.');

  const { data, error } = await supabase
    .from('sync_channels')
    .select()
    .eq('code', code.toUpperCase().trim())
    .single();

  if (error || !data) {
    throw new Error('Código de canal inválido. Verifica el código del dispositivo principal.');
  }

  return {
    id: data.id,
    code: data.code,
    name: data.name,
    ownerUserId: data.owner_user_id,
    created_at: data.created_at,
  };
}

/**
 * Deletes the channel (and all its reports via CASCADE).
 * Only the owner can do this (enforced by RLS).
 */
export async function deleteChannel(channelId: string): Promise<void> {
  const { error } = await supabase
    .from('sync_channels')
    .delete()
    .eq('id', channelId);

  if (error) {
    logger.error('Failed to delete sync channel', error, { feature: 'Sync' });
    throw new Error('No se pudo eliminar el canal de sincronización.');
  }
}

// ─── Report Operations ───────────────────────────────────────────────────────

/**
 * Sends a report from the secondary device to the channel.
 */
export async function sendReportToChannel(
  channelId: string,
  sourceDevice: string,
  report: Report,
  template?: import('@/lib/types').Template
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para enviar reportes.');

  const { error } = await supabase
    .from('sync_reports')
    .insert({
      channel_id: channelId,
      source_device: sourceDevice,
      report_data: { report, templateData: template ?? null } as any,
      status: 'pending',
    });

  if (error) {
    logger.error('Failed to send report to channel', error, { feature: 'Sync', metadata: { channelId } });
    throw new Error('No se pudo enviar el reporte al dispositivo principal.');
  }
}

/**
 * Fetches all pending sync reports for the authenticated user's channel.
 */
export async function fetchPendingReports(channelId: string): Promise<SyncReport[]> {
  const { data, error } = await supabase
    .from('sync_reports')
    .select()
    .eq('channel_id', channelId)
    .eq('status', 'pending')
    .order('sent_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch pending sync reports', error, { feature: 'Sync' });
    return [];
  }

  return (data || []).map(rowToSyncReport);
}

/**
 * Marks a report as received and deletes it from Supabase (transit-only).
 */
export async function markReportReceived(syncReportId: string): Promise<void> {
  const { error } = await supabase
    .from('sync_reports')
    .delete()
    .eq('id', syncReportId);

  if (error) {
    logger.error('Failed to mark sync report as received', error, {
      feature: 'Sync',
      metadata: { syncReportId },
    });
  }
}

// ─── Realtime Subscription ───────────────────────────────────────────────────

type ReportCallback = (report: SyncReport) => void;

/**
 * Subscribes to new reports arriving in the channel via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeToChannel(
  channelId: string,
  onNewReport: ReportCallback
): () => void {
  // Use a unique name per call so React StrictMode's double-invocation doesn't
  // try to call .on() on an already-subscribed channel instance.
  const uniqueName = `sync:${channelId}:${Math.random().toString(36).slice(2, 8)}`;

  const channel = supabase
    .channel(uniqueName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sync_reports',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const row = payload.new as any;
        onNewReport(rowToSyncReport(row));
      }
    )
    .subscribe((status) => {
      logger.info('Sync Realtime status', { status, channelId, feature: 'Sync' });
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Internal ────────────────────────────────────────────────────────────────

function rowToSyncReport(row: any): SyncReport {
  // report_data can be the raw Report (legacy) or { report, templateData } (new format)
  const payload = row.report_data;
  const reportData: Report = payload?.report ?? payload;
  const templateData = payload?.templateData ?? undefined;

  return {
    id: row.id,
    channelId: row.channel_id,
    sourceDevice: row.source_device,
    reportData,
    templateData,
    status: row.status,
    sentAt: row.sent_at,
  };
}

