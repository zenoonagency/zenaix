import { create } from "zustand";
import { whatsappMessageService } from "../../services/whatsapp/whatsappMessage.service";
import {
  WhatsappMessage,
  InputSendMessageDTO,
  WhatsappContact,
} from "../../types/whatsapp";
import { APIError } from "../../services/errors/api.errors";
import { useWhatsappContactStore } from "./whatsappContactStore";

interface WhatsappMessageStoreState {
  messages: {
    [instanceId: string]: { [contactId: string]: WhatsappMessage[] };
  };
  cursors: { [instanceId: string]: { [contactId: string]: string | null } };
  hasMoreMessages: { [instanceId: string]: { [contactId: string]: boolean } };
  isLoading: boolean;
  isLoadingMore: { [instanceId: string]: { [contactId: string]: boolean } };
  error: string | null;
  lastFetched: number | null;
  setMessages: (
    instanceId: string,
    contactId: string,
    messages: WhatsappMessage[]
  ) => void;
  addMessage: (
    instanceId: string,
    contactId: string,
    message: WhatsappMessage
  ) => void;
  addTemporaryMessage: (
    instanceId: string,
    contactId: string,
    message: WhatsappMessage
  ) => void;
  updateMessageStatus: (
    instanceId: string,
    contactId: string,
    messageId: string,
    status: "sending" | "sent" | "delivered" | "read"
  ) => void;
  updateMessageAck: (
    instanceId: string,
    contactId: string,
    waMessageId: string,
    ack: number
  ) => void;
  cleanUserData: () => void;
  fetchAllMessages: (
    token: string,
    organizationId: string,
    instanceId: string,
    contactId: string,
    limit?: number,
    cursor?: string
  ) => Promise<void>;
  fetchMoreMessages: (
    token: string,
    organizationId: string,
    instanceId: string,
    contactId: string,
    limit?: number
  ) => Promise<void>;
}

export const useWhatsappMessageStore = create<WhatsappMessageStoreState>()(
  (set, get) => ({
    messages: {},
    cursors: {},
    hasMoreMessages: {},
    isLoading: false,
    isLoadingMore: {},
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
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID temporário único
        status: "sending" as const,
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
        const updatedMessages = currentMessages.map((msg) =>
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

    updateMessageAck: (instanceId, contactId, waMessageId, ack) => {
      set((state) => {
        const currentMessages = state.messages[instanceId]?.[contactId] || [];
        const updatedMessages = currentMessages.map((msg) =>
          msg.wa_message_id === waMessageId ? { ...msg, ack } : msg
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

    fetchAllMessages: async (
      token,
      organizationId,
      instanceId,
      contactId,
      limit = 30,
      cursor
    ) => {
      set({ isLoading: true, error: null });
      try {
        // Buscar o contato para obter o phone
        const contactStore = useWhatsappContactStore.getState();
        const contacts = contactStore.contacts[instanceId] || [];
        const contact = contacts.find((c) => c.id === contactId);

        if (!contact) {
          throw new APIError("Contato não encontrado.");
        }

        const messages = await whatsappMessageService.list(
          token,
          organizationId,
          instanceId,
          contact.phone,
          limit,
          cursor
        );

        // Se não há cursor, é a primeira busca - substituir mensagens
        // Se há cursor, é busca de mais mensagens - adicionar no início
        set((state) => {
          const currentMessages = state.messages[instanceId]?.[contactId] || [];
          const newMessages = cursor
            ? [...messages, ...currentMessages]
            : messages;

          return {
            messages: {
              ...state.messages,
              [instanceId]: {
                ...(state.messages[instanceId] || {}),
                [contactId]: newMessages,
              },
            },
            cursors: {
              ...state.cursors,
              [instanceId]: {
                ...(state.cursors[instanceId] || {}),
                [contactId]:
                  messages.length === limit
                    ? `${messages[messages.length - 1]?.id}`
                    : null,
              },
            },
            hasMoreMessages: {
              ...state.hasMoreMessages,
              [instanceId]: {
                ...(state.hasMoreMessages[instanceId] || {}),
                [contactId]: messages.length === limit,
              },
            },
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          };
        });
      } catch (err: any) {
        const errorMessage =
          err instanceof APIError ? err.message : "Erro ao buscar mensagens.";
        set({ error: errorMessage, isLoading: false });
      }
    },

    fetchMoreMessages: async (
      token,
      organizationId,
      instanceId,
      contactId,
      limit = 30
    ) => {
      const state = get();
      const currentCursor = state.cursors[instanceId]?.[contactId];
      const isLoadingMore = state.isLoadingMore[instanceId]?.[contactId];

      // Se não há mais mensagens ou já está carregando, não fazer nada
      if (!currentCursor || isLoadingMore) {
        return;
      }

      set((state) => ({
        isLoadingMore: {
          ...state.isLoadingMore,
          [instanceId]: {
            ...(state.isLoadingMore[instanceId] || {}),
            [contactId]: true,
          },
        },
      }));

      try {
        // Buscar o contato para obter o phone
        const contactStore = useWhatsappContactStore.getState();
        const contacts = contactStore.contacts[instanceId] || [];
        const contact = contacts.find((c) => c.id === contactId);

        if (!contact) {
          throw new APIError("Contato não encontrado.");
        }

        const messages = await whatsappMessageService.list(
          token,
          organizationId,
          instanceId,
          contact.phone,
          limit,
          currentCursor
        );

        set((state) => {
          const currentMessages = state.messages[instanceId]?.[contactId] || [];
          const newMessages = [...messages, ...currentMessages];

          return {
            messages: {
              ...state.messages,
              [instanceId]: {
                ...(state.messages[instanceId] || {}),
                [contactId]: newMessages,
              },
            },
            cursors: {
              ...state.cursors,
              [instanceId]: {
                ...(state.cursors[instanceId] || {}),
                [contactId]:
                  messages.length === limit
                    ? `${messages[messages.length - 1]?.id}`
                    : null,
              },
            },
            hasMoreMessages: {
              ...state.hasMoreMessages,
              [instanceId]: {
                ...(state.hasMoreMessages[instanceId] || {}),
                [contactId]: messages.length === limit,
              },
            },
            isLoadingMore: {
              ...state.isLoadingMore,
              [instanceId]: {
                ...(state.isLoadingMore[instanceId] || {}),
                [contactId]: false,
              },
            },
          };
        });
      } catch (err: any) {
        const errorMessage =
          err instanceof APIError
            ? err.message
            : "Erro ao buscar mais mensagens.";
        set((state) => ({
          error: errorMessage,
          isLoadingMore: {
            ...state.isLoadingMore,
            [instanceId]: {
              ...(state.isLoadingMore[instanceId] || {}),
              [contactId]: false,
            },
          },
        }));
      }
    },
  })
);
