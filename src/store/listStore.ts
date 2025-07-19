import { create } from "zustand";
import { listService } from "../services/list.service";
import {
  OutputListDTO,
  InputCreateListDTO,
  InputUpdateListDTO,
} from "../types/list";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";

interface ListState {
  lists: OutputListDTO[];
  isLoading: boolean;
  error: string | null;
  selectedList: OutputListDTO | null;

  setLists: (lists: OutputListDTO[]) => void;
  addList: (list: OutputListDTO) => void;
  updateList: (list: OutputListDTO) => void;
  removeList: (listId: string) => void;
  setSelectedList: (list: OutputListDTO | null) => void;

  fetchLists: (boardId: string) => Promise<void>;
  fetchListById: (boardId: string, listId: string) => Promise<void>;
  createList: (
    boardId: string,
    data: InputCreateListDTO
  ) => Promise<OutputListDTO | null>;
  updateListRemote: (
    boardId: string,
    listId: string,
    data: InputUpdateListDTO
  ) => Promise<OutputListDTO | null>;
  deleteList: (boardId: string, listId: string) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,
  selectedList: null,

  setLists: (lists) => set({ lists }),
  addList: (list) => {
    set((state) => ({
      lists: state.lists.some((l) => l.id === list.id)
        ? state.lists
        : [...state.lists, list],
    }));
  },
  updateList: (list) => {
    set((state) => ({
      lists: state.lists.map((l) => (l.id === list.id ? list : l)),
    }));
  },
  removeList: (listId) => {
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
    }));
  },
  setSelectedList: (list) => set({ selectedList: list }),

  fetchLists: async (boardId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      const lists = await listService.getLists(token, boardId);
      set({ lists, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar listas";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
  fetchListById: async (boardId, listId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      const list = await listService.getListById(token, boardId, listId);
      set((state) => ({
        lists: state.lists.some((l) => l.id === list.id)
          ? state.lists.map((l) => (l.id === list.id ? list : l))
          : [...state.lists, list],
        selectedList: list,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar lista";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
  createList: async (boardId, data) => {
    const { token } = useAuthStore.getState();
    if (!token) return null;
    set({ isLoading: true });
    try {
      const list = await listService.createList(token, boardId, data);
      set((state) => ({
        lists: [...state.lists, list],
        isLoading: false,
        error: null,
      }));
      return list;
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao criar lista";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
      return null;
    }
  },
  updateListRemote: async (boardId, listId, data) => {
    const { token } = useAuthStore.getState();
    if (!token) return null;
    set({ isLoading: true });
    try {
      const list = await listService.updateList(token, boardId, listId, data);
      set((state) => ({
        lists: state.lists.map((l) => (l.id === list.id ? list : l)),
        isLoading: false,
        error: null,
      }));
      return list;
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao atualizar lista";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
      return null;
    }
  },
  deleteList: async (boardId, listId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      await listService.deleteList(token, boardId, listId);
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao deletar lista";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
}));
