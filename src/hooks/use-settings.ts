'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';
import { stableStringify } from '@/lib/db/db';

const defaultSettings: AppSettings = {
  active_guard_id: '',
  is_guard_open: false,
  guard_period: '',
  guard_shift_duration: 24,
  final_report_staff_snapshot: {},
  final_report_start_date: '',
  final_report_end_date: '',
  final_report_manual_novedades: [],
  final_report_statistics: '',
  reportarole_ids: [],
  group_consecutive_reports: false,
  enable_report_numbering: false,
  report_numbering_type: 'general',
  group_by_template_type: false,
  pinned_template_ids: [],
  grouped_template_ids: [],
};

export function useSettings() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace, isCloud);

    const sub = repo.watchSettings().subscribe(async (doc) => {
      if (doc) {
        const item = doc.toJSON ? doc.toJSON() : doc;
        let rawData = item.data || {};
        
        // 1. Manejo de emergencia: Si la data es un string, parsear
        if (typeof rawData === 'string') {
          try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
        }

        // 2. Manejo de corrupción: Si tiene claves numéricas (spread de string), descartar
        if (rawData && rawData['0'] !== undefined && rawData['1'] !== undefined) {
          logger.warn('Detectada corrupción de datos en settings, limpiando...');
          rawData = {};
        }

        // 3. Migración: Mapear campos viejos (camelCase) a nuevos (snake_case)
        const sanitized: AppSettings = { ...defaultSettings };
        const d = rawData as any;

        sanitized.active_guard_id = d.active_guard_id || d.activeGuardId || '';
        sanitized.is_guard_open = d.is_guard_open !== undefined ? d.is_guard_open : d.isGuardOpen;
        sanitized.guard_period = d.guard_period || d.guardPeriod || '';
        sanitized.orden_del_dia_draft = d.orden_del_dia_draft || d.ordenDelDiaDraft;
        sanitized.final_report_manual_novedades = d.final_report_manual_novedades || d.finalReportManualNovedades || [];
        sanitized.disabled_modules = d.disabled_modules || d.disabledModules;
        sanitized.reportarole_ids = d.reportarole_ids || d.reportaroleIds || [];
        sanitized.whatsapp_default_chat_ids = d.whatsapp_default_chat_ids || d.whatsappDefaultChatIds || [];
        sanitized.whatsapp_local_url = d.whatsapp_local_url || d.whatsappLocalUrl || '';
        sanitized.final_report_statistics = d.final_report_statistics || d.finalReportStatistics || '';
        sanitized.group_consecutive_reports = d.group_consecutive_reports !== undefined ? d.group_consecutive_reports : false;
        sanitized.enable_report_numbering = d.enable_report_numbering !== undefined ? d.enable_report_numbering : false;
        sanitized.report_numbering_type = d.report_numbering_type || 'general';
        sanitized.group_by_template_type = d.group_by_template_type !== undefined ? d.group_by_template_type : false;
        sanitized.pinned_template_ids = d.pinned_template_ids || [];
        sanitized.grouped_template_ids = d.grouped_template_ids || [];

        // 4. Comparación Profunda: Solo actualizar si hay un cambio real
        setSettings(prev => {
          const prevStr = stableStringify(prev);
          const nextStr = stableStringify(sanitized);
          if (prevStr !== nextStr) {
            return sanitized;
          }
          return prev;
        });
      } else {
        setSettings(defaultSettings);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace, isCloud);
      await repo.saveSettings(settings, newSettings);
    },
    [db, currentWorkspace, settings, isCloud]
  );

  const clearAllSettings = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace, isCloud);
    await repo.saveSettings(defaultSettings, {});
  }, [db, currentWorkspace, isCloud]);

  return { settings, saveSettings, isLoaded, clearAllSettings };
}



