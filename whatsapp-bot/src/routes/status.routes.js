const express = require('express');
const router = express.Router();
const state = require('../state');
const { restartClient } = require('../client');

router.get('/workspace', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({ activeWorkspace: state.activeWorkspace });
});

router.post('/workspace', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { workspace } = req.body;
  if (workspace && typeof workspace === 'string') {
    const prev = state.activeWorkspace;
    state.activeWorkspace = workspace.trim();
    console.log(`[Workspace] Área de trabajo del bot asignada: "${state.activeWorkspace}" (anterior: "${prev || 'ninguna'}")`);
    return res.json({ success: true, activeWorkspace: state.activeWorkspace });
  }
  if (workspace === null) {
    state.activeWorkspace = null;
    console.log('[Workspace] Bot desvinculado de área de trabajo específica.');
    return res.json({ success: true, activeWorkspace: null });
  }
  return res.status(400).json({ error: 'workspace string o null es requerido' });
});

router.get('/status', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const requestedWorkspace = req.query.workspace || req.headers['x-workspace-id'];

  // Si aún no hay área de trabajo activa y la solicitud especifica una, auto-asignarla
  if (!state.activeWorkspace && requestedWorkspace && typeof requestedWorkspace === 'string') {
    state.activeWorkspace = requestedWorkspace.trim();
    console.log(`[Workspace] Bot auto-asignado al área de trabajo inicial: "${state.activeWorkspace}"`);
  }

  const isWorkspaceMatch = !state.activeWorkspace || !requestedWorkspace || state.activeWorkspace === requestedWorkspace;

  res.json({
    isReady: state.isReady,
    needsAuth: !state.isReady && state.qrCodeData !== null,
    qr: state.qrCodeData,
    statusMessage: !isWorkspaceMatch 
      ? `El bot está asignado al área de trabajo "${state.activeWorkspace}".` 
      : state.statusMessage,
    activeWorkspace: state.activeWorkspace,
    isWorkspaceMatch
  });
});

router.post('/logout', async (req, res) => {
  console.log('[Logout] Solicitud de cierre de sesión recibida desde la API...');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({ success: true, message: 'Cerrando sesión y reiniciando cliente...' });

  state.isReady = false;
  state.qrCodeData = null;
  state.statusMessage = 'Cerrando sesión...';

  try {
    if (state.client) {
      await state.client.logout().catch(() => {});
    }
  } catch (e) {
    // Ignorar si falla
  }
  restartClient('Sesión cerrada. Generando nuevo QR...');
});

module.exports = router;
