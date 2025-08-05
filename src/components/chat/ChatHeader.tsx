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
        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center p-2">
          <img src="/assets/images/LOGO-DARK-SMALL.webp" alt="" />
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
