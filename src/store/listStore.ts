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
import { cleanUserData } from "../utils/dataOwnership";

interface ListState {
  lists: OutputListDTO[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  selectedList: OutputListDTO | null;

  setLists: (lists: OutputListDTO[]) => void;
  addList: (list: OutputListDTO) => void;
  updateList: (list: OutputListDTO) => void;
  removeList: (listId: string) => void;
  selectList: (list: OutputListDTO) => void;
  cleanUserData: () => void;

  fetchLists: (boardId: string) => Promise<void>;
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: [],
      isLoading: false,
      error: null,
      lastFetched: null,
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
      selectList: (list) => {
        set({ selectedList: list });
      },
      cleanUserData: () => {
        set({
          lists: [],
          isLoading: false,
          error: null,
          selectedList: null,
          lastFetched: null,
        });
      },

      fetchLists: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization?.id) {
          console.error("Token ou organização não encontrados");
          return;
        }

        if (get().isLoading) return;
        if (get().lists.length === 0) {
          set({ isLoading: true });
        }

        try {
          const lists = await listService.getLists(
            token,
            organization.id,
            boardId
          );
          set({
            lists,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });
        } catch (error: any) {
          console.error("Erro ao buscar listas:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar listas";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
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
