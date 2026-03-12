'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { replicateWebRTC, getConnectionHandlerSimplePeer } from 'rxdb/plugins/replication-webrtc';
import { useDatabase, useWorkspaceManager } from './db-context';
import { logger } from '../logger';
import { toast } from 'sonner';
import { useNotifications } from '../notifications-provider';

/**
 * A queue to manage outgoing P2P messages to avoid saturating the data channel.
 * Messages are processed sequentially per peer with a small delay.
 */
class P2PMessageQueue {
  private queues: Map<string, Array<{ peer: any, message: any, handler: any, onFailure?: () => void }>> = new Map();
  private processing: Set<string> = new Set();
  private interval = 100; // ms between messages

  enqueue(peerId: string, peer: any, message: any, handler: any, onFailure?: () => void) {
    if (!this.queues.has(peerId)) {
      this.queues.set(peerId, []);
    }
    this.queues.get(peerId)!.push({ peer, message, handler, onFailure });
    this.processQueue(peerId);
  }

  private async processQueue(peerId: string) {
    if (this.processing.has(peerId)) return;
    this.processing.add(peerId);

    // Initial wait to let the WebRTC channel stabilize 
    await new Promise(resolve => setTimeout(resolve, 200));

    const queue = this.queues.get(peerId);
    while (queue && queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      const { peer, message, handler, onFailure } = item;
      try {
        if (handler && typeof handler.send === 'function') {
          handler.send(peer, message);
        }
      } catch (e) {
        // Silently log and ignore ERR_DATA_CHANNEL during refreshes
        const errMsg = (e as any)?.message || '';
        if (!errMsg.includes('ERR_DATA_CHANNEL')) {
          console.warn(`[P2P Queue] Failed to send to ${peerId}:`, e);
        }
        if (onFailure) onFailure();
      }
      
      if (queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.interval));
      }
    }

    this.processing.delete(peerId);
  }

  clear() {
    this.queues.clear();
    this.processing.clear();
  }
}

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
  const { addNotification } = useNotifications();
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
  const messageSubsRef = useRef<any[]>([]);
  const peerStatesSubsRef = useRef<any[]>([]);
  const isSyncingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const roomIdRef = useRef('');
  const msgQueueRef = useRef(new P2PMessageQueue());
  const usernameRef = useRef('');
  const passwordRef = useRef('');
  const peerAliasesRef = useRef<Record<string, string>>({}); // Ref to hold current peerAliases for subscriptions
  const previousPeerIdsRef = useRef<Set<string>>(new Set()); // To track connects/disconnects
  const sentIdentityToRef = useRef<Set<string>>(new Set()); // To avoid flooding identity messages
  const notifiedPeersRef = useRef<Set<string>>(new Set()); // To track which connections were announced

  // Keep peerAliasesRef up-to-date
  useEffect(() => {
    peerAliasesRef.current = peerAliases;
  }, [peerAliases]);

  const stopSync = useCallback(async () => {
    logger.info('Stopping P2P synchronization...');
    replicationsRef.current.forEach((rep) => {
      try { rep.cancel(); } catch(e) { logger.warn('Error cancelling replication:', e); }
    });
    replicationsRef.current = [];
    messageSubsRef.current.forEach(sub => sub.unsubscribe());
    messageSubsRef.current = [];
    peerStatesSubsRef.current.forEach(sub => sub.unsubscribe());
    peerStatesSubsRef.current = [];
    msgQueueRef.current.clear();
    
    setIsSyncing(false);
    isSyncingRef.current = false;
    setPeerCount(0);
    setPeers([]);
    setPeerAliases({});
    previousPeerIdsRef.current.clear(); // Clear previous peers on stop
    sentIdentityToRef.current.clear();
    notifiedPeersRef.current.clear();
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
          if (collectionName === 'notifications') {
            logger.info(`Skipping P2P replication for local-only collection: ${collectionName}`);
            continue;
          }
          
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
            // Check if this is a transient WebRTC error
            // These often happen when a peer closes a tab or refreshes
            const isTransient = 
              err?.code === 'RC_WEBRTC_PEER' || 
              err?.parameters?.error?.code === 'ERR_DATA_CHANNEL' ||
              err?.parameters?.error?.code === 'ERR_CONNECTION_FAILURE' ||
              err?.message?.includes('ERR_DATA_CHANNEL') ||
              err?.message?.includes('ERR_CONNECTION_FAILURE') ||
              // Also treat empty errors as probably transient WebRTC junk during refreshes
              (err && typeof err === 'object' && Object.keys(err).length === 0);

            if (isTransient) {
              // Log as debug so it doesn't clutter the terminal/console as ERROR
              logger.debug(`P2P Transient handled for ${collectionName}:`, err);
              return;
            }

            // Real error - log it and maybe show toast
            logger.error(`P2P Replication error in ${collectionName}:`, err);

            // Still show a toast for other real errors, throttled to the reports collection
            if (collectionName === 'reports') {
              toast.error(`Error de sincronización: ${err.message || 'Conexión fallida'}`);
            }
          });

          // Monkey-patch removePeer to avoid "missing value from map" crash
          // This happens when an error occurs before connect$ fires, so the peer was never added to the map.
          if (typeof (replicationState as any).removePeer === 'function') {
            const originalRemovePeer = (replicationState as any).removePeer.bind(replicationState);
            (replicationState as any).removePeer = (peer: any) => {
              try {
                return originalRemovePeer(peer);
              } catch (e) {
                // Ignore "missing value from map" which happens on early disconnects
                logger.debug(`Suppressed RxDB internal removePeer error for ${collectionName}`);
              }
            };
          }

          // Listen for identity messages to resolve friendly names (on ALL collections)
          // We use response$ instead of message$ to bypass RxDB's internal masterHandler.bind() logic
          // which crashes if a custom method (like 'identity') is received.
          const messageSub = replicationState.connectionHandler.response$.subscribe({
            next: (data: any) => {
              try {
                if (data.response && data.response.result && data.response.result.type === 'identity') {
                  const alias = data.response.result.alias;
                  if (alias && data.peer?.id) {
                    const peerId = data.peer.id;
                    logger.info(`P2P Identity received on [${collectionName}]: ${peerId} -> ${alias}`);
                    setPeerAliases(prev => {
                      const updated = { ...prev, [peerId]: alias };
                      peerAliasesRef.current = updated; // Keep ref in sync for notifications
                      return updated;
                    });
                    
                    // Notify connection with ALIAS
                    // Limit notification to only one primary collection to avoid duplicate alerts (we have 6 collections)
                    const isPrimary = collectionName === 'reports' || collectionName === collections[collections.length - 1].name;
                    if (isPrimary && !notifiedPeersRef.current.has(peerId)) {
                      notifiedPeersRef.current.add(peerId);
                      
                      if (typeof addNotification === 'function') {
                        addNotification({
                          title: 'Par conectado',
                          message: `${alias} se ha unido a la sincronización.`,
                          type: 'info',
                          metadata: { peerId }
                        });
                      }
                    }
                  }
                }
              } catch (e) {
                logger.error('Error handling P2P identity response', e);
              }
            },
            error: (err: any) => logger.error(`P2P Identity stream error on ${collectionName}`, err)
          });
          messageSubsRef.current.push(messageSub);

          // Track peer count and states (on ALL collections as well, but only update UI from 'reports')
          const peerStatesSub = replicationState.peerStates$.subscribe({
            next: (peerMap: Map<any, any>) => {
              try {
                const peerList: PeerInfo[] = [];
                const currentPeerIds = new Set<string>();
                
                peerMap.forEach((state, peer) => {
                  currentPeerIds.add(peer.id);
                  
                  const identityKey = `${replicationState.collection.name}:${peer.id}`;
                  if (peer.id && !sentIdentityToRef.current.has(identityKey)) {
                    sentIdentityToRef.current.add(identityKey);
                    
                    // Queue the identity message instead of sending immediately
                    // We use 'result' field to make it appear as a response, 
                    // which prevents RxDB the master-side from trying to process it as a method call.
                    msgQueueRef.current.enqueue(peer.id, peer, {
                      id: 'identity-' + Date.now(),
                      result: { type: 'identity', alias: localAlias }
                    }, replicationState.connectionHandler, () => {
                      sentIdentityToRef.current.delete(identityKey);
                    });
                  }

                  peerList.push({
                    id: peer.id,
                    isMaster: !!state.replicationState
                  });
                });

                // Only update the global peer list and notifications from the 'reports' or fallback collection
                // to avoid redundant state updates and notifications
                const isPrimaryUpdater = collectionName === 'reports' || collectionName === collections[collections.length - 1].name;
                
                if (isPrimaryUpdater) {
                  // Check for disconnections
                  previousPeerIdsRef.current.forEach(id => {
                    if (!currentPeerIds.has(id)) {
                      const friendlyName = peerAliasesRef.current[id] || id;
                      if (typeof addNotification === 'function') {
                        addNotification({
                          title: 'Par desconectado',
                          message: `${friendlyName} ha abandonado la sesión.`,
                          type: 'info',
                          metadata: { peerId: id }
                        });
                      }
                      notifiedPeersRef.current.delete(id);
                    }
                  });

                  previousPeerIdsRef.current = currentPeerIds;
                  setPeers(peerList);
                  setPeerCount(peerMap.size);
                }
              } catch (e) {
                logger.error(`Error in peerStates subscription for ${collectionName}`, e);
              }
            },
            error: (err: any) => logger.error(`P2P peerStates error on ${collectionName}`, err)
          });
          peerStatesSubsRef.current.push(peerStatesSub);

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
