const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3001;

// Middleware para CORS y Private Network Access (PNA) con Orígenes Permitidos Seguros
const allowedOrigins = [
  'http://localhost:5173', // Vite Local Dev
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  }
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

client.initialize();

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
    // Filtramos solo grupos o permitimos todo? El usuario quiere enviar a grupos.
    const formattedChats = chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup
    }));

    res.json(formattedChats);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client is not ready' });
  }

  const { chatId, message, media } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: 'Faltan parámetros: chatId y message son requeridos' });
  }

  try {
    const response = await client.sendMessage(chatId, message);
    
    // Si se enviaron archivos/fotos adjuntos, se procesan y envían
    if (media && Array.isArray(media)) {
      for (const item of media) {
        if (item.url) {
          // Extraer mimetype y datos base64 de la Data URL
          const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches) {
            const mimetype = matches[1];
            const data = matches[2];
            const messageMedia = new MessageMedia(mimetype, data, item.name || 'foto.jpg');
            
            console.log(`[Media] Enviando archivo adjunto a ${chatId}: ${item.name || 'foto.jpg'}`);
            await client.sendMessage(chatId, messageMedia, {
              caption: item.description || ''
            });
          }
        }
      }
    }

    res.json({ success: true, messageId: response.id._serialized });
  } catch (error) {
    console.error('Error enviando mensaje con adjuntos:', error);
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
        await client.sendMessage(msg.chatId, msg.message);

        // Si se programaron archivos/fotos adjuntos, se procesan y envían
        if (msg.media && Array.isArray(msg.media)) {
          for (const item of msg.media) {
            if (item.url) {
              // Extraer mimetype y datos base64 de la Data URL
              const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
              if (matches) {
                const mimetype = matches[1];
                const data = matches[2];
                const messageMedia = new MessageMedia(mimetype, data, item.name || 'foto.jpg');
                
                console.log(`[Programado - Media] Enviando archivo adjunto a ${msg.chatId}: ${item.name || 'foto.jpg'}`);
                await client.sendMessage(msg.chatId, messageMedia, {
                  caption: item.description || ''
                });
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
  if (!id || !chatId || !message || !scheduledTime) {
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
