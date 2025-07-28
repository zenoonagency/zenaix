import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { whatsappContactService } from '../../services/whatsapp/whatsappContact.service';
import { WhatsappContact } from '../../types/whatsapp';
import { APIError } from '../../services/errors/api.errors';

interface WhatsappContactStoreState {
  contacts: { [instanceId: string]: WhatsappContact[] };
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setContacts: (instanceId: string, contacts: WhatsappContact[]) => void;
  addContact: (instanceId: string, contact: WhatsappContact) => void;
  updateContact: (instanceId: string, contact: WhatsappContact) => void;
  removeContact: (instanceId: string, contactId: string) => void;
  cleanUserData: () => void;
  fetchAllContacts: (token: string, organizationId: string, instanceId: string) => Promise<void>;
}

export const useWhatsappContactStore = create<WhatsappContactStoreState>()(
  persist(
    (set, get) => ({
      contacts: {},
      isLoading: false,
      error: null,
      lastFetched: null,

      setContacts: (instanceId, contacts) => {
        set((state) => ({
          contacts: { ...state.contacts, [instanceId]: contacts },
        }));
      },

      addContact: (instanceId, contact) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [instanceId]: [...(state.contacts[instanceId] || []), contact],
          },
        }));
      },

      updateContact: (instanceId, contact) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [instanceId]: (state.contacts[instanceId] || []).map((c) =>
              c.id === contact.id ? contact : c
            ),
          },
        }));
      },

      removeContact: (instanceId, contactId) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [instanceId]: (state.contacts[instanceId] || []).filter(
              (c) => c.id !== contactId
            ),
          },
        }));
      },

      cleanUserData: () => {
        set({ contacts: {}, isLoading: false, error: null, lastFetched: null });
      },

      fetchAllContacts: async (token, organizationId, instanceId) => {
        set({ isLoading: true, error: null });
        try {
          const contacts = await whatsappContactService.findAll(token, organizationId, instanceId);
          set((state) => ({
            contacts: { ...state.contacts, [instanceId]: contacts },
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          }));
        } catch (err: any) {
          const errorMessage = err instanceof APIError ? err.message : 'Erro ao buscar contatos.';
          set({ error: errorMessage, isLoading: false });
        }
      },
    }),
    {
      name: 'whatsapp-contact-store',
      partialize: (state) => ({ contacts: state.contacts, lastFetched: state.lastFetched }),
    }
  )
); 