import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from './WebSocketService';

interface WebSocketContextType {
  isConnected: boolean;
  send: (data: any) => boolean;
  lastError: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  send: () => false,
  lastError: null,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setLastError(null);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
    };
    
    const handleError = (error: Error) => {
      setLastError(error);
      console.warn('WebSocket connection error:', error);
    };

    webSocketService.on('connected', handleConnect);
    webSocketService.on('disconnected', handleDisconnect);
    webSocketService.on('error', handleError);
    webSocketService.on('reconnect_failed', () => {
      setLastError(new Error('Failed to establish WebSocket connection after multiple attempts'));
    });

    if (!webSocketService.isConnected) {
      webSocketService.connect();
    }

    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('disconnected', handleDisconnect);
      webSocketService.off('error', handleError);
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        send: webSocketService.send.bind(webSocketService),
        lastError,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}