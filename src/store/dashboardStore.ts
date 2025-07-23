import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardService } from "../services/board.service";
import { Board, TopSellersResponse } from "../types/board";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";

export interface DashboardStore {
  // Board do dashboard
  activeBoardId: string | null;
  activeBoard: Board | null;
  lastUsedBoardId: string | null;

  // Top sellers
  topSellers: TopSellersResponse;

  // Loading states
  isLoadingBoard: boolean;
  isLoadingTopSellers: boolean;

  // Error state
  error: string | null;

  // Cache
  lastFetched: number | null;

  // Actions
  setActiveBoardId: (boardId: string | null) => void;
  setActiveBoard: (board: Board | null) => void;
  setLastUsedBoardId: (boardId: string | null) => void;
  fetchDashboardBoard: (boardId: string) => Promise<void>;
  fetchTopSellers: (boardId: string) => Promise<void>;
  selectAndLoadBoard: (boardId: string) => Promise<void>;

  // Utils
  cleanUserData: () => void;
  clearError: () => void;
  selectInitialBoard: (boards: Board[]) => void;
}

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
        console.log(
          "[DashboardStore] Definindo board ativo:",
          board?.name || "null"
        );
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

        console.log("[DashboardStore] 🔄 Iniciando fetch do board:", boardId);
        set({ isLoadingBoard: true, error: null });

        try {
          // getBoardById já retorna board completo com listas e cards
          const fullBoard = await boardService.getBoardById(
            token,
            organization.id,
            boardId
          );

          console.log("[DashboardStore] ✅ Board carregado com sucesso:", {
            boardName: fullBoard.name,
            listsCount: fullBoard.lists?.length || 0,
            totalCards:
              fullBoard.lists?.reduce(
                (total, list) => total + (list.cards?.length || 0),
                0
              ) || 0,
          });

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
          console.warn(
            "[DashboardStore] Parâmetros insuficientes para buscar top sellers"
          );
          return;
        }

        console.log(
          "[DashboardStore] 🔄 Buscando top sellers para board:",
          boardId
        );
        set({ isLoadingTopSellers: true });

        try {
          const sellers = await boardService.getTopSellers(
            token,
            organization.id,
            boardId
          );

          console.log(
            "[DashboardStore] ✅ Top sellers carregados:",
            sellers.data.length
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
        console.log("[DashboardStore] 🧹 Limpando dados do usuário");
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
          console.log("[DashboardStore] Nenhum board disponível");
          set({ activeBoardId: null, activeBoard: null });
          return;
        }

        const state = get();

        // Se já tem um board ativo e ele ainda existe na lista, manter
        if (
          state.activeBoardId &&
          boards.some((b) => b.id === state.activeBoardId)
        ) {
          console.log(
            "[DashboardStore] Mantendo board ativo existente:",
            state.activeBoardId
          );
          // Atualizar os dados do board se necessário
          const currentBoard = boards.find((b) => b.id === state.activeBoardId);
          if (
            currentBoard &&
            (!state.activeBoard || !state.activeBoard.lists)
          ) {
            console.log("[DashboardStore] Atualizando dados do board ativo");
            set({ activeBoard: currentBoard });
          }
          return;
        }

        // Se tem último board usado e ele ainda existe, usar ele
        if (
          state.lastUsedBoardId &&
          boards.some((b) => b.id === state.lastUsedBoardId)
        ) {
          console.log(
            "[DashboardStore] Selecionando último board usado:",
            state.lastUsedBoardId
          );
          const board =
            boards.find((b) => b.id === state.lastUsedBoardId) || null;
          set({
            activeBoardId: state.lastUsedBoardId,
            activeBoard: board,
          });
          return;
        }

        // Caso contrário, usar o primeiro board
        console.log(
          "[DashboardStore] Selecionando primeiro board:",
          boards[0].name
        );
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
