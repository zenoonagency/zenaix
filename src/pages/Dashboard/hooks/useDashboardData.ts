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
  } = useBoardStore();
  const {
    activeBoardId: dashboardActiveBoardId,
    activeBoard: dashboardActiveBoard,
    topSellers: dashboardTopSellers,
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

  useEffect(() => {
    if (dashboardActiveBoardId) {
      const needsFullLoad =
        !dashboardActiveBoard ||
        dashboardActiveBoard.id !== dashboardActiveBoardId ||
        !dashboardActiveBoard.lists ||
        dashboardActiveBoard.lists.length === 0;

      if (needsFullLoad && !isDashboardLoadingBoard) {
        dashboardSelectAndLoadBoard(dashboardActiveBoardId);
        return;
      }

      if (
        dashboardActiveBoard?.id === dashboardActiveBoardId &&
        !isDashboardLoadingTopSellers
      ) {
        const { fetchTopSellers } = useDashboardStore.getState();
        fetchTopSellers(dashboardActiveBoardId);
      }
    } else {
      const store = useDashboardStore.getState();
      if (store.topSellers.data.length > 0) {
        store.topSellers = { data: [] };
      }
    }
  }, [dashboardActiveBoardId, dashboardActiveBoard?.id]);

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
