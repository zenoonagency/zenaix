import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmbedOutput } from "../types/embed";
import { embedService } from "../services/embed/embed.service";
import { APIError } from "../services/errors/api.errors";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export interface EmbedPagesState {
  pages: EmbedOutput[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  realtimeChannel: RealtimeChannel | null;

  setPages: (pages: EmbedOutput[]) => void;
  addPage: (page: EmbedOutput) => void;
  updatePage: (page: EmbedOutput) => void;
  deletePage: (pageId: string) => void;
  fetchAllEmbedPages: (token: string, organizationId: string) => Promise<void>;
  connectToEmbedChanges: (organizationId: string) => void;
  disconnectFromEmbedChanges: () => void;
}

const CACHE_DURATION = 60 * 60 * 1000;

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
        const { pages, isLoading, lastFetched } = get();
        const now = Date.now();

        if (
          lastFetched &&
          now - lastFetched < CACHE_DURATION &&
          pages.length > 0
        ) {
          console.log("EmbedPagesStore: A usar páginas do cache.");
          return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null });
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
      connectToEmbedChanges: (organization_id: string) => {
        const { addPage, updatePage, deletePage } = get();

        // Previne múltiplas conexões
        if (get().realtimeChannel) {
          return;
        }

        console.log(
          `[EmbedPagesStore] 📢 Conectando ao Realtime de Embeds para a org: ${organization_id}`
        );

        const channel = supabase
          .channel(`embed-pages-${organization_id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "EmbedPage",
              filter: `"organizationId"=eq.${organization_id}`,
            },
            (payload: RealtimePostgresChangesPayload<EmbedOutput>) => {
              console.log(
                "📢 Evento de Realtime recebido para Embeds:",
                payload
              );

              switch (payload.eventType) {
                case "INSERT":
                  addPage(payload.new);
                  break;
                case "UPDATE":
                  updatePage(payload.new);
                  break;
                case "DELETE":
                  if (payload.old.id) {
                    deletePage(payload.old.id);
                  }
                  break;
              }
            }
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              console.log(
                `[EmbedPagesStore] ✅ Inscrito com sucesso no canal de embeds!`
              );
            }
            if (status === "CHANNEL_ERROR") {
              console.error(
                `[EmbedPagesStore] ❌ Erro ao conectar no canal de embeds:`,
                err
              );
            }
          });

        set({ realtimeChannel: channel });
      },
      disconnectFromEmbedChanges: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          set({ realtimeChannel: null });
        }
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
