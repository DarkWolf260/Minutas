import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWhatsAppBot } from './use-whatsapp-bot';
import { useSettings } from '@/hooks/configuracion';
import type { Report, Template } from '@/lib/types';
import { toast } from 'sonner';

import type { ChatItem, UseWhatsAppChatOptions, WhatsAppMessage, WhatsAppChat } from '../types';

export function useWhatsAppChat({
  reports,
  templates,
  selectedReportId,
  onSelectReport,
  guardiaAbierta,
  initialChatId,
  externalActiveChatId,
  onChatChange
}: UseWhatsAppChatOptions) {
  const { settings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');

  // Selected chat ID from real WhatsApp chats
  const [internalActiveChatId, setInternalActiveChatId] = useState<string>(() => {
    return initialChatId || externalActiveChatId || localStorage.getItem('minutas_active_whatsapp_chat') || settings?.whatsapp_default_chat_ids?.[0] || '';
  });

  const activeChatId = (externalActiveChatId !== undefined && externalActiveChatId !== null)
    ? externalActiveChatId
    : internalActiveChatId;

  const setActiveChatId = useCallback((id: string) => {
    setInternalActiveChatId(id);
    localStorage.setItem('minutas_active_whatsapp_chat', id);
    onChatChange?.(id);
  }, [onChatChange]);
  const [realMessages, setRealMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');

  const isBotReady = bot.isAvailable && bot.status.isReady;

  // Available chat targets from WhatsApp bot
  const chatList: ChatItem[] = useMemo(() => {
    if (!bot.chats || bot.chats.length === 0) {
      return [];
    }

    const validChats = bot.chats.filter(c => {
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
      return true;
    });

    // Prioritize default configured chats
    const defaultIds = settings?.whatsapp_default_chat_ids || [];
    const sortedBotChats = [...validChats].sort((a, b) => {
      const aFav = defaultIds.includes(a.id) ? 1 : 0;
      const bFav = defaultIds.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });

    return sortedBotChats.map(c => ({
      id: c.id,
      name: c.name || c.id,
      isGroup: c.isGroup,
      avatarUrl: c.avatarUrl || null
    }));
  }, [bot.chats, settings?.whatsapp_default_chat_ids]);

  // Auto-select chat when chat list is loaded
  useEffect(() => {
    if (chatList.length > 0) {
      const isValid = chatList.some(c => c.id === activeChatId);
      if (!activeChatId || !isValid) {
        const defaultIds = settings?.whatsapp_default_chat_ids || [];
        const preferred = chatList.find(c => defaultIds.includes(c.id));
        setActiveChatId(preferred ? preferred.id : chatList[0]!.id);
      }
    }
  }, [chatList, activeChatId, settings?.whatsapp_default_chat_ids]);

  const currentChat: ChatItem | null = useMemo(() => {
    return chatList.find(c => c.id === activeChatId) || (chatList.length > 0 ? chatList[0]! : null);
  }, [chatList, activeChatId]);

  const botRef = useRef(bot);
  useEffect(() => {
    botRef.current = bot;
  }, [bot]);

  // Fetch real messages when active chat is a real WhatsApp chat
  const loadRealMessages = useCallback(async (silent = false) => {
    if (!activeChatId) {
      setRealMessages([]);
      return;
    }

    if (!silent) setIsLoadingMessages(true);
    try {
      const msgs = await botRef.current.fetchChatMessages(activeChatId, 40);

      // 1. Deduplicar mensajes entrantes por ID y huella
      const seenIds = new Set<string>();
      const seenFingerprints = new Set<string>();
      const uniqueIncoming: WhatsAppMessage[] = [];

      for (const m of msgs) {
        if (!m || !m.id) continue;
        if (seenIds.has(m.id)) continue;
        seenIds.add(m.id);

        const cleanBody = (m.body || '').trim();
        const sender = m.fromMe ? 'me' : (m.author || m.from || 'unknown');
        const roundedTs = Math.round(m.timestamp / 2000); // Bloques de 2s
        const fingerprint = `${sender}_${roundedTs}_${cleanBody}`;

        if (cleanBody && seenFingerprints.has(fingerprint)) {
          continue;
        }
        if (cleanBody) {
          seenFingerprints.add(fingerprint);
        }

        uniqueIncoming.push(m);
      }

      setRealMessages(prev => {
        // 2. Conciliar mensajes optimistas/temporales (temp_...)
        const pendingTemps = prev.filter(p => p.id.startsWith('temp_'));
        const remainingTemps = pendingTemps.filter(temp => {
          const alreadyConfirmed = uniqueIncoming.some(real =>
            real.fromMe &&
            (real.body || '').trim() === (temp.body || '').trim() &&
            Math.abs(real.timestamp - temp.timestamp) < 30000
          );
          return !alreadyConfirmed;
        });

        // 3. Combinar mensajes reales confirmados con temps aún pendientes
        const combined = [...uniqueIncoming, ...remainingTemps];
        combined.sort((a, b) => a.timestamp - b.timestamp);

        // 4. Deduplicación final defensiva
        const finalSet = new Set<string>();
        const finalResult: WhatsAppMessage[] = [];
        for (const item of combined) {
          if (finalSet.has(item.id)) continue;
          finalSet.add(item.id);
          finalResult.push(item);
        }

        // Si la lista es idéntica en longitud y último elemento, preservar referencia
        if (prev.length === finalResult.length && prev.length > 0) {
          const lastPrev = prev[prev.length - 1];
          const lastNew = finalResult[finalResult.length - 1];
          if (lastPrev?.id === lastNew?.id && lastPrev?.timestamp === lastNew?.timestamp) {
            return prev;
          }
        }
        return finalResult;
      });
    } catch (err) {
      if (!silent) {
        console.error('Error cargando mensajes de WhatsApp:', err);
      }
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, [activeChatId]);

  // Load chats on mount / when bot is ready
  useEffect(() => {
    if (isBotReady && bot.chats.length === 0) {
      botRef.current.loadChats();
    }
  }, [isBotReady, bot.chats.length]);

  // Poll messages if looking at a real WhatsApp chat
  useEffect(() => {
    if (activeChatId && isBotReady) {
      loadRealMessages(false);

      const timer = setInterval(() => {
        loadRealMessages(true);
      }, 4000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [activeChatId, isBotReady, loadRealMessages]);

  // Send message
  const handleSendMessage = useCallback(async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : messageText).trim();
    if (!textToSend || !activeChatId || isSending) return;

    setIsSending(true);
    try {
      const res = await bot.sendMessage(activeChatId, textToSend);

      // Usar ID real devuelto por el bot si está disponible, o temporal
      const realId = res?.messageId && typeof res.messageId === 'string' && !res.messageId.startsWith('dedup_')
        ? res.messageId
        : `temp_${Date.now()}`;

      // Optimistic local add
      const newMsg: WhatsAppMessage = {
        id: realId,
        body: textToSend,
        type: 'chat',
        timestamp: Date.now(),
        fromMe: true,
        from: 'me',
        to: activeChatId,
        author: null,
        senderName: 'Tú',
        hasMedia: false,
        ack: 1
      };
      setRealMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setMessageText('');
    } catch (err: any) {
      toast.error('Error al enviar mensaje', {
        description: err?.message || 'Verifica la conexión del bot'
      });
    } finally {
      setIsSending(false);
    }
  }, [messageText, activeChatId, bot, isSending]);

  // Send a specific report/novedad to WhatsApp
  const handleSendReportToChat = useCallback(async (report: Report, targetChatId?: string) => {
    const destinationId = targetChatId || activeChatId || (settings?.whatsapp_default_chat_ids || [])[0];
    
    if (!destinationId) {
      toast.error('Selecciona un chat destino en el selector superior');
      return;
    }

    if (!isBotReady) {
      toast.error('Bot de WhatsApp no conectado', {
        description: 'Enciende el bot en iniciar-bot.bat para enviar novedades.'
      });
      return;
    }

    const toastId = toast.loading('Enviando novedad a WhatsApp...');
    try {
      const photosToSend = (report.photos || []).map(p => ({
        id: p.id,
        url: p.url,
        name: p.name,
        description: p.description,
        local_blob_id: p.local_blob_id
      }));

      const bodyText = `📋 *${report.title}*\n\n${report.content || ''}`.trim();
      await bot.sendMessage(destinationId, bodyText, photosToSend);
      toast.success('Novedad enviada con éxito', { id: toastId });
    } catch (err: any) {
      toast.error('Error al enviar la novedad', {
        id: toastId,
        description: err?.message || 'Falló la comunicación con el bot'
      });
    }
  }, [activeChatId, settings?.whatsapp_default_chat_ids, isBotReady, bot]);

  return {
    bot,
    isBotReady,
    activeChatId,
    setActiveChatId,
    currentChat,
    chatList,
    realMessages,
    isLoadingMessages,
    isSending,
    messageText,
    setMessageText,
    handleSendMessage,
    handleSendReportToChat,
    refreshMessages: () => loadRealMessages(false),
    reports,
    templates,
    selectedReportId,
    onSelectReport,
    guardiaAbierta
  };
}

export type UseWhatsAppChatReturn = ReturnType<typeof useWhatsAppChat>;
