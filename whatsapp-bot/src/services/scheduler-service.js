const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const { SCHEDULE_FILE } = require('../config');
const state = require('../state');

function clearScheduledQueueOnStart() {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify([], null, 2));
    console.log('[Programado] Se ha descartado la cola de mensajes programados al iniciar el bot.');
  } catch (e) {
    console.error('Error al descartar la cola de mensajes al iniciar:', e);
  }
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

function addOrUpdateScheduledMessage({ id, chatId, message, scheduledTime, title, media, workspaceId }) {
  const messages = getScheduledMessages();
  const existingIndex = messages.findIndex(m => m.id === id);
  const newMsg = {
    id,
    chatId,
    message,
    scheduledTime,
    title,
    media,
    workspaceId: workspaceId || state.activeWorkspace || null,
    status: 'pending'
  };

  if (existingIndex >= 0) {
    messages[existingIndex] = newMsg;
  } else {
    messages.push(newMsg);
  }

  saveScheduledMessages(messages);
  const pendingCount = messages.filter(m => m.status === 'pending').length;
  console.log(`\n[Programado] Mensaje programado añadido/actualizado. Total pendientes: ${pendingCount}`);
  return newMsg;
}

function removeScheduledMessage(id) {
  let messages = getScheduledMessages();
  const initialLength = messages.length;
  messages = messages.filter(m => m.id !== id);

  if (messages.length !== initialLength) {
    saveScheduledMessages(messages);
    const pendingCount = messages.filter(m => m.status === 'pending').length;
    console.log(`\n[Programado] Mensaje cancelado. Total pendientes: ${pendingCount}`);
    return true;
  }
  return false;
}

let schedulerInterval = null;

function initScheduler() {
  clearScheduledQueueOnStart();

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  schedulerInterval = setInterval(async () => {
    if (!state.isReady || !state.client) return;
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
        if (state.activeWorkspace && msg.workspaceId && msg.workspaceId !== state.activeWorkspace) {
          continue;
        }

        try {
          let targetChatId = msg.chatId;
          if (typeof targetChatId === 'string' && !targetChatId.includes('@')) {
            targetChatId = `${targetChatId.replace(/\D/g, '')}@c.us`;
          }

          console.log(`[Programado] Enviando mensaje ${msg.id} a ${targetChatId}...`);

          // Enviar texto si hay contenido
          if (msg.message && msg.message.trim()) {
            await state.client.sendMessage(targetChatId, msg.message);
          }

          // Enviar adjuntos si los hay
          if (msg.media && Array.isArray(msg.media)) {
            for (const item of msg.media) {
              if (item.url) {
                const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches) {
                  const messageMedia = new MessageMedia(matches[1], matches[2], item.name || 'foto.jpg');
                  console.log(`[Programado - Media] Enviando archivo adjunto a ${targetChatId}: ${item.name || 'foto.jpg'}`);
                  await state.client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
                } else {
                  const messageMedia = await MessageMedia.fromUrl(item.url, { unsafeMime: true });
                  await state.client.sendMessage(targetChatId, messageMedia, { caption: item.description || '' });
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
  }, 20000);
}

module.exports = {
  getScheduledMessages,
  saveScheduledMessages,
  addOrUpdateScheduledMessage,
  removeScheduledMessage,
  initScheduler
};
