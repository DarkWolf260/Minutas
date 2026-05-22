import { useState, useEffect, useCallback } from 'react';

export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
}

export interface WhatsAppStatus {
  isReady: boolean;
  needsAuth: boolean;
  qr: string | null;
  statusMessage?: string;
}

// Module-level cache to share offline status across all hook instances and prevent duplicate requests / console ERR_CONNECTION_REFUSED spam.
let globalIsOffline = false;
let lastCheckTime = 0;
let consecutiveFailures = 0;
let currentPollingInterval = 5000; // Start at 5s
let lastCheckedUrl = '';

export function useWhatsAppBot(localUrl: string = 'http://localhost:3001') {
  const [status, setStatus] = useState<WhatsAppStatus>({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Iniciando...' });
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkStatus = useCallback(async (forceParam: boolean | any = false) => {
    let force = forceParam === true || (typeof forceParam === 'object' && forceParam !== null && !(forceParam instanceof Headers));
    
    // Force check if the target URL has changed
    if (localUrl !== lastCheckedUrl) {
      force = true;
      lastCheckedUrl = localUrl;
    }

    const now = Date.now();

    // If we're not forcing and we know the server was recently offline, return cached status immediately
    // without making a fetch request, preventing console ERR_CONNECTION_REFUSED spam.
    if (!force && globalIsOffline && now < lastCheckTime + currentPollingInterval) {
      setIsAvailable(false);
      setStatus({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Servidor no disponible' });
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(`${localUrl}/api/whatsapp/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Status no ok');
      
      const data = await response.json();
      
      // Success! Reset backoff variables
      globalIsOffline = false;
      lastCheckTime = now;
      consecutiveFailures = 0;
      currentPollingInterval = 5000;
      
      setStatus(data);
      setIsAvailable(true);
      
      return data.isReady;
    } catch (error) {
      // Failure! Record offline state and increase polling interval (exponential backoff)
      globalIsOffline = true;
      lastCheckTime = now;
      consecutiveFailures++;
      
      if (consecutiveFailures === 1) {
        currentPollingInterval = 15000; // 15s
      } else if (consecutiveFailures === 2) {
        currentPollingInterval = 30000; // 30s
      } else if (consecutiveFailures === 3) {
        currentPollingInterval = 60000; // 1m
      } else {
        currentPollingInterval = 120000; // 2m max
      }
      
      setIsAvailable(false);
      setStatus({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Servidor no disponible' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [localUrl]);

  const loadChats = useCallback(async () => {
    if (!status.isReady) return;
    
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/chats`);
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [localUrl, status.isReady]);

  const sendMessage = useCallback(async (chatId: string, message: string) => {
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error sending message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }, [localUrl]);

  // Polling for status with dynamic interval
  useEffect(() => {
    checkStatus();
    
    let timeoutId: NodeJS.Timeout;
    
    const poll = async () => {
      await checkStatus();
      timeoutId = setTimeout(poll, currentPollingInterval);
    };
    
    timeoutId = setTimeout(poll, currentPollingInterval);
    
    return () => clearTimeout(timeoutId);
  }, [checkStatus]);

  // Load chats when ready
  useEffect(() => {
    if (status.isReady && chats.length === 0) {
      loadChats();
    }
  }, [status.isReady, chats.length, loadChats]);

  return {
    isAvailable,
    isLoading,
    status,
    chats,
    checkStatus,
    loadChats,
    sendMessage,
    localUrl
  };
}
