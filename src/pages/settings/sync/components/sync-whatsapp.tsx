import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  AlertTriangle,
  Loader2,
  Users,
  User,
  Search,
  Check,
  PanelLeft,
  PanelRight,
  RefreshCw,
  Trash2,
  Layers,
  X,
  Sparkles,
  Wifi,
  QrCode
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { useWhatsAppBot, type WhatsAppChat, getCleanAvatarUrl, useSafeMediaSrc } from '@/hooks/whatsapp';
import { useSettings } from '@/hooks/configuracion';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { normalizeString, cn } from '@/lib/utils';
import type { WhatsAppRecipientGroup } from '@/lib/types';
import { toast } from 'sonner';

function ChatAvatarItem({ chat }: { chat: WhatsAppChat }) {
  const cleanUrl = getCleanAvatarUrl(chat.avatarUrl);
  const { src: safeUrl, hasError } = useSafeMediaSrc(cleanUrl);

  if (safeUrl && !hasError) {
    return (
      <img
        src={safeUrl}
        alt={chat.name || ''}
        className="w-full h-full object-cover rounded-full"
      />
    );
  }

  return chat.isGroup ? (
    <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
  ) : (
    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
  );
}

export function SyncWhatsApp() {
  const { currentWorkspace } = useWorkspaceManager();
  const { settings, saveSettings } = useSettings();
  const [localUrl, setLocalUrl] = useState('http://localhost:3001');
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (settings?.whatsapp_local_url) {
      setLocalUrl(settings.whatsapp_local_url);
    }
  }, [settings?.whatsapp_local_url]);

  const handleLogout = async () => {
    await saveSettings({ whatsapp_default_chat_ids: [] });
    await bot.logout();
    toast.success('Sesión de WhatsApp cerrada');
  };

  const selectedIds = useMemo(() => {
    return settings?.whatsapp_default_chat_ids || [];
  }, [settings?.whatsapp_default_chat_ids]);

  const recipientGroups: WhatsAppRecipientGroup[] = useMemo(() => {
    return settings?.whatsapp_recipient_groups || [];
  }, [settings?.whatsapp_recipient_groups]);

  const handleToggleChat = async (chatId: string, rawName?: string) => {
    if (!settings) return;
    const cleanName = (rawName || chatId).replace(/@.*$/, '');
    let newIds: string[];

    if (selectedIds.includes(chatId)) {
      newIds = selectedIds.filter(id => id !== chatId);
      toast.success(`"${cleanName}" quitado de destinatarios`);
    } else {
      if (selectedIds.length >= 5) {
        setShowLimitAlert(true);
        return;
      }
      newIds = [...selectedIds, chatId];
      toast.success(`"${cleanName}" agregado como destinatario`);
    }
    await saveSettings({ whatsapp_default_chat_ids: newIds });
  };

  const handleClearRecipients = async () => {
    if (!settings || selectedIds.length === 0) return;
    await saveSettings({ whatsapp_default_chat_ids: [] });
    toast.success('Destinatarios activos limpiados');
  };

  const handleApplyGroup = async (group: WhatsAppRecipientGroup) => {
    if (!settings) return;
    if (group.chatIds.length > 5) {
      toast.warning(`El grupo tiene ${group.chatIds.length} chats. Se seleccionaron los primeros 5.`);
    }
    const newIds = group.chatIds.slice(0, 5);
    await saveSettings({ whatsapp_default_chat_ids: newIds });
    toast.success(`Grupo "${group.name}" activado (${newIds.length} destinatarios)`);
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!settings) return;
    const updated = recipientGroups.filter(g => g.id !== groupId);
    await saveSettings({ whatsapp_recipient_groups: updated });
    toast.success(`Grupo "${groupName}" eliminado`);
  };

  const handleRefreshChats = async () => {
    setIsRefreshing(true);
    try {
      await bot.loadChats();
      toast.success('Lista de chats actualizada');
    } catch {
      toast.error('No se pudo actualizar la lista de chats');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Chat Position: Default to 'right_form'
  const chatPosition = settings?.whatsapp_chat_position || 'right_form';

  const handleUpdateChatPosition = async (position: 'sidebar' | 'right_form') => {
    if (chatPosition === position) return;
    await saveSettings({ whatsapp_chat_position: position });
    toast.success(
      position === 'right_form'
        ? 'Chat configurado al lado derecho del formulario'
        : 'Chat integrado en el apartado de plantillas/lista'
    );
  };

  // Filtrado de chats unificados (ordenados por recencia, sin separar en pestañas o listas divididas)
  const filteredChats = useMemo(() => {
    const searchNorm = normalizeString(searchQuery);
    return (bot.chats || [])
      .filter(c => {
        if (!c.id) return false;
        const lower = c.id.toLowerCase().trim();
        if (
          lower === 'status@broadcast' ||
          lower.startsWith('status@') ||
          lower.includes('@broadcast') ||
          lower.includes('@newsletter')
        ) {
          return false;
        }
        if (!searchNorm) return true;
        return (
          normalizeString(c.name || '').includes(searchNorm) ||
          normalizeString(c.id || '').includes(searchNorm)
        );
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [bot.chats, searchQuery]);

  // Resolver destinatarios activos con nombres
  const activeRecipientChats = useMemo(() => {
    return selectedIds.map(id => {
      const found = (bot.chats || []).find(c => c.id === id);
      return {
        id,
        name: found?.name || id.replace(/@.*$/, ''),
        isGroup: found?.isGroup ?? id.endsWith('@g.us')
      };
    });
  }, [selectedIds, bot.chats]);

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl overflow-hidden shadow-xs">
      <CardHeader className="pb-4 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <MessageSquare className="h-4 w-4" />
            </div>
            Bot de WhatsApp
          </CardTitle>

          {bot.isAvailable && (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  bot.status.isReady
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    bot.status.isReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {bot.status.isReady ? 'Conectado' : 'Pendiente'}
              </div>
              {bot.status.isReady && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2 font-medium"
                >
                  Cerrar sesión
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {bot.conflictBotUrl && (
          <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 animate-pulse text-rose-500" />
            <div>
              <span className="font-bold">Conflicto de Bot Detectado:</span> Otro bot de WhatsApp
              diferente está conectado y activo en esta misma área de trabajo (Servidor:{' '}
              <code>{bot.conflictBotUrl}</code>).
              <p className="mt-1 font-semibold text-[11px] text-rose-500/90">
                Tener múltiples bots con cuentas distintas en un mismo área causará fallas en el envío
                y desalineación de contactos.
              </p>
            </div>
          </div>
        )}

        {/* Configuración de URL */}
        <div className="space-y-2 pb-4 border-b border-border/60">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            URL del Bot de WhatsApp
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="http://localhost:3001"
              value={localUrl}
              onChange={e => setLocalUrl(e.target.value)}
              className="bg-background/50 focus-visible:ring-emerald-500/30 border-muted/40 h-9 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await saveSettings({ whatsapp_local_url: localUrl });
                toast.success('URL del bot guardada');
              }}
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-9 px-4 font-semibold"
            >
              Conectar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Usa <code>http://localhost:3001</code> si corre en este equipo, o la IP local de red (ej:{' '}
            <code>http://192.168.1.50:3001</code>) si corre en otro dispositivo.
          </p>
        </div>

        {/* Disposición del Chat en Novedades (Default: right_form) */}
        <div className="space-y-3 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Disposición del Chat en Novedades
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configura dónde deseas visualizar el chat de WhatsApp dentro del módulo de novedades.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 1 (Predeterminado): Del lado derecho del formulario */}
            <button
              type="button"
              onClick={() => handleUpdateChatPosition('right_form')}
              className={cn(
                'relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all group cursor-pointer',
                chatPosition === 'right_form'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-border/70 hover:border-emerald-500/40 hover:bg-muted/40'
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    chatPosition === 'right_form'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  <PanelRight className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border-emerald-500/30"
                  >
                    Predeterminado
                  </Badge>
                  {chatPosition === 'right_form' && (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="font-bold text-xs text-foreground">
                Del Lado Derecho del Formulario
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                El chat se muestra como un panel derecho junto al formulario, permitiendo consultar y copiar mensajes mientras redactas el reporte.
              </p>
            </button>

            {/* Opción 2: Integrado en apartado de plantillas / lista lateral */}
            <button
              type="button"
              onClick={() => handleUpdateChatPosition('sidebar')}
              className={cn(
                'relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all group cursor-pointer',
                chatPosition === 'sidebar'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-border/70 hover:border-emerald-500/40 hover:bg-muted/40'
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    chatPosition === 'sidebar'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  <PanelLeft className="h-4 w-4" />
                </div>
                {chatPosition === 'sidebar' && (
                  <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <div className="font-bold text-xs text-foreground">
                Integrado en Plantillas / Lista
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                El chat se ubica en la barra lateral izquierda, alternando con la lista de reportes y plantillas existentes.
              </p>
            </button>
          </div>
        </div>

        {/* Estado y Contenido de WhatsApp */}
        {bot.isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span>Verificando estado del bot local...</span>
          </div>
        ) : !bot.isAvailable ? (
          bot.status.activeWorkspace && currentWorkspace && bot.status.activeWorkspace !== currentWorkspace ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm gap-3 px-4 text-center">
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <span className="font-bold text-foreground">Bot activo en otra área de trabajo</span>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                El dispositivo principal tiene el bot enlazado al área <strong>"{bot.status.activeWorkspace}"</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground/80 max-w-[260px]">
                Para interactuar con el bot, debes cambiar a esa misma área de trabajo o desvincularla en el dispositivo principal.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-3 px-4 text-center">
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <span className="font-bold text-foreground">Servidor de WhatsApp no disponible</span>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Asegúrate de que el bot de WhatsApp esté encendido y que la URL configurada sea accesible.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bot.checkStatus(true)}
                className="mt-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                Reintentar conexión
              </Button>
            </div>
          )
        ) : bot.status.needsAuth ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 justify-center">
              <QrCode className="h-4 w-4" /> Vinculación de WhatsApp Requerida
            </div>

            {bot.status.qr ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl border border-emerald-500/30 shadow-md">
                  <QRCodeSVG key={bot.status.qr} value={bot.status.qr} size={190} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Código QR sincronizado en tiempo real</span>
                </div>
                <div className="text-xs text-muted-foreground text-left max-w-sm space-y-1 bg-muted/30 p-3 rounded-xl border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Para vincular tu cuenta:</p>
                  <p>1. Abre WhatsApp en tu teléfono.</p>
                  <p>2. Ve a <strong>Dispositivos vinculados</strong> &gt; <strong>Vincular un dispositivo</strong>.</p>
                  <p>3. Apunta tu teléfono hacia este código QR para escanearlo.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-xl border-border/60 bg-muted/20 text-sm text-muted-foreground gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span>Generando código QR seguro...</span>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => bot.checkStatus(true)}
              className="w-full border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-600 h-9 font-semibold"
            >
              Comprobar estado
            </Button>
          </div>
        ) : bot.status.isReady ? (
          <div className="space-y-5">
            {/* Destinatarios Activos (Chips con remover rápido) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Destinatarios Activos ({selectedIds.length}/5)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Los reportes se enviarán a estos destinatarios seleccionados.
                  </p>
                </div>
                {selectedIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearRecipients}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 font-semibold"
                  >
                    Limpiar todos
                  </Button>
                )}
              </div>

              {activeRecipientChats.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-muted/20">
                  No hay destinatarios activos seleccionados. Marca chats en la lista inferior o activa un grupo de envío.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  {activeRecipientChats.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 bg-background border border-emerald-500/30 text-foreground px-2.5 py-1 rounded-full text-xs font-medium shadow-2xs group"
                    >
                      {item.isGroup ? (
                        <Users className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="truncate max-w-[140px]">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleChat(item.id, item.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grupos de Envío Creados */}
            {recipientGroups.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Grupos de Envío ({recipientGroups.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recipientGroups.map(grp => (
                    <div
                      key={grp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card hover:border-emerald-500/40 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{grp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{grp.chatIds.length} miembros</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplyGroup(grp)}
                          className="h-7 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-2 font-semibold"
                        >
                          Activar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(grp.id, grp.name)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista Unificada de Chats y Contactos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Chats y Contactos ({filteredChats.length})
                </label>
                <button
                  type="button"
                  onClick={handleRefreshChats}
                  disabled={isRefreshing}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
                  Recargar
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar chat o contacto..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-background/50 pl-9 focus-visible:ring-emerald-500/30 border-muted/40 h-9 text-sm"
                />
              </div>

              <ScrollArea className="h-64 border rounded-xl bg-background/30 backdrop-blur-sm overflow-hidden">
                {bot.chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                    <span className="text-xs font-medium">
                      {bot.status.statusMessage && bot.status.statusMessage !== 'Listo'
                        ? bot.status.statusMessage
                        : 'Cargando lista de chats de WhatsApp...'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRefreshChats}
                      className="text-xs text-emerald-600 hover:underline font-semibold mt-1"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No se encontraron chats que coincidan con "{searchQuery}".
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredChats.map(chat => {
                      const isChecked = selectedIds.includes(chat.id);
                      const displayName = (chat.name || chat.id).replace(/@.*$/, '');

                      return (
                        <div
                          key={chat.id}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer select-none group',
                            isChecked
                              ? 'bg-emerald-500/15 border border-emerald-500/30'
                              : 'hover:bg-muted/50 border border-transparent'
                          )}
                          onClick={() => handleToggleChat(chat.id, displayName)}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-muted">
                              <ChatAvatarItem chat={chat} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {displayName}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0 px-1.5 py-0.2 rounded-md bg-muted/60">
                                  {chat.isGroup ? 'Grupo' : 'Contacto'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={cn(
                              'h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ml-2',
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                                : 'border-muted-foreground/30 group-hover:border-emerald-500/50'
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="font-medium text-foreground">
              {bot.status.statusMessage || 'Iniciando cliente...'}
            </span>
            <p className="text-xs text-muted-foreground max-w-[250px] text-center">
              Esto puede tardar unos segundos mientras se sincronizan los datos con WhatsApp.
            </p>
          </div>
        )}

        {showLimitAlert && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-card border rounded-2xl p-6 shadow-xl max-w-sm text-center space-y-4 border-amber-500/30">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Límite de destinatarios alcanzado</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Por seguridad y para evitar bloqueos por parte de WhatsApp, el límite máximo permitido es de 5 destinatarios activos simultáneos.
              </p>
              <Button
                onClick={() => setShowLimitAlert(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
