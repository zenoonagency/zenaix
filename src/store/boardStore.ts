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
import { APIError } from "../services/errors/api.errors";

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  selectedBoard: Board | null;
  lastFetched: number | null; // Adicionado para consistência

  // Ações síncronas (para a RealtimeStore e componentes)
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setSelectedBoard: (board: Board | null) => void;

  fetchBoards: () => Promise<void>;
  fetchBoardById: (boardId: string) => Promise<void>;
  createBoardApi: (data: InputCreateBoardDTO) => Promise<Board | null>;
  updateBoardApi: (
    boardId: string,
    data: InputUpdateBoardDTO
  ) => Promise<Board | null>;
  deleteBoardApi: (boardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      isLoading: false,
      error: null,
      selectedBoard: null,
      lastFetched: null,

      setBoards: (boards) => set({ boards }),
      addBoard: (board) => {
        set((state) => ({
          boards: state.boards.some((b) => b.id === board.id)
            ? state.boards
            : [...state.boards, board],
        }));
      },
      updateBoard: (board) => {
        set((state) => ({
          boards: state.boards.map((b) => (b.id === board.id ? board : b)),
        }));
      },
      removeBoard: (boardId) => {
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== boardId),
        }));
      },
      setSelectedBoard: (board) => set({ selectedBoard: board }),

      // --- AÇÕES ASSÍNCRONAS ---
      fetchBoards: async () => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) return;

        if (get().isLoading) return;
        if (get().boards.length === 0) {
          set({ isLoading: true });
        }

        try {
          const boards = await boardService.getBoards(token, organization.id);
          set({
            boards,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });
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
          // Atualiza a store com o quadro completo
          get().updateBoard(board);
          set({ selectedBoard: board, isLoading: false, error: null });
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao buscar quadro";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      createBoardApi: async (data) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) return null;

        try {
          // Apenas chama o serviço. A atualização virá via Realtime.
          return await boardService.createBoard(token, organization.id, data);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao criar quadro";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },

      updateBoardApi: async (boardId, data) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) return null;

        try {
          return await boardService.updateBoard(
            token,
            organization.id,
            boardId,
            data
          );
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : "Erro ao atualizar quadro";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },

      deleteBoardApi: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) return;

        try {
          // Apenas chama o serviço. A atualização virá via Realtime.
          await boardService.deleteBoard(token, organization.id, boardId);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao apagar quadro";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
    }),
    {
      name: "board-store",
      partialize: (state) => ({
        boards: state.boards,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
