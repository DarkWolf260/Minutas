const state = require('../state');
const { MAX_AVATAR_IMAGE_CACHE } = require('../config');
const { extractWidString } = require('../utils/formatters');

async function resolveChatAvatarUrl(chatId) {
  if (!chatId || !state.isReady || !state.client) return null;
  let targetChatId = extractWidString(chatId) || (typeof chatId === 'string' ? chatId.trim() : '');
  if (!targetChatId) return null;
  if (!targetChatId.includes('@')) {
    targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
  }

  if (state.avatarCache.has(targetChatId) && state.avatarCache.get(targetChatId)) {
    return state.avatarCache.get(targetChatId);
  }

  let picUrl = null;
  try {
    picUrl = await state.client.getProfilePicUrl(targetChatId);
  } catch (_) {}

  // Si es un ID @lid y no devolvió foto directa, resolver el número telefónico (@c.us)
  if (!picUrl && targetChatId.endsWith('@lid') && state.client.pupPage) {
    try {
      const phoneWid = await state.client.pupPage.evaluate(async (lid) => {
        try {
          const res = await window.WWebJS?.enforceLidAndPnRetrieval?.(lid);
          return res?.phone?._serialized || (res?.phone?.user ? `${res.phone.user}@c.us` : null);
        } catch (e) {
          return null;
        }
      }, targetChatId);

      if (phoneWid && phoneWid !== targetChatId) {
        if (state.avatarCache.has(phoneWid)) {
          picUrl = state.avatarCache.get(phoneWid);
        } else {
          picUrl = await state.client.getProfilePicUrl(phoneWid).catch(() => null);
          state.avatarCache.set(phoneWid, picUrl || null);
        }
      }
    } catch (_) {}
  }

  state.avatarCache.set(targetChatId, picUrl || null);
  state.avatarCache.set(chatId, picUrl || null);
  return picUrl || null;
}

async function getChatAvatarBinary(decodedId) {
  if (state.avatarImageCache.has(decodedId)) {
    return {
      status: 200,
      contentType: 'image/jpeg',
      data: state.avatarImageCache.get(decodedId)
    };
  }

  try {
    const picUrl = await resolveChatAvatarUrl(decodedId);
    if (picUrl) {
      const cdnRes = await fetch(picUrl);
      if (cdnRes.ok) {
        const arrayBuf = await cdnRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        if (state.avatarImageCache.size >= MAX_AVATAR_IMAGE_CACHE) {
          const firstKey = state.avatarImageCache.keys().next().value;
          if (firstKey) state.avatarImageCache.delete(firstKey);
        }
        state.avatarImageCache.set(decodedId, buffer);

        return {
          status: 200,
          contentType: 'image/jpeg',
          data: buffer
        };
      }
    }
  } catch (err) {
    console.warn(`[Avatar] Error obteniendo avatar.jpg para ${decodedId}:`, err?.message || err);
  }

  return {
    status: 404,
    contentType: 'text/plain',
    data: 'Avatar not found'
  };
}

function isRealConversationId(id) {
  if (!id || typeof id !== 'string') return false;
  const lower = id.toLowerCase().trim();
  if (
    lower === 'status@broadcast' ||
    lower.startsWith('status@') ||
    lower.includes('@broadcast') ||
    lower.includes('@newsletter')
  ) {
    return false;
  }
  return lower.endsWith('@c.us') || lower.endsWith('@g.us') || lower.endsWith('@lid') || lower.endsWith('@s.whatsapp.net');
}

async function fetchChats(requestedWorkspace) {
  if (state.activeWorkspace && requestedWorkspace && requestedWorkspace !== state.activeWorkspace) {
    const error = new Error(`El bot está asignado exclusivamente al área de trabajo "${state.activeWorkspace}". No disponible en "${requestedWorkspace}".`);
    error.status = 403;
    error.activeWorkspace = state.activeWorkspace;
    throw error;
  }

  if (!state.isReady || !state.client) {
    const error = new Error('WhatsApp client is not ready');
    error.status = 400;
    throw error;
  }

  let formattedChats = [];

  // 1. Extracción directa desde la memoria de WhatsApp Web en Puppeteer enriquecida con la libreta de contactos
  try {
    if (state.client.pupPage) {
      const rawExtractedChats = await state.client.pupPage.evaluate(() => {
        try {
          const collections = window.require?.('WAWebCollections') || window.Store;
          const chatCollection = (collections?.Chat || window.Store?.Chat)?.getModelsArray?.() || [];
          const contactCollection = collections?.Contact || window.Store?.Contact;
          const ContactGetters = window.require?.('WAWebContactGetters');

          function isValidId(id) {
            if (!id || typeof id !== 'string') return false;
            const lower = id.toLowerCase().trim();
            if (
              lower === 'status@broadcast' ||
              lower.startsWith('status@') ||
              lower.includes('@broadcast') ||
              lower.includes('@newsletter')
            ) {
              return false;
            }
            return lower.endsWith('@c.us') || lower.endsWith('@g.us') || lower.endsWith('@lid') || lower.endsWith('@s.whatsapp.net');
          }

          return chatCollection
            .map(c => {
              const id = c.id?._serialized || (typeof c.id === 'string' ? c.id : '');
              if (!isValidId(id)) return null;

              const isGroup = Boolean(c.isGroup || (id && id.endsWith('@g.us')));

              let contact = null;
              try {
                if (contactCollection) {
                  contact = contactCollection.get(c.id) 
                    || contactCollection.get(id) 
                    || (c.id?.user ? contactCollection.get(`${c.id.user}@c.us`) : null)
                    || c.contact;
                }
              } catch (e) {}
              if (!contact && c.contact) {
                contact = c.contact;
              }

              let name = null;
              if (isGroup) {
                name = c.formattedTitle || c.name || c.groupMetadata?.subject || (contact && ContactGetters?.getName?.(contact)) || contact?.name;
              } else {
                if (contact) {
                  try {
                    name = ContactGetters?.getName?.(contact)
                      || contact.name
                      || contact.formattedName
                      || contact.displayName
                      || ContactGetters?.getPushname?.(contact)
                      || contact.pushname
                      || contact.notifyName
                      || ContactGetters?.getVerifiedName?.(contact)
                      || contact.verifiedName;
                  } catch (e) {}
                }
                if (!name) {
                  name = c.formattedTitle || c.name;
                }
              }

              if (!name || name === id) {
                name = c.contact?.pushname || c.contact?.notifyName || (c.id?.user ? `+${c.id.user}` : 'Chat');
              }

              const timestamp = c.t || c.conversationTimestamp || 0;
              const directPicUrl = contact?.profilePicThumbObj?.eurl || contact?.profilePicThumb?.eurl || c.contact?.profilePicThumbObj?.eurl || c.profilePicThumb?.eurl || null;
              return { id, name, isGroup, timestamp, directPicUrl };
            })
            .filter(Boolean)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (e) {
          return [];
        }
      });

      if (Array.isArray(rawExtractedChats) && rawExtractedChats.length > 0) {
        formattedChats = rawExtractedChats
          .filter(c => isRealConversationId(c.id))
          .map(c => {
            if (c.directPicUrl) {
              state.avatarCache.set(c.id, c.directPicUrl);
            }
            return {
              id: c.id,
              name: c.name,
              isGroup: c.isGroup,
              avatarUrl: `/api/whatsapp/chats/${encodeURIComponent(c.id)}/avatar.jpg`
            };
          });
      }
    }
  } catch (evalErr) {
    console.warn(`[Chats] Extractor en memoria falló (${evalErr.message}). Intentando fallback nativo...`);
  }

  // 2. Si el extractor directo devolvió vacío, intentar client.getChats() con un timeout estricto de 4 segundos
  if (!formattedChats || formattedChats.length === 0) {
    try {
      const getChatsSafe = state.client.getChats().catch(err => {
        console.warn(`[Chats] Error interno en client.getChats(): ${err?.message || err}`);
        return [];
      });
      const timeoutSafe = new Promise(resolve => setTimeout(() => resolve([]), 4000));
      const chats = await Promise.race([getChatsSafe, timeoutSafe]);
      if (Array.isArray(chats) && chats.length > 0) {
        formattedChats = chats
          .filter(chat => {
            const id = chat.id?._serialized || (typeof chat.id === 'string' ? chat.id : '');
            return isRealConversationId(id);
          })
          .map(chat => {
            const id = chat.id?._serialized || (typeof chat.id === 'string' ? chat.id : '');
            return {
              id,
              name: chat.name || chat.formattedTitle || (id.endsWith('@g.us') ? 'Grupo' : 'Contacto'),
              isGroup: Boolean(chat.isGroup),
              avatarUrl: `/api/whatsapp/chats/${encodeURIComponent(id)}/avatar.jpg`
            };
          });
      }
    } catch (err) {
      console.warn(`[Chats] client.getChats() omitido: ${err?.message || err}`);
    }
  }

  // 3. Para los chats individuales cuyo nombre quedó como número de teléfono, resolver nombre real
  if (Array.isArray(formattedChats) && formattedChats.length > 0) {
    const chatsNeedingNames = formattedChats.filter(c => 
      !c.isGroup && (/^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, '')) || c.name === c.id || c.name === 'Chat')
    );

    if (chatsNeedingNames.length > 0) {
      // Resolver primeros 40 de inmediato
      const primaryBatch = chatsNeedingNames.slice(0, 40);
      await Promise.all(primaryBatch.map(async (chat) => {
        try {
          const contact = await state.client.getContactById(chat.id);
          const resolvedName = contact?.name || contact?.pushname || contact?.shortName || contact?.verifiedName;
          if (resolvedName && resolvedName.trim() && !/^\+?\d{7,}$/.test(resolvedName.replace(/[\s\-\(\)]/g, ''))) {
            chat.name = resolvedName.trim();
            state.contactNameCache.set(chat.id, chat.name);
          }
        } catch (err) {}
      }));

      // Resolver los restantes en segundo plano sin demorar la respuesta
      const remainingBatch = chatsNeedingNames.slice(40);
      if (remainingBatch.length > 0) {
        (async () => {
          for (const chat of remainingBatch) {
            try {
              const contact = await state.client.getContactById(chat.id);
              const resolvedName = contact?.name || contact?.pushname || contact?.shortName || contact?.verifiedName;
              if (resolvedName && resolvedName.trim() && !/^\+?\d{7,}$/.test(resolvedName.replace(/[\s\-\(\)]/g, ''))) {
                chat.name = resolvedName.trim();
                state.contactNameCache.set(chat.id, chat.name);
              }
            } catch (err) {}
          }
        })().catch(() => {});
      }
    }
  }

  // 4. Actualizar o recuperar de caché preservando nombres reales previamente conocidos
  if (formattedChats && formattedChats.length > 0) {
    if (state.cachedChats && state.cachedChats.length > 0) {
      const cachedMap = new Map(state.cachedChats.map(c => [c.id, c.name]));
      formattedChats.forEach(c => {
        const oldName = cachedMap.get(c.id);
        const isCurrentPhone = /^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, ''));
        const wasOldRealName = oldName && !/^\+?\d{7,}$/.test(oldName.replace(/[\s\-\(\)]/g, ''));
        if (isCurrentPhone && wasOldRealName) {
          c.name = oldName;
        }
      });
    }

    // Alimentar contactNameCache con los nombres de contactos/chats conocidos
    formattedChats.forEach(c => {
      if (c.id && c.name && !/^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, ''))) {
        state.contactNameCache.set(c.id, c.name);
        if (typeof c.id === 'string' && c.id.includes('@')) {
          const u = c.id.split('@')[0];
          state.contactNameCache.set(`${u}@c.us`, c.name);
          state.contactNameCache.set(`${u}@lid`, c.name);
        }
      }
    });

    // Asignar endpoint de avatares a todos los chats
    formattedChats.forEach(c => {
      c.avatarUrl = `/api/whatsapp/chats/${encodeURIComponent(c.id)}/avatar.jpg`;
    });

    // Resolver de inmediato los primeros 40 chats activos para que tengan respuesta instantánea
    const initialAvatarBatch = formattedChats.slice(0, 40).filter(c => !state.avatarCache.has(c.id) || !state.avatarCache.get(c.id));
    if (initialAvatarBatch.length > 0) {
      await Promise.allSettled(initialAvatarBatch.map(async c => {
        try {
          await resolveChatAvatarUrl(c.id);
        } catch (e) {}
      }));
    }

    // Para los chats restantes (> 40), resolver en segundo plano en lotes pequeños sin bloquear HTTP
    const remainingAvatarBatch = formattedChats.slice(40).filter(c => !state.avatarCache.has(c.id) || !state.avatarCache.get(c.id));
    if (remainingAvatarBatch.length > 0) {
      (async () => {
        const CHUNK_SIZE = 10;
        for (let i = 0; i < remainingAvatarBatch.length; i += CHUNK_SIZE) {
          const chunk = remainingAvatarBatch.slice(i, i + CHUNK_SIZE);
          await Promise.allSettled(chunk.map(c => resolveChatAvatarUrl(c.id)));
          await new Promise(r => setTimeout(r, 150));
        }
      })().catch(err => console.warn('[Chats] Background avatar resolution warning:', err?.message));
    }

    // Filtrar estrictamente cualquier chat que no sea una conversación real válida
    formattedChats = formattedChats.filter(c => isRealConversationId(c.id));
    state.cachedChats = formattedChats;
  } else if (state.cachedChats.length > 0) {
    state.cachedChats = state.cachedChats.filter(c => isRealConversationId(c.id));
    formattedChats = state.cachedChats;
  }

  return formattedChats || [];
}

module.exports = {
  resolveChatAvatarUrl,
  getChatAvatarBinary,
  fetchChats
};
