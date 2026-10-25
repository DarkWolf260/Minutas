const express = require('express');
const { PORT, isAllowedOrigin } = require('./src/config');
const { initWhatsAppClient, destroyClient } = require('./src/client');
const { initScheduler } = require('./src/services/scheduler-service');

const statusRoutes = require('./src/routes/status.routes');
const chatsRoutes = require('./src/routes/chats.routes');
const messagesRoutes = require('./src/routes/messages.routes');
const schedulerRoutes = require('./src/routes/scheduler.routes');

const app = express();

process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Promesa rechazada no controlada:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Excepción no capturada:', err?.message || err);
});

// Middleware CORS y Private Network Access (PNA)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  const requestedHeaders = req.headers['access-control-request-headers'];
  const defaultAllowedHeaders = 'Content-Type, Authorization, x-requested-with, x-workspace-id, cache-control, pragma';
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders || defaultAllowedHeaders);
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Montar rutas de la API
app.use('/api/whatsapp/chats', chatsRoutes);
app.use('/api/whatsapp', statusRoutes);
app.use('/api/whatsapp', messagesRoutes);
app.use('/api/whatsapp', schedulerRoutes);

// Iniciar servicios en segundo plano y cliente de WhatsApp
initScheduler();
initWhatsAppClient();

// Iniciar servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`📡 Servidor WhatsApp Bot escuchando en http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});

// Manejo de cierre gracioso para evitar archivos bloqueados en Windows
process.on('SIGINT', async () => {
  await destroyClient();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = { app, server };
