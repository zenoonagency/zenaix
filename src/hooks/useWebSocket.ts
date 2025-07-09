import { useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/websocket/WebSocketService';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnected,
    onDisconnected,
    onError,
  } = options;

  const messageHandler = useCallback((data: any) => {
    if (onMessage) onMessage(data);
  }, [onMessage]);

  useEffect(() => {
    if (!webSocketService.isConnected) {
      webSocketService.connect();
    }

    webSocketService.on('message', messageHandler);
    if (onConnected) webSocketService.on('connected', onConnected);
    if (onDisconnected) webSocketService.on('disconnected', onDisconnected);
    if (onError) webSocketService.on('error', onError);

    return () => {
      webSocketService.off('message', messageHandler);
      if (onConnected) webSocketService.off('connected', onConnected);
      if (onDisconnected) webSocketService.off('disconnected', onDisconnected);
      if (onError) webSocketService.off('error', onError);
    };
  }, [messageHandler, onConnected, onDisconnected, onError]);

  const sendMessage = useCallback((data: any): boolean => {
    return webSocketService.send(data);
  }, []);

  return { sendMessage, isConnected: webSocketService.isConnected };
}