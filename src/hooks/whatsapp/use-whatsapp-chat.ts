import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWhatsAppBot, type WhatsAppMessage, type WhatsAppChat } from './use-whatsapp-bot';
import { useSettings } from '@/hooks/configuracion';
import type { Report, Template } from '@/lib/types';
import { toast } from 'sonner';

export interface ChatItem {
  id: string;
  name: string;
  isGroup: boolean;
  isGuardNovedades?: boolean;
}

export const GUARD_NOVEDADES_CHAT_ID = 'guardia-novedades';

export interface UseWhatsAppChatOptions {
  reports: Report[];
  templates: Template[];
  selectedReportId: string | null;
  onSelectReport: (id: string | null) => void;
  guardiaAbierta: boolean;
}

export function useWhatsAppChat({
  reports,
  templates,
  selectedReportId,
  onSelectReport,
  guardiaAbierta
}: UseWhatsAppChatOptions) {
  const { settings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');

  // Selected chat tab: either 'guardia-novedades' or a real WhatsApp chat ID
  const [activeChatId, setActiveChatId] = useState<string>(GUARD_NOVEDADES_CHAT_ID);
  const [realMessages, setRealMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isBotReady = bot.isAvailable && bot.status.isReady;

  // Available chat targets: Guard Novedades first, then bot chats
  const chatList: ChatItem[] = useMemo(() => {
    const list: ChatItem[] = [
      {
        id: GUARD_NOVEDADES_CHAT_ID,
        name: 'Novedades de Guardia (Turno)',
        isGroup: true,
        isGuardNovedades: true
      }
    ];

    if (bot.chats && bot.chats.length > 0) {
      // Prioritize default configured chats
      const defaultIds = settings?.whatsapp_default_chat_ids || [];
      const sortedBotChats = [...bot.chats].sort((a, b) => {
        const aFav = defaultIds.includes(a.id) ? 1 : 0;
        const bFav = defaultIds.includes(b.id) ? 1 : 0;
        return bFav - aFav;
      });

      sortedBotChats.forEach(c => {
        list.push({
          id: c.id,
          name: c.name || c.id,
          isGroup: c.isGroup,
          isGuardNovedades: false
        });
      });
    }

    return list;
  }, [bot.chats, settings?.whatsapp_default_chat_ids]);

  const currentChat = useMemo(() => {
    return chatList.find(c => c.id === activeChatId) || chatList[0]!;
  }, [chatList, activeChatId]);

  const botRef = useRef(bot);
  useEffect(() => {
    botRef.current = bot;
  }, [bot]);

  // Fetch real messages when active chat is a real WhatsApp chat
  const loadRealMessages = useCallback(async (silent = false) => {
    if (activeChatId === GUARD_NOVEDADES_CHAT_ID) {
      setRealMessages([]);
      return;
    }

    if (!silent) setIsLoadingMessages(true);
    try {
      const msgs = await botRef.current.fetchChatMessages(activeChatId, 40);
      setRealMessages(msgs);
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
    if (activeChatId !== GUARD_NOVEDADES_CHAT_ID && isBotReady) {
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
    if (!textToSend) return;

    setIsSending(true);
    try {
      if (activeChatId === GUARD_NOVEDADES_CHAT_ID) {
        // If in Guard Novedades mode, sending a message can send to all configured WhatsApp chats if bot is ready
        const defaultChatIds = settings?.whatsapp_default_chat_ids || [];
        if (isBotReady && defaultChatIds.length > 0) {
          for (const cId of defaultChatIds) {
            await bot.sendMessage(cId, textToSend);
          }
          toast.success(`Mensaje enviado a ${defaultChatIds.length} chat(s) de WhatsApp`);
        } else {
          toast.info('Mensaje redactado.', {
            description: isBotReady 
              ? 'Selecciona un chat destino o configura chats en Sincronización.'
              : 'Conecta el bot de WhatsApp para enviar mensajes directos.'
          });
        }
      } else {
        // Send to the active real WhatsApp chat
        await bot.sendMessage(activeChatId, textToSend);
        
        // Optimistic local add
        const newMsg: WhatsAppMessage = {
          id: `temp_${Date.now()}`,
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
        setRealMessages(prev => [...prev, newMsg]);
        toast.success('Mensaje enviado');
      }

      setMessageText('');
    } catch (err: any) {
      toast.error('Error al enviar mensaje', {
        description: err?.message || 'Verifica la conexión del bot'
      });
    } finally {
      setIsSending(false);
    }
  }, [messageText, activeChatId, settings?.whatsapp_default_chat_ids, isBotReady, bot]);

  // Send a specific report/novedad to WhatsApp
  const handleSendReportToChat = useCallback(async (report: Report, targetChatId?: string) => {
    const destinationId = targetChatId || (activeChatId !== GUARD_NOVEDADES_CHAT_ID ? activeChatId : (settings?.whatsapp_default_chat_ids || [])[0]);
    
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
