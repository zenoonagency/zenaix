import { useEffect, useCallback } from 'react';

interface UseEvolutionWebSocketOptions {
  onMessage?: (data: any) => void;
  onStatus?: (status: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export function useEvolutionWebSocket(options: UseEvolutionWebSocketOptions = {}) {
  const {
    onMessage,
    onStatus,
    onConnected,
    onDisconnected,
    onError,
  } = options;

  useEffect(() => {
    const ws = new WebSocket('wss://zenoon-agency-n8n.htm57w.easypanel.host/ws');

    ws.onopen = () => {
      console.log('Connected to Evolution WebSocket');
      // Send authentication message
      ws.send(JSON.stringify({
        action: 'authenticate',
        data: {
          apiKey: 'gii2diw9z19184v2vfwq9s',
          instance: 'bot'
        }
      }));
      if (onConnected) onConnected();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === 'message' && onMessage) {
          onMessage(data.data);
        } else if (data.action === 'status' && onStatus) {
          onStatus(data.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      if (onDisconnected) onDisconnected();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    return () => {
      ws.close();
    };
  }, [onMessage, onStatus, onConnected, onDisconnected, onError]);

  const sendMessage = useCallback((data: any) => {
    const ws = new WebSocket('wss://zenoon-agency-n8n.htm57w.easypanel.host/ws');
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  return { sendMessage };
}