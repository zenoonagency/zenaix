import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIError } from "../services/errors/api.errors";
import { TagState } from "../types/tag";
import { tagService } from "../services/tag/tag.service";

const CACHE_DURATION = 60 * 60 * 1000;

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      setTags: (tags) => set({ tags }),

      addTag: (newTag) =>
        set((state) => ({
          tags: state.tags.some((t) => t.id === newTag.id)
            ? state.tags
            : [...state.tags, newTag],
        })),

      updateTag: (updatedTag) =>
        set((state) => ({
          tags: state.tags.map((tag) =>
            tag.id === updatedTag.id ? updatedTag : tag
          ),
        })),

      deleteTag: (tagId) =>
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== tagId),
        })),

      fetchAllTags: async (token: string, organizationId: string) => {
        const { tags, isLoading, lastFetched } = get();
        const now = Date.now();

        if (
          lastFetched &&
          now - lastFetched < CACHE_DURATION &&
          tags.length > 0
        ) {
          return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const fetchedTags = await tagService.findAll(token, organizationId);
          set({
            tags: fetchedTags,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          console.error("[TagStore] Erro ao buscar tags:", err);
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Não foi possível carregar as tags.";
          set({ error: errorMessage, isLoading: false });
        }
      },
    }),
    {
      name: "tag-storage",
      partialize: (state) => ({
        tags: state.tags,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
