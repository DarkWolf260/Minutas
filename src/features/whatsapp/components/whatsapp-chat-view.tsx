import React, { useRef, useEffect, useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MessageSquare,
  Shield,
  Loader2,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { WhatsAppChatHeader } from './whatsapp-chat-header';
import { WhatsAppChatBubble } from './whatsapp-chat-bubble';
import { WhatsAppChatInput } from './whatsapp-chat-input';
import { useWhatsAppChat } from '../hooks';
import type { UseWhatsAppChatOptions, WhatsAppMessage } from '../types';
import type { Report } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

export interface WhatsAppChatViewProps extends UseWhatsAppChatOptions {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onOpenCreateDialog?: () => void;
  className?: string;
  onBack?: () => void;
  onCollapse?: () => void;
}

/**
 * Agrupa mensajes de imagen consecutivos del mismo remitente enviados en un intervalo
 * corto (≤60s) en una sola burbuja de álbum (mosaico), al igual que WhatsApp nativo.
 */
/**
 * Agrupa mensajes de imagen estrictamente consecutivos del mismo remitente enviados en una ráfaga
 * simultánea (≤5s) en una sola burbuja de álbum (mosaico), al igual que WhatsApp nativo.
 *
 * Reglas de consistencia:
 * 1. Solo agrupa mensajes con `type === 'image'`.
 * 2. Si hay texto ('chat'), audio, video, documento o mensaje de otro remitente en medio, la agrupación se detiene de inmediato.
 * 3. Si más de una imagen tiene su propio pie de texto (caption) distinto, NO se agrupan (se muestran individuales con su texto).
 * 4. Deduplica fotos dentro del grupo por ID, mediaUrl y miniatura idéntica.
 * 5. Los stubs de tipo 'album' no se agregan como fotos para evitar duplicados.
 */
export function groupMessagesIntoAlbums(messages: WhatsAppMessage[]): WhatsAppMessage[] {
  if (!messages || messages.length === 0) return [];
  const result: WhatsAppMessage[] = [];
  const n = messages.length;
  let i = 0;

  const isImageMsg = (m?: WhatsAppMessage | null): boolean =>
    Boolean(m && !m.isRevoked && m.type === 'image');

  const isAlbumStub = (m?: WhatsAppMessage | null): boolean =>
    Boolean(m && !m.isRevoked && m.type === 'album');

  const MAX_ALBUM_GAP_MS = 5000; // Máximo 5 segundos entre imágenes enviadas en el mismo lote

  while (i < n) {
    const current = messages[i];
    if (!current) {
      i++;
      continue;
    }

    if (isImageMsg(current) || isAlbumStub(current)) {
      const senderKey = `${current.fromMe ? 'me' : (current.author || current.from || '')}`;
      const group: WhatsAppMessage[] = [];
      const seenPhotoIds = new Set<string>();
      const seenMediaUrls = new Set<string>();
      const seenThumbnails = new Set<string>();

      let j = i;
      let albumStubId: string | null = null;
      let combinedCaption = '';
      let combinedQuotedMsg = current.quotedMsg || null;
      let captionsCount = 0;

      while (j < n) {
        const next = messages[j];
        if (!next) break;

        const nextSender = `${next.fromMe ? 'me' : (next.author || next.from || '')}`;
        if (nextSender !== senderKey) break;

        const timeDiff = Math.abs(next.timestamp - current.timestamp);
        if (timeDiff > MAX_ALBUM_GAP_MS) break;

        if (isImageMsg(next)) {
          const hasCaption = Boolean(next.body && next.body.trim());
          if (hasCaption && captionsCount >= 1) {
            // Un segundo mensaje con texto explicativo propio no puede pertenecer al mismo álbum.
            // Rompe la ráfaga aquí para que sea procesado como mensaje o reporte independiente.
            break;
          }

          // Comprobar si esta imagen ya está en el grupo (deduplicación defensiva)
          const isDuplicate =
            seenPhotoIds.has(next.id) ||
            (Boolean(next.mediaUrl) && seenMediaUrls.has(next.mediaUrl!)) ||
            (Boolean(next.thumbnail) && seenThumbnails.has(next.thumbnail!));

          if (!isDuplicate) {
            seenPhotoIds.add(next.id);
            if (next.mediaUrl) seenMediaUrls.add(next.mediaUrl);
            if (next.thumbnail) seenThumbnails.add(next.thumbnail);
            group.push(next);

            if (hasCaption) {
              captionsCount++;
              if (!combinedCaption) {
                combinedCaption = next.body.trim();
              }
            }
          }

          if (next.quotedMsg && !combinedQuotedMsg) {
            combinedQuotedMsg = next.quotedMsg;
          }
          j++;
        } else if (isAlbumStub(next)) {
          albumStubId = next.id;
          if (next.body && next.body.trim() && !combinedCaption) {
            combinedCaption = next.body.trim();
          }
          if (next.quotedMsg && !combinedQuotedMsg) {
            combinedQuotedMsg = next.quotedMsg;
          }
          j++;
        } else {
          // Cualquier otro tipo de mensaje (chat de texto, audio, video, etc.) ROMPE la ráfaga
          break;
        }
      }

      if (group.length > 1) {
        const first = group[0];
        const last = group[group.length - 1];
        if (first && last) {
          const albumMsg: WhatsAppMessage = {
            ...first,
            id: albumStubId || `album_${first.id}`,
            fromMe: first.fromMe ?? false,
            type: 'album',
            hasMedia: true,
            body: combinedCaption || first.body || '',
            quotedMsg: combinedQuotedMsg,
            hasQuotedMsg: Boolean(combinedQuotedMsg),
            albumMessages: group,
            timestamp: last.timestamp || first.timestamp,
            ack: last.ack ?? first.ack
          };
          result.push(albumMsg);
          i = j;
          continue;
        }
      } else if (group.length === 1 && group[0]) {
        result.push(group[0]);
        i = j;
        continue;
      } else if (group.length === 0 && albumStubId) {
        i = j;
        continue;
      }
    }

    result.push(current);
    i++;
  }

  return result;
}

export function WhatsAppChatView({
  reports,
  templates,
  selectedReportId,
  onSelectReport,
  guardiaAbierta,
  initialChatId,
  externalActiveChatId,
  onChatChange,
  isExpanded,
  onToggleExpand,
  onOpenCreateDialog,
  className,
  onBack,
  onCollapse
}: WhatsAppChatViewProps) {
  const navigate = useNavigate();
  const chatHook = useWhatsAppChat({
    reports,
    templates,
    selectedReportId,
    onSelectReport,
    guardiaAbierta,
    initialChatId,
    externalActiveChatId,
    onChatChange
  });

  const {
    currentChat,
    realMessages,
    isLoadingMessages,
    isBotReady,
    bot,
    handleSendReportToChat
  } = chatHook;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Deduplicación defensiva en el render y agrupación automática en álbumes estilo WhatsApp
  const displayedMessages = useMemo(() => {
    const renderedIds = new Set<string>();
    const renderedFingerprints = new Set<string>();

      const deduplicated = realMessages.filter(msg => {
        if (!msg || !msg.id) return false;
        if (renderedIds.has(msg.id)) return false;
        renderedIds.add(msg.id);

        const cleanBody = (msg.body || '').trim();
        const sender = msg.fromMe ? 'me' : (msg.author || msg.from || 'unknown');
        const roundedTs = Math.round(msg.timestamp / 3000); // Bloques de 3s
        const mediaSignature = msg.thumbnail || msg.mediaUrl || '';
        const fingerprint = cleanBody
          ? `${sender}_${roundedTs}_${cleanBody}`
          : `${sender}_${roundedTs}_${msg.type}_${mediaSignature}`;

        if (fingerprint && renderedFingerprints.has(fingerprint)) {
          return false;
        }
        if (fingerprint) {
          renderedFingerprints.add(fingerprint);
        }
        return true;
      });

      return groupMessagesIntoAlbums(deduplicated);
    }, [realMessages]);

    // Auto-scroll to bottom on mount or new messages
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
      scrollToBottom('auto');
    }, [currentChat?.id, displayedMessages.length]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
      setShowScrollBottom(!isNearBottom);
    };

    // Mapa de nombres de contactos reales obtenidos desde bot.chats
    const contactNameMap = useMemo(() => {
      const map = new Map<string, string>();
      if (bot.chats && bot.chats.length > 0) {
        bot.chats.forEach(c => {
          if (c.id && c.name && !/^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, ''))) {
            const clean = c.name.trim();
            map.set(c.id, clean);
            if (c.id.includes('@')) {
              const u = c.id.split('@')[0];
              if (u) {
                map.set(`${u}@c.us`, clean);
                map.set(`${u}@lid`, clean);
                map.set(u, clean);
              }
            }
          }
        });
      }
      return map;
    }, [bot.chats]);

    // Mapa de avatares de contactos reales obtenidos desde bot.chats
    const contactAvatarMap = useMemo(() => {
      const map = new Map<string, string>();
      if (bot.chats && bot.chats.length > 0) {
        bot.chats.forEach(c => {
          if (c.id && c.avatarUrl) {
            map.set(c.id, c.avatarUrl);
            if (c.id.includes('@')) {
              const u = c.id.split('@')[0];
              if (u) {
                map.set(`${u}@c.us`, c.avatarUrl);
                map.set(`${u}@lid`, c.avatarUrl);
                map.set(u, c.avatarUrl);
              }
            }
          }
        });
      }
      return map;
    }, [bot.chats]);

    return (
      <div
        className={cn(
          'flex flex-col h-full w-full bg-[#efeae2]/40 dark:bg-[#0b141a] overflow-hidden relative',
          className
        )}
      >
        {/* Background Wallpaper Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.045] bg-repeat z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Header */}
        <WhatsAppChatHeader
          chatHook={chatHook}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onBack={onBack}
          onCollapse={onCollapse}
        />

        {/* Messages Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-1 sm:px-2 py-3 z-10 space-y-2 relative"
        >
          {/* Date / Chat Banner */}
          <div className="flex justify-center my-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-background/80 text-muted-foreground shadow-xs border border-border/40 backdrop-blur-xs">
              {currentChat ? currentChat.name.toUpperCase() : 'CHAT DE WHATSAPP'}
            </span>
          </div>

          {/* Real WhatsApp Chat Feed */}
          {!isBotReady ? (
            <div className="p-4 my-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm text-center space-y-3">
              {bot.status.needsAuth && bot.status.qr ? (
                <div className="space-y-3">
                  <div className="font-bold text-xs text-foreground">
                    Escanea para vincular WhatsApp
                  </div>
                  <div className="p-3 bg-white rounded-xl inline-block shadow-xs border">
                    <QRCodeSVG value={bot.status.qr} size={160} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Abre WhatsApp en tu teléfono &gt; Dispositivos vinculados &gt; Vincular dispositivo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-xs text-foreground">Bot de WhatsApp Desconectado</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Para leer y enviar mensajes reales a {currentChat?.name || 'WhatsApp'}, enciende el bot local con <code>iniciar-bot.bat</code> o verifica la URL.
                  </p>
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bot.checkStatus(true)}
                      className="h-7 text-xs"
                    >
                      Reintentar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/settings?tab=sync')}
                      className="h-7 text-xs text-emerald-600"
                    >
                      Configuración
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : !currentChat ? (
            <div className="p-6 text-center text-xs text-muted-foreground my-8">
              Selecciona un chat en el selector superior para ver la conversación.
            </div>
          ) : isLoadingMessages && displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <span className="text-xs">Cargando mensajes...</span>
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground my-8">
              No se encontraron mensajes recientes en este chat.
            </div>
          ) : (
            displayedMessages.map(msg => (
              <WhatsAppChatBubble
                key={msg.id}
                message={msg}
                isGroup={Boolean(currentChat?.isGroup)}
                contactNameMap={contactNameMap}
                contactAvatarMap={contactAvatarMap}
                realMessages={realMessages}
              />
            ))
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute right-4 bottom-16 z-20 h-8 w-8 rounded-full bg-background/90 text-foreground border shadow-md flex items-center justify-center hover:bg-muted transition-transform active:scale-95"
            title="Bajar al último mensaje"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {/* Bottom Input */}
        <WhatsAppChatInput
          chatHook={chatHook}
        />
      </div>
    );
  }
