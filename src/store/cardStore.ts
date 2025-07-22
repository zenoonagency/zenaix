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
import { cleanUserData } from "../utils/dataOwnership";

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
  cleanUserData: () => void;
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
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization?.id) {
          console.error("Token ou organização não encontrados");
          return;
        }

        if (get().isLoading) return;
        if (get().cards.length === 0) {
          set({ isLoading: true });
        }

        try {
          const cards = await cardService.getCards(
            token,
            organization.id,
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
          console.error("Erro ao buscar cards:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar cards";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },
      cleanUserData: () => {
        set({
          cards: [],
          selectedCard: null,
          lastFetched: null,
          error: null,
          isLoading: false,
        });
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
