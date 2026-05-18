const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});
app.use(express.json());

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

  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: 'Faltan parámetros: chatId y message son requeridos' });
  }

  try {
    const response = await client.sendMessage(chatId, message);
    res.json({ success: true, messageId: response.id._serialized });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: error.toString() });
  }
});

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
