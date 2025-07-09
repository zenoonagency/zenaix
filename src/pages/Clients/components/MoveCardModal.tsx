import React from 'react';
import { X } from 'lucide-react';
import { useKanbanStore } from '../store/kanbanStore';
import { useThemeStore } from '../../../store/themeStore';
import { useToast } from '../../../hooks/useToast';

interface MoveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  currentListId: string;
  boardId: string;
}

export function MoveCardModal({ isOpen, onClose, cardId, currentListId, boardId }: MoveCardModalProps) {
  const { theme } = useThemeStore();
  const { boards, moveCard } = useKanbanStore();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const currentBoard = boards.find(b => b.id === boardId);
  
  const handleMove = (targetListId: string) => {
    if (targetListId === currentListId) return;
    
    moveCard(cardId, currentListId, targetListId);
    showToast('Card movido com sucesso!', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-dark-800 rounded-lg w-full max-w-md p-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Mover Card
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {currentBoard?.lists.map((list) => (
            <button
  key={list.id}
  onClick={() => handleMove(list.id)}
  disabled={list.id === currentListId}
  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
    list.id === currentListId
      ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-dark-400 dark:text-gray-600'
      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white'
  }`}
>
  {list.title}
</button>

          ))}
        </div>
      </div>
    </div>
  );
} 