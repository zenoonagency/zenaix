import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MessagingState, Contact, MessageContent } from '../types';
import { generateId } from '../../../utils/generateId';

// Limitar o número máximo de lotes para evitar estouro da cota de armazenamento
const MAX_STORED_BATCHES = 100;

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      batches: [],
      selectedContacts: [],

      addBatch: (id, context, messages, contacts) => {
        const newBatch = {
          id,
          context,
          messages,
          contacts,
          status: 'pending' as const,
          progress: 0,
          sentCount: 0,
          failedCount: 0,
          createdAt: new Date().toISOString(),
        };

        // Limpar batches antigos se exceder o limite
        set((state) => {
          let updatedBatches = [newBatch, ...state.batches];
          
          // Se temos mais batches que o limite, remover os mais antigos
          if (updatedBatches.length > MAX_STORED_BATCHES) {
            updatedBatches = updatedBatches.slice(0, MAX_STORED_BATCHES);
          }
          
          return { batches: updatedBatches };
        });
      },

      updateBatchProgress: (id, progress, status, sentCount = undefined, failedCount = undefined) => {
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.id === id
              ? {
                  ...batch,
                  progress,
                  status,
                  ...(sentCount !== undefined && { sentCount }),
                  ...(failedCount !== undefined && { failedCount }),
                }
              : batch
          ),
        }));
      },

      completeBatch: (id, sentCount, failedCount) => {
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.id === id
              ? {
                  ...batch,
                  status: 'completed',
                  progress: 100,
                  sentCount,
                  failedCount,
                  completedAt: new Date().toISOString(),
                }
              : batch
          ),
        }));
      },

      removeBatch: (id) => {
        set((state) => ({
          batches: state.batches.filter((batch) => batch.id !== id),
        }));
      },

      // Função para limpar todos os lotes
      clearAllBatches: () => {
        set({ batches: [] });
      },

      // Função para limpar lotes antigos
      cleanupOldBatches: () => {
        set((state) => {
          if (state.batches.length <= MAX_STORED_BATCHES) return state;
          
          // Ordenar por data (mais recentes primeiro) e manter apenas o limite definido
          const sortedBatches = [...state.batches].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, MAX_STORED_BATCHES);
          
          return { batches: sortedBatches };
        });
      },

      setSelectedContacts: (contactIds) => {
        set({ selectedContacts: contactIds });
      },

      clearSelectedContacts: () => {
        set({ selectedContacts: [] });
      },
    }),
    {
      name: 'messaging-store',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          const migratedState = {
            ...persistedState,
            batches: (persistedState.batches || []).map((batch: any) => ({
              ...batch,
              messages: (batch.messages || []).map((msg: string | MessageContent) => {
                if (typeof msg === 'string') {
                  return {
                    type: 'text',
                    content: msg
                  };
                }
                return msg;
              })
            }))
          };
          return migratedState;
        }
        return persistedState;
      },
      // Reduzir o tamanho dos dados armazenados transformando-os antes de salvar
      partialize: (state) => ({
        batches: state.batches.map(batch => ({
          id: batch.id,
          context: batch.context,
          // Para mensagens, armazenar apenas os metadados, não o conteúdo completo de arquivos
          messages: batch.messages.map(msg => ({
            type: msg.type,
            // Para tipos de mídia, armazenar apenas o tipo e filename, não o conteúdo base64
            content: msg.type === 'text' ? msg.content : '[MEDIA CONTENT]',
            filename: msg.filename
          })),
          // Limitar o número de contatos armazenados por lote para economizar espaço
          contacts: batch.contacts.slice(0, 10).map(contact => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone
          })),
          status: batch.status,
          progress: batch.progress,
          sentCount: batch.sentCount, 
          failedCount: batch.failedCount,
          createdAt: batch.createdAt,
          completedAt: batch.completedAt
        })).slice(0, MAX_STORED_BATCHES),
        selectedContacts: state.selectedContacts
      }),
    }
  )
);