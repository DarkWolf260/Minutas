const express = require('express');
const router = express.Router();
const state = require('../state');
const {
  getScheduledMessages,
  addOrUpdateScheduledMessage,
  removeScheduledMessage,
  discardExpiredMessages
} = require('../services/scheduler-service');

router.post('/schedule', (req, res) => {
  const { id, chatId, message, scheduledTime, title, media, workspaceId } = req.body;
  const requestedWorkspace = workspaceId || req.query.workspace || req.headers['x-workspace-id'];

  if (state.activeWorkspace && requestedWorkspace && requestedWorkspace !== state.activeWorkspace) {
    console.warn(`[Schedule] Programación rechazada: el bot está en "${state.activeWorkspace}", se solicitó desde "${requestedWorkspace}".`);
    return res.status(403).json({ 
      error: `El bot está asignado exclusivamente al área de trabajo "${state.activeWorkspace}". No disponible en "${requestedWorkspace}".`,
      activeWorkspace: state.activeWorkspace
    });
  }

  const hasMedia = media && Array.isArray(media) && media.length > 0;

  if (!id || !chatId || (!message && !hasMedia) || !scheduledTime) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos para programar' });
  }

  addOrUpdateScheduledMessage({
    id,
    chatId,
    message,
    scheduledTime,
    title,
    media,
    workspaceId: requestedWorkspace || state.activeWorkspace || null
  });

  res.json({ success: true, message: 'Mensaje programado en el servidor' });
});

router.post('/scheduled/discard-expired', (req, res) => {
  const { reason, workspaceId } = req.body || {};
  const requestedWorkspace = workspaceId || req.query.workspace || req.headers['x-workspace-id'];
  const count = discardExpiredMessages(reason || 'Solicitud de descarte de mensajes vencidos', requestedWorkspace);
  res.json({ success: true, discardedCount: count });
});

router.delete('/schedule/:id', (req, res) => {
  const { id } = req.params;
  const removed = removeScheduledMessage(id);
  if (removed) {
    res.json({ success: true, message: 'Programación cancelada en el servidor' });
  } else {
    res.json({ success: false, message: 'No se encontró la programación en el servidor' });
  }
});

router.get('/scheduled', (req, res) => {
  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];
  let messages = getScheduledMessages();
  if (requestedWorkspace) {
    messages = messages.filter(m => !m.workspaceId || m.workspaceId === requestedWorkspace);
  }
  res.json(messages);
});

module.exports = router;
