
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmbedOutput } from "../types/embed";

export interface EmbedPagesState {
  pages: EmbedOutput[];
  setPages: (pages: EmbedOutput[]) => void;
  addPage: (page: EmbedOutput) => void;
  updatePage: (page: EmbedOutput) => void;
  deletePage: (pageId: string) => void;
}

export const useEmbedPagesStore = create<EmbedPagesState>()(
  persist(
    (set) => ({
      pages: [],

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
    }),
    {
      name: "embed-pages-storage",
      partialize: (state) => ({
        pages: state.pages,
      }),
    }
  )
);
