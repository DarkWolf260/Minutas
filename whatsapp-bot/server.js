const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3001;

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
  // Requerido por navegadores basados en Chromium para Private Network Access (PNA)
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

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

function initWhatsAppClient() {
  if (isInitializing) return;
  isInitializing = true;
  isReady = false;
  qrCodeData = null;
  statusMessage = 'Iniciando cliente de WhatsApp...';

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
      headless: true,
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

  client.on('disconnected', async (reason) => {
    console.log('Cliente de WhatsApp desconectado:', reason);
    restartClient('Desconectado. Generando nuevo QR...');
  });

  client.initialize()
    .then(() => {
      isInitializing = false;
    })
    .catch(err => {
      console.error('Error al inicializar el cliente de WhatsApp:', err);
      statusMessage = 'Error al inicializar cliente: ' + (err.message || err);
      isInitializing = false;
    });
}

async function restartClient(reasonText = 'Reiniciando cliente...') {
  if (isInitializing) return;
  isInitializing = true;
  isReady = false;
  qrCodeData = null;
  statusMessage = reasonText;

  try {
    if (client) {
      console.log(`[WhatsApp] Cerrando instancia previa (${reasonText})...`);
      await client.destroy();
    }
  } catch (destroyErr) {
    // Ignorar si ya estaba destruida
  }

  setTimeout(() => {
    isInitializing = false;
    initWhatsAppClient();
  }, 1500);
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
      await client.logout();
    }
  } catch (e) {
    try {
      if (client) await client.destroy();
    } catch (destroyErr) {}
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

    try {
      const chats = await client.getChats();
      formattedChats = chats.map(chat => ({
        id: chat.id?._serialized || (typeof chat.id === 'string' ? chat.id : ''),
        name: chat.name || chat.formattedTitle || 'Sin nombre',
        isGroup: Boolean(chat.isGroup)
      })).filter(c => c.id);
    } catch (err) {
      console.warn(`[Chats] client.getChats() nativo lanzó error (${err.message || err}). Usando extractor directo...`);

      formattedChats = await client.pupPage.evaluate(() => {
        try {
          const chatCollection = (window.require('WAWebCollections')?.Chat || window.Store?.Chat)?.getModelsArray() || [];
          return chatCollection.map(c => ({
            id: c.id?._serialized || (typeof c.id === 'string' ? c.id : ''),
            name: c.name || c.formattedTitle || c.contact?.name || 'Chat',
            isGroup: Boolean(c.isGroup)
          })).filter(c => c.id);
        } catch (e) {
          return [];
        }
      });
    }

    res.json(formattedChats);
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    res.status(500).json({ error: error.toString() });
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
