const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3001;

// Middleware para CORS y Private Network Access (PNA) con Orígenes Permitidos Seguros
const allowedOrigins = [
  'http://localhost:4173', // Vite Local Dev
  'http://localhost:3000', // Local Alternativo
  'https://minutas.vercel.app' // Hosting de Producción (Reemplazar con tu dominio real)
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let isReady = false;
let qrCodeData = null;
let statusMessage = 'Iniciando cliente...';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-site-isolation-trials',
      '--no-zygote'
    ],
  },
  // Fijar versión estable de WhatsApp Web para evitar navegaciones inesperadas
  // que destruyen el contexto de Puppeteer durante la inyección (Client.js:inject)
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1043159177-alpha.html',
  },
});

client.on('qr', (qr) => {
  qrCodeData = qr;
  statusMessage = 'Esperando escaneo de QR...';
  console.log('\n==================================================');
  console.log('Escanea este código QR con WhatsApp para iniciar:');
  console.log('==================================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  statusMessage = `Sincronizando: ${percent}%`;
  console.log(`Progreso de carga: ${percent}% - ${message}`);
});

client.on('ready', () => {
  isReady = true;
  qrCodeData = null;
  statusMessage = 'Listo';
  console.log('\n==================================================');
  console.log('✅ Cliente de WhatsApp está listo!');
  console.log(`📡 Servidor API escuchando en http://localhost:${port}`);
  console.log('==================================================\n');
});

client.on('authenticated', () => {
  console.log('Autenticación exitosa.');
  statusMessage = 'Autenticado. Sincronizando chats...';
  qrCodeData = null;
});

client.on('auth_failure', msg => {
  console.error('Error de autenticación:', msg);
  isReady = false;
  statusMessage = 'Error de autenticación';
});

client.on('disconnected', (reason) => {
  console.log('Cliente de WhatsApp desconectado:', reason);
  isReady = false;
  qrCodeData = null;
  statusMessage = 'Desconectado';
});

// Inicializar con reintentos automáticos para sobrevivir a "Execution context was destroyed"
async function startClient(attempt = 1) {
  const MAX_ATTEMPTS = 3;
  try {
    console.log(`[Init] Iniciando cliente WhatsApp (intento ${attempt}/${MAX_ATTEMPTS})...`);
    await client.initialize();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Init] Fallo en intento ${attempt}: ${msg}`);
    
    // Destruir el cliente para cerrar el proceso de Chromium y liberar el lock sobre la carpeta ./session
    try {
      console.log('[Init] Cerrando navegador para liberar session lock...');
      await client.destroy();
    } catch (destroyErr) {
      // Ignorar fallos de destrucción si ya estaba cerrado o no inicializado
    }

    if (attempt < MAX_ATTEMPTS) {
      console.log(`[Init] Reintentando en 3 segundos...`);
      await new Promise(r => setTimeout(r, 3000));
      await startClient(attempt + 1);
    } else {
      console.error('[Init] Se agotaron los reintentos. Saliendo.');
      process.exit(1);
    }
  }
}

startClient();

// Rutas de la API
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    isReady,
    needsAuth: !isReady && qrCodeData !== null,
    qr: qrCodeData,
    statusMessage
  });
});

app.get('/api/whatsapp/chats', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  try {
    const chats = await client.getChats();
    const errors = chats.filter(c => c.error);
    if (errors.length > 0) {
      console.warn(`[chats] ${errors.length} chats fallaron al serializarse por completo. Ejemplo:`, errors[0].name, "-", errors[0].error);
    }
    const formattedChats = chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup
    }));

    res.json(formattedChats);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : '';
    console.error('[chats] getChats() FAILED:', errMsg);
    if (errStack) console.error('[chats] Stack:', errStack);
    res.status(500).json({ error: errMsg, detail: errStack });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  const { chatId, message, media } = req.body;
  const hasMedia = media && Array.isArray(media) && media.length > 0;

  // Permitir message vacío si hay adjuntos (ej: reporte solo de fotos)
  if (!chatId || (!message && !hasMedia)) {
    return res.status(400).json({ error: 'Faltan parámetros: chatId y al menos message o media son requeridos' });
  }

  try {
    let textMsgId = null;

    // Solo enviar texto si hay contenido (WhatsApp no acepta mensajes vacíos)
    if (message && message.trim()) {
      const response = await client.sendMessage(chatId, message);
      textMsgId = response && response.id ? response.id._serialized : null;
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
              console.log(`[Media] Enviando adjunto a ${chatId}: ${item.name || 'foto.jpg'}`);
              await client.sendMessage(chatId, messageMedia, { caption: item.description || '' });
            } else {
              // URL pública (ej: Supabase Storage)
              console.log(`[Media] Adjunto URL pública a ${chatId}: ${item.url.substring(0, 80)}...`);
              const messageMedia = await MessageMedia.fromUrl(item.url, { unsafeMime: true });
              await client.sendMessage(chatId, messageMedia, { caption: item.description || '' });
            }
          } catch (mediaErr) {
            console.error(`[Media] Error enviando adjunto "${item.name || 'foto'}" a ${chatId}:`, mediaErr.message || mediaErr);
          }
        }
      })();
    }
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/api/whatsapp/edit', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  const { messageId, message } = req.body;

  if (!messageId || !message) {
    return res.status(400).json({ error: 'Faltan parámetros: messageId y message son requeridos' });
  }

  try {
    const msg = await client.getMessageById(messageId);
    if (!msg) {
      return res.status(404).json({ error: 'No se encontró el mensaje original' });
    }
    const editedMsg = await msg.edit(message);
    res.json({ success: true, messageId: editedMsg && editedMsg.id ? editedMsg.id._serialized : null });
  } catch (error) {
    console.error('Error al editar mensaje:', error);
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
      try {
        console.log(`[Programado] Enviando mensaje ${msg.id} a ${msg.chatId}...`);

        // Solo enviar texto si hay contenido (WhatsApp no acepta mensajes vacíos)
        if (msg.message && msg.message.trim()) {
          await client.sendMessage(msg.chatId, msg.message);
        }

        // Si se programaron archivos/fotos adjuntos, se procesan y envían
        if (msg.media && Array.isArray(msg.media)) {
          for (const item of msg.media) {
            if (item.url) {
              const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
              if (matches) {
                const messageMedia = new MessageMedia(matches[1], matches[2], item.name || 'foto.jpg');
                console.log(`[Programado - Media] Enviando archivo adjunto a ${msg.chatId}: ${item.name || 'foto.jpg'}`);
                await client.sendMessage(msg.chatId, messageMedia, { caption: item.description || '' });
              } else {
                const messageMedia = await MessageMedia.fromUrl(item.url, { unsafeMime: true });
                await client.sendMessage(msg.chatId, messageMedia, { caption: item.description || '' });
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
  const { id, chatId, message, scheduledTime, title, media } = req.body;
  const hasMedia = media && Array.isArray(media) && media.length > 0;

  // Permitir message vacío si hay adjuntos
  if (!id || !chatId || (!message && !hasMedia) || !scheduledTime) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos para programar' });
  }

  const messages = getScheduledMessages();
  const existingIndex = messages.findIndex(m => m.id === id);
  const newMsg = { id, chatId, message, scheduledTime, title, media, status: 'pending' };

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
  res.json(getScheduledMessages());
});
// ===============================================

app.listen(port, () => {
  console.log(`\nIniciando servidor de WhatsApp Bot en puerto ${port}...`);
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
