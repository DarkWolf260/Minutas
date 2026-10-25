const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { PORT, SESSION_DATA_PATH } = require('./config');
const state = require('./state');

function initWhatsAppClient() {
  state.isInitializing = true;
  state.isReady = false;
  state.qrCodeData = null;
  state.statusMessage = 'Iniciando cliente de WhatsApp...';

  state.client = new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_DATA_PATH }),
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

  state.client.on('qr', (qr) => {
    state.qrCodeData = qr;
    state.statusMessage = 'Esperando escaneo de QR...';
    console.log('\n==================================================');
    console.log(`[${new Date().toLocaleTimeString()}] Nuevo código QR generado:`);
    console.log('==================================================\n');
    qrcode.generate(qr, { small: true });
  });

  state.client.on('loading_screen', (percent, message) => {
    state.statusMessage = `Sincronizando: ${percent}%`;
    console.log(`Progreso de carga: ${percent}% - ${message}`);
    if (percent >= 99 && !state.isReady) {
      setTimeout(async () => {
        if (!state.isReady && state.client && state.client.pupPage) {
          try {
            const hasPaneSide = await state.client.pupPage.evaluate(() => {
              return Boolean(document.querySelector('#pane-side') || window.Store?.Chat);
            });
            if (hasPaneSide && !state.isReady) {
              console.log('[Watchdog] WhatsApp Web cargado (pane-side detectado). Activando evento ready...');
              state.client.emit('ready');
            }
          } catch (_) {}
        }
      }, 4000);
    }
  });

  state.client.on('ready', async () => {
    state.isReady = true;
    state.qrCodeData = null;
    state.statusMessage = 'Listo';
    console.log('\n==================================================');
    console.log('✅ Cliente de WhatsApp está listo!');
    console.log(`📡 Servidor API escuchando en http://localhost:${PORT}`);
    console.log('==================================================\n');

    try {
      if (state.client.pupPage) {
        await state.client.pupPage.evaluate(() => {
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

  state.client.on('authenticated', () => {
    console.log('Autenticación exitosa.');
    state.statusMessage = 'Autenticado. Sincronizando chats...';
    state.qrCodeData = null;
  });

  state.client.on('auth_failure', async msg => {
    console.error('Error de autenticación:', msg);
    restartClient('Error de autenticación. Generando nuevo QR...');
  });

  state.client.on('message_revoke_everyone', async (after, before) => {
    try {
      const afterId = after?.id?._serialized || after?.id;
      if (afterId) state.revokedMessageIds.add(afterId);
      const beforeId = before?.id?._serialized || before?.id;
      if (beforeId) state.revokedMessageIds.add(beforeId);
    } catch (err) {}
  });

  state.client.on('disconnected', async (reason) => {
    console.log('Cliente de WhatsApp desconectado:', reason);
    restartClient('Desconectado. Generando nuevo QR...');
  });

  state.client.initialize()
    .then(() => {
      state.isInitializing = false;
    })
    .catch(async err => {
      console.error('Error al inicializar el cliente de WhatsApp:', err);
      state.statusMessage = 'Error al inicializar cliente: ' + (err.message || err);
      state.isInitializing = false;
      try {
        if (state.client) {
          await state.client.destroy().catch(() => {});
          state.client = null;
        }
      } catch (_) {}
    });
}

async function restartClient(reasonText = 'Reiniciando cliente...') {
  if (state.isRestarting) return;
  state.isRestarting = true;
  state.isInitializing = true;
  state.isReady = false;
  state.qrCodeData = null;
  state.cachedChats = [];
  state.statusMessage = reasonText;

  setTimeout(async () => {
    try {
      if (state.client) {
        console.log(`[WhatsApp] Cerrando instancia previa (${reasonText})...`);
        try {
          state.client.pupPage?.removeAllListeners?.();
          state.client.removeAllListeners?.();
        } catch (_) {}
        await state.client.destroy().catch(() => {});
        state.client = null;
      }
    } catch (destroyErr) {
      // Ignorar si ya estaba destruida
    }

    setTimeout(() => {
      state.isInitializing = false;
      state.isRestarting = false;
      initWhatsAppClient();
    }, 1500);
  }, 400);
}

async function destroyClient() {
  if (state.client) {
    console.log('\nCerrando cliente de WhatsApp...');
    try {
      await state.client.destroy();
    } catch (e) {
      // Ignorar si ya estaba destruida
    }
    state.client = null;
  }
}

module.exports = {
  initWhatsAppClient,
  restartClient,
  destroyClient
};
