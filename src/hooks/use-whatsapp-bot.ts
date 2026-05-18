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

export function useWhatsAppBot(localUrl: string = 'http://localhost:3001') {
  const [status, setStatus] = useState<WhatsAppStatus>({ isReady: false, needsAuth: false, qr: null, statusMessage: 'Iniciando...' });
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${localUrl}/api/whatsapp/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Status no ok');
      
      const data = await response.json();
      setStatus(data);
      setIsAvailable(true);
      
      return data.isReady;
    } catch (error) {
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

  // Polling for status
  useEffect(() => {
    checkStatus();
    
    // Poll every 5 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);
    
    return () => clearInterval(interval);
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
