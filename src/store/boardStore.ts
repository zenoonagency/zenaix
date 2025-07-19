import { create } from "zustand";
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

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setSelectedBoard: (board: Board | null) => void;

  fetchBoards: () => Promise<void>;
  fetchBoardById: (boardId: string) => Promise<void>;
  createBoard: (data: InputCreateBoardDTO) => Promise<Board | null>;
  updateBoardRemote: (
    boardId: string,
    data: InputUpdateBoardDTO
  ) => Promise<Board | null>;
  deleteBoard: (boardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  isLoading: false,
  error: null,
  selectedBoard: null,

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

  fetchBoards: async () => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization?.id) return;
    set({ isLoading: true });
    try {
      const boards = await boardService.getBoards(token, organization.id);
      set({ boards, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar quadros";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
  fetchBoardById: async (boardId) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization?.id) return;
    set({ isLoading: true });
    try {
      const board = await boardService.getBoardById(
        token,
        organization.id,
        boardId
      );
      set((state) => ({
        boards: state.boards.some((b) => b.id === board.id)
          ? state.boards.map((b) => (b.id === board.id ? board : b))
          : [...state.boards, board],
        selectedBoard: board,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar quadro";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
  createBoard: async (data) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization?.id) return null;
    set({ isLoading: true });
    try {
      const board = await boardService.createBoard(
        token,
        organization.id,
        data
      );
      set((state) => ({
        boards: [...state.boards, board],
        isLoading: false,
        error: null,
      }));
      return board;
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao criar quadro";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
      return null;
    }
  },
  updateBoardRemote: async (boardId, data) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization?.id) return null;
    set({ isLoading: true });
    try {
      const board = await boardService.updateBoard(
        token,
        organization.id,
        boardId,
        data
      );
      set((state) => ({
        boards: state.boards.map((b) => (b.id === board.id ? board : b)),
        isLoading: false,
        error: null,
      }));
      return board;
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao atualizar quadro";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
      return null;
    }
  },
  deleteBoard: async (boardId) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization?.id) return;
    set({ isLoading: true });
    try {
      await boardService.deleteBoard(token, organization.id, boardId);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao deletar quadro";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
}));
