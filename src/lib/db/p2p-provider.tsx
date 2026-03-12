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
  startSync: (id: string) => Promise<void>;
  stopSync: () => Promise<void>;
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
  const replicationsRef = useRef<any[]>([]);
  const isSyncingRef = useRef(false);
  const roomIdRef = useRef('');

  const stopSync = useCallback(async () => {
    logger.info('Stopping P2P synchronization...');
    replicationsRef.current.forEach((rep) => rep.cancel());
    replicationsRef.current = [];
    setIsSyncing(false);
    isSyncingRef.current = false;
    setPeerCount(0);
    setPeers([]);
    setRoomId('');
    roomIdRef.current = '';
  }, []);

  const startSync = useCallback(
    async (targetRoomId: string) => {
      if (!db || !targetRoomId || !currentWorkspace) return;
      
      // If already syncing with the same ID, do nothing
      if (isSyncingRef.current && roomIdRef.current === targetRoomId) {
        return;
      }
      
      if (isSyncingRef.current) await stopSync();

      try {
        setIsSyncing(true);
        isSyncingRef.current = true;
        setRoomId(targetRoomId);
        roomIdRef.current = targetRoomId;
        logger.info(`Starting P2P synchronization for room: ${targetRoomId} (Scoped to workspace: ${currentWorkspace})`);

        const collections = Object.values(db.collections) as any[];
        const newReplications: any[] = [];
        
        let peerSubscribed = false;

        for (const collection of collections) {
          const collectionName = (collection as any).name;
          const topic = `${targetRoomId}-${collectionName}`;
          
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
                return coll.find({
                  selector: {
                    workspaceId: currentWorkspace
                  }
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
            replicationState.peerStates$.subscribe((peerMap: Map<any, any>) => {
              const peerList: PeerInfo[] = [];
              if (peerMap.size > peerCount) {
                toast.success('¡Nuevo par sincronizado conectado!');
              }
              peerMap.forEach((state, peer) => {
                logger.info(`P2P Peer detected: ${peer.id}`, state);
                peerList.push({
                   id: peer.id || 'unknown',
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
        logger.error('Failed to start P2P synchronization', error);
        setIsSyncing(false);
        isSyncingRef.current = false;
      }
    },
    [db, currentWorkspace, stopSync]
  );

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
          await startSync(settings.p2pRoomId);
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
      replicationsRef.current.forEach((rep) => rep.cancel());
    };
  }, [db, currentWorkspace, startSync, stopSync]);

  return (
    <P2PContext.Provider value={{ 
      isSyncing, 
      peerCount, 
      roomId, 
      peers, 
      startSync, 
      stopSync, 
      wipeLocalData 
    }}>
      {children}
    </P2PContext.Provider>
  );
}
