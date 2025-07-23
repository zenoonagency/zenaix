import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmbedOutput, EmbedPagesState } from "../types/embed";
import { embedService } from "../services/embed/embed.service";
import { APIError } from "../services/errors/api.errors";
import { cleanUserData } from "../utils/dataOwnership";

export const useEmbedPagesStore = create<EmbedPagesState>()(
  persist(
    (set, get) => ({
      pages: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      realtimeChannel: null,

      setPages: (pages) => set({ pages }),

      addPage: (newPage) =>
        set((state) => ({
          pages: [...state.pages, newPage],
        })),

      updatePage: (updatedPage) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === updatedPage.id ? updatedPage : page
          ),
        })),

      deletePage: (pageId) =>
        set((state) => ({
          pages: state.pages.filter((page) => page.id !== pageId),
        })),

      fetchAllEmbedPages: async (token: string, organizationId: string) => {
        const { pages, isLoading } = get();

        if (pages.length === 0) {
          set({ isLoading: true });
        }

        if (isLoading) return;

        try {
          const fetchedPages = await embedService.findAll(
            token,
            organizationId
          );
          set({
            pages: fetchedPages,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          console.error("EmbedPagesStore: Erro ao buscar páginas:", err);
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Não foi possível carregar as páginas embed.";
          set({ error: errorMessage, isLoading: false });
        }
      },
      cleanUserData: () => {
        set({
          pages: [],
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },
    }),

    {
      name: "embed-pages-storage",
      partialize: (state) => ({
        pages: state.pages,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
