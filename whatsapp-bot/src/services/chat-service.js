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

  if (state.avatarCache.has(targetChatId)) {
    return state.avatarCache.get(targetChatId);
  }

  let picUrl = null;

  // 1. Intento rápido con client.getProfilePicUrl (timeout de 1200ms)
  try {
    const getPicPromise = state.client.getProfilePicUrl(targetChatId);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 1200));
    picUrl = await Promise.race([getPicPromise, timeoutPromise]);
  } catch (_) {}

  // 2. Si es un ID @lid y no devolvió foto directa, resolver el número telefónico (@c.us) con timeout
  if (!picUrl && targetChatId.endsWith('@lid') && state.client.pupPage) {
    try {
      const lidPromise = state.client.pupPage.evaluate(async (lid) => {
        try {
          const res = await window.WWebJS?.enforceLidAndPnRetrieval?.(lid);
          return res?.phone?._serialized || (res?.phone?.user ? `${res.phone.user}@c.us` : null);
        } catch (e) {
          return null;
        }
      }, targetChatId);
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 900));
      const phoneWid = await Promise.race([lidPromise, timeoutPromise]);

      if (phoneWid && phoneWid !== targetChatId) {
        if (state.avatarCache.has(phoneWid)) {
          picUrl = state.avatarCache.get(phoneWid);
        } else {
          const phonePicPromise = state.client.getProfilePicUrl(phoneWid).catch(() => null);
          const phoneTimeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 900));
          picUrl = await Promise.race([phonePicPromise, phoneTimeoutPromise]);
          state.avatarCache.set(phoneWid, picUrl || null);
        }
      }
    } catch (_) {}
  }

  // 3. Fallback directo a ProfilePicThumb en memoria si no retornó URL directa
  if (!picUrl && state.client.pupPage) {
    try {
      const evalPromise = state.client.pupPage.evaluate((wid) => {
        try {
          let collections = null;
          try {
            collections = window.require?.('WAWebCollections') || window.Store;
          } catch (_) {
            collections = window.Store;
          }
          const picCol = collections?.ProfilePicThumb || window.Store?.ProfilePicThumb;
          const thumb = picCol?.get?.(wid);
          return thumb?.eurl || null;
        } catch (e) {
          return null;
        }
      }, targetChatId);
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 600));
      picUrl = await Promise.race([evalPromise, timeoutPromise]);
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

let inFlightFetchChatsPromise = null;

async function fetchChats(requestedWorkspace) {
  if (inFlightFetchChatsPromise) {
    return inFlightFetchChatsPromise;
  }
  inFlightFetchChatsPromise = (async () => {
    try {
      return await executeFetchChats(requestedWorkspace);
    } finally {
      inFlightFetchChatsPromise = null;
    }
  })();
  return inFlightFetchChatsPromise;
}

async function executeFetchChats(requestedWorkspace) {
  if (state.activeWorkspace && requestedWorkspace && requestedWorkspace !== state.activeWorkspace) {
    const error = new Error(`El bot está asignado exclusivamente al área de trabajo "${state.activeWorkspace}". No disponible en "${requestedWorkspace}".`);
    error.status = 403;
    error.activeWorkspace = state.activeWorkspace;
    throw error;
  }

  if (!state.isReady || !state.client) {
    if (state.cachedChats && state.cachedChats.length > 0) {
      return state.cachedChats;
    }
    const error = new Error('WhatsApp client is not ready');
    error.status = 400;
    throw error;
  }

  let formattedChats = [];

  // 1. Extracción directa y segura desde la memoria de WhatsApp Web en Puppeteer (enriquecida con libreta de contactos y fotos)
  try {
    if (state.client.pupPage) {
      const evalPromise = state.client.pupPage.evaluate(() => {
        try {
          let chatCollection = [];
          try {
            const collections = window.require ? window.require('WAWebCollections') : null;
            chatCollection = (collections?.Chat || window.Store?.Chat)?.getModelsArray?.() || [];
          } catch (_) {
            chatCollection = window.Store?.Chat?.getModelsArray?.() || [];
          }

          if (!chatCollection || !chatCollection.length) {
            try {
              chatCollection = window.Store?.Chat?.models || [];
            } catch (_) {}
          }

          let contactCollection = null;
          try {
            const collections = window.require ? window.require('WAWebCollections') : null;
            contactCollection = collections?.Contact || window.Store?.Contact;
          } catch (_) {
            contactCollection = window.Store?.Contact;
          }

          let picThumbCollection = null;
          try {
            const collections = window.require ? window.require('WAWebCollections') : null;
            picThumbCollection = collections?.ProfilePicThumb || window.Store?.ProfilePicThumb;
          } catch (_) {
            picThumbCollection = window.Store?.ProfilePicThumb;
          }

          let ContactGetters = null;
          try {
            ContactGetters = window.require ? window.require('WAWebContactGetters') : null;
          } catch (_) {}

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

          // Filtrar y ordenar los más recientes PRIMERO, limitando a los 150 chats activos
          // Esto evita recorrer miles de chats antiguos y garantiza una respuesta ultra rápida (<100ms)
          const modelsArray = (Array.isArray(chatCollection) ? chatCollection : []);
          const topChats = modelsArray
            .filter(c => {
              if (!c) return false;
              const id = c.id?._serialized || (typeof c.id === 'string' ? c.id : '');
              return isValidId(id);
            })
            .sort((a, b) => (b.t || b.conversationTimestamp || 0) - (a.t || a.conversationTimestamp || 0))
            .slice(0, 150);

          return topChats
            .map(c => {
              if (!c) return null;
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
              } catch (_) {}
              if (!contact && c.contact) {
                contact = c.contact;
              }

              let name = null;
              if (isGroup) {
                name = c.formattedTitle || c.name || c.groupMetadata?.subject;
                if (!name && contact) {
                  try {
                    name = (ContactGetters?.getName && ContactGetters.getName(contact)) || contact.name;
                  } catch (_) {}
                }
              } else {
                if (contact) {
                  try {
                    name = (ContactGetters?.getName && ContactGetters.getName(contact))
                      || contact.name
                      || contact.formattedName
                      || contact.displayName
                      || (ContactGetters?.getPushname && ContactGetters.getPushname(contact))
                      || contact.pushname
                      || contact.notifyName
                      || (ContactGetters?.getVerifiedName && ContactGetters.getVerifiedName(contact))
                      || contact.verifiedName;
                  } catch (_) {}
                }
                if (!name) {
                  name = c.formattedTitle || c.name;
                }
              }

              if (typeof name !== 'string' || !name.trim() || name === id) {
                name = c.contact?.pushname || c.contact?.notifyName || (c.id?.user ? `+${c.id.user}` : 'Chat');
              } else {
                name = name.trim();
              }

              const timestamp = c.t || c.conversationTimestamp || 0;

              // Obtener foto de perfil directamente desde ProfilePicThumb en memoria para todos los chats
              let thumb = null;
              try {
                if (picThumbCollection) {
                  thumb = picThumbCollection.get(c.id)
                    || picThumbCollection.get(id)
                    || (c.id?.user ? picThumbCollection.get(`${c.id.user}@c.us`) : null)
                    || (c.id?.user ? picThumbCollection.get(`${c.id.user}@lid`) : null);
                }
              } catch (_) {}

              const directPicUrl = (thumb?.eurl && typeof thumb.eurl === 'string' && /^https?:\/\//i.test(thumb.eurl) ? thumb.eurl : null)
                || (contact?.profilePicThumbObj?.eurl && typeof contact.profilePicThumbObj.eurl === 'string' && /^https?:\/\//i.test(contact.profilePicThumbObj.eurl) ? contact.profilePicThumbObj.eurl : null)
                || (contact?.profilePicThumb?.eurl && typeof contact.profilePicThumb.eurl === 'string' && /^https?:\/\//i.test(contact.profilePicThumb.eurl) ? contact.profilePicThumb.eurl : null)
                || (c.contact?.profilePicThumbObj?.eurl && typeof c.contact.profilePicThumbObj.eurl === 'string' && /^https?:\/\//i.test(c.contact.profilePicThumbObj.eurl) ? c.contact.profilePicThumbObj.eurl : null)
                || (c.profilePicThumb?.eurl && typeof c.profilePicThumb.eurl === 'string' && /^https?:\/\//i.test(c.profilePicThumb.eurl) ? c.profilePicThumb.eurl : null)
                || null;

              return { id, name, isGroup, timestamp, directPicUrl };
            })
            .filter(Boolean)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (e) {
          return [];
        }
      });

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('evaluate timeout')), 15000));
      const rawExtractedChats = await Promise.race([evalPromise, timeoutPromise]);

      if (Array.isArray(rawExtractedChats) && rawExtractedChats.length > 0) {
        formattedChats = rawExtractedChats
          .filter(c => isRealConversationId(c.id))
          .map(c => {
            if (c.directPicUrl) {
              state.avatarCache.set(c.id, c.directPicUrl);
            }
            const pic = c.directPicUrl || state.avatarCache.get(c.id);
            return {
              id: c.id,
              name: c.name,
              isGroup: c.isGroup,
              timestamp: c.timestamp || 0,
              avatarUrl: (pic && typeof pic === 'string' && /^https?:\/\//i.test(pic))
                ? pic
                : null
            };
          });
      }
    }
  } catch (evalErr) {
    if (!state.cachedChats || state.cachedChats.length === 0) {
      console.warn(`[Chats] Extractor en memoria falló (${evalErr.message}).`);
    }
  }

  // 2. Si el extractor directo devolvió vacío pero tenemos chats en caché, usar la caché
  if ((!formattedChats || formattedChats.length === 0) && state.cachedChats && state.cachedChats.length > 0) {
    return state.cachedChats;
  }

  // Fallback rápido y ligero a modelos Store.Chat si el extractor no devolvió nada
  if (!formattedChats || formattedChats.length === 0) {
    try {
      if (state.client.pupPage) {
        const simpleChats = await Promise.race([
          state.client.pupPage.evaluate(() => {
            try {
              const chats = window.Store?.Chat?.models || [];
              return chats.map(c => {
                const id = c.id?._serialized || (typeof c.id === 'string' ? c.id : '');
                return {
                  id,
                  name: c.formattedTitle || c.name || (c.id?.user ? `+${c.id.user}` : 'Chat'),
                  isGroup: Boolean(c.isGroup),
                  timestamp: c.t || 0,
                  avatarUrl: null
                };
              }).filter(c => c.id && (c.id.endsWith('@c.us') || c.id.endsWith('@g.us') || c.id.endsWith('@lid')));
            } catch (_) {
              return [];
            }
          }),
          new Promise(r => setTimeout(() => r([]), 2500))
        ]);
        if (Array.isArray(simpleChats) && simpleChats.length > 0) {
          formattedChats = simpleChats;
        }
      }
    } catch (_) {}
  }

  // Ordenar chats por los más recientes (timestamp descendente)
  if (Array.isArray(formattedChats)) {
    formattedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  // 3. Aplicar nombres de contactos y avatares conocidos previamente de caché (instantáneo, sin demoras)
  if (Array.isArray(formattedChats) && formattedChats.length > 0) {
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

    formattedChats.forEach(c => {
      // Si el nombre aún parece teléfono, buscar en contactNameCache
      const isPhone = /^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, '')) || c.name === c.id || c.name === 'Chat';
      if (isPhone && state.contactNameCache.has(c.id)) {
        c.name = state.contactNameCache.get(c.id);
      }

      // Si conocemos nombre real, alimentar contactNameCache
      if (c.id && c.name && !/^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, ''))) {
        state.contactNameCache.set(c.id, c.name);
        if (typeof c.id === 'string' && c.id.includes('@')) {
          const u = c.id.split('@')[0];
          state.contactNameCache.set(`${u}@c.us`, c.name);
          state.contactNameCache.set(`${u}@lid`, c.name);
        }
      }

      // Asignar avatar de caché si no vino directo
      if (!c.avatarUrl && state.avatarCache.has(c.id)) {
        const pic = state.avatarCache.get(c.id);
        if (pic && typeof pic === 'string' && /^https?:\/\//i.test(pic)) {
          c.avatarUrl = pic;
        }
      }
    });

    formattedChats = formattedChats.filter(c => isRealConversationId(c.id));
    state.cachedChats = formattedChats;

    // 4. Mejoras en SEGUNDO PLANO (suave y paulatino, sin saturar CPU ni red)
    setTimeout(() => {
      (async () => {
        // A. Nombres de contactos pendientes (lote moderado con timeout individual de 600ms)
        const chatsNeedingNames = formattedChats.filter(c => 
          !c.isGroup && (/^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, '')) || c.name === c.id || c.name === 'Chat')
        ).slice(0, 30);

        for (const chat of chatsNeedingNames) {
          try {
            const contact = await Promise.race([
              state.client.getContactById(chat.id),
              new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 600))
            ]);
            const resolvedName = contact?.name || contact?.pushname || contact?.shortName || contact?.verifiedName;
            if (resolvedName && resolvedName.trim() && !/^\+?\d{7,}$/.test(resolvedName.replace(/[\s\-\(\)]/g, ''))) {
              chat.name = resolvedName.trim();
              state.contactNameCache.set(chat.id, chat.name);
            }
          } catch (_) {}
        }

        // B. Avatares pendientes en segundo plano:
        // Se resuelven de a 2 en 2 con un descanso de 350ms para mantener la CPU en reposo
        const chatsNeedingAvatars = formattedChats.filter(c => 
          !c.avatarUrl && (!state.avatarCache.has(c.id) || !state.avatarCache.get(c.id))
        );

        for (let i = 0; i < chatsNeedingAvatars.length; i += 2) {
          const chunk = chatsNeedingAvatars.slice(i, i + 2);
          await Promise.allSettled(chunk.map(async (c) => {
            const pic = await resolveChatAvatarUrl(c.id);
            if (pic) {
              c.avatarUrl = pic;
            }
          }));
          await new Promise(r => setTimeout(r, 350));
        }
      })().catch(err => console.warn('[Chats] Background enrichment warning:', err?.message));
    }, 100);
  } else if (state.cachedChats && state.cachedChats.length > 0) {
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
