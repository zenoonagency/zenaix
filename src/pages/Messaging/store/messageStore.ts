import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MessageState, Contact, MessageRecord } from '../types';

export const useMessageStore = create<MessageState>()(
  persist(
    (set) => ({
      history: [],

      sendMessages: async (contact: Contact, message: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
      },

      addRecord: (record: MessageRecord) =>
        set((state) => ({
          history: [record, ...state.history],
        })),
    }),
    {
      name: 'message-store',
    }
  )
);