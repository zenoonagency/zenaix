import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardService } from "../services/board.service";
import {
  Board,
  InputCreateBoardDTO,
  InputUpdateBoardDTO,
} from "../types/board";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { useListStore } from "./listStore";
import { APIError } from "../services/errors/api.errors";
import { OutputListDTO } from "../types/list";
import { OutputCardDTO } from "../types/card";

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  selectedBoard: Board | null;
  lastFetched: number | null;
  activeBoardId: string | null;
  lastUsedBoardId: string | null;
  activeBoard: Board | null;

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;

  setSelectedBoard: (board: Board | null) => void;
  setActiveBoardId: (boardId: string | null) => void;
  setLastUsedBoardId: (boardId: string | null) => void;
  setActiveBoard: (board: Board | null) => void;
  selectActiveBoard: (boards: Board[]) => void;

  addListToActiveBoard: (list: OutputListDTO) => void;
  updateListInActiveBoard: (list: OutputListDTO) => void;
  removeListFromActiveBoard: (listId: string) => void;
  addCardToActiveBoard: (card: OutputCardDTO) => void;
  updateCardInActiveBoard: (card: OutputCardDTO) => void;
  removeCardFromActiveBoard: (cardId: string, listId: string) => void;

  fetchAllBoards: (token: string, organizationId: string) => Promise<void>;
  fetchBoardById: (boardId: string) => Promise<void>;
  selectAndLoadBoard: (boardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      isLoading: false,
      error: null,
      selectedBoard: null,
      lastFetched: null,
      activeBoardId: null,
      lastUsedBoardId: null,
      activeBoard: null,

      setBoards: (boards) => {
        set({ boards });
        // Após definir os boards, selecionar o ativo automaticamente
        get().selectActiveBoard(boards);
      },

      addBoard: (board) => {
        set((state) => ({
          boards: state.boards.some((b) => b.id === board.id)
            ? state.boards
            : [...state.boards, board],
        }));
        // Após adicionar um board, selecioná-lo como ativo
        get().setActiveBoardId(board.id);
        get().setLastUsedBoardId(board.id);
      },

      updateBoard: (board) => {
        set((state) => ({
          boards: state.boards.map((b) => (b.id === board.id ? board : b)),
        }));
      },

      removeBoard: (boardId) => {
        set((state) => {
          const newBoards = state.boards.filter((b) => b.id !== boardId);

          // Se o board removido era o ativo, selecionar outro
          let newActiveBoardId = state.activeBoardId;
          if (state.activeBoardId === boardId) {
            newActiveBoardId = newBoards.length > 0 ? newBoards[0].id : null;
          }

          // Se o board removido era o último usado, limpar
          let newLastUsedBoardId = state.lastUsedBoardId;
          if (state.lastUsedBoardId === boardId) {
            newLastUsedBoardId = newBoards.length > 0 ? newBoards[0].id : null;
          }

          return {
            boards: newBoards,
            activeBoardId: newActiveBoardId,
            lastUsedBoardId: newLastUsedBoardId,
          };
        });
      },

      addListToActiveBoard: (list) => {
        set((state) => {
          if (
            !state.activeBoard ||
            state.activeBoard.lists.some((l) => l.id === list.id)
          )
            return {};

          // CORREÇÃO: Adiciona a propriedade 'cards' em falta ao novo objeto de lista.
          const newListWithCards = { ...list, cards: [] };

          return {
            activeBoard: {
              ...state.activeBoard,
              lists: [...state.activeBoard.lists, newListWithCards],
            },
          };
        });
      },
      updateListInActiveBoard: (updatedList) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) =>
                list.id === updatedList.id ? { ...list, ...updatedList } : list
              ),
            },
          };
        });
      },
      removeListFromActiveBoard: (listId) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.filter(
                (list) => list.id !== listId
              ),
            },
          };
        });
      },
      addCardToActiveBoard: (card) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => {
                if (
                  list.id === card.list_id &&
                  !list.cards.some((c) => c.id === card.id)
                ) {
                  return { ...list, cards: [...list.cards, card] };
                }
                return list;
              }),
            },
          };
        });
      },
      updateCardInActiveBoard: (updatedCard) => {
        set((state) => {
          if (!state.activeBoard) return {};

          const newLists = state.activeBoard.lists.map((list) => {
            // Remove o cartão da sua lista antiga (se ele mudou de lista)
            const filteredCards = list.cards.filter(
              (c) => c.id !== updatedCard.id
            );

            // Adiciona o cartão atualizado à sua nova lista
            if (list.id === updatedCard.list_id) {
              return { ...list, cards: [...filteredCards, updatedCard] };
            }

            return { ...list, cards: filteredCards };
          });

          return {
            activeBoard: {
              ...state.activeBoard,
              lists: newLists,
            },
          };
        });
      },
      removeCardFromActiveBoard: (cardId, listId) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => {
                if (list.id === listId) {
                  return {
                    ...list,
                    cards: list.cards.filter((card) => card.id !== cardId),
                  };
                }
                return list;
              }),
            },
          };
        });
      },

      setSelectedBoard: (board) => set({ selectedBoard: board }),

      setActiveBoardId: (boardId) => {
        set({ activeBoardId: boardId });
        // Quando um board é selecionado, salvá-lo como último usado
        if (boardId) {
          get().setLastUsedBoardId(boardId);
        }
      },

      setLastUsedBoardId: (boardId) => set({ lastUsedBoardId: boardId }),

      setActiveBoard: (board) => set({ activeBoard: board }),

      // Função para selecionar automaticamente o board ativo
      selectActiveBoard: (boards: Board[]) => {
        const state = get();

        if (boards.length === 0) {
          set({ activeBoardId: null });
          return;
        }

        if (
          state.activeBoardId &&
          boards.some((b) => b.id === state.activeBoardId)
        ) {
          return;
        }

        if (
          state.lastUsedBoardId &&
          boards.some((b) => b.id === state.lastUsedBoardId)
        ) {
          set({ activeBoardId: state.lastUsedBoardId });
          return;
        }

        set({ activeBoardId: boards[0].id });
      },

      fetchAllBoards: async (token: string, organizationId: string) => {
        if (!token || !organizationId) {
          console.error("Token ou organizationId não fornecidos");
          return;
        }

        if (get().isLoading) {
          return;
        }

        if (get().boards.length === 0) {
          set({ isLoading: true });
        }

        try {
          const boards = await boardService.getBoards(token, organizationId);

          set({
            boards,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });

          get().selectActiveBoard(boards);
        } catch (error: any) {
          console.error("Erro ao buscar quadros:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar quadros";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      fetchBoardById: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error("Token ou organização não encontrados");
          return;
        }

        set({ isLoading: true });
        try {
          const board = await boardService.getBoardById(
            token,
            organization.id,
            boardId
          );

          get().updateBoard(board);
          set({
            selectedBoard: board,
            activeBoard: board,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Erro ao buscar quadro:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar quadro";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      selectAndLoadBoard: async (boardId: string) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error("Token ou organização não encontrados");
          return;
        }

        try {
          get().setActiveBoardId(boardId);
          get().setLastUsedBoardId(boardId);

          await get().fetchBoardById(boardId);
        } catch (error: any) {
          console.error("Erro ao carregar board:", error);
          const errorMessage =
            error?.message || error?.error || "Erro ao carregar quadro";
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },
    }),
    {
      name: "board-store",
      partialize: (state) => ({
        boards: state.boards,
        lastFetched: state.lastFetched,
        activeBoardId: state.activeBoardId,
        lastUsedBoardId: state.lastUsedBoardId,
        activeBoard: state.activeBoard,
      }),
    }
  )
);
