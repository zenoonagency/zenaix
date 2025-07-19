import React, { useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";

interface BoardSelectorProps {
  boards: Array<{ id: string; name: string }>;
  activeBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard?: () => void;
}

export function BoardSelector({
  boards = [],
  activeBoardId,
  onSelectBoard,
  isOpen,
  onClose,
  onCreateBoard,
}: BoardSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const filteredBoards = (boards || []).filter((board) =>
    board?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  const handleSelectBoard = (boardId: string) => {
    onSelectBoard(boardId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div
        className={`w-full max-w-md p-6 rounded-lg shadow-xl m-4 ${
          isDark ? "bg-dark-800" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
          <h3
            className={`text-lg font-medium ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Selecionar Quadro
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar quadros..."
            className={`w-full px-4 py-2 pl-10 text-base rounded-lg border ${
              isDark
                ? "bg-dark-700 border-dark-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {boards.length === 0 ? (
            <div
              className={`text-center py-8 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <div className="text-2xl font-semibold mb-2">
                Nenhum quadro encontrado
              </div>
              <div className="mb-4 text-base">
                Crie seu primeiro quadro para começar a organizar suas tarefas!
              </div>
              {onCreateBoard && (
                <button
                  onClick={onCreateBoard}
                  className="flex items-center justify-center w-full mt-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Novo Quadro
                </button>
              )}
            </div>
          ) : filteredBoards.length > 0 ? (
            <div className="space-y-2">
              {filteredBoards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleSelectBoard(board.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    board.id === activeBoardId
                      ? "bg-[#7f00ff]/10 text-[#7f00ff]"
                      : `${
                          isDark ? "hover:bg-dark-700" : "hover:bg-gray-100"
                        } ${isDark ? "text-gray-200" : "text-gray-700"}`
                  }`}
                >
                  {board.name}
                </button>
              ))}
            </div>
          ) : searchTerm ? (
            <div
              className={`text-center py-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Nenhum quadro encontrado com "{searchTerm}"
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
