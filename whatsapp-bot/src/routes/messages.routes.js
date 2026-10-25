const express = require('express');
const router = express.Router();
const { sendMessage, getMessageMedia } = require('../services/message-service');

router.post('/send', async (req, res) => {
  const { chatId, message, media, location, workspaceId } = req.body;
  const requestedWorkspace = workspaceId || req.query.workspace || req.headers['x-workspace-id'];

  try {
    const result = await sendMessage({
      chatId,
      message,
      media,
      location,
      workspaceId,
      requestedWorkspace
    });
    res.json(result);
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message, activeWorkspace: error.activeWorkspace });
    }
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: error.toString() });
  }
});

router.get('/messages/:messageId/media', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const { messageId } = req.params;
  const decodedMsgId = decodeURIComponent(messageId);

  try {
    const { mimetype, buffer } = await getMessageMedia(decodedMsgId);
    res.setHeader('Content-Type', mimetype);
    return res.send(buffer);
  } catch (err) {
    if (err.status === 503) {
      return res.status(503).json({ error: err.message });
    }
    if (err.status === 404) {
      return res.status(404).json({ error: err.message });
    }
    console.error(`[Media] Error descargando media para ${decodedMsgId}:`, err?.message || err);
    res.status(500).json({ error: err.message || 'Error al descargar archivo multimedia' });
  }
});

module.exports = router;
