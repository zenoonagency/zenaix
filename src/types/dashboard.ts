import { Board, TopSellersResponse } from "./board";

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
