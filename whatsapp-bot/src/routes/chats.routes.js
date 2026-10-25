const express = require('express');
const router = express.Router();
const { fetchChats, getChatAvatarBinary, resolveChatAvatarUrl } = require('../services/chat-service');
const { fetchChatMessages } = require('../services/message-service');

router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];

  try {
    const chats = await fetchChats(requestedWorkspace);
    res.json(chats);
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message, activeWorkspace: error.activeWorkspace });
    }
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.toString() });
  }
});

router.get('/:chatId/messages', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { chatId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;

  try {
    const messages = await fetchChatMessages(chatId, limit);
    res.json(messages);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error(`[Messages] Error obteniendo mensajes de ${chatId}:`, error?.message || error);
    res.status(500).json({ error: error.message || 'Error al obtener mensajes' });
  }
});

router.get('/:chatId/avatar.jpg', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const { chatId } = req.params;
  const decodedId = decodeURIComponent(chatId);

  const { contentType, data } = await getChatAvatarBinary(decodedId);
  res.setHeader('Content-Type', contentType);
  return res.send(data);
});

router.get('/:chatId/avatar', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const { chatId } = req.params;
  const decodedId = decodeURIComponent(chatId);

  try {
    const picUrl = await resolveChatAvatarUrl(decodedId);
    if (picUrl) {
      return res.json({
        avatarUrl: `/api/whatsapp/chats/${encodeURIComponent(decodedId)}/avatar.jpg`
      });
    }
    return res.json({ avatarUrl: null });
  } catch (err) {
    return res.json({ avatarUrl: null });
  }
});

module.exports = router;
