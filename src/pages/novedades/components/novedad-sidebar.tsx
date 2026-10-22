import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { PlusCircle, Search, Calendar, Pin, MessageSquare, FileText, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoGuardBanner } from '@/components/guards/guard-selector';
import { cn } from '@/lib/utils';
import { NovedadItem } from './novedad-item';
import { NovedadFilters } from './novedad-filters';
import { NovedadGroupItem } from './novedad-group-item';
import type { Report, Template } from '@/lib/types';
import { useSettings } from '@/hooks/configuracion';
import { getReportDateTime, findValueInform_data } from '@/lib/report-sorter';
import { WhatsAppChatView } from './whatsapp-chat/whatsapp-chat-view';
import { WhatsAppChatList } from './whatsapp-chat/whatsapp-chat-list';
import { useWhatsAppBot } from '@/hooks/whatsapp';

import type { UseNovedadesReturn } from '@/hooks/novedades';

export interface NovedadSidebarProps {
  hook: Pick<
    UseNovedadesReturn,
    | 'idReporteSeleccionado'
    | 'creandoReporte'
    | 'guardiaAbierta'
    | 'setEsDialogOpenCrear'
    | 'busqueda'
    | 'setBusqueda'
    | 'ordenamiento'
    | 'setOrdenamiento'
    | 'reportesFiltrados'
    | 'manejarSeleccionarReporte'
    | 'manejarExportarTodasWord'
    | 'templates'
    | 'reports'
  >;
  isMobile: boolean;
  vistaSidebar?: 'lista' | 'whatsapp';
  onCambiarVistaSidebar?: (vista: 'lista' | 'whatsapp') => void;
  isChatExpanded?: boolean;
  onToggleExpandChat?: () => void;
  showWhatsAppTab?: boolean;
}

/** Returns a human-friendly label for a given YYYY-MM-DD key. */
function formatDayLabel(dateKey: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Parse the date key locally so timezone doesn't shift the day
  const date = new Date(dateKey + 'T00:00:00');
  const formatted = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (dateKey === toKey(today)) return `Hoy — ${formatted}`;
  if (dateKey === toKey(yesterday)) return `Ayer — ${formatted}`;
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Groups reports by the calendar day of the event (Fecha from form_data).
 * Falls back to the report's timestamp field if form_data has no Fecha.
 * The direction controls whether groups are sorted newest-first ('desc') or oldest-first ('asc').
 */
function groupReportsByDay(
  reports: Report[],
  direction: 'asc' | 'desc' = 'desc'
): { dateKey: string; label: string; reports: Report[] }[] {
  const map = new Map<string, Report[]>();

  for (const report of reports) {
    // Primary: use getReportDateTime which reads Fecha + Hora from form_data
    const eventDate = getReportDateTime(report);
    let key: string;

    if (eventDate && !isNaN(eventDate.getTime())) {
      key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    } else {
      // Fallback: use the report's creation timestamp
      const fallback = report.timestamp ? new Date(report.timestamp) : new Date();
      key = `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
    }

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(report);
  }

  // Sort groups according to direction
  return Array.from(map.entries())
    .sort(([a], [b]) => direction === 'desc' ? (a < b ? 1 : a > b ? -1 : 0) : (a < b ? -1 : a > b ? 1 : 0))
    .map(([dateKey, reps]) => ({
      dateKey,
      label: formatDayLabel(dateKey),
      reports: reps,
    }));
}

export interface ReportGroup {
  id: string;
  isGroup: true;
  templateId: string;
  templateName: string;
  timeRange: string;
  reports: Report[];
}

export type SidebarListItem = 
  | { isGroup: false; report: Report }
  | ReportGroup;

function getReportTimeStr(report: Report): string {
  const rawHora = findValueInform_data(report.form_data, 'Hora');
  if (rawHora) {
    const matches = String(rawHora).match(/\d{2}:\d{2}/);
    if (matches && matches[0]) {
      return matches[0];
    }
  }
  const date = report.timestamp ? new Date(report.timestamp) : new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getTimeRange(group: Report[]): string {
  if (group.length === 0) return '';
  
  // Sort group chronologically (oldest first)
  const sorted = [...group].sort((a, b) => {
    const timeA = getReportDateTime(a)?.getTime() || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
    const timeB = getReportDateTime(b)?.getTime() || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
    return timeA - timeB;
  });

  const start = getReportTimeStr(sorted[0]!);
  const end = getReportTimeStr(sorted[sorted.length - 1]!);
  
  if (start === end) {
    return `${start} HLV`;
  }
  return `${start} - ${end} HLV`;
}

function groupContiguousReports(
  reports: Report[],
  templates: Template[]
): SidebarListItem[] {
  const result: SidebarListItem[] = [];
  if (reports.length === 0) return result;

  let currentGroup: Report[] = [reports[0]!];
  let currentTemplateId = reports[0]!.template_id;

  for (let i = 1; i < reports.length; i++) {
    const report = reports[i]!;
    if (report.template_id === currentTemplateId) {
      currentGroup.push(report);
    } else {
      // Flush current group
      if (currentGroup.length > 1) {
        const template = templates?.find(t => t.id === currentTemplateId);
        result.push({
          isGroup: true,
          id: `group-${currentTemplateId}-${currentGroup[0]!.id}`,
          templateId: currentTemplateId,
          templateName: template?.name || 'Reporte',
          timeRange: getTimeRange(currentGroup),
          reports: [...currentGroup]
        });
      } else {
        result.push({
          isGroup: false,
          report: currentGroup[0]!
        });
      }
      // Start new group
      currentGroup = [report];
      currentTemplateId = report.template_id;
    }
  }

  // Flush last group
  if (currentGroup.length > 1) {
    const template = templates?.find(t => t.id === currentTemplateId);
    result.push({
      isGroup: true,
      id: `group-${currentTemplateId}-${currentGroup[0]!.id}`,
      templateId: currentTemplateId,
      templateName: template?.name || 'Reporte',
      timeRange: getTimeRange(currentGroup),
      reports: [...currentGroup]
    });
  } else if (currentGroup.length === 1) {
    result.push({
      isGroup: false,
      report: currentGroup[0]!
    });
  }

  return result;
}

function groupReportsByTemplate(
  reports: Report[],
  templates: Template[],
  direction: 'asc' | 'desc' = 'desc'
): ReportGroup[] {
  const map = new Map<string, Report[]>();

  for (const report of reports) {
    const tId = report.template_id;
    if (!map.has(tId)) map.set(tId, []);
    map.get(tId)!.push(report);
  }

  return Array.from(map.entries()).map(([templateId, reps]) => {
    const template = templates?.find(t => t.id === templateId);
    
    // Sort reports inside the group chronologically
    const sortedReps = [...reps].sort((a, b) => {
      const timeA = getReportDateTime(a)?.getTime() || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const timeB = getReportDateTime(b)?.getTime() || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return direction === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return {
      id: `template-group-${templateId}`,
      isGroup: true as const,
      templateId,
      templateName: template?.name || 'Reporte',
      timeRange: getTimeRange(sortedReps),
      reports: sortedReps
    };
  });
}

export const NovedadSidebar = ({
  hook,
  isMobile,
  vistaSidebar: vistaSidebarProp,
  onCambiarVistaSidebar,
  isChatExpanded = false,
  onToggleExpandChat,
  showWhatsAppTab
}: NovedadSidebarProps) => {
  const {
    idReporteSeleccionado,
    creandoReporte,
    guardiaAbierta,
    setEsDialogOpenCrear,
    busqueda,
    setBusqueda,
    ordenamiento,
    setOrdenamiento,
    reportesFiltrados,
    manejarSeleccionarReporte,
    manejarExportarTodasWord,
    templates,
    reports
  } = hook;

  const { settings, saveSettings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const isBotConnected = (bot.isAvailable && bot.status.isReady) || bot.isCloudActive;

  const isChatPositionRight = settings?.whatsapp_chat_position === 'right_form';
  const shouldShowWhatsAppTab = showWhatsAppTab ?? (!isChatPositionRight || isMobile);

  const [internalVista, setInternalVista] = useState<'lista' | 'whatsapp'>(() => {
    return (localStorage.getItem('novedades_vista_sidebar') as 'lista' | 'whatsapp') || 'lista';
  });

  const activeVista = vistaSidebarProp ?? internalVista;
  const effectiveVista = isBotConnected && shouldShowWhatsAppTab ? activeVista : 'lista';

  const [subVistaWhatsApp, setSubVistaWhatsApp] = useState<'chats' | 'conversacion'>('chats');
  const [chatWhatsAppActivo, setChatWhatsAppActivo] = useState<string | null>(() => {
    return localStorage.getItem('minutas_active_whatsapp_chat') || null;
  });

  const handleSelectChatWhatsApp = (chatId: string) => {
    setChatWhatsAppActivo(chatId);
    localStorage.setItem('minutas_active_whatsapp_chat', chatId);
    setSubVistaWhatsApp('conversacion');
  };

  const handleCambiarVista = (vista: 'lista' | 'whatsapp') => {
    if (vista === 'whatsapp') {
      setSubVistaWhatsApp('chats');
    }
    if (onCambiarVistaSidebar) {
      onCambiarVistaSidebar(vista);
    } else {
      setInternalVista(vista);
      localStorage.setItem('novedades_vista_sidebar', vista);
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const groupedIds = settings?.grouped_template_ids || [];
    const showByTemplate = !!settings?.group_by_template_type;

    const timelineReports = showByTemplate
      ? reportesFiltrados.filter((r: Report) => !groupedIds.includes(r.template_id))
      : reportesFiltrados;

    return groupReportsByDay(timelineReports, ordenamiento);
  }, [reportesFiltrados, ordenamiento, settings?.group_by_template_type, settings?.grouped_template_ids]);

  const groupsWithGrouping = useMemo(() => {
    const groupConsecutive = !!settings?.group_consecutive_reports;
    return groups.map(g => ({
      ...g,
      items: groupConsecutive
        ? groupContiguousReports(g.reports, templates || [])
        : g.reports.map(r => ({ isGroup: false as const, report: r }))
    }));
  }, [groups, templates, settings?.group_consecutive_reports]);

  const handleTogglePin = useCallback(
    async (templateId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const currentPinned = settings?.pinned_template_ids || [];
      let nextPinned: string[];
      if (currentPinned.includes(templateId)) {
        nextPinned = currentPinned.filter(id => id !== templateId);
      } else {
        nextPinned = [...currentPinned, templateId];
      }
      await saveSettings({ pinned_template_ids: nextPinned });
    },
    [settings?.pinned_template_ids, saveSettings]
  );

  const { pinnedGroups, unpinnedGroups } = useMemo(() => {
    if (!settings?.group_by_template_type) {
      return { pinnedGroups: [], unpinnedGroups: [] };
    }

    const groupedIds = settings.grouped_template_ids || [];
    const reportsToGroup = reportesFiltrados.filter((r: Report) => groupedIds.includes(r.template_id));
    const allGroups = groupReportsByTemplate(reportsToGroup, templates || [], ordenamiento);
    const pinnedIds = settings.pinned_template_ids || [];

    const sortGroupsAlphabetically = (a: ReportGroup, b: ReportGroup) => {
      const nameA = a.templateName.replace(/\{.*?\}/g, '').trim().toLowerCase();
      const nameB = b.templateName.replace(/\{.*?\}/g, '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    };

    const pinned: ReportGroup[] = [];
    const unpinned: ReportGroup[] = [];

    allGroups.forEach(g => {
      if (pinnedIds.includes(g.templateId)) {
        pinned.push(g);
      } else {
        unpinned.push(g);
      }
    });

    pinned.sort(sortGroupsAlphabetically);
    unpinned.sort(sortGroupsAlphabetically);

    return { pinnedGroups: pinned, unpinnedGroups: unpinned };
  }, [reportesFiltrados, templates, ordenamiento, settings?.group_by_template_type, settings?.grouped_template_ids, settings?.pinned_template_ids]);

  const reportNumbers = useMemo(() => {
    const map = new Map<string, number>();
    if (!settings?.enable_report_numbering) return map;

    // Sort all filtered reports chronologically (ascending)
    const sorted = [...reportesFiltrados].sort((a, b) => {
      const timeA = getReportDateTime(a)?.getTime() || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const timeB = getReportDateTime(b)?.getTime() || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return timeA - timeB;
    });

    const type = settings.report_numbering_type || 'general';
    if (type === 'template') {
      const counters: Record<string, number> = {};
      sorted.forEach(r => {
        counters[r.template_id] = (counters[r.template_id] || 0) + 1;
        map.set(r.id, counters[r.template_id]!);
      });
    } else {
      sorted.forEach((r, idx) => {
        map.set(r.id, idx + 1);
      });
    }

    return map;
  }, [reportesFiltrados, settings?.enable_report_numbering, settings?.report_numbering_type]);

  // Auto-expand group if a child report is selected
  useEffect(() => {
    if (!idReporteSeleccionado) return;
    
    if (settings?.group_by_template_type) {
      const allGroups = [...pinnedGroups, ...unpinnedGroups];
      allGroups.forEach(group => {
        if (group.reports.some(r => r.id === idReporteSeleccionado)) {
          setExpandedGroups(prev => {
            if (prev[group.id]) return prev;
            return { ...prev, [group.id]: true };
          });
        }
      });
    } else {
      groupsWithGrouping.forEach(g => {
        g.items.forEach(item => {
          if (item.isGroup && item.reports.some(r => r.id === idReporteSeleccionado)) {
            setExpandedGroups(prev => {
              if (prev[item.id]) return prev;
              return { ...prev, [item.id]: true };
            });
          }
        });
      });
    }
  }, [idReporteSeleccionado, groupsWithGrouping, pinnedGroups, unpinnedGroups, settings?.group_by_template_type]);

  const handleToggleExpand = useCallback((groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  return (
    <aside
      id="novedades-sidebar"
      className={cn(
        'h-full w-full sm:w-80 lg:w-96 flex-col border-r bg-card flex gap-0 animate-in fade-in slide-in-from-left-4 duration-300 sm:animate-none',
        idReporteSeleccionado || creandoReporte ? 'hidden sm:flex' : 'flex'
      )}
    >
      <div className="flex flex-col border-b bg-card">
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 min-h-[52px]',
            isBotConnected && shouldShowWhatsAppTab && 'pb-1.5'
          )}
        >
          <h2 className="text-base sm:text-lg font-bold tracking-tight">Novedades</h2>
          <Button
            size="sm"
            onClick={() => setEsDialogOpenCrear(true)}
            disabled={!guardiaAbierta}
            className="shadow-sm gap-1.5 h-8 px-2.5 text-xs font-medium"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Nuevo
          </Button>
        </div>

        {/* Alternador de Vistas: Lista vs Chat WhatsApp (solo visible si el bot está conectado y la pestaña está habilitada) */}
        {isBotConnected && shouldShowWhatsAppTab && (
          <div className="px-3 sm:px-4 pb-2.5 animate-in fade-in duration-200">
            <div className="flex items-center p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/40">
              <button
                type="button"
                onClick={() => handleCambiarVista('lista')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all',
                  effectiveVista === 'lista'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => handleCambiarVista('whatsapp')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all',
                  effectiveVista === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {effectiveVista === 'whatsapp' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {isChatExpanded ? (
            <WhatsAppChatList
              bot={bot}
              activeChatId={chatWhatsAppActivo}
              onSelectChat={handleSelectChatWhatsApp}
            />
          ) : subVistaWhatsApp === 'chats' ? (
            <WhatsAppChatList
              bot={bot}
              activeChatId={chatWhatsAppActivo}
              onSelectChat={handleSelectChatWhatsApp}
            />
          ) : (
            <WhatsAppChatView
              reports={reports || reportesFiltrados}
              templates={templates}
              selectedReportId={idReporteSeleccionado}
              onSelectReport={manejarSeleccionarReporte}
              guardiaAbierta={guardiaAbierta}
              isExpanded={false}
              externalActiveChatId={chatWhatsAppActivo}
              onChatChange={setChatWhatsAppActivo}
              onToggleExpand={onToggleExpandChat}
              onOpenCreateDialog={() => setEsDialogOpenCrear(true)}
              onBack={() => setSubVistaWhatsApp('chats')}
            />
          )}
        </div>
      ) : (
        <>
          <NovedadFilters
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            ordenamiento={ordenamiento}
            setOrdenamiento={setOrdenamiento}
            manejarExportarTodasWord={manejarExportarTodasWord}
          />

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full" type="always">
          <div className={cn(
            'p-3 pt-3 sm:pb-3',
            reportesFiltrados.length > 0 ? 'pb-32' : 'pb-6'
          )}>
            {settings?.group_by_template_type ? (
              (pinnedGroups.length > 0 || unpinnedGroups.length > 0 || groupsWithGrouping.length > 0) ? (
                <div className="space-y-6">
                  {/* Pinned Groups Section */}
                  {pinnedGroups.length > 0 && (
                    <div className="space-y-1">
                      {pinnedGroups.map((group) => (
                        <NovedadGroupItem
                          key={group.id}
                          id={group.id}
                          templateId={group.templateId}
                          templateName={group.templateName}
                          timeRange={group.timeRange}
                          reports={group.reports}
                          isExpanded={!!expandedGroups[group.id]}
                          onToggleExpand={handleToggleExpand}
                          idReporteSeleccionado={idReporteSeleccionado}
                          creandoReporte={creandoReporte}
                          manejarSeleccionarReporte={manejarSeleccionarReporte}
                          reportNumbers={reportNumbers}
                          isPinned={true}
                          onTogglePin={handleTogglePin}
                          showDate={true}
                        />
                      ))}
                    </div>
                  )}

                  {/* Unpinned Groups Section */}
                  {unpinnedGroups.length > 0 && (
                    <div className="space-y-1">
                      {unpinnedGroups.map((group) => (
                        <NovedadGroupItem
                          key={group.id}
                          id={group.id}
                          templateId={group.templateId}
                          templateName={group.templateName}
                          timeRange={group.timeRange}
                          reports={group.reports}
                          isExpanded={!!expandedGroups[group.id]}
                          onToggleExpand={handleToggleExpand}
                          idReporteSeleccionado={idReporteSeleccionado}
                          creandoReporte={creandoReporte}
                          manejarSeleccionarReporte={manejarSeleccionarReporte}
                          reportNumbers={reportNumbers}
                          isPinned={false}
                          onTogglePin={handleTogglePin}
                          showDate={true}
                        />
                      ))}
                    </div>
                  )}

                  {/* Timeline Section for Ungrouped Templates */}
                  {groupsWithGrouping.length > 0 && (
                    <div className="space-y-5">
                      {groupsWithGrouping.map((group, groupIndex) => (
                        <div
                          key={group.dateKey}
                          className="animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both"
                          style={{ animationDelay: `${groupIndex * 60}ms` }}
                        >
                          {/* Day separator header */}
                          <div className="flex items-center gap-2 px-1 mb-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate">
                              {group.label}
                            </span>
                            <div className="flex-1 h-px bg-border/60" />
                            <span className="text-[10px] text-muted-foreground/40 shrink-0 font-medium">
                              {group.reports.length}
                            </span>
                          </div>

                          {/* Reports for that day */}
                          <div className="space-y-1">
                            {group.items.map((item, itemIndex) => (
                              <div
                                key={item.isGroup ? item.id : item.report.id}
                                className="animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both"
                                style={{ animationDelay: `${groupIndex * 60 + itemIndex * 35}ms` }}
                              >
                                {item.isGroup ? (
                                  <NovedadGroupItem
                                    id={item.id}
                                    templateId={item.templateId}
                                    templateName={item.templateName}
                                    timeRange={item.timeRange}
                                    reports={item.reports}
                                    isExpanded={!!expandedGroups[item.id]}
                                    onToggleExpand={handleToggleExpand}
                                    idReporteSeleccionado={idReporteSeleccionado}
                                    creandoReporte={creandoReporte}
                                    manejarSeleccionarReporte={manejarSeleccionarReporte}
                                    reportNumbers={reportNumbers}
                                  />
                                ) : (
                                  <NovedadItem
                                    report={item.report}
                                    isSelected={idReporteSeleccionado === item.report.id && !creandoReporte}
                                    onSelect={manejarSeleccionarReporte}
                                    number={reportNumbers.get(item.report.id)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 sm:py-12 px-4 text-center animate-in fade-in duration-500 w-full">
                  {!guardiaAbierta && isMobile ? (
                    <NoGuardBanner
                      message="Para registrar novedades primero debes abrir una nueva guardia."
                      allowOpenHere
                    />
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-muted-foreground/10 opacity-60">
                        <Search className="h-7 w-7 opacity-20" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground/70 tracking-tight">Sin resultados</h3>
                        <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                          No se encontraron reportes registrados.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )
            ) : (
              groupsWithGrouping.length > 0 ? (
                <div className="space-y-5">
                  {groupsWithGrouping.map((group, groupIndex) => (
                    <div
                      key={group.dateKey}
                      className="animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both"
                      style={{ animationDelay: `${groupIndex * 60}ms` }}
                    >
                      {/* Day separator header */}
                      <div className="flex items-center gap-2 px-1 mb-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate">
                          {group.label}
                        </span>
                        <div className="flex-1 h-px bg-border/60" />
                        <span className="text-[10px] text-muted-foreground/40 shrink-0 font-medium">
                          {group.reports.length}
                        </span>
                      </div>

                      {/* Reports for that day */}
                      <div className="space-y-1">
                        {group.items.map((item, itemIndex) => (
                          <div
                            key={item.isGroup ? item.id : item.report.id}
                            className="animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both"
                            style={{ animationDelay: `${groupIndex * 60 + itemIndex * 35}ms` }}
                          >
                            {item.isGroup ? (
                              <NovedadGroupItem
                                id={item.id}
                                templateName={item.templateName}
                                timeRange={item.timeRange}
                                reports={item.reports}
                                isExpanded={!!expandedGroups[item.id]}
                                onToggleExpand={handleToggleExpand}
                                idReporteSeleccionado={idReporteSeleccionado}
                                creandoReporte={creandoReporte}
                                manejarSeleccionarReporte={manejarSeleccionarReporte}
                                reportNumbers={reportNumbers}
                              />
                            ) : (
                              <NovedadItem
                                report={item.report}
                                isSelected={idReporteSeleccionado === item.report.id && !creandoReporte}
                                onSelect={manejarSeleccionarReporte}
                                number={reportNumbers.get(item.report.id)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 sm:py-12 px-4 text-center animate-in fade-in duration-500 w-full">
                  {!guardiaAbierta && isMobile ? (
                    <NoGuardBanner
                      message="Para registrar novedades primero debes abrir una nueva guardia."
                      allowOpenHere
                    />
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-muted-foreground/10 opacity-60">
                        <Search className="h-7 w-7 opacity-20" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground/70 tracking-tight">Sin resultados</h3>
                        <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                          No se encontraron reportes registrados.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )}
</aside>
  );
};
