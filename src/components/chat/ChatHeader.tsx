import { Button } from "../../components/ui/button";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface ChatHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  isMaximized?: boolean;
}

export const ChatHeader = ({
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onMouseDown,
  isDragging,
  isMaximized = false,
}: ChatHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        "cursor-move select-none",
        isDragging && "cursor-grabbing"
      )}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center p-1">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            Zenaix Assistant
          </h3>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Resize/Maximize Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (isMaximized && onRestore) {
              onRestore();
            } else if (onMaximize) {
              onMaximize();
            }
          }}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          {isMaximized ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Minimizar"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-full text-gray-400"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
