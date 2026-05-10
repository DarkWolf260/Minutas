/**
 * Sync-related TypeScript types.
 */

import type { Report, Template } from '@/lib/types';

export type SyncRole = 'primary' | 'secondary' | 'none';
export type SyncImportMode = 'auto' | 'inbox';
export type SyncReportStatus = 'pending' | 'received';

export interface SyncChannel {
  id: string;
  code: string;        // 6-char code shared with secondary devices
  name: string;
  ownerUserId: string;
  created_at: string;
}

export interface SyncReport {
  id: string;
  channelId: string;
  sourceDevice: string;
  reportData: Report;
  /** Snapshot of the template from the sender — used when the primary doesn't have it locally */
  templateData?: Template;
  status: SyncReportStatus;
  sentAt: string;
}

/** Persisted in AppSettings */
export interface SyncConfig {
  role: SyncRole;
  deviceName: string;
  channelId?: string;
  channelCode?: string;  // only meaningful when role === 'primary'
  importMode: SyncImportMode;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  role: 'none',
  deviceName: '',
  importMode: 'auto',
};

