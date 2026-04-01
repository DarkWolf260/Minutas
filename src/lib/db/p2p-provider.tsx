'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * DUMMY P2P PROVIDER
 * This provider satisfies the context requirements of the settings page
 * but performs no network operations. 
 * The P2P functionality has been deactivated for stability.
 */

interface P2PContextType {
  isSyncing: boolean;
  peerCount: number;
  roomId: string;
  targetPassword?: string;
  targetSignalingUrl?: string;
  peers: any[];
  localAlias: string;
  peerAliases: Record<string, string>;
  connectionStatus: string;
  startSync: (...args: any[]) => Promise<void>;
  stopSync: () => Promise<void>;
  updateLocalAlias: (alias: string) => void;
  localRole: string;
  setLocalRole: (role: string) => void;
  wipeLocalData: () => Promise<void>;
  collectionStatuses: Record<string, string>;
  peerRoles: Record<string, string>;
  syncProgress: any;
}

const P2PContext = createContext<P2PContextType | null>(null);

export const useP2P = () => {
  const context = useContext(P2PContext);
  if (!context) throw new Error('useP2P must be used within a P2PProvider');
  return context;
};

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const [localAlias, setLocalAliasState] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('p2p_local_alias') || '' : ''));

  const startSync = useCallback(async () => {
    console.log('P2P Sync is currently disabled.');
  }, []);

  const stopSync = useCallback(async () => {}, []);

  const updateLocalAlias = useCallback((alias: string) => {
    setLocalAliasState(alias);
    if (typeof window !== 'undefined') localStorage.setItem('p2p_local_alias', alias);
  }, []);

  const wipeLocalData = useCallback(async () => {
    console.log('Wipe local data requested.');
  }, []);

  return (
    <P2PContext.Provider value={{
      isSyncing: false,
      peerCount: 0,
      roomId: '',
      targetPassword: '',
      targetSignalingUrl: '',
      peers: [],
      localAlias,
      peerAliases: {},
      connectionStatus: 'idle',
      startSync,
      stopSync,
      updateLocalAlias,
      localRole: 'undetermined',
      setLocalRole: () => {},
      wipeLocalData,
      collectionStatuses: {},
      peerRoles: {},
      syncProgress: { total: 0, sent: 0, received: 0, active: false }
    }}>
      {children}
    </P2PContext.Provider>
  );
}
