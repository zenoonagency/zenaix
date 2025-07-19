import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cardService } from "../services/card.service";
import {
  OutputCardDTO,
  InputCreateCardDTO,
  InputUpdateCardDTO,
} from "../types/card";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";

interface CardState {
  cards: OutputCardDTO[];
  isLoading: boolean;
  error: string | null;
  selectedCard: OutputCardDTO | null;
  lastFetched: number | null; 

  setCards: (cards: OutputCardDTO[]) => void;
  addCard: (card: OutputCardDTO) => void;
  updateCard: (card: OutputCardDTO) => void;
  removeCard: (cardId: string) => void;
  setSelectedCard: (card: OutputCardDTO | null) => void;

  fetchAllCards: (
    boardId: string,
    listId: string,
    title?: string
  ) => Promise<void>;
  createCardApi: (
    boardId: string,
    listId: string,
    data: InputCreateCardDTO
  ) => Promise<OutputCardDTO | null>;
  updateCardApi: (
    boardId: string,
    listId: string,
    cardId: string,
    data: InputUpdateCardDTO
  ) => Promise<OutputCardDTO | null>;
  deleteCardApi: (
    boardId: string,
    listId: string,
    cardId: string
  ) => Promise<void>;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: [],
      isLoading: false,
      error: null,
      selectedCard: null,
      lastFetched: null,

      setCards: (cards) => set({ cards }),
      addCard: (card) => {
        set((state) => ({
          cards: state.cards.some((c) => c.id === card.id)
            ? state.cards
            : [...state.cards, card],
        }));
      },
      updateCard: (card) => {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === card.id ? card : c)),
        }));
      },
      removeCard: (cardId) => {
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== cardId),
        }));
      },
      setSelectedCard: (card) => set({ selectedCard: card }),

      fetchAllCards: async (boardId, listId, title) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        if (get().isLoading) return;
        if (get().cards.length === 0) {
          set({ isLoading: true });
        }

        try {
          const cards = await cardService.getCards(
            token,
            boardId,
            listId,
            title
          );
          set({
            cards,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao buscar cards";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      createCardApi: async (boardId, listId, data) => {
        const { token } = useAuthStore.getState();
        if (!token) return null;

        try {
          return await cardService.createCard(token, boardId, listId, data);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao criar card";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
      updateCardApi: async (boardId, listId, cardId, data) => {
        const { token } = useAuthStore.getState();
        if (!token) return null;

        try {
          return await cardService.updateCard(
            token,
            boardId,
            listId,
            cardId,
            data
          );
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : "Erro ao atualizar card";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
      deleteCardApi: async (boardId, listId, cardId) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
          await cardService.deleteCard(token, boardId, listId, cardId);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao apagar card";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
    }),
    {
      name: "card-store",
      partialize: (state) => ({
        cards: state.cards,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
