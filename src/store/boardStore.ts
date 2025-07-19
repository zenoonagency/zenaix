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

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  selectedBoard: Board | null;
  lastFetched: number | null;
  activeBoardId: string | null; // ID do quadro ativo
  lastUsedBoardId: string | null; // ID do último quadro usado
  activeBoard: Board | null; // Board completo ativo (com listas e cards)

  // Ações síncronas (para a RealtimeStore e componentes)
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setSelectedBoard: (board: Board | null) => void;
  setActiveBoardId: (boardId: string | null) => void;
  setLastUsedBoardId: (boardId: string | null) => void;
  setActiveBoard: (board: Board | null) => void;
  selectActiveBoard: (boards: Board[]) => void;

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
        if (!token || !organizationId) return;

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
          const errorMessage =
            error instanceof APIError
              ? error.message
              : "Erro ao buscar quadros";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      fetchBoardById: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) return;

        set({ isLoading: true });
        try {
          const board = await boardService.getBoardById(
            token,
            organization.id,
            boardId
          );

          // Carregar listas do board automaticamente
          const { fetchLists } = useListStore.getState();
          await fetchLists(boardId);

          get().updateBoard(board);
          set({
            selectedBoard: board,
            activeBoard: board,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao buscar quadro";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      selectAndLoadBoard: async (boardId: string) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          return;
        }

        get().setActiveBoardId(boardId);
        get().setLastUsedBoardId(boardId);

        await get().fetchBoardById(boardId);
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
