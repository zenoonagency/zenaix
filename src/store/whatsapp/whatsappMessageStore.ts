import { create } from 'zustand';
import { whatsappMessageService } from '../../services/whatsapp/whatsappMessage.service';
import { WhatsappMessage, InputSendMessageDTO, WhatsappContact } from '../../types/whatsapp';
import { APIError } from '../../services/errors/api.errors';
import { useWhatsappContactStore } from './whatsappContactStore';

interface WhatsappMessageStoreState {
  messages: { [instanceId: string]: { [contactId: string]: WhatsappMessage[] } };
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setMessages: (instanceId: string, contactId: string, messages: WhatsappMessage[]) => void;
  addMessage: (instanceId: string, contactId: string, message: WhatsappMessage) => void;
  addTemporaryMessage: (instanceId: string, contactId: string, message: WhatsappMessage) => void;
  updateMessageStatus: (instanceId: string, contactId: string, messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read') => void;
  cleanUserData: () => void;
  fetchAllMessages: (token: string, organizationId: string, instanceId: string, contactId: string, limit?: number, cursor?: string) => Promise<void>;
}

export const useWhatsappMessageStore = create<WhatsappMessageStoreState>()((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,
  lastFetched: null,

  setMessages: (instanceId, contactId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [instanceId]: {
          ...(state.messages[instanceId] || {}),
          [contactId]: messages,
        },
      },
    }));
  },

  addMessage: (instanceId, contactId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [instanceId]: {
          ...(state.messages[instanceId] || {}),
          [contactId]: [
            ...(state.messages[instanceId]?.[contactId] || []),
            message,
          ],
        },
      },
    }));
  },

  addTemporaryMessage: (instanceId, contactId, message) => {
    // Adiciona uma mensagem temporária com status 'sending'
    const tempMessage = {
      ...message,
      id: `temp_${Date.now()}_${Math.random()}`, // ID temporário único
      status: 'sending' as const
    };
    
    set((state) => ({
      messages: {
        ...state.messages,
        [instanceId]: {
          ...(state.messages[instanceId] || {}),
          [contactId]: [
            ...(state.messages[instanceId]?.[contactId] || []),
            tempMessage,
          ],
        },
      },
    }));
  },

  updateMessageStatus: (instanceId, contactId, messageId, status) => {
    set((state) => {
      const currentMessages = state.messages[instanceId]?.[contactId] || [];
      const updatedMessages = currentMessages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      );
      
      return {
        messages: {
          ...state.messages,
          [instanceId]: {
            ...(state.messages[instanceId] || {}),
            [contactId]: updatedMessages,
          },
        },
      };
    });
  },

  cleanUserData: () => {
    set({ messages: {}, isLoading: false, error: null, lastFetched: null });
  },

  fetchAllMessages: async (token, organizationId, instanceId, contactId, limit = 20, cursor) => {
    set({ isLoading: true, error: null });
    try {
      // Buscar o contato para obter o phone
      const contactStore = useWhatsappContactStore.getState();
      const contacts = contactStore.contacts[instanceId] || [];
      const contact = contacts.find(c => c.id === contactId);
      
      if (!contact) {
        throw new APIError('Contato não encontrado.');
      }
      
      const messages = await whatsappMessageService.list(token, organizationId, instanceId, contact.phone, limit, cursor);
      set((state) => ({
        messages: {
          ...state.messages,
          [instanceId]: {
            ...(state.messages[instanceId] || {}),
            [contactId]: messages,
          },
        },
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      }));
    } catch (err: any) {
      const errorMessage = err instanceof APIError ? err.message : 'Erro ao buscar mensagens.';
      set({ error: errorMessage, isLoading: false });
    }
  },
})); 