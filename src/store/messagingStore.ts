// src/store/messagingStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Contact } from "../types/contacts";
import { generateId } from "../utils/generateId";
import { MessagingState } from "../types/messaging";

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set) => ({
      batches: [],
      selectedContacts: [],

      addBatch: (context, messages) =>
        set((state) => ({
          batches: [
            {
              id: generateId(),
              context,
              messages,
              status: "pending",
              progress: 0,
              sentCount: 0,
              failedCount: 0,
              createdAt: new Date().toISOString(),
            },
            ...state.batches,
          ],
        })),

      updateBatchProgress: (id, progress, status) =>
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.id === id
              ? {
                  ...batch,
                  progress,
                  status,
                }
              : batch
          ),
        })),

      completeBatch: (id, sentCount, failedCount) =>
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.id === id
              ? {
                  ...batch,
                  status: "completed",
                  progress: 100,
                  sentCount,
                  failedCount,
                  completedAt: new Date().toISOString(),
                }
              : batch
          ),
        })),

      addContacts: (contacts) =>
        set((state) => ({
          selectedContacts: [...state.selectedContacts, ...contacts],
        })),

      clearContacts: () =>
        set({
          selectedContacts: [],
        }),
    }),
    {
      name: "messaging-store",
    }
  )
);
