// Desactivar avisos de deprecación internos de Node (ej. punycode)
process.noDeprecation = true;

const express = require('express');
const { PORT, isAllowedOrigin } = require('./src/config');
const { initWhatsAppClient, destroyClient } = require('./src/client');
const { initScheduler } = require('./src/services/scheduler-service');
const { cleanupEnvironment } = require('./src/cleanup');

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

// Limpiar procesos huérfanos previos y archivos de bloqueo antes de escuchar
cleanupEnvironment();

let server = null;
let servicesStarted = false;

function startServicesOnce() {
  if (servicesStarted) return;
  servicesStarted = true;
  initScheduler();
  initWhatsAppClient();
}

function listenWithRetry(attemptsLeft = 2) {
  server = app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`📡 Servidor WhatsApp Bot escuchando en http://localhost:${PORT}`);
    console.log(`==================================================\n`);
    startServicesOnce();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`[Server] Puerto ${PORT} ocupado. Liberando y reintentando (${attemptsLeft} restante)...`);
      cleanupEnvironment();
      setTimeout(() => {
        listenWithRetry(attemptsLeft - 1);
      }, 1000);
    } else {
      console.error('[Server] Error fatal al iniciar servidor HTTP:', err?.message || err);
    }
  });
}

listenWithRetry();

// Manejo de cierre gracioso para evitar archivos bloqueados en Windows
const handleShutdown = async () => {
  await destroyClient();
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

module.exports = { app, server };
