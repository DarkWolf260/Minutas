const { Location, MessageMedia } = require('whatsapp-web.js');
const state = require('../state');
const { MAX_RECENT_MESSAGES } = require('../config');
const { extractWidString } = require('../utils/formatters');
const { extractThumbnail, isRawBase64Image } = require('../utils/media');
const { extractLocation } = require('../utils/location');

const MAX_MEDIA_CACHE = 100;

async function resolveQuotedMsg(msg, isGroupChat) {
  try {
    let qData = msg._data?.quotedMsg;
    let quotedMessageInstance = null;

    if (typeof msg.getQuotedMessage === 'function') {
      try {
        quotedMessageInstance = await msg.getQuotedMessage();
      } catch (getQuotedErr) {
        // Fallback silencioso a msg._data.quotedMsg
      }
    }

    if (!qData && !quotedMessageInstance) {
      return null;
    }

    const qIsRevoked = Boolean(
      quotedMessageInstance?.type === 'revoked' ||
      qData?.type === 'revoked' ||
      quotedMessageInstance?._data?.type === 'revoked' ||
      quotedMessageInstance?._data?.isRevoked === true ||
      quotedMessageInstance?._data?.subtype === 'sender_revoke' ||
      quotedMessageInstance?._data?.subtype === 'admin_revoke' ||
      qData?.subtype === 'sender_revoke' ||
      qData?.subtype === 'admin_revoke'
    );

    const qType = quotedMessageInstance?.type || qData?.type || 'chat';
    const qFromMe = Boolean(quotedMessageInstance?.fromMe ?? (qData?.id?.fromMe || qData?.fromMe));

    // Remitente del mensaje citado
    let qSenderName = null;
    if (qFromMe) {
      qSenderName = 'Tú';
    } else {
      let rawAuthor = quotedMessageInstance?.author || qData?.author || qData?.from || quotedMessageInstance?.from;
      let qAuthorId = extractWidString(rawAuthor);

      if (qAuthorId && state.contactNameCache.has(qAuthorId)) {
        qSenderName = state.contactNameCache.get(qAuthorId);
      } else if (qAuthorId && typeof qAuthorId === 'string' && qAuthorId.includes('@')) {
        const u = qAuthorId.split('@')[0];
        qSenderName = state.contactNameCache.get(`${u}@c.us`) || state.contactNameCache.get(`${u}@lid`);
      }

      const explicitName = qData?.notifyName || quotedMessageInstance?._data?.notifyName || quotedMessageInstance?._data?.name;
      if (!qSenderName && explicitName && typeof explicitName === 'string' && explicitName.trim()) {
        const clean = explicitName.trim();
        if (!/^\+?\d{7,}$/.test(clean.replace(/[\s\-\(\)]/g, ''))) {
          qSenderName = clean;
        }
      }

      if (!qSenderName && qAuthorId && typeof qAuthorId === 'string' && qAuthorId.includes('@')) {
        const raw = qAuthorId.split('@')[0];
        qSenderName = /^\d{7,15}$/.test(raw) ? `+${raw}` : raw;
      } else if (qAuthorId) {
        qSenderName = String(qAuthorId);
      } else {
        qSenderName = 'Contacto';
      }
    }

    const qLocation = extractLocation(quotedMessageInstance) || extractLocation(qData);

    const isMediaMsg = Boolean(
      quotedMessageInstance?.hasMedia ||
      qData?.isMedia ||
      qData?.hasMedia ||
      ['image', 'video', 'document', 'audio', 'ptt', 'sticker'].includes(qType)
    );

    let qThumbnail = null;
    if (isMediaMsg || qLocation || qType === 'location' || qType === 'live_location') {
      const rawCandidate = qData?.body || quotedMessageInstance?._data?.body || quotedMessageInstance?.body;
      if (rawCandidate && typeof rawCandidate === 'string') {
        qThumbnail = extractThumbnail(rawCandidate);
      }
      if (!qThumbnail && (qData?.thumbnail || quotedMessageInstance?._data?.thumbnail)) {
        qThumbnail = extractThumbnail(qData?.thumbnail || quotedMessageInstance?._data?.thumbnail);
      }
      if (!qThumbnail && (qData?.mediaData?.preview || quotedMessageInstance?._data?.mediaData?.preview)) {
        qThumbnail = extractThumbnail(qData?.mediaData?.preview || quotedMessageInstance?._data?.mediaData?.preview);
      }
    }

    const candidateBody = qData?.caption || quotedMessageInstance?.body || qData?.body || '';
    let qBody = '';
    if (qIsRevoked) {
      qBody = 'Este mensaje fue eliminado';
    } else if (candidateBody && typeof candidateBody === 'string' && !isRawBase64Image(candidateBody)) {
      qBody = candidateBody.trim();
    }

    const qHasMedia = Boolean((isMediaMsg || qLocation) && (qThumbnail || quotedMessageInstance?.hasMedia || qData?.isMedia));

    if (!qBody && !qIsRevoked) {
      if (qType === 'image') qBody = 'Foto';
      else if (qType === 'video') qBody = 'Video';
      else if (qType === 'audio' || qType === 'ptt') qBody = 'Nota de voz';
      else if (qType === 'document') qBody = 'Documento';
      else if (qType === 'sticker') qBody = 'Sticker';
      else if (qLocation || qType === 'location' || qType === 'live_location') {
        qBody = qLocation?.name || qLocation?.description || (qLocation?.isLive ? 'Ubicación en tiempo real' : 'Ubicación');
      }
    }

    let qMsgId = quotedMessageInstance?.id?._serialized || qData?.id?._serialized || null;
    if (!qMsgId && typeof qData?.id === 'string' && qData.id.includes('_')) {
      qMsgId = qData.id;
    }
    if (!qMsgId && msg._data?.quotedStanzaID) {
      const stanzaId = msg._data.quotedStanzaID;
      const remote = msg.id?.remote || msg.to || msg.from;
      const remoteStr = extractWidString(remote);
      if (remoteStr) {
        qMsgId = `${qFromMe ? 'true' : 'false'}_${remoteStr}_${stanzaId}`;
      }
    }

    if (quotedMessageInstance && quotedMessageInstance.id?._serialized) {
      state.recentMessagesCache.set(quotedMessageInstance.id._serialized, quotedMessageInstance);
      if (msg._data?.quotedStanzaID) {
        state.recentMessagesCache.set(msg._data.quotedStanzaID, quotedMessageInstance);
      }
    }

    return {
      id: qMsgId,
      body: qBody,
      type: qType,
      fromMe: qFromMe,
      senderName: qSenderName || (qFromMe ? 'Tú' : 'Contacto'),
      hasMedia: qHasMedia,
      thumbnail: qThumbnail,
      location: qLocation,
      mediaUrl: (qHasMedia && qMsgId && qMsgId.includes('_')) ? `/api/whatsapp/messages/${encodeURIComponent(qMsgId)}/media` : null,
      isRevoked: qIsRevoked
    };
  } catch (err) {
    console.warn('[QuotedMsg] Error resolviendo mensaje citado:', err?.message || err);
    return null;
  }
}

async function fetchChatMessages(targetChatId, limit = 50) {
  if (!state.isReady || !state.client) {
    const error = new Error('WhatsApp client is not ready');
    error.status = 400;
    throw error;
  }

  const chat = await state.client.getChatById(targetChatId);
  if (!chat) {
    const error = new Error('Chat no encontrado');
    error.status = 404;
    throw error;
  }

  const messages = await chat.fetchMessages({ limit });

  // 1. Guardar en caché nombres reales ya presentes en los mensajes
  messages.forEach(msg => {
    const authorId = extractWidString(msg.author || msg.from);
    const explicitName = msg._data?.notifyName || msg._data?.name;
    if (authorId && explicitName && typeof explicitName === 'string' && explicitName.trim()) {
      const cleanName = explicitName.trim();
      if (!/^\+?\d{7,}$/.test(cleanName.replace(/[\s\-\(\)]/g, ''))) {
        state.contactNameCache.set(authorId, cleanName);
        if (typeof authorId === 'string' && authorId.includes('@')) {
          const u = authorId.split('@')[0];
          state.contactNameCache.set(`${u}@c.us`, cleanName);
          state.contactNameCache.set(`${u}@lid`, cleanName);
        }
      }
    }
  });

  // 2. Identificar autores que aún no tienen un nombre real en caché
  const unresolvedAuthors = [...new Set(
    messages
      .filter(m => !m.fromMe)
      .map(m => extractWidString(m.author || m.from))
      .filter(Boolean)
      .filter(id => {
        const cached = state.contactNameCache.get(id);
        return !cached || /^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''));
      })
  )];

  // 3. Resolución en bloque a través de la memoria de WhatsApp Web (Puppeteer)
  if (unresolvedAuthors.length > 0 && state.client.pupPage) {
    try {
      const resolvedMap = await state.client.pupPage.evaluate((ids) => {
        const res = {};
        const collections = window.require?.('WAWebCollections') || window.Store;
        const contactCollection = collections?.Contact || window.Store?.Contact;
        const ContactGetters = window.require?.('WAWebContactGetters');

        ids.forEach(id => {
          try {
            let contact = null;
            if (contactCollection) {
              contact = contactCollection.get(id);
              if (!contact && typeof id === 'string' && id.includes('@')) {
                const user = id.split('@')[0];
                contact = contactCollection.get(`${user}@c.us`) || contactCollection.get(`${user}@lid`);
              }
            }
            if (contact) {
              const name = (ContactGetters && ContactGetters.getName ? ContactGetters.getName(contact) : null)
                || contact.name
                || contact.formattedName
                || contact.displayName
                || (ContactGetters && ContactGetters.getPushname ? ContactGetters.getPushname(contact) : null)
                || contact.pushname
                || contact.notifyName
                || (ContactGetters && ContactGetters.getVerifiedName ? ContactGetters.getVerifiedName(contact) : null)
                || contact.verifiedName;
              if (name && typeof name === 'string' && name.trim()) {
                res[id] = name.trim();
              }
            }
          } catch (e) {}
        });
        return res;
      }, unresolvedAuthors);

      if (resolvedMap && typeof resolvedMap === 'object') {
        for (const [id, name] of Object.entries(resolvedMap)) {
          if (name && !/^\+?\d{7,}$/.test(name.replace(/[\s\-\(\)]/g, ''))) {
            state.contactNameCache.set(id, name);
            if (typeof id === 'string' && id.includes('@')) {
              const u = id.split('@')[0];
              state.contactNameCache.set(`${u}@c.us`, name);
              state.contactNameCache.set(`${u}@lid`, name);
            }
          }
        }
      }
    } catch (evalErr) {
      // Fallback silencioso
    }
  }

  // 4. Fallback con client.getContactById
  const stillUnresolved = unresolvedAuthors.filter(id => {
    const cached = state.contactNameCache.get(id);
    return !cached || /^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''));
  });

  if (stillUnresolved.length > 0) {
    await Promise.all(stillUnresolved.slice(0, 15).map(async (id) => {
      try {
        const contact = await state.client.getContactById(id);
        const name = contact?.name || contact?.pushname || contact?.shortName || contact?.verifiedName;
        if (name && typeof name === 'string' && name.trim() && !/^\+?\d{7,}$/.test(name.replace(/[\s\-\(\)]/g, ''))) {
          state.contactNameCache.set(id, name.trim());
          if (typeof id === 'string' && id.includes('@')) {
            const u = id.split('@')[0];
            state.contactNameCache.set(`${u}@c.us`, name.trim());
            state.contactNameCache.set(`${u}@lid`, name.trim());
          }
        }
      } catch (err) {}
    }));
  }

  const isGroupChat = Boolean(chat.isGroup || (typeof targetChatId === 'string' && targetChatId.endsWith('@g.us')));

  const formatted = await Promise.all(messages.map(async (msg) => {
    const msgId = msg.id?._serialized || msg.id?.$1 || (typeof msg.id === 'string' ? msg.id : msg.id?.id) || String(Date.now());

    if (state.recentMessagesCache.size >= MAX_RECENT_MESSAGES) {
      const firstKey = state.recentMessagesCache.keys().next().value;
      state.recentMessagesCache.delete(firstKey);
    }
    state.recentMessagesCache.set(msgId, msg);

    const isRevoked = Boolean(
      msg.type === 'revoked' ||
      msg._data?.type === 'revoked' ||
      msg._data?.subtype === 'sender_revoke' ||
      msg._data?.subtype === 'admin_revoke' ||
      msg._data?.isRevoked === true ||
      state.revokedMessageIds.has(msgId)
    );

    const location = !isRevoked ? extractLocation(msg) : null;
    const isLocationMsg = Boolean(location || msg.type === 'location' || msg.type === 'live_location');

    let thumbnail = null;
    if (!isRevoked && (msg.hasMedia || isLocationMsg)) {
      thumbnail = extractThumbnail(msg._data?.body || msg._data?.thumbnail || msg._data?.mediaData?.preview || msg.body);
    }

    let rawBody = isRevoked ? '' : (msg.body || '');
    let bodyText = '';
    if (!isRevoked) {
      if (isRawBase64Image(rawBody)) {
        const comment = msg._data?.comment || msg._data?.loc || location?.description;
        if (comment && typeof comment === 'string' && !isRawBase64Image(comment)) {
          bodyText = comment.trim();
        } else {
          bodyText = '';
        }
      } else if (isLocationMsg && /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(rawBody.trim())) {
        bodyText = location?.description || location?.name || '';
      } else {
        bodyText = rawBody;
      }
    }

    let senderName = null;
    if (msg.fromMe) {
      senderName = 'Tú';
    } else {
      const authorId = extractWidString(msg.author || msg.from);
      let cached = authorId ? state.contactNameCache.get(authorId) : null;
      if (!cached && authorId && typeof authorId === 'string' && authorId.includes('@')) {
        const u = authorId.split('@')[0];
        cached = state.contactNameCache.get(`${u}@c.us`) || state.contactNameCache.get(`${u}@lid`);
      }
      const notify = msg._data?.notifyName || msg._data?.name;

      if (cached && !/^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''))) {
        senderName = cached;
      } else if (notify && typeof notify === 'string' && notify.trim() && !/^\+?\d{7,}$/.test(notify.replace(/[\s\-\(\)]/g, ''))) {
        senderName = notify.trim();
      } else if (cached) {
        senderName = cached;
      } else if (authorId && typeof authorId === 'string' && authorId.includes('@')) {
        const raw = authorId.split('@')[0];
        senderName = /^\d{7,15}$/.test(raw) ? `+${raw}` : raw;
      } else {
        senderName = authorId || null;
      }
    }

    let quotedMsg = null;
    const hasQuotedMsg = Boolean(msg.hasQuotedMsg || msg._data?.quotedMsg);
    if (!isRevoked && hasQuotedMsg) {
      quotedMsg = await resolveQuotedMsg(msg, isGroupChat);
    }

    const hasMedia = !isRevoked && (msg.hasMedia || ['image', 'video', 'document', 'audio', 'ptt', 'sticker'].includes(msg.type));
    const mediaUrl = (hasMedia && msgId && msgId.includes('_')) ? `/api/whatsapp/messages/${encodeURIComponent(msgId)}/media` : null;

    return {
      id: msgId,
      body: bodyText,
      type: isRevoked ? 'revoked' : (msg.type || 'chat'),
      timestamp: (msg.timestamp ? msg.timestamp * 1000 : Date.now()),
      fromMe: Boolean(msg.fromMe),
      from: extractWidString(msg.from) || msg.from,
      to: extractWidString(msg.to) || msg.to,
      author: extractWidString(msg.author) || null,
      senderName,
      hasMedia,
      mediaUrl,
      thumbnail,
      location,
      ack: msg.ack || 0,
      isRevoked,
      hasQuotedMsg: Boolean(quotedMsg),
      quotedMsg
    };
  }));

  return formatted;
}

async function getMessageMedia(decodedMsgId) {
  if (!state.isReady || !state.client) {
    const error = new Error('WhatsApp client is not ready');
    error.status = 503;
    throw error;
  }

  // 1. Revisar caché en memoria
  if (state.mediaCache.has(decodedMsgId)) {
    return state.mediaCache.get(decodedMsgId);
  }

  let media = null;
  let msgObj = state.recentMessagesCache.get(decodedMsgId) || null;

  // 2. Si no estaba en recentMessagesCache y el ID es serializado, consultar mediante client.getMessageById
  if (!msgObj && decodedMsgId.includes('_')) {
    try {
      msgObj = await state.client.getMessageById(decodedMsgId);
    } catch (getErr) {
      console.warn(`[Media] getMessageById aviso para ${decodedMsgId}:`, getErr?.message || getErr);
    }
  }

  // 3. Descargar media si tenemos instancia msgObj
  if (msgObj && typeof msgObj.downloadMedia === 'function') {
    try {
      media = await msgObj.downloadMedia();
    } catch (dlErr) {
      console.warn(`[Media] downloadMedia aviso para ${decodedMsgId}:`, dlErr?.message || dlErr);
    }
  }

  // 4. Fallback: evaluar directamente en pupPage con resolveMediaBlob
  if ((!media || !media.data) && state.client.pupPage) {
    try {
      const resolved = await state.client.pupPage.evaluate(async (msgId) => {
        try {
          const res = await window.WWebJS.resolveMediaBlob(msgId);
          if (!res || !res.blob) return null;
          const data = await window.WWebJS.arrayBufferToBase64Async(await res.blob.arrayBuffer());
          return {
            data,
            mimetype: res.mimetype || 'image/jpeg',
            filename: res.filename
          };
        } catch (e) {
          return null;
        }
      }, decodedMsgId);
      if (resolved && resolved.data) {
        media = resolved;
      }
    } catch (pupErr) {
      console.warn(`[Media] pupPage evaluate aviso para ${decodedMsgId}:`, pupErr?.message || pupErr);
    }
  }

  // 5. Fallback 2: usar thumbnail de _data.body o mediaData
  if (!media || !media.data) {
    const rawThumb = msgObj?._data?.body || msgObj?._data?.thumbnail || msgObj?._data?.mediaData?.preview;
    if (rawThumb && typeof rawThumb === 'string') {
      let rawBase64 = rawThumb;
      if (rawBase64.includes('base64,')) {
        rawBase64 = rawBase64.split('base64,')[1];
      }
      if (rawBase64.length > 20) {
        const buffer = Buffer.from(rawBase64, 'base64');
        return { mimetype: 'image/jpeg', buffer };
      }
    }
  }

  if (!media || !media.data) {
    const error = new Error('Media no disponible o expirada en WhatsApp');
    error.status = 404;
    throw error;
  }

  const buffer = Buffer.from(media.data, 'base64');
  const mimetype = media.mimetype || 'image/jpeg';

  if (state.mediaCache.size >= MAX_MEDIA_CACHE) {
    const firstKey = state.mediaCache.keys().next().value;
    state.mediaCache.delete(firstKey);
  }
  const result = { mimetype, buffer, timestamp: Date.now() };
  state.mediaCache.set(decodedMsgId, result);

  return result;
}

async function sendMessage({ chatId, message, media, location, workspaceId, requestedWorkspace }) {
  if (!state.isReady || !state.client) {
    const error = new Error('WhatsApp client is not ready');
    error.status = 400;
    throw error;
  }

  if (state.activeWorkspace && requestedWorkspace && requestedWorkspace !== state.activeWorkspace) {
    console.warn(`[Send] Envío rechazado: el bot está activo en "${state.activeWorkspace}", se solicitó desde "${requestedWorkspace}".`);
    const error = new Error(`El bot está asignado exclusivamente al área de trabajo "${state.activeWorkspace}". No disponible en "${requestedWorkspace}".`);
    error.status = 403;
    error.activeWorkspace = state.activeWorkspace;
    throw error;
  }

  const hasMedia = media && Array.isArray(media) && media.length > 0;
  const hasLocation = location && !isNaN(Number(location.latitude)) && !isNaN(Number(location.longitude));

  if (!chatId || (!message && !hasMedia && !hasLocation)) {
    const error = new Error('Faltan parámetros: chatId y al menos message, media o location son requeridos');
    error.status = 400;
    throw error;
  }

  let targetChatId = chatId;
  if (typeof targetChatId === 'string' && !targetChatId.includes('@')) {
    targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
  }

  let textMsgId = null;

  // Enviar ubicación si se solicitó
  if (hasLocation) {
    console.log(`[Send] Enviando ubicación a ${targetChatId}: ${location.latitude}, ${location.longitude}...`);
    const locInstance = new Location(Number(location.latitude), Number(location.longitude), location.description || location.name || '');
    const locResponse = await state.client.sendMessage(targetChatId, locInstance);
    textMsgId = locResponse?.id?._serialized || locResponse?.id || `loc_${Date.now()}`;
    console.log(`[Send] Ubicación enviada exitosamente. ID: ${textMsgId}`);
  }

  // Enviar texto si hay contenido
  if (message && message.trim()) {
    console.log(`[Send] Enviando texto a ${targetChatId}...`);
    const response = await state.client.sendMessage(targetChatId, message);
    textMsgId = response?.id?._serialized || response?.id || `msg_${Date.now()}`;
    console.log(`[Send] Texto enviado exitosamente. ID: ${textMsgId}`);
  }

  // Enviar fotos en background
  if (hasMedia) {
    (async () => {
      for (const item of media) {
        if (!item.url) continue;
        try {
          const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches) {
            const messageMedia = new MessageMedia(matches[1], matches[2], item.name || 'foto.jpg');
            console.log(`[Media] Enviando adjunto a ${targetChatId}: ${item.name || 'foto.jpg'}`);
            await state.client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
          } else {
            console.log(`[Media] Adjunto URL pública a ${targetChatId}: ${item.url.substring(0, 80)}...`);
            const messageMedia = await MessageMedia.fromUrl(item.url, { unsafeMime: true });
            await state.client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
          }
        } catch (mediaErr) {
          console.error(`[Media] Error enviando adjunto "${item.name || 'foto'}" a ${targetChatId}:`, mediaErr.message || mediaErr);
        }
      }
    })();
  }

  return {
    success: true,
    messageId: textMsgId,
    mediaCount: hasMedia ? media.length : 0
  };
}

module.exports = {
  resolveQuotedMsg,
  fetchChatMessages,
  getMessageMedia,
  sendMessage
};
