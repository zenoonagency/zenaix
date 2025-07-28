import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { whatsappContactService } from '../../services/whatsapp/whatsappContact.service';
import { WhatsappContact } from '../../types/whatsapp';
import { APIError } from '../../services/errors/api.errors';
import { useWhatsAppInstanceStore } from '../whatsAppInstanceStore';

interface WhatsappContactStoreState {
  contacts: { [instanceId: string]: WhatsappContact[] };
  isLoading: boolean;
  error: string | null;
  lastFetched: { [instanceId: string]: number | null };
  setContacts: (instanceId: string, contacts: WhatsappContact[]) => void;
  addContact: (instanceId: string, contact: WhatsappContact) => void;
  updateContact: (instanceId: string, contact: WhatsappContact) => void;
  removeContact: (instanceId: string, contactId: string) => void;
  cleanUserData: () => void;
  fetchAllContacts: (token: string, organizationId: string, instanceId: string, showLoading?: boolean) => Promise<void>;
  fetchContactsInBackground: (token: string, organizationId: string, instanceId: string) => Promise<void>;
  hasContactsForInstance: (instanceId: string) => boolean;
  isInstanceConnected: (instanceId: string) => boolean;
  updateContactInStore: (instanceId: string, contactId: string, updates: Partial<WhatsappContact>) => void;
  deleteContactFromStore: (instanceId: string, contactId: string) => void;
}

export const useWhatsappContactStore = create<WhatsappContactStoreState>()(
  persist(
    (set, get) => ({
      contacts: {},
      isLoading: false,
      error: null,
      lastFetched: {},

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
        set({ contacts: {}, isLoading: false, error: null, lastFetched: {} });
      },

      fetchAllContacts: async (token, organizationId, instanceId, showLoading = true) => {
        if (showLoading) {
          set({ isLoading: true, error: null });
        }

        // Verificar se a instância está conectada antes de buscar contatos
        const instanceStore = useWhatsAppInstanceStore.getState();
        const instance = instanceStore.instances.find(inst => inst.id === instanceId);
        
        if (!instance || instance.status !== 'CONNECTED') {
          if (showLoading) {
            set({ isLoading: false, error: null });
          }
          console.log(`[WhatsAppContactStore] Instância ${instanceId} não está conectada (status: ${instance?.status || 'não encontrada'}). Pulando busca de contatos.`);
          return;
        }

        const lastFetched = get().lastFetched[instanceId];
        const contacts = get().contacts[instanceId];

        // Se tem dados recentes (menos de 30 segundos), busca em background
        if (lastFetched && contacts && Date.now() - lastFetched < 30000) { // 30 segundos
          if (showLoading) {
            set({ isLoading: false, error: null });
          }
          // Busca em background para atualizar dados
          get().fetchContactsInBackground(token, organizationId, instanceId);
          return;
        }

        try {
          const fetchedContacts = await whatsappContactService.findAll(token, organizationId, instanceId);
          set((state) => ({
            contacts: { ...state.contacts, [instanceId]: fetchedContacts },
            lastFetched: { ...state.lastFetched, [instanceId]: Date.now() },
            isLoading: false,
            error: null,
          }));
        } catch (err: any) {
          const errorMessage = err instanceof APIError ? err.message : 'Erro ao buscar contatos.';
          set({ error: errorMessage, isLoading: false });
        }
      },

      fetchContactsInBackground: async (token, organizationId, instanceId) => {
        // Verificar se a instância está conectada antes de buscar contatos
        const instanceStore = useWhatsAppInstanceStore.getState();
        const instance = instanceStore.instances.find(inst => inst.id === instanceId);
        
        if (!instance || instance.status !== 'CONNECTED') {
          console.log(`[WhatsAppContactStore] Instância ${instanceId} não está conectada (status: ${instance?.status || 'não encontrada'}). Pulando busca em background.`);
          return;
        }

        try {
          const fetchedContacts = await whatsappContactService.findAll(token, organizationId, instanceId);
          set((state) => ({
            contacts: { ...state.contacts, [instanceId]: fetchedContacts },
            lastFetched: { ...state.lastFetched, [instanceId]: Date.now() },
          }));
          console.log(`[WhatsAppContactStore] Contatos atualizados em background para instância ${instanceId}`);
        } catch (err: any) {
          console.error(`[WhatsAppContactStore] Erro ao buscar contatos em background para instância ${instanceId}:`, err);
        }
      },

      hasContactsForInstance: (instanceId) => {
        return get().contacts[instanceId] && get().contacts[instanceId].length > 0;
      },

      isInstanceConnected: (instanceId) => {
        const instanceStore = useWhatsAppInstanceStore.getState();
        const instance = instanceStore.instances.find(inst => inst.id === instanceId);
        return instance?.status === 'CONNECTED';
      },

      updateContactInStore: (instanceId, contactId, updates) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [instanceId]: (state.contacts[instanceId] || []).map((contact) =>
              contact.id === contactId ? { ...contact, ...updates } : contact
            ),
          },
        }));
      },

      deleteContactFromStore: (instanceId, contactId) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [instanceId]: (state.contacts[instanceId] || []).filter(
              (contact) => contact.id !== contactId
            ),
          },
        }));
      },
    }),
    {
      name: 'whatsapp-contact-store',
      partialize: (state) => ({ contacts: state.contacts, lastFetched: state.lastFetched }),
    }
  )
); 