import React from 'react';
import { List } from '../../Kanban/types';

interface KanbanPreviewProps {
  lists: List[];
}

export function KanbanPreview({ lists }: KanbanPreviewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {lists.map((list) => (
        <div key={list.id} className="flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{list.title}</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {list.cards.length} {list.cards.length === 1 ? 'card' : 'cards'}
          </div>
        </div>
      ))}
    </div>
  );
}