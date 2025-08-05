import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useAuthStore } from "../../../store/authStore";
import { useDashboardStore } from "../../../store/dashboardStore";
import { useDashboardTransactionStore } from "../../../store/dashboardTransactionStore";
import { useBoardStore } from "../../../store/boardStore";
import { useCalendarStore } from "../../../store/calendarStore";

export function useDashboardData() {
  const { token, user } = useAuthStore();
  const {
    boards,
    fetchAllBoards,
    isLoading: isBoardsLoading,
    topSellers: dashboardTopSellers,
  } = useBoardStore();
  const {
    activeBoardId: dashboardActiveBoardId,
    activeBoard: dashboardActiveBoard,
    isLoadingBoard: isDashboardLoadingBoard,
    isLoadingTopSellers: isDashboardLoadingTopSellers,
    selectAndLoadBoard: dashboardSelectAndLoadBoard,
    selectInitialBoard: dashboardSelectInitialBoard,
  } = useDashboardStore();
  const {
    transactions: dashboardTransactions,
    summary: dashboardSummary,
    isLoading: isDashboardLoading,
    fetchDashboardTransactions,
    fetchDashboardSummary,
  } = useDashboardTransactionStore();
  const { events: calendarEvents, fetchEvents } = useCalendarStore();

  const [initialTransactionsFetched, setInitialTransactionsFetched] =
    useState(false);

  const dashboardTransactionsData = dashboardTransactions || [];

  useEffect(() => {
    if (
      token &&
      user?.organization_id &&
      boards.length === 0 &&
      !isBoardsLoading
    ) {
      fetchAllBoards(token, user.organization_id);
    }
  }, [token, user?.organization_id]);

  useEffect(() => {
    if (boards.length > 0) {
      dashboardSelectInitialBoard(boards);
    }
  }, [boards, dashboardSelectInitialBoard]);

  // Função utilitária para cache localStorage
  function getTopSellersCache(boardId: string) {
    try {
      const cache = localStorage.getItem(`topsellers_${boardId}`);
      if (cache) return JSON.parse(cache);
    } catch {}
    return null;
  }
  function setTopSellersCache(boardId: string, data: any) {
    try {
      localStorage.setItem(`topsellers_${boardId}`, JSON.stringify(data));
    } catch {}
  }

  useEffect(() => {
    if (
      dashboardActiveBoardId &&
      dashboardActiveBoard?.id === dashboardActiveBoardId
    ) {
      // Se já tem top sellers no store, não faz fetch
      if (dashboardTopSellers?.data?.length > 0) return;
      // Tenta cache local
      const cache = getTopSellersCache(dashboardActiveBoardId);
      if (cache && Array.isArray(cache.data) && cache.data.length > 0) {
        useBoardStore.getState().setTopSellers(cache);
        // Busca em background para atualizar
        useBoardStore.getState().fetchTopSellers(dashboardActiveBoardId);
        return;
      }
      // Se não tem cache, busca normalmente
      useBoardStore.getState().fetchTopSellers(dashboardActiveBoardId);
    } else {
      // Limpando top sellers se não tem board
      if (dashboardTopSellers.data.length > 0) {
        useBoardStore.getState().setTopSellers({ data: [] });
      }
    }
  }, [dashboardActiveBoardId, dashboardActiveBoard]);

  useEffect(() => {
    if (token && user?.organization_id) {
      fetchEvents();
    }
  }, [token, user?.organization_id]);

  return {
    boards,
    dashboardActiveBoardId,
    dashboardActiveBoard,
    dashboardTopSellers,
    isDashboardLoadingBoard,
    isDashboardLoadingTopSellers,
    dashboardSelectAndLoadBoard,
    dashboardTransactionsData,
    dashboardSummary,
    isDashboardLoading,
    fetchDashboardTransactions,
    fetchDashboardSummary,
    calendarEvents,
    initialTransactionsFetched,
    setInitialTransactionsFetched,
  };
}
