import { create } from 'zustand';
import { whatsappMessageService } from '../../services/whatsapp/whatsappMessage.service';
import { WhatsappMessage, InputSendMessageDTO } from '../../types/whatsapp';
import { APIError } from '../../services/errors/api.errors';

interface WhatsappMessageStoreState {
  messages: { [instanceId: string]: { [contact: string]: WhatsappMessage[] } };
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setMessages: (instanceId: string, contact: string, messages: WhatsappMessage[]) => void;
  addMessage: (instanceId: string, contact: string, message: WhatsappMessage) => void;
  cleanUserData: () => void;
  fetchAllMessages: (token: string, organizationId: string, instanceId: string, contact: string, limit?: number, cursor?: string) => Promise<void>;
}

export const useWhatsappMessageStore = create<WhatsappMessageStoreState>()((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,
  lastFetched: null,

  setMessages: (instanceId, contact, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [instanceId]: {
          ...(state.messages[instanceId] || {}),
          [contact]: messages,
        },
      },
    }));
  },

  addMessage: (instanceId, contact, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [instanceId]: {
          ...(state.messages[instanceId] || {}),
          [contact]: [
            ...(state.messages[instanceId]?.[contact] || []),
            message,
          ],
        },
      },
    }));
  },

  cleanUserData: () => {
    set({ messages: {}, isLoading: false, error: null, lastFetched: null });
  },

  fetchAllMessages: async (token, organizationId, instanceId, contact, limit = 20, cursor) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await whatsappMessageService.list(token, organizationId, instanceId, contact, limit, cursor);
      set((state) => ({
        messages: {
          ...state.messages,
          [instanceId]: {
            ...(state.messages[instanceId] || {}),
            [contact]: messages,
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