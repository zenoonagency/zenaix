import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmbedPage {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

interface EmbedPagesStore {
  pages: EmbedPage[];
  addPage: (page: Omit<EmbedPage, 'id' | 'createdAt'>) => void;
  updatePage: (id: string, updates: Partial<Omit<EmbedPage, 'id' | 'createdAt'>>) => void;
  deletePage: (id: string) => void;
}

export const useEmbedPagesStore = create<EmbedPagesStore>()(
  persist(
    (set) => ({
      pages: [],
      addPage: (page) =>
        set((state) => ({
          pages: [
            ...state.pages,
            {
              ...page,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updatePage: (id, updates) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, ...updates } : page
          ),
        })),
      deletePage: (id) =>
        set((state) => ({
          pages: state.pages.filter((page) => page.id !== id),
        })),
    }),
    {
      name: 'embed-pages-storage',
    }
  )
); 