import { Button } from '@/components/ui/button';
import { X, Minus, Maximize2, Minimize2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import zenaixLogo from '@/assets/zenaix-logo.png';

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
  isMaximized = false
}: ChatHeaderProps) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border-b border-chat-border bg-chat-surface",
        "cursor-move select-none",
        isDragging && "cursor-grabbing"
      )}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center p-1">
          <img src={zenaixLogo} alt="Zenaix Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h3 className="font-medium text-sm text-black">Zenaix Assistant</h3>
          <p className="text-xs text-green-400">Online</p>
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
          className="h-8 w-8 p-0 hover:bg-chat-border rounded-full text-gray-400 hover:text-white"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          className="h-8 w-8 p-0 hover:bg-chat-border rounded-full text-gray-400 hover:text-white"
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
          className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full text-gray-400"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};