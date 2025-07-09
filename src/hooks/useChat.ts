import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../services/websocket/WebSocketContext';
import { useConversationStore } from '../store/conversationStore';
import { Message } from '../types/chat';
import { generateId } from '../utils/generateId';

export function useChat() {
  const { isConnected, send, lastError } = useWebSocket();
  const { addMessage, activeConversationId } = useConversationStore();
  const [isSending, setIsSending] = useState(false);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'message' && data.conversationId) {
      const message: Message = {
        id: generateId(),
        content: data.content,
        timestamp: new Date().toISOString(),
        senderId: data.senderId,
        isAgent: data.isAgent,
      };
      addMessage(data.conversationId, message);
    }
  }, [addMessage]);

  useEffect(() => {
    if (lastError) {
      console.warn('Chat connection error:', lastError);
    }
  }, [lastError]);

  const sendChatMessage = useCallback(async (content: string) => {
    if (!activeConversationId || !isConnected) {
      console.warn('Cannot send message: No active conversation or not connected');
      return false;
    }

    try {
      setIsSending(true);
      const success = send({
        type: 'send_message',
        conversationId: activeConversationId,
        content,
        timestamp: new Date().toISOString(),
      });

      if (!success) {
        throw new Error('Failed to send message');
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeConversationId, isConnected, send]);

  return {
    sendChatMessage,
    isConnected,
    isSending,
    error: lastError,
  };
}