import React from "react";
import { useBoardStore } from "../../../store/boardStore";
import { List } from "../../types/list";

interface CompletedListSelectorProps {
  boardId: string;
  lists: List[];
}

export function CompletedListSelector({
  boardId,
  lists,
}: CompletedListSelectorProps) {
  // TODO: implementar integração real com a store de boards se necessário
  const completedListId = null;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const listId = event.target.value;
    // setCompletedList(boardId, listId); // This line was removed as per the edit hint
    // Força a atualização do estado do Kanban
    useBoardStore.setState((state) => ({
      ...state,
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...board, completedListId: listId } : board
      ),
    }));
  };

  return (
    <div className="flex items-center gap-2 p-4">
      <label className="text-sm text-gray-600 dark:text-gray-400">
        Lista de Concluídos:
      </label>
      <select
        value={completedListId || ""}
        onChange={handleChange}
        className="p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
      >
        <option value="">Selecione uma lista</option>
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.title}
          </option>
        ))}
      </select>
    </div>
  );
}
