import { create } from "zustand";
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

  setCards: (cards: OutputCardDTO[]) => void;
  addCard: (card: OutputCardDTO) => void;
  updateCard: (card: OutputCardDTO) => void;
  removeCard: (cardId: string) => void;
  setSelectedCard: (card: OutputCardDTO | null) => void;

  fetchCards: (
    boardId: string,
    listId: string,
    title?: string
  ) => Promise<void>;
  fetchCardById: (
    boardId: string,
    listId: string,
    cardId: string
  ) => Promise<void>;
  createCard: (
    boardId: string,
    listId: string,
    data: InputCreateCardDTO
  ) => Promise<OutputCardDTO | null>;
  updateCardRemote: (
    boardId: string,
    listId: string,
    cardId: string,
    data: InputUpdateCardDTO
  ) => Promise<OutputCardDTO | null>;
  deleteCard: (
    boardId: string,
    listId: string,
    cardId: string
  ) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: false,
  error: null,
  selectedCard: null,

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

  fetchCards: async (boardId, listId, title) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      const cards = await cardService.getCards(token, boardId, listId, title);
      set({ cards, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar cards";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
  fetchCardById: async (boardId, listId, cardId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      const card = await cardService.getCardById(
        token,
        boardId,
        listId,
        cardId
      );
      set((state) => ({
        cards: state.cards.some((c) => c.id === card.id)
          ? state.cards.map((c) => (c.id === card.id ? card : c))
          : [...state.cards, card],
        selectedCard: card,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar card";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
  createCard: async (boardId, listId, data) => {
    const { token } = useAuthStore.getState();
    if (!token) return null;
    set({ isLoading: true });
    try {
      const card = await cardService.createCard(token, boardId, listId, data);
      set((state) => ({
        cards: [...state.cards, card],
        isLoading: false,
        error: null,
      }));
      return card;
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao criar card";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
      return null;
    }
  },
  updateCardRemote: async (boardId, listId, cardId, data) => {
    const { token } = useAuthStore.getState();
    if (!token) return null;
    set({ isLoading: true });
    try {
      const card = await cardService.updateCard(
        token,
        boardId,
        listId,
        cardId,
        data
      );
      set((state) => ({
        cards: state.cards.map((c) => (c.id === card.id ? card : c)),
        isLoading: false,
        error: null,
      }));
      return card;
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao atualizar card";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
      return null;
    }
  },
  deleteCard: async (boardId, listId, cardId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      await cardService.deleteCard(token, boardId, listId, cardId);
      set((state) => ({
        cards: state.cards.filter((c) => c.id !== cardId),
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao deletar card";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
}));
