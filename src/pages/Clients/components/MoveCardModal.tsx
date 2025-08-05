import React from "react";
import { X } from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";

interface MoveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetListId: string) => void;
  lists: { id: string; title: string }[];
  currentListId: string;
  loading?: boolean;
}

export const MoveCardModal: React.FC<MoveCardModalProps> = ({
  isOpen,
  onClose,
  onMove,
  lists,
  currentListId,
  loading = false,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center !mt-0">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative  w-full max-w-xl p-6 rounded-lg shadow-lg ${
          isDark ? "bg-[#1e1f25] text-gray-100" : "bg-white text-gray-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mover para Lista</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        {loading && (
          <div className="flex justify-center items-center py-4">
            <span className="animate-spin w-8 h-8 border-4 border-[#7f00ff] border-t-transparent rounded-full"></span>
          </div>
        )}
        <div className="flex flex-col space-y-2 max-h-96 overflow-y-auto mt-2">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() =>
                !loading && list.id !== currentListId && onMove(list.id)
              }
              disabled={list.id === currentListId || loading}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors border-2 ${
                list.id === currentListId
                  ? "border-[#7f00ff] bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-dark-400 dark:text-gray-600"
                  : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
              } ${loading ? "opacity-60" : ""}`}
              style={{ fontSize: 16, fontWeight: 400 }}
            >
              {list.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
