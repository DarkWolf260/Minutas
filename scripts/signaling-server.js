/**
 * Standalone RxDB Signaling Server
 * This script starts a private signaling server for P2P replication.
 * 
 * Usage:
 * 1. Run it locally: npm run signaling
 * 2. Deploy it to a server (Render, Railway, Fly.io, etc.)
 */

// Use dynamic import because RxDB is ESM
async function start() {
    try {
        const { startSignalingServer } = await import('rxdb/plugins/replication-webrtc');
        const port = process.env.PORT || 8080;
        
        const signalingServer = await startSignalingServer(parseInt(port.toString()));
        
        console.log('=========================================');
        console.log('🚀 P2P Signaling Server Active');
        console.log(`📡 URL: ws://localhost:${port}`);
        console.log('=========================================');
        console.log('To use this server, update the "Servidor de Señalización"');
        console.log('field in your App Settings.');
        
    } catch (error) {
        console.error('Failed to start signaling server:', error);
        process.exit(1);
    }
}

start();
