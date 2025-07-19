import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  lastFetched: number | null;

  setLists: (lists: OutputListDTO[]) => void;
  addList: (list: OutputListDTO) => void;
  updateList: (list: OutputListDTO) => void;
  removeList: (listId: string) => void;

  fetchLists: (boardId: string) => Promise<void>;
  createListApi: (
    boardId: string,
    data: InputCreateListDTO
  ) => Promise<OutputListDTO | null>;
  updateListApi: (
    boardId: string,
    listId: string,
    data: InputUpdateListDTO
  ) => Promise<OutputListDTO | null>;
  deleteListApi: (boardId: string, listId: string) => Promise<void>;
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: [],
      isLoading: false,
      error: null,
      lastFetched: null,

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

      fetchLists: async (boardId) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        if (get().isLoading) return;
        if (get().lists.length === 0) {
          set({ isLoading: true });
        }

        try {
          const lists = await listService.getLists(token, boardId);
          set({
            lists,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao buscar listas";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      createListApi: async (boardId, data) => {
        const { token } = useAuthStore.getState();
        if (!token) return null;

        try {
          return await listService.createList(token, boardId, data);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao criar lista";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
      updateListApi: async (boardId, listId, data) => {
        const { token } = useAuthStore.getState();
        if (!token) return null;

        try {
          return await listService.updateList(token, boardId, listId, data);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : "Erro ao atualizar lista";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
      deleteListApi: async (boardId, listId) => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
          await listService.deleteList(token, boardId, listId);
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError ? error.message : "Erro ao apagar lista";
          set({ error: errorMessage });
          useToastStore.getState().addToast(errorMessage, "error");
          throw error;
        }
      },
    }),
    {
      name: "list-store",
      partialize: (state) => ({
        lists: state.lists,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
