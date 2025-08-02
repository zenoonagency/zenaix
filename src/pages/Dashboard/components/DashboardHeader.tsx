import React from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { BoardSelector } from "../../Clients/components/BoardSelector";

interface DashboardHeaderProps {
  dashboardActiveBoard: any;
  dashboardActiveBoardId: string | null;
  boards: any[];
  onSelectBoard: (boardId: string) => void;
  onShowBoardSelector: () => void;
  onShowExportModal: () => void;
  showBoardSelector: boolean;
  onCloseBoardSelector: () => void;
  isLoadingBoard?: boolean;
}

export function DashboardHeader({
  dashboardActiveBoard,
  dashboardActiveBoardId,
  boards,
  onSelectBoard,
  onShowBoardSelector,
  onShowExportModal,
  showBoardSelector,
  onCloseBoardSelector,
  isLoadingBoard = false,
}: DashboardHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 border border-purple-500 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h4v4H4V6zm6 0h4v4h-4V6zm6 0h4v4h-4V6zM4 14h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-purple-600">Dashboards</h1>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={onShowBoardSelector}
            disabled={isLoadingBoard}
            className="flex items-center h-[40px] gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingBoard ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Carregando...</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">
                  {dashboardActiveBoard ? (
                    dashboardActiveBoard.name
                  ) : (
                    <span className="inline-block w-32 h-5 bg-gray-200 rounded animate-pulse" />
                  )}
                </span>
                <ChevronDown className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={onShowExportModal}
            className="flex items-center h-[40px] gap-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar Relatório
          </button>
        </div>
      </div>

      <BoardSelector
        boards={boards}
        activeBoardId={dashboardActiveBoardId}
        onSelectBoard={onSelectBoard}
        isOpen={showBoardSelector}
        onClose={onCloseBoardSelector}
      />
    </>
  );
}
