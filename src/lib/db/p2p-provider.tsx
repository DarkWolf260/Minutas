'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { replicateWebRTC, getConnectionHandlerSimplePeer } from 'rxdb/plugins/replication-webrtc';
import { useDatabase, useWorkspaceManager } from './db-context';
import { logger } from '../logger';
import { toast } from 'sonner';

interface PeerInfo {
  id: string;
  isMaster: boolean; // RxDB master in the pair
}

interface P2PContextType {
  isSyncing: boolean;
  peerCount: number;
  roomId: string;
  peers: PeerInfo[];
  localAlias: string;
  peerAliases: Record<string, string>;
  startSync: (id: string, username?: string, password?: string) => Promise<void>;
  stopSync: () => Promise<void>;
  updateLocalAlias: (alias: string) => void;
  wipeLocalData: () => Promise<void>;
}

const P2PContext = createContext<P2PContextType | null>(null);

export const useP2P = () => {
  const context = useContext(P2PContext);
  if (!context) throw new Error('useP2P must be used within a P2PProvider');
  return context;
};

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [isSyncing, setIsSyncing] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [peerAliases, setPeerAliases] = useState<Record<string, string>>({});
  const [localAlias, setLocalAlias] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('p2p_local_alias') || '';
    }
    return '';
  });
  const replicationsRef = useRef<any[]>([]);
  const peerStatesSubRef = useRef<any>(null);
  const messageSubRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const roomIdRef = useRef('');
  const usernameRef = useRef('');
  const passwordRef = useRef('');

  const stopSync = useCallback(async () => {
    logger.info('Stopping P2P synchronization...');
    replicationsRef.current.forEach((rep) => {
      try { rep.cancel(); } catch(e) { logger.warn('Error cancelling replication:', e); }
    });
    replicationsRef.current = [];
    if (peerStatesSubRef.current) peerStatesSubRef.current.unsubscribe();
    if (messageSubRef.current) messageSubRef.current.unsubscribe();
    peerStatesSubRef.current = null;
    messageSubRef.current = null;
    
    setIsSyncing(false);
    isSyncingRef.current = false;
    setPeerCount(0);
    setPeers([]);
    setPeerAliases({});
    setRoomId('');
    roomIdRef.current = '';
    usernameRef.current = '';
    passwordRef.current = '';
    logger.info('P2P synchronization stopped and cleaned up.');
  }, []);

  const startSync = useCallback(
    async (targetRoomId: string, username?: string, password?: string) => {
      if (!db || !targetRoomId || !currentWorkspace) {
        logger.warn('startSync called with missing dependencies (db, targetRoomId, or currentWorkspace). Aborting.');
        return;
      }
      
      // Normalize parameters to avoid 'undefined' vs '' mismatches
      const normUsername = username || '';
      const normPassword = password || '';
      
      // Lock to prevent concurrent execution
      if (isConnectingRef.current) {
        logger.info('P2P startSync already in progress, skipping...');
        return;
      }

      // If already syncing with the same ID, username, AND password, do nothing
      if (
        isSyncingRef.current && 
        roomIdRef.current === targetRoomId && 
        usernameRef.current === normUsername && 
        passwordRef.current === normPassword
      ) {
        return;
      }
      
      isConnectingRef.current = true;

      if (isSyncingRef.current) {
        logger.info('P2P sync active or parameters changed, stopping before restart...');
        await stopSync();
      }

      try {
        logger.info(`Starting P2P sync: Room=${targetRoomId}, Alias=${normUsername}, HasPass=${!!normPassword}`);
        setIsSyncing(true);
        isSyncingRef.current = true;
        setRoomId(targetRoomId);
        roomIdRef.current = targetRoomId;
        usernameRef.current = normUsername;
        passwordRef.current = normPassword;
        
        // Simple stable transformation for the topic if password exists
        // We avoid btoa() because it crashes with non-Latin1 characters
        const roomSuffix = normPassword 
          ? `-${normPassword.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0).toString(16)}` 
          : '';
        const secureRoomId = `${targetRoomId}${roomSuffix}`;

        logger.info(`Starting P2P synchronization for room: ${targetRoomId} (Scoped to workspace: ${currentWorkspace}) with user: ${normUsername || 'Anonymous'}`);

        const collections = Object.values(db.collections) as any[];
        const newReplications: any[] = [];
        
        // Generate a stable peerId for this sync session
        // We use the username + a short hash to ensure uniqueness
        const sessionPeerId = normUsername 
          ? `${normUsername}#${Math.random().toString(36).slice(-4)}`
          : undefined;

        let peerSubscribed = false;

        for (const collection of collections) {
          const collectionName = (collection as any).name;
          const topic = `${secureRoomId}-${collectionName}`;
          
          logger.info(`Initializing P2P replication for collection: ${collectionName} on topic: ${topic}`);

          const replicationState = await replicateWebRTC({
            collection: collection as any,
            topic: topic,
            connectionHandlerCreator: getConnectionHandlerSimplePeer({
              signalingServerUrl: 'wss://signaling.rxdb.info/',
            } as any),
            pull: {},
            push: {
              // Ensure we ONLY push data from the current workspace
              queryBuilder: (coll: any) => {
                const selector: any = {
                  workspaceId: currentWorkspace
                };
                
                // Special case: do NOT sync the main app settings via P2P 
                // to avoid overwriting each other's P2P/Local config
                if (collectionName === 'configs') {
                  selector.id = { $ne: `${currentWorkspace}:settings:app` };
                }

                return coll.find({
                  selector
                });
              }
            } as any,
          });

          replicationState.error$.subscribe((err: any) => {
            logger.error(`P2P Replication error in ${collectionName}:`, err);
            // Throttle toast to avoid spamming for multiple collections
            if (collectionName === 'reports') {
              toast.error(`Error de sincronización: ${err.message || 'Conexión fallida'}`);
            }
          });

          // Track peer count and roles
          if (!peerSubscribed && (collectionName === 'reports' || collection === collections[collections.length - 1])) {
            peerSubscribed = true;
            
            // Listen for identity messages to resolve friendly names
            messageSubRef.current = replicationState.connectionHandler.message$.subscribe((data: any) => {
              if (data.message && data.message.method === 'identity') {
                const alias = data.message.params?.[0];
                if (alias && data.peer?.id) {
                  logger.info(`P2P Identity received: ${data.peer.id} -> ${alias}`);
                  setPeerAliases(prev => ({ ...prev, [data.peer.id]: alias }));
                }
              }
            });

            peerStatesSubRef.current = replicationState.peerStates$.subscribe((peerMap: Map<any, any>) => {
              const peerList: PeerInfo[] = [];
              if (peerMap.size > peerCount) {
                toast.success('¡Nuevo par sincronizado conectado!');
              }

              peerMap.forEach((state, peer) => {
                // Broadcast our identity to the new peer
                try {
                   replicationState.connectionHandler.send(peer, {
                      id: 'identity-' + Date.now(),
                      method: 'identity' as any,
                      params: [localAlias]
                   } as any);
                } catch(e) {
                   logger.warn('Failed to send identity to peer', e);
                }

                // Use the technical ID by default, will be replaced by alias once identity message arrives
                peerList.push({
                   id: peer.id,
                   isMaster: !state.replicationState
                });
              });
              setPeers(peerList);
              setPeerCount(peerMap.size);
            });
          }

          newReplications.push(replicationState);
        }

        replicationsRef.current = newReplications;
      } catch (error) {
        logger.error('P2P Sync start failed:', error);
        toast.error('Error al iniciar sincronización P2P');
        await stopSync();
      } finally {
        isConnectingRef.current = false;
      }
    },
    [db, currentWorkspace, stopSync, localAlias]
  );

  const updateLocalAlias = useCallback((alias: string) => {
    setLocalAlias(alias);
    if (typeof window !== 'undefined') {
      localStorage.setItem('p2p_local_alias', alias);
    }
  }, []);

  const wipeLocalData = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    logger.info(`Wiping local data for workspace ${currentWorkspace} due to sync strategy...`);
    try {
      const collections = Object.values(db.collections);
      for (const coll of collections) {
        const docs = await coll.find({
          selector: { workspaceId: currentWorkspace }
        }).exec();

        if (docs.length > 0) {
          // Filter out critical settings if in configs
          const toRemove = docs.filter((d: any) => {
            const data = d.toJSON();
            if (coll.name === 'configs' && data.id === `${currentWorkspace}:settings:app`) return false;
            return true;
          });
          
          if (toRemove.length > 0) {
            await coll.bulkRemove(toRemove.map((d: any) => d.primary));
          }
        }
      }
      toast.info(`Datos de "${currentWorkspace}" limpiados con éxito`);
    } catch (error) {
      logger.error('Failed to wipe local data', error, { workspaceId: currentWorkspace });
      toast.error('Error al limpiar datos locales');
    }
  }, [db, currentWorkspace]);

  // Auto-start and persistence logic
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    // Listen to settings changes for the CURRENT workspace to auto-start/stop
    const sub = db.configs.findOne(`${currentWorkspace}:settings:app`).$.subscribe(async (doc: any) => {
      if (doc) {
        const docData = doc.toJSON();
        const settings = docData.data;
        if (settings?.p2pRoomId) {
          // Pass the localAlias along with database settings
          await startSync(settings.p2pRoomId, localAlias, settings.p2pPassword);
        } else if (isSyncingRef.current) {
          await stopSync();
        }
      } else {
        // No settings found for this workspace, stop sync if active
        if (isSyncingRef.current) {
          await stopSync();
        }
      }
    });

    return () => {
      sub.unsubscribe();
      // Ensure we clean up when dependencies change
      replicationsRef.current.forEach((rep) => rep.cancel());
    };
  }, [db, currentWorkspace, startSync, stopSync, localAlias]);

  return (
    <P2PContext.Provider value={{ 
      isSyncing, 
      peerCount, 
      roomId, 
      peers, 
      localAlias,
      peerAliases,
      startSync, 
      stopSync, 
      updateLocalAlias,
      wipeLocalData 
    }}>
      {children}
    </P2PContext.Provider>
  );
}
