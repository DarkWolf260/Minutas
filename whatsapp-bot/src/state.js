// Estado compartido en memoria del bot de WhatsApp

const state = {
  isReady: false,
  isInitializing: false,
  isRestarting: false,
  qrCodeData: null,
  statusMessage: 'Iniciando cliente...',
  client: null,
  activeWorkspace: null,

  // Cachés
  cachedChats: [],
  contactNameCache: new Map(),
  avatarCache: new Map(),
  avatarImageCache: new Map(),
  revokedMessageIds: new Set(),
  recentMessagesCache: new Map(),
  mediaCache: new Map()
};

module.exports = state;
