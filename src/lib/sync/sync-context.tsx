'use client';

/**
 * SyncProvider — wraps the full sync logic as a singleton React context.
 *
 * Problem this solves:
 *   `useSyncManager` was called by multiple components (NotificationBell in
 *   SideNav + MobileNav, ReportViewer, SyncPage…).  Each call ran its own
 *   useEffect and created its own Supabase Realtime subscription, causing:
 *     • "cannot add postgres_changes callbacks after subscribe()" from Supabase
 *     • duplicate inbox processing
 *   Moving all logic into a single Provider fixes this at the root.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/use-settings';
import { useAuth } from '@/hooks/use-auth';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useNotifications } from '@/lib/notifications-provider';
import {
  createChannel,
  joinChannelByCode,
  deleteChannel,
  sendReportToChannel,
  fetchPendingReports,
  markReportReceived,
  subscribeToChannel,
} from './sync-service';
import type { SyncConfig, SyncReport } from './sync-types';
import type { Report } from '@/lib/types';
import { DEFAULT_SYNC_CONFIG } from './sync-types';
import { logger } from '@/lib/logger';

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface SyncContextValue {
  syncConfig: SyncConfig;
  inboxReports: SyncReport[];
  isSyncing: boolean;
  isConfigured: boolean;
  isPrimary: boolean;
  isSecondary: boolean;
  setupAsPrimary: (deviceName: string) => Promise<any>;
  setupAsSecondary: (deviceName: string, code: string) => Promise<any>;
  sendReport: (report: Report) => Promise<boolean>;
  importFromInbox: (syncReport: SyncReport) => Promise<void>;
  discardFromInbox: (syncReport: SyncReport) => Promise<void>;
  resetSync: () => Promise<void>;
  setImportMode: (mode: 'auto' | 'inbox') => void;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { settings, saveSettings } = useSettings();
  const { isAuthenticated } = useAuth();
  const { addReport } = useReports();
  const { templates, addTemplate } = useTemplates();
  const { addNotification } = useNotifications();

  const syncConfig: SyncConfig = (settings as any)?.syncConfig ?? DEFAULT_SYNC_CONFIG;

  const [inboxReports, setInboxReports] = useState<SyncReport[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Save config helper ──────────────────────────────────────────────

  const saveSyncConfig = useCallback(
    (partial: Partial<SyncConfig>) =>
      saveSettings({ syncConfig: { ...syncConfig, ...partial } } as any),
    [saveSettings, syncConfig]
  );

  // ── Import a sync report into local RxDB ───────────────────────────

  const importReport = useCallback(
    async (syncReport: SyncReport) => {
      let reportData = syncReport.reportData;

      if (syncReport.templateData) {
        const td = syncReport.templateData;
        const exactMatch = templates.find((t) => t.id === td.id);

        if (!exactMatch) {
          const nameMatch = templates.find(
            (t) => t.name.toLowerCase() === td.name.toLowerCase()
          );
          if (nameMatch) {
            reportData = { ...reportData, template_id: nameMatch.id };
          } else {
            await addTemplate({
              ...td,
              workspace_id: settings.workspace_id ?? td.workspace_id,
            });
          }
        }
      }

      const report: Report = {
        ...reportData,
        workspace_id: settings.workspace_id ?? reportData.workspace_id,
      };
      await addReport(report);
      await markReportReceived(syncReport.id);
      setInboxReports((prev) => prev.filter((r) => r.id !== syncReport.id));
    },
    [addReport, addTemplate, templates, settings.workspace_id]
  );

  // Stable ref so the Realtime callback always uses the latest importReport
  const importReportRef = useRef(importReport);
  useEffect(() => { importReportRef.current = importReport; }, [importReport]);

  // ── Handle incoming report ──────────────────────────────────────────

  const handleIncoming = useCallback(
    async (syncReport: SyncReport) => {
      if (syncConfig.importMode === 'auto') {
        await importReportRef.current(syncReport);
        toast.success(`Reporte recibido de "${syncReport.sourceDevice}"`, {
          description: syncReport.reportData.title,
        });
      } else {
        setInboxReports((prev) => {
          if (prev.some((r) => r.id === syncReport.id)) return prev;
          return [...prev, syncReport];
        });
        addNotification({
          type: 'info',
          title: 'Reporte pendiente en bandeja',
          message: `"${syncReport.reportData.title}" de ${syncReport.sourceDevice}`,
          metadata: { syncReportId: syncReport.id, sourceDevice: syncReport.sourceDevice },
        });
      }
    },
    [syncConfig.importMode, addNotification]
  );

  const handleIncomingRef = useRef(handleIncoming);
  useEffect(() => { handleIncomingRef.current = handleIncoming; }, [handleIncoming]);

  // ── Realtime subscription — ONE instance for the entire app ────────

  useEffect(() => {
    if (!isAuthenticated) return;
    if (syncConfig.role !== 'primary' || !syncConfig.channelId) return;

    const channelId = syncConfig.channelId;
    let cancelled = false;

    // Fetch offline-pending reports once on connect
    fetchPendingReports(channelId).then((pending) => {
      if (cancelled || pending.length === 0) return;
      if (syncConfig.importMode === 'auto') {
        (async () => {
          for (const r of pending) await importReportRef.current(r);
          toast.success(`${pending.length} reporte(s) recibidos mientras estabas desconectado.`);
        })();
      } else {
        setInboxReports(pending);
        pending.forEach((r) => {
          addNotification({
            type: 'info',
            title: 'Reporte pendiente en bandeja',
            message: `"${r.reportData.title}" de ${r.sourceDevice}`,
            metadata: { syncReportId: r.id, sourceDevice: r.sourceDevice },
          });
        });
        if (pending.length > 0)
          toast.info(`${pending.length} reporte(s) pendientes en la bandeja.`);
      }
    });

    // Subscribe to Realtime via unique channel name to avoid StrictMode conflicts
    const unsub = subscribeToChannel(channelId, (r) => handleIncomingRef.current(r));
    unsubscribeRef.current = unsub;

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, syncConfig.role, syncConfig.channelId]);

  // ─── Public Actions ─────────────────────────────────────────────────

  const setupAsPrimary = useCallback(async (deviceName: string) => {
    setIsSyncing(true);
    try {
      const channel = await createChannel(deviceName);
      await saveSyncConfig({ role: 'primary', deviceName, channelId: channel.id, channelCode: channel.code });
      toast.success(`Canal creado. Código: ${channel.code}`);
      return channel;
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo crear el canal.');
      return null;
    } finally { setIsSyncing(false); }
  }, [saveSyncConfig]);

  const setupAsSecondary = useCallback(async (deviceName: string, code: string) => {
    setIsSyncing(true);
    try {
      const channel = await joinChannelByCode(code);
      await saveSyncConfig({ role: 'secondary', deviceName, channelId: channel.id, channelCode: channel.code });
      toast.success(`Conectado al canal "${channel.name}".`);
      return channel;
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo unir al canal.');
      return null;
    } finally { setIsSyncing(false); }
  }, [saveSyncConfig]);

  const sendReport = useCallback(async (report: Report) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para enviar reportes al principal.');
      return false;
    }
    if (syncConfig.role !== 'secondary' || !syncConfig.channelId) {
      toast.error('Este dispositivo no está configurado como secundario.');
      return false;
    }
    setIsSyncing(true);
    try {
      const template = templates.find((t) => t.id === report.template_id);
      await sendReportToChannel(syncConfig.channelId, syncConfig.deviceName || 'Dispositivo Secundario', report, template);
      toast.success('Reporte enviado al dispositivo principal.');
      return true;
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo enviar el reporte.');
      return false;
    } finally { setIsSyncing(false); }
  }, [isAuthenticated, syncConfig, templates]);

  const importFromInbox = useCallback(async (syncReport: SyncReport) => {
    setIsSyncing(true);
    try {
      await importReport(syncReport);
      toast.success('Reporte importado correctamente.');
    } finally { setIsSyncing(false); }
  }, [importReport]);

  const discardFromInbox = useCallback(async (syncReport: SyncReport) => {
    await markReportReceived(syncReport.id);
    setInboxReports((prev) => prev.filter((r) => r.id !== syncReport.id));
  }, []);

  const resetSync = useCallback(async () => {
    if (syncConfig.role === 'primary' && syncConfig.channelId) {
      try { await deleteChannel(syncConfig.channelId); }
      catch (err) { logger.error('Failed to delete channel on reset', err, { feature: 'Sync' }); }
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setInboxReports([]);
    await saveSyncConfig(DEFAULT_SYNC_CONFIG);
    toast.success('Sincronización desactivada.');
  }, [syncConfig, saveSyncConfig]);

  const setImportMode = useCallback(
    (mode: 'auto' | 'inbox') => saveSyncConfig({ importMode: mode }),
    [saveSyncConfig]
  );

  const value: SyncContextValue = {
    syncConfig,
    inboxReports,
    isSyncing,
    isConfigured: syncConfig.role !== 'none',
    isPrimary: syncConfig.role === 'primary',
    isSecondary: syncConfig.role === 'secondary',
    setupAsPrimary,
    setupAsSecondary,
    sendReport,
    importFromInbox,
    discardFromInbox,
    resetSync,
    setImportMode,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSyncContext must be used within <SyncProvider>');
  return ctx;
}



