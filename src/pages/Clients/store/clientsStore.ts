import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClientsState } from '../types';
import { generateId } from '../../../utils/generateId';

export const useClientsStore = create<ClientsState>()(
  persist(
    (set) => ({
      clients: [],
      
      addClient: (clientData) => {
        const newClient = {
          ...clientData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          clients: [...state.clients, newClient],
        }));
      },

      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id
              ? {
                  ...client,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : client
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
        }));
      },
    }),
    {
      name: 'clients-store',
    }
  )
);