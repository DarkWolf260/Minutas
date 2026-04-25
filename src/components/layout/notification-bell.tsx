'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/lib/notifications-provider';
import { useSyncManager } from '@/hooks/use-sync';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
  const navigate = useNavigate();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [discardingId, setDiscardingId] = useState<string | null>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const {
    inboxReports,
    importFromInbox,
    discardFromInbox,
    isPrimary,
    syncConfig,
  } = useSyncManager();

  /** Find the SyncReport object for a notification's syncReportId. */
  const getSyncReport = (syncReportId: string) =>
    inboxReports.find((r) => r.id === syncReportId) ?? null;

  const handleImport = async (
    e: React.MouseEvent,
    notifId: string,
    syncReportId: string
  ) => {
    e.stopPropagation();
    const syncReport = getSyncReport(syncReportId);
    if (!syncReport) return;
    setImportingId(syncReportId);
    await importFromInbox(syncReport);
    await markAsRead(notifId);
    setImportingId(null);
  };

  const handleDiscard = async (
    e: React.MouseEvent,
    notifId: string,
    syncReportId: string
  ) => {
    e.stopPropagation();
    const syncReport = getSyncReport(syncReportId);
    if (syncReport) {
      setDiscardingId(syncReportId);
      await discardFromInbox(syncReport);
      setDiscardingId(null);
    }
    await markAsRead(notifId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':   return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? '+9' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Notificaciones</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `Tienes ${unreadCount} mensajes sin leer.`
                : 'No tienes mensajes nuevos.'}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => markAllAsRead()}
                title="Marcar todo como leído"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => clearAll()}
                title="Limpiar todo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Separator />

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <BellOff className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">No hay notificaciones recientes.</p>
            </div>
          ) : (
            <div className="grid gap-1 p-2">
              {notifications.map((notification) => {
                const syncReportId = notification.metadata?.syncReportId as string | undefined;
                const syncReport = syncReportId ? getSyncReport(syncReportId) : null;
                const isInboxNotif = isPrimary &&
                  syncConfig.importMode === 'inbox' &&
                  !!syncReportId;
                const canAct = isInboxNotif && !!syncReport; // report still pending

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative flex select-none items-start gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent',
                      !notification.read && 'bg-accent/40',
                      !isInboxNotif && 'cursor-default'
                    )}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (syncReportId && !canAct) navigate('/settings/sync');
                    }}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('font-medium leading-none truncate', !notification.read && 'text-foreground')}>
                          {notification.title}
                        </p>
                        <time className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Inline action buttons for sync inbox notifications */}
                      {isInboxNotif && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {canAct ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[11px] text-green-600 border-green-500/30 hover:bg-green-500/10"
                                disabled={importingId === syncReportId}
                                onClick={(e) => handleImport(e, notification.id, syncReportId!)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {importingId === syncReportId ? 'Importando...' : 'Importar'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                                disabled={discardingId === syncReportId}
                                onClick={(e) => handleDiscard(e, notification.id, syncReportId!)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Descartar
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Ya importado
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!notification.read && (
                      <span className="absolute right-2 top-1/2 flex h-2 w-2 -translate-y-1/2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
