import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  type?: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
}

const STORAGE_KEY = 'chat-messages';

export const useChatStorage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedMessages = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        console.log('Carregando mensagens do localStorage:', parsedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Erro ao carregar mensagens do localStorage:', error);
      }
    }
  }, []);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      type: 'text',
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      console.log('Adicionando mensagem:', newMessage);
      console.log('Total de mensagens após adicionar:', updatedMessages.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      );
      console.log('Atualizando mensagem:', id, updates);
      console.log('Mensagens após atualização:', updatedMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
  };
};