const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3001;

process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Promesa rechazada no controlada:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Excepción no capturada:', err?.message || err);
});

// Función para validar si el origen está permitido (soporta localhost, IPs locales y producción)
function isAllowedOrigin(origin) {
  if (!origin) return true; // Peticiones locales o herramientas como curl/Postman

  // localhost o 127.0.0.1 con cualquier puerto y protocolo (http o https)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;

  // Redes locales privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x) con cualquier puerto y protocolo
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin)) return true;

  // Dominios de producción / Vercel
  if (/^https:\/\/.*\.vercel\.app$/i.test(origin) || origin === 'https://minutas.vercel.app') return true;

  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Permitir dinámicamente cualquier encabezado solicitado por el cliente (x-workspace-id, cache-control, etc.)
  const requestedHeaders = req.headers['access-control-request-headers'];
  const defaultAllowedHeaders = 'Content-Type, Authorization, x-requested-with, x-workspace-id, cache-control, pragma';
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders || defaultAllowedHeaders);
  res.setHeader('Access-Control-Expose-Headers', '*');
  // Requerido por navegadores basados en Chromium para Private Network Access (PNA)
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let isReady = false;
let qrCodeData = null;
let statusMessage = 'Iniciando cliente...';
let client = null;
let isInitializing = false;
let cachedChats = [];
const contactNameCache = new Map();
const avatarCache = new Map();
const avatarImageCache = new Map();
const MAX_AVATAR_IMAGE_CACHE = 250;
const revokedMessageIds = new Set();
const recentMessagesCache = new Map();
const MAX_RECENT_MESSAGES = 250;

function extractThumbnail(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim();
  if (str.startsWith('data:image/')) return str;
  let clean = str;
  if (clean.includes('base64,')) {
    clean = clean.split('base64,')[1];
  }
  if (clean.length > 20) {
    if (clean.startsWith('UklGR')) {
      return `data:image/webp;base64,${clean}`;
    }
    if (clean.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${clean}`;
    }
    return `data:image/jpeg;base64,${clean}`;
  }
  return null;
}

async function resolveQuotedMsg(msg, isGroupChat) {
  try {
    let qData = msg._data?.quotedMsg;
    let quotedMessageInstance = null;

    if (!qData && msg.hasQuotedMsg && typeof msg.getQuotedMessage === 'function') {
      try {
        quotedMessageInstance = await msg.getQuotedMessage();
        if (quotedMessageInstance) {
          qData = quotedMessageInstance._data;
        }
      } catch (e) {}
    }

    if (!qData && !quotedMessageInstance) {
      return null;
    }

    const qType = quotedMessageInstance?.type || qData?.type || 'chat';
    const qIsRevoked = qType === 'revoked' || qData?.subtype === 'sender_revoke' || qData?.subtype === 'admin_revoke';

    const qFromMe = Boolean(quotedMessageInstance?.fromMe || qData?.fromMe);
    const qAuthorId = quotedMessageInstance?.author || qData?.author || quotedMessageInstance?.from || qData?.from || msg._data?.quotedParticipant;

    let qSenderName = qFromMe ? 'Tú' : null;
    if (!qSenderName && qAuthorId) {
      const cached = contactNameCache.get(qAuthorId);
      const notify = qData?.notifyName || qData?.name;
      if (cached && !/^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''))) {
        qSenderName = cached;
      } else if (notify && typeof notify === 'string' && notify.trim() && !/^\+?\d{7,}$/.test(notify.replace(/[\s\-\(\)]/g, ''))) {
        qSenderName = notify.trim();
        contactNameCache.set(qAuthorId, qSenderName);
      } else if (cached) {
        qSenderName = cached;
      } else if (notify && typeof notify === 'string' && notify.trim()) {
        qSenderName = notify.trim();
      } else if (isGroupChat && qAuthorId) {
        const raw = qAuthorId.split('@')[0];
        qSenderName = /^\d{7,15}$/.test(raw) ? `+${raw}` : raw;
      } else {
        qSenderName = 'Contacto';
      }
    }

    // Extraer miniatura si el mensaje citado tenía foto
    let qThumbnail = null;
    const rawBody = qData?.body || quotedMessageInstance?._data?.body;
    if (rawBody && typeof rawBody === 'string') {
      qThumbnail = extractThumbnail(rawBody);
    }
    if (!qThumbnail && (qData?.thumbnail || quotedMessageInstance?._data?.thumbnail)) {
      qThumbnail = extractThumbnail(qData?.thumbnail || quotedMessageInstance?._data?.thumbnail);
    }
    if (!qThumbnail && (qData?.mediaData?.preview || quotedMessageInstance?._data?.mediaData?.preview)) {
      qThumbnail = extractThumbnail(qData?.mediaData?.preview || quotedMessageInstance?._data?.mediaData?.preview);
    }

    // Texto o subtítulo
    let qBody = qIsRevoked ? 'Este mensaje fue eliminado' : (qData?.caption || quotedMessageInstance?.body || '');
    if (!qIsRevoked && !qBody && rawBody && typeof rawBody === 'string' && !rawBody.startsWith('data:') && !rawBody.startsWith('/9j/') && rawBody.length < 500) {
      qBody = rawBody;
    }

    const qHasMedia = Boolean(
      quotedMessageInstance?.hasMedia ||
      qData?.isMedia ||
      qData?.hasMedia ||
      ['image', 'video', 'document', 'audio', 'ptt', 'sticker'].includes(qType) ||
      qThumbnail
    );

    if (!qBody && !qIsRevoked) {
      if (qType === 'image') qBody = 'Foto';
      else if (qType === 'video') qBody = 'Video';
      else if (qType === 'audio' || qType === 'ptt') qBody = 'Nota de voz';
      else if (qType === 'document') qBody = 'Documento';
      else if (qType === 'sticker') qBody = 'Sticker';
    }

    const qMsgId = quotedMessageInstance?.id?._serialized || qData?.id?._serialized || (typeof qData?.id === 'string' ? qData.id : qData?.id?.id) || msg._data?.quotedStanzaID || null;

    return {
      id: qMsgId,
      body: qBody,
      type: qType,
      fromMe: qFromMe,
      senderName: qSenderName || (qFromMe ? 'Tú' : 'Contacto'),
      hasMedia: qHasMedia,
      thumbnail: qThumbnail,
      mediaUrl: (qHasMedia && qMsgId) ? `/api/whatsapp/messages/${encodeURIComponent(qMsgId)}/media` : null,
      isRevoked: qIsRevoked
    };
  } catch (err) {
    console.warn('[QuotedMsg] Error resolviendo mensaje citado:', err?.message || err);
    return null;
  }
}

async function resolveChatAvatarUrl(chatId) {
  if (!chatId || !isReady || !client) return null;
  let targetChatId = typeof chatId === 'string' ? chatId.trim() : '';
  if (!targetChatId) return null;
  if (!targetChatId.includes('@')) {
    targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
  }

  if (avatarCache.has(targetChatId)) {
    return avatarCache.get(targetChatId);
  }

  let picUrl = null;
  try {
    picUrl = await client.getProfilePicUrl(targetChatId);
  } catch (_) {}

  // Si es un ID @lid y no devolvió foto directa, resolver el número telefónico (@c.us)
  if (!picUrl && targetChatId.endsWith('@lid') && client.pupPage) {
    try {
      const phoneWid = await client.pupPage.evaluate(async (lid) => {
        try {
          const res = await window.WWebJS?.enforceLidAndPnRetrieval?.(lid);
          return res?.phone?._serialized || (res?.phone?.user ? `${res.phone.user}@c.us` : null);
        } catch (e) {
          return null;
        }
      }, targetChatId);

      if (phoneWid && phoneWid !== targetChatId) {
        if (avatarCache.has(phoneWid)) {
          picUrl = avatarCache.get(phoneWid);
        } else {
          picUrl = await client.getProfilePicUrl(phoneWid).catch(() => null);
          avatarCache.set(phoneWid, picUrl || null);
        }
      }
    } catch (_) {}
  }

  avatarCache.set(targetChatId, picUrl || null);
  avatarCache.set(chatId, picUrl || null);
  return picUrl || null;
}

function initWhatsAppClient() {
  isInitializing = true;
  isReady = false;
  qrCodeData = null;
  statusMessage = 'Iniciando cliente de WhatsApp...';

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    authTimeoutMs: 60000,
    puppeteer: {
      headless: true,
      protocolTimeout: 0,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote'
      ],
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  });

  client.on('qr', (qr) => {
    qrCodeData = qr;
    statusMessage = 'Esperando escaneo de QR...';
    console.log('\n==================================================');
    console.log(`[${new Date().toLocaleTimeString()}] Nuevo código QR generado:`);
    console.log('==================================================\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('loading_screen', (percent, message) => {
    statusMessage = `Sincronizando: ${percent}%`;
    console.log(`Progreso de carga: ${percent}% - ${message}`);
    if (percent >= 99 && !isReady) {
      setTimeout(async () => {
        if (!isReady && client && client.pupPage) {
          try {
            const hasPaneSide = await client.pupPage.evaluate(() => {
              return Boolean(document.querySelector('#pane-side') || window.Store?.Chat);
            });
            if (hasPaneSide && !isReady) {
              console.log('[Watchdog] WhatsApp Web cargado (pane-side detectado). Activando evento ready...');
              client.emit('ready');
            }
          } catch (_) {}
        }
      }, 4000);
    }
  });

  client.on('ready', async () => {
    isReady = true;
    qrCodeData = null;
    statusMessage = 'Listo';
    console.log('\n==================================================');
    console.log('✅ Cliente de WhatsApp está listo!');
    console.log(`📡 Servidor API escuchando en http://localhost:${port}`);
    console.log('==================================================\n');

    try {
      if (client.pupPage) {
        await client.pupPage.evaluate(() => {
          if (window.WWebJS && window.WWebJS.getChatModel) {
            const originalGetChatModel = window.WWebJS.getChatModel;
            window.WWebJS.getChatModel = async (chat, options) => {
              try {
                return await originalGetChatModel(chat, options);
              } catch (e) {
                return {
                  id: chat.id,
                  name: chat.name || chat.formattedTitle,
                  isGroup: Boolean(chat.isGroup),
                  formattedTitle: chat.formattedTitle
                };
              }
            };
          }
        });
      }
    } catch (patchErr) {
      // Silently ignore if page is not ready yet
    }
  });

  client.on('authenticated', () => {
    console.log('Autenticación exitosa.');
    statusMessage = 'Autenticado. Sincronizando chats...';
    qrCodeData = null;
  });

  client.on('auth_failure', async msg => {
    console.error('Error de autenticación:', msg);
    restartClient('Error de autenticación. Generando nuevo QR...');
  });

  client.on('message_revoke_everyone', async (after, before) => {
    try {
      const afterId = after?.id?._serialized || after?.id;
      if (afterId) revokedMessageIds.add(afterId);
      const beforeId = before?.id?._serialized || before?.id;
      if (beforeId) revokedMessageIds.add(beforeId);
    } catch (err) {}
  });

  client.on('disconnected', async (reason) => {
    console.log('Cliente de WhatsApp desconectado:', reason);
    restartClient('Desconectado. Generando nuevo QR...');
  });

  client.initialize()
    .then(() => {
      isInitializing = false;
    })
    .catch(async err => {
      console.error('Error al inicializar el cliente de WhatsApp:', err);
      statusMessage = 'Error al inicializar cliente: ' + (err.message || err);
      isInitializing = false;
      try {
        if (client) {
          await client.destroy().catch(() => {});
          client = null;
        }
      } catch (_) {}
    });
}

let isRestarting = false;

async function restartClient(reasonText = 'Reiniciando cliente...') {
  if (isRestarting) return;
  isRestarting = true;
  isInitializing = true;
  isReady = false;
  qrCodeData = null;
  cachedChats = [];
  statusMessage = reasonText;

  setTimeout(async () => {
    try {
      if (client) {
        console.log(`[WhatsApp] Cerrando instancia previa (${reasonText})...`);
        try {
          client.pupPage?.removeAllListeners?.();
          client.removeAllListeners?.();
        } catch (_) {}
        await client.destroy().catch(() => {});
        client = null;
      }
    } catch (destroyErr) {
      // Ignorar si ya estaba destruida
    }

    setTimeout(() => {
      isInitializing = false;
      isRestarting = false;
      initWhatsAppClient();
    }, 1500);
  }, 400);
}

// Inicializar por primera vez
initWhatsAppClient();

let activeWorkspace = null;

// Rutas de la API
app.get('/api/whatsapp/workspace', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({ activeWorkspace });
});

app.post('/api/whatsapp/workspace', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { workspace } = req.body;
  if (workspace && typeof workspace === 'string') {
    const prev = activeWorkspace;
    activeWorkspace = workspace.trim();
    console.log(`[Workspace] Área de trabajo del bot asignada: "${activeWorkspace}" (anterior: "${prev || 'ninguna'}")`);
    return res.json({ success: true, activeWorkspace });
  }
  if (workspace === null) {
    activeWorkspace = null;
    console.log('[Workspace] Bot desvinculado de área de trabajo específica.');
    return res.json({ success: true, activeWorkspace: null });
  }
  return res.status(400).json({ error: 'workspace string o null es requerido' });
});

app.get('/api/whatsapp/status', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];
  
  // Si aún no hay área de trabajo activa y la solicitud especifica una, auto-asignarla
  if (!activeWorkspace && requestedWorkspace && typeof requestedWorkspace === 'string') {
    activeWorkspace = requestedWorkspace.trim();
    console.log(`[Workspace] Bot auto-asignado al área de trabajo inicial: "${activeWorkspace}"`);
  }

  const isWorkspaceMatch = !activeWorkspace || !requestedWorkspace || activeWorkspace === requestedWorkspace;

  res.json({
    isReady,
    needsAuth: !isReady && qrCodeData !== null,
    qr: qrCodeData,
    statusMessage: !isWorkspaceMatch 
      ? `El bot está asignado al área de trabajo "${activeWorkspace}".` 
      : statusMessage,
    activeWorkspace,
    isWorkspaceMatch
  });
});

app.post('/api/whatsapp/logout', async (req, res) => {
  console.log('[Logout] Solicitud de cierre de sesión recibida desde la API...');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({ success: true, message: 'Cerrando sesión y reiniciando cliente...' });

  isReady = false;
  qrCodeData = null;
  statusMessage = 'Cerrando sesión...';

  try {
    if (client) {
      await client.logout().catch(() => {});
    }
  } catch (e) {
    // Ignorar si falla
  }
  restartClient('Sesión cerrada. Generando nuevo QR...');
});

app.get('/api/whatsapp/chats', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];
  if (activeWorkspace && requestedWorkspace && requestedWorkspace !== activeWorkspace) {
    return res.status(403).json({ 
      error: `El bot está asignado exclusivamente al área de trabajo "${activeWorkspace}". No disponible en "${requestedWorkspace}".`,
      activeWorkspace 
    });
  }

  if (!isReady || !client) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  try {
    let formattedChats = [];

    // 1. Extracción directa desde la memoria de WhatsApp Web en Puppeteer enriquecida con la libreta de contactos
    try {
      if (client.pupPage) {
        formattedChats = await client.pupPage.evaluate(() => {
          try {
            const collections = window.require?.('WAWebCollections') || window.Store;
            const chatCollection = (collections?.Chat || window.Store?.Chat)?.getModelsArray?.() || [];
            const contactCollection = collections?.Contact || window.Store?.Contact;
            const ContactGetters = window.require?.('WAWebContactGetters');

            return chatCollection
              .map(c => {
                const id = c.id?._serialized || (typeof c.id === 'string' ? c.id : '');
                const isGroup = Boolean(c.isGroup || (id && id.endsWith('@g.us')));

                // 1. Intentar obtener el contacto asociado de la colección global
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

                // 2. Extraer el mejor nombre disponible
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

                // 3. Fallback a pushname directo o teléfono
                if (!name || name === id) {
                  name = c.contact?.pushname || c.contact?.notifyName || (c.id?.user ? `+${c.id.user}` : 'Chat');
                }

                const timestamp = c.t || c.conversationTimestamp || 0;
                const avatarUrl = c.contact?.profilePicThumbObj?.eurl || c.profilePicThumb?.eurl || null;
                return { id, name, isGroup, timestamp, avatarUrl };
              })
              .filter(c => c.id && !c.id.includes('@broadcast') && !c.id.includes('status@broadcast'))
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .map(({ id, name, isGroup, avatarUrl }) => {
                if (avatarUrl) avatarCache.set(id, avatarUrl);
                return { 
                  id, 
                  name, 
                  isGroup, 
                  avatarUrl: avatarUrl ? `/api/whatsapp/chats/${encodeURIComponent(id)}/avatar.jpg` : null 
                };
              });
          } catch (e) {
            return [];
          }
        });
      }
    } catch (evalErr) {
      console.warn(`[Chats] Extractor en memoria falló (${evalErr.message}). Intentando fallback nativo...`);
    }

    // 2. Si el extractor directo devolvió vacío, intentar client.getChats() con un timeout estricto de 4 segundos
    if (!formattedChats || formattedChats.length === 0) {
      try {
        const getChatsSafe = client.getChats().catch(err => {
          console.warn(`[Chats] Error interno en client.getChats(): ${err?.message || err}`);
          return [];
        });
        const timeoutSafe = new Promise(resolve => setTimeout(() => resolve([]), 4000));
        const chats = await Promise.race([getChatsSafe, timeoutSafe]);
        if (Array.isArray(chats) && chats.length > 0) {
          formattedChats = chats.map(chat => ({
            id: chat.id?._serialized || (typeof chat.id === 'string' ? chat.id : ''),
            name: chat.name || chat.formattedTitle || 'Sin nombre',
            isGroup: Boolean(chat.isGroup)
          })).filter(c => c.id);
        }
      } catch (err) {
        console.warn(`[Chats] client.getChats() omitido: ${err?.message || err}`);
      }
    }

    // 3. Para los chats individuales cuyo nombre quedó como número de teléfono,
    // resolver su nombre real usando client.getContactById (consulta garantizada a WhatsApp)
    if (Array.isArray(formattedChats) && formattedChats.length > 0) {
      const chatsNeedingNames = formattedChats.filter(c => 
        !c.isGroup && (/^\+?\d{7,}$/.test(c.name.replace(/[\s\-\(\)]/g, '')) || c.name === c.id || c.name === 'Chat')
      );

      if (chatsNeedingNames.length > 0) {
        await Promise.all(chatsNeedingNames.slice(0, 25).map(async (chat) => {
          try {
            const contact = await client.getContactById(chat.id);
            const resolvedName = contact?.name || contact?.pushname || contact?.shortName || contact?.verifiedName;
            if (resolvedName && resolvedName.trim() && !/^\+?\d{7,}$/.test(resolvedName.replace(/[\s\-\(\)]/g, ''))) {
              chat.name = resolvedName.trim();
            }
          } catch (err) {}
        }));
      }
    }

    // 4. Actualizar o recuperar de caché preservando nombres reales previamente conocidos
    if (formattedChats && formattedChats.length > 0) {
      if (cachedChats && cachedChats.length > 0) {
        const cachedMap = new Map(cachedChats.map(c => [c.id, c.name]));
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
          contactNameCache.set(c.id, c.name);
          if (typeof c.id === 'string' && c.id.includes('@')) {
            const u = c.id.split('@')[0];
            contactNameCache.set(`${u}@c.us`, c.name);
            contactNameCache.set(`${u}@lid`, c.name);
          }
        }
      });

      // Asignar avatares conocidos desde la caché
      formattedChats.forEach(c => {
        if (avatarCache.has(c.id)) {
          const cachedPic = avatarCache.get(c.id);
          c.avatarUrl = cachedPic ? `/api/whatsapp/chats/${encodeURIComponent(c.id)}/avatar.jpg` : null;
        } else if (c.avatarUrl && typeof c.avatarUrl === 'string' && c.avatarUrl.startsWith('http')) {
          avatarCache.set(c.id, c.avatarUrl);
          c.avatarUrl = `/api/whatsapp/chats/${encodeURIComponent(c.id)}/avatar.jpg`;
        }
      });

      // Resolver en paralelo los avatares de los primeros 25 chats activos si aún no han sido consultados
      const chatsNeedingAvatar = formattedChats.slice(0, 25).filter(c => !avatarCache.has(c.id));
      if (chatsNeedingAvatar.length > 0) {
        await Promise.allSettled(chatsNeedingAvatar.map(async c => {
          try {
            const pic = await resolveChatAvatarUrl(c.id);
            c.avatarUrl = pic ? `/api/whatsapp/chats/${encodeURIComponent(c.id)}/avatar.jpg` : null;
          } catch (e) {
            c.avatarUrl = null;
          }
        }));
      }

      cachedChats = formattedChats;
    } else if (cachedChats.length > 0) {
      formattedChats = cachedChats;
    }

    res.json(formattedChats || []);
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    res.json(cachedChats || []);
  }
});

app.get('/api/whatsapp/chats/:chatId/messages', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];
  if (activeWorkspace && requestedWorkspace && requestedWorkspace !== activeWorkspace) {
    return res.status(403).json({ 
      error: `El bot está asignado exclusivamente al área de trabajo "${activeWorkspace}".`,
      activeWorkspace 
    });
  }

  if (!isReady || !client) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  const { chatId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  try {
    let targetChatId = chatId;
    if (typeof targetChatId === 'string' && !targetChatId.includes('@')) {
      targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
    }

    const chat = await client.getChatById(targetChatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const messages = await chat.fetchMessages({ limit });

    // 1. Guardar en caché nombres reales ya presentes en los mensajes
    messages.forEach(msg => {
      const authorId = msg.author || msg.from;
      const explicitName = msg._data?.notifyName || msg._data?.name;
      if (authorId && explicitName && typeof explicitName === 'string' && explicitName.trim()) {
        const cleanName = explicitName.trim();
        if (!/^\+?\d{7,}$/.test(cleanName.replace(/[\s\-\(\)]/g, ''))) {
          contactNameCache.set(authorId, cleanName);
          if (authorId.includes('@')) {
            const u = authorId.split('@')[0];
            contactNameCache.set(`${u}@c.us`, cleanName);
            contactNameCache.set(`${u}@lid`, cleanName);
          }
        }
      }
    });

    // 2. Identificar autores que aún no tienen un nombre real en caché
    const unresolvedAuthors = [...new Set(
      messages
        .filter(m => !m.fromMe)
        .map(m => m.author || m.from)
        .filter(Boolean)
        .filter(id => {
          const cached = contactNameCache.get(id);
          return !cached || /^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''));
        })
    )];

    // 3. Resolución en bloque a través de la memoria de WhatsApp Web (Puppeteer)
    if (unresolvedAuthors.length > 0 && client.pupPage) {
      try {
        const resolvedMap = await client.pupPage.evaluate((ids) => {
          const res = {};
          const collections = window.require?.('WAWebCollections') || window.Store;
          const contactCollection = collections?.Contact || window.Store?.Contact;
          const ContactGetters = window.require?.('WAWebContactGetters');

          ids.forEach(id => {
            try {
              let contact = null;
              if (contactCollection) {
                contact = contactCollection.get(id);
                if (!contact && id.includes('@')) {
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
              contactNameCache.set(id, name);
              if (id.includes('@')) {
                const u = id.split('@')[0];
                contactNameCache.set(`${u}@c.us`, name);
                contactNameCache.set(`${u}@lid`, name);
              }
            }
          }
        }
      } catch (evalErr) {
        // Fallback silencioso
      }
    }

    // 4. Fallback con client.getContactById para autores que sigan sin nombre
    const stillUnresolved = unresolvedAuthors.filter(id => {
      const cached = contactNameCache.get(id);
      return !cached || /^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''));
    });

    if (stillUnresolved.length > 0) {
      await Promise.all(stillUnresolved.slice(0, 15).map(async (id) => {
        try {
          const contact = await client.getContactById(id);
          const name = contact?.name || contact?.pushname || contact?.shortName || contact?.verifiedName;
          if (name && typeof name === 'string' && name.trim() && !/^\+?\d{7,}$/.test(name.replace(/[\s\-\(\)]/g, ''))) {
            contactNameCache.set(id, name.trim());
            if (id.includes('@')) {
              const u = id.split('@')[0];
              contactNameCache.set(`${u}@c.us`, name.trim());
              contactNameCache.set(`${u}@lid`, name.trim());
            }
          }
        } catch (err) {}
      }));
    }

    const isGroupChat = Boolean(chat.isGroup || (typeof targetChatId === 'string' && targetChatId.endsWith('@g.us')));

    const formatted = await Promise.all(messages.map(async (msg) => {
      const msgId = msg.id?._serialized || msg.id?.$1 || (typeof msg.id === 'string' ? msg.id : msg.id?.id) || String(Date.now());

      // Guardar en recentMessagesCache para descarga de media rápida y fallback
      if (recentMessagesCache.size >= MAX_RECENT_MESSAGES) {
        const firstKey = recentMessagesCache.keys().next().value;
        recentMessagesCache.delete(firstKey);
      }
      recentMessagesCache.set(msgId, msg);

      const isRevoked = Boolean(
        msg.type === 'revoked' ||
        msg._data?.type === 'revoked' ||
        msg._data?.subtype === 'sender_revoke' ||
        msg._data?.subtype === 'admin_revoke' ||
        msg._data?.isRevoked === true ||
        revokedMessageIds.has(msgId)
      );

      let thumbnail = null;
      if (!isRevoked && msg.hasMedia) {
        thumbnail = extractThumbnail(msg._data?.body || msg._data?.thumbnail || msg._data?.mediaData?.preview);
      }

      let senderName = null;
      if (msg.fromMe) {
        senderName = 'Tú';
      } else {
        const authorId = msg.author || msg.from;
        const cached = authorId ? contactNameCache.get(authorId) : null;
        const notify = msg._data?.notifyName || msg._data?.name;

        if (cached && !/^\+?\d{7,}$/.test(cached.replace(/[\s\-\(\)]/g, ''))) {
          senderName = cached;
        } else if (notify && typeof notify === 'string' && notify.trim() && !/^\+?\d{7,}$/.test(notify.replace(/[\s\-\(\)]/g, ''))) {
          senderName = notify.trim();
          if (authorId) contactNameCache.set(authorId, senderName);
        } else if (cached) {
          senderName = cached;
        } else if (notify && typeof notify === 'string' && notify.trim()) {
          senderName = notify.trim();
        } else if (isGroupChat && msg.author) {
          const raw = msg.author.split('@')[0];
          senderName = /^\d{7,15}$/.test(raw) ? `+${raw}` : raw;
        } else {
          senderName = chat.name || 'Contacto';
        }
      }

      const quotedMsg = !isRevoked ? await resolveQuotedMsg(msg, isGroupChat) : null;

      return {
        id: msgId,
        body: isRevoked ? '' : (msg.body || ''),
        type: isRevoked ? 'revoked' : (msg.type || 'chat'),
        timestamp: (msg.timestamp || 0) * 1000,
        fromMe: Boolean(msg.fromMe),
        from: msg.from,
        to: msg.to,
        author: msg.author || null,
        senderName,
        hasMedia: isRevoked ? false : Boolean(msg.hasMedia),
        mediaUrl: (!isRevoked && msg.hasMedia) ? `/api/whatsapp/messages/${encodeURIComponent(msgId)}/media` : null,
        thumbnail,
        ack: msg.ack,
        isRevoked,
        hasQuotedMsg: Boolean(quotedMsg),
        quotedMsg
      };
    }));

    res.json(formatted);
  } catch (error) {
    console.error(`[Messages] Error obteniendo mensajes de ${chatId}:`, error?.message || error);
    res.status(500).json({ error: error.message || 'Error al obtener mensajes' });
  }
});

// Endpoint que sirve la imagen binaria (JPEG) directamente desde proxy local
app.get('/api/whatsapp/chats/:chatId/avatar.jpg', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const { chatId } = req.params;
  const decodedId = decodeURIComponent(chatId);

  // 1. Revisar caché en memoria del buffer de imagen
  if (avatarImageCache.has(decodedId)) {
    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(avatarImageCache.get(decodedId));
  }

  try {
    const picUrl = await resolveChatAvatarUrl(decodedId);
    if (picUrl) {
      const cdnRes = await fetch(picUrl);
      if (cdnRes.ok) {
        const arrayBuf = await cdnRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        if (avatarImageCache.size >= MAX_AVATAR_IMAGE_CACHE) {
          const firstKey = avatarImageCache.keys().next().value;
          if (firstKey) avatarImageCache.delete(firstKey);
        }
        avatarImageCache.set(decodedId, buffer);

        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(buffer);
      }
    }
  } catch (err) {
    console.warn(`[Avatar] Error obteniendo avatar.jpg para ${decodedId}:`, err?.message || err);
  }

  // Fallback visual SVG neutro si no tiene foto (no retorna 404 para evitar spam en consola)
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>'
  );
});

// Endpoint JSON para consultar si un chat tiene avatar
app.get('/api/whatsapp/chats/:chatId/avatar', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const { chatId } = req.params;
  const decodedId = decodeURIComponent(chatId);

  try {
    const picUrl = await resolveChatAvatarUrl(decodedId);
    if (picUrl) {
      return res.json({
        avatarUrl: `/api/whatsapp/chats/${encodeURIComponent(decodedId)}/avatar.jpg`
      });
    }
    return res.json({ avatarUrl: null });
  } catch (err) {
    return res.json({ avatarUrl: null });
  }
});

// Cache en memoria para archivos multimedia descargados (evita re-descargar de Puppeteer)
const mediaCache = new Map();
const MAX_MEDIA_CACHE = 100;

app.get('/api/whatsapp/messages/:messageId/media', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const { messageId } = req.params;
  const decodedMsgId = decodeURIComponent(messageId);

  if (!isReady || !client) {
    return res.status(503).json({ error: 'WhatsApp client is not ready' });
  }

  // 1. Revisar caché en memoria
  if (mediaCache.has(decodedMsgId)) {
    const cached = mediaCache.get(decodedMsgId);
    res.setHeader('Content-Type', cached.mimetype || 'image/jpeg');
    return res.send(cached.buffer);
  }

  try {
    let media = null;
    let msgObj = recentMessagesCache.get(decodedMsgId) || null;

    // 2. Si no estaba en recentMessagesCache, intentar mediante client.getMessageById
    if (!msgObj) {
      try {
        msgObj = await client.getMessageById(decodedMsgId);
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
    if ((!media || !media.data) && client.pupPage) {
      try {
        const resolved = await client.pupPage.evaluate(async (msgId) => {
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

    // 5. Fallback 2: si no se pudo descargar el archivo completo, usar thumbnail de _data.body o mediaData
    if (!media || !media.data) {
      const rawThumb = msgObj?._data?.body || msgObj?._data?.thumbnail || msgObj?._data?.mediaData?.preview;
      if (rawThumb && typeof rawThumb === 'string') {
        let rawBase64 = rawThumb;
        if (rawBase64.includes('base64,')) {
          rawBase64 = rawBase64.split('base64,')[1];
        }
        if (rawBase64.length > 20) {
          const buffer = Buffer.from(rawBase64, 'base64');
          res.setHeader('Content-Type', 'image/jpeg');
          return res.send(buffer);
        }
      }
    }

    if (!media || !media.data) {
      return res.status(404).json({ error: 'Media no disponible o expirada en WhatsApp' });
    }

    const buffer = Buffer.from(media.data, 'base64');
    const mimetype = media.mimetype || 'image/jpeg';

    if (mediaCache.size >= MAX_MEDIA_CACHE) {
      const firstKey = mediaCache.keys().next().value;
      mediaCache.delete(firstKey);
    }
    mediaCache.set(decodedMsgId, { mimetype, buffer, timestamp: Date.now() });

    res.setHeader('Content-Type', mimetype);
    return res.send(buffer);
  } catch (err) {
    console.error(`[Media] Error descargando media para ${decodedMsgId}:`, err?.message || err);
    res.status(500).json({ error: err.message || 'Error al descargar archivo multimedia' });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  const { chatId, message, media, workspaceId } = req.body;
  const requestedWorkspace = workspaceId || req.query.workspace || req.headers['x-workspace-id'];

  if (activeWorkspace && requestedWorkspace && requestedWorkspace !== activeWorkspace) {
    console.warn(`[Send] Envío rechazado: el bot está activo en "${activeWorkspace}", se solicitó desde "${requestedWorkspace}".`);
    return res.status(403).json({ 
      error: `El bot está asignado exclusivamente al área de trabajo "${activeWorkspace}". No disponible en "${requestedWorkspace}".`,
      activeWorkspace 
    });
  }

  const hasMedia = media && Array.isArray(media) && media.length > 0;

  // Permitir message vacío si hay adjuntos (ej: reporte solo de fotos)
  if (!chatId || (!message && !hasMedia)) {
    return res.status(400).json({ error: 'Faltan parámetros: chatId y al menos message o media son requeridos' });
  }

  // Normalizar chatId para WhatsApp (asegurar @c.us o @g.us)
  let targetChatId = chatId;
  if (typeof targetChatId === 'string' && !targetChatId.includes('@')) {
    targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
  }

  try {
    let textMsgId = null;

    // Solo enviar texto si hay contenido (WhatsApp no acepta mensajes vacíos)
    if (message && message.trim()) {
      console.log(`[Send] Enviando texto a ${targetChatId}...`);
      const response = await client.sendMessage(targetChatId, message);
      textMsgId = response?.id?._serialized || response?.id || `msg_${Date.now()}`;
      console.log(`[Send] Texto enviado exitosamente. ID: ${textMsgId}`);
    }

    // Responder inmediatamente — el browser no espera que las fotos terminen de enviarse.
    res.json({ success: true, messageId: textMsgId, mediaCount: hasMedia ? media.length : 0 });

    // Procesar y enviar fotos en background (fire-and-forget)
    if (hasMedia) {
      (async () => {
        for (const item of media) {
          if (!item.url) continue;
          try {
            const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches) {
              // Base64 data URI
              const messageMedia = new MessageMedia(matches[1], matches[2], item.name || 'foto.jpg');
              console.log(`[Media] Enviando adjunto a ${targetChatId}: ${item.name || 'foto.jpg'}`);
              await client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
            } else {
              // URL pública (ej: Supabase Storage)
              console.log(`[Media] Adjunto URL pública a ${targetChatId}: ${item.url.substring(0, 80)}...`);
              const messageMedia = await MessageMedia.fromUrl(item.url, { unsafeMime: true });
              await client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
            }
          } catch (mediaErr) {
            console.error(`[Media] Error enviando adjunto "${item.name || 'foto'}" a ${targetChatId}:`, mediaErr.message || mediaErr);
          }
        }
      })();
    }
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: error.toString() });
  }
});


// === SISTEMA DE PROGRAMACIÓN EN SEGUNDO PLANO ===
const fs = require('fs');
const path = require('path');
const SCHEDULE_FILE = path.join(__dirname, 'scheduled_messages.json');

// Descartar la cola de mensajes programados al iniciar el bot
try {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify([], null, 2));
  console.log('[Programado] Se ha descartado la cola de mensajes programados al iniciar el bot.');
} catch (e) {
  console.error('Error al descartar la cola de mensajes al iniciar:', e);
}

function getScheduledMessages() {
  if (!fs.existsSync(SCHEDULE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
  } catch (e) {
    console.error('Error leyendo scheduled_messages.json:', e);
    return [];
  }
}

function saveScheduledMessages(messages) {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(messages, null, 2));
  } catch (e) {
    console.error('Error guardando scheduled_messages.json:', e);
  }
}

// Bucle en segundo plano para procesar mensajes programados
setInterval(async () => {
  if (!isReady) return;
  const messages = getScheduledMessages();
  const pendingCount = messages.filter(m => m.status === 'pending').length;

  if (pendingCount > 0) {
    console.log(`[Programado] Revisando cola: ${pendingCount} mensaje(s) pendiente(s)`);
  }

  const now = new Date();
  let updated = false;

  for (const msg of messages) {
    if (msg.status === 'pending' && new Date(msg.scheduledTime) <= now) {
      // Validar si el mensaje pertenece al área de trabajo activa actual
      if (activeWorkspace && msg.workspaceId && msg.workspaceId !== activeWorkspace) {
        // Omitir envío mientras el bot esté asignado a otra área de trabajo
        continue;
      }

      try {
        let targetChatId = msg.chatId;
        if (typeof targetChatId === 'string' && !targetChatId.includes('@')) {
          targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
        }

        console.log(`[Programado] Enviando mensaje ${msg.id} a ${targetChatId}...`);

        // Solo enviar texto si hay contenido (WhatsApp no acepta mensajes vacíos)
        if (msg.message && msg.message.trim()) {
          await client.sendMessage(targetChatId, msg.message);
        }

        // Si se programaron archivos/fotos adjuntos, se procesan y envían
        if (msg.media && Array.isArray(msg.media)) {
          for (const item of msg.media) {
            if (item.url) {
              const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
              if (matches) {
                const messageMedia = new MessageMedia(matches[1], matches[2], item.name || 'foto.jpg');
                console.log(`[Programado - Media] Enviando archivo adjunto a ${targetChatId}: ${item.name || 'foto.jpg'}`);
                await client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
              } else {
                const messageMedia = await MessageMedia.fromUrl(item.url, { unsafeMime: true });
                await client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
              }
            }
          }
        }

        msg.status = 'sent';
        console.log(`[Programado] Mensaje ${msg.id} enviado exitosamente.`);
      } catch (error) {
        console.error(`[Programado] Error enviando mensaje ${msg.id}:`, error);
        msg.status = 'failed';
        msg.error = error.toString();
      }
      updated = true;
    }
  }

  if (updated) {
    saveScheduledMessages(messages);
  }
}, 20000); // Revisa cada 20 segundos

// Endpoints del sistema de programación
app.post('/api/whatsapp/schedule', (req, res) => {
  const { id, chatId, message, scheduledTime, title, media, workspaceId } = req.body;
  const requestedWorkspace = workspaceId || req.query.workspace || req.headers['x-workspace-id'];

  if (activeWorkspace && requestedWorkspace && requestedWorkspace !== activeWorkspace) {
    console.warn(`[Schedule] Programación rechazada: el bot está en "${activeWorkspace}", se solicitó desde "${requestedWorkspace}".`);
    return res.status(403).json({ 
      error: `El bot está asignado exclusivamente al área de trabajo "${activeWorkspace}". No disponible en "${requestedWorkspace}".`,
      activeWorkspace 
    });
  }

  const hasMedia = media && Array.isArray(media) && media.length > 0;

  // Permitir message vacío si hay adjuntos
  if (!id || !chatId || (!message && !hasMedia) || !scheduledTime) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos para programar' });
  }

  const messages = getScheduledMessages();
  const existingIndex = messages.findIndex(m => m.id === id);
  const newMsg = { 
    id, 
    chatId, 
    message, 
    scheduledTime, 
    title, 
    media, 
    workspaceId: requestedWorkspace || activeWorkspace || null,
    status: 'pending' 
  };

  if (existingIndex >= 0) {
    messages[existingIndex] = newMsg; // Actualiza existente
  } else {
    messages.push(newMsg); // Nuevo
  }

  saveScheduledMessages(messages);
  const pendingCount = messages.filter(m => m.status === 'pending').length;
  console.log(`\n[Programado] Mensaje programado añadido/actualizado. Total pendientes: ${pendingCount}`);
  res.json({ success: true, message: 'Mensaje programado en el servidor' });
});

app.delete('/api/whatsapp/schedule/:id', (req, res) => {
  const { id } = req.params;
  let messages = getScheduledMessages();
  const initialLength = messages.length;
  messages = messages.filter(m => m.id !== id);

  if (messages.length !== initialLength) {
    saveScheduledMessages(messages);
    const pendingCount = messages.filter(m => m.status === 'pending').length;
    console.log(`\n[Programado] Mensaje cancelado. Total pendientes: ${pendingCount}`);
    res.json({ success: true, message: 'Programación cancelada en el servidor' });
  } else {
    res.json({ success: false, message: 'No se encontró la programación en el servidor' });
  }
});

app.get('/api/whatsapp/scheduled', (req, res) => {
  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];
  let messages = getScheduledMessages();
  if (requestedWorkspace) {
    messages = messages.filter(m => !m.workspaceId || m.workspaceId === requestedWorkspace);
  }
  res.json(messages);
});
// ===============================================

app.listen(port, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Servidor de WhatsApp Bot activo en puerto ${port}`);
  console.log(`   - Local:    http://localhost:${port}`);
  console.log(`   - Red LAN:  http://0.0.0.0:${port}`);
  console.log(`==================================================\n`);
});

// Manejo de cierre gracioso para evitar archivos bloqueados en Windows
process.on('SIGINT', async () => {
  console.log('\nCerrando cliente de WhatsApp...');
  try {
    await client.destroy();
  } catch (e) {
    // A veces falla si ya estaba cerrado, ignoramos
  }
  process.exit(0);
});
