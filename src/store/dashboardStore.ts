import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardService } from "../services/board.service";
import { Board, TopSellersResponse } from "../types/board";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";
import { DashboardStore } from "../types/dashboard";

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      activeBoardId: null,
      activeBoard: null,
      lastUsedBoardId: null,
      topSellers: { data: [] },
      isLoadingBoard: false,
      isLoadingTopSellers: false,
      error: null,
      lastFetched: null,

      // Actions
      setActiveBoardId: (boardId) => {
        set({ activeBoardId: boardId });
        if (boardId) {
          get().setLastUsedBoardId(boardId);
        }
      },

      setActiveBoard: (board) => {
        set({ activeBoard: board });
      },

      setLastUsedBoardId: (boardId) => {
        set({ lastUsedBoardId: boardId });
      },

      fetchDashboardBoard: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error(
            "[DashboardStore] Token ou organização não encontrados"
          );
          return;
        }

        set({ isLoadingBoard: true, error: null });

        try {
          // getBoardById já retorna board completo com listas e cards
          const fullBoard = await boardService.getBoardById(
            token,
            organization.id,
            boardId
          );

          set({
            activeBoard: fullBoard,
            activeBoardId: boardId,
            isLoadingBoard: false,
            lastFetched: Date.now(),
          });
        } catch (error: any) {
          console.error("[DashboardStore] ❌ Erro ao buscar board:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar quadro";

          set({
            error: errorMessage,
            isLoadingBoard: false,
          });

          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      fetchTopSellers: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization?.id || !boardId) {
          return;
        }

        set({ isLoadingTopSellers: true });

        try {
          const sellers = await boardService.getTopSellers(
            token,
            organization.id,
            boardId
          );

          set({
            topSellers: sellers,
            isLoadingTopSellers: false,
          });
        } catch (error) {
          console.error(
            "[DashboardStore] ❌ Erro ao buscar top sellers:",
            error
          );
          set({
            topSellers: { data: [] },
            isLoadingTopSellers: false,
          });
        }
      },

      selectAndLoadBoard: async (boardId: string) => {
        console.log(
          "[DashboardStore] 🎯 Selecionando e carregando board:",
          boardId
        );

        // Definir o ID imediatamente para evitar estado inconsistente
        get().setActiveBoardId(boardId);

        // Buscar board completo
        await get().fetchDashboardBoard(boardId);

        // Buscar top sellers em paralelo (não bloquear)
        get().fetchTopSellers(boardId);
      },

      // Utils
      cleanUserData: () => {
        set({
          activeBoardId: null,
          activeBoard: null,
          lastUsedBoardId: null,
          topSellers: { data: [] },
          isLoadingBoard: false,
          isLoadingTopSellers: false,
          error: null,
          lastFetched: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      selectInitialBoard: (boards: Board[]) => {
        if (boards.length === 0) {
          set({ activeBoardId: null, activeBoard: null });
          return;
        }

        const state = get();

        // Se já tem um board ativo e ele ainda existe na lista, manter
        if (
          state.activeBoardId &&
          boards.some((b) => b.id === state.activeBoardId)
        ) {
          // Atualizar os dados do board se necessário
          const currentBoard = boards.find((b) => b.id === state.activeBoardId);
          if (
            currentBoard &&
            (!state.activeBoard || !state.activeBoard.lists)
          ) {
            set({ activeBoard: currentBoard });
          }
          return;
        }

        // Se tem último board usado e ele ainda existe, usar ele
        if (
          state.lastUsedBoardId &&
          boards.some((b) => b.id === state.lastUsedBoardId)
        ) {
          const board =
            boards.find((b) => b.id === state.lastUsedBoardId) || null;
          set({
            activeBoardId: state.lastUsedBoardId,
            activeBoard: board,
          });
          return;
        }

        // Caso contrário, usar o primeiro board
        set({
          activeBoardId: boards[0].id,
          activeBoard: boards[0],
        });
      },
    }),
    {
      name: "dashboard-store",
      partialize: (state) => ({
        activeBoardId: state.activeBoardId,
        activeBoard: state.activeBoard,
        lastUsedBoardId: state.lastUsedBoardId,
        lastFetched: state.lastFetched,
        // Não persistir topSellers, loading states e errors
      }),
    }
  )
);
