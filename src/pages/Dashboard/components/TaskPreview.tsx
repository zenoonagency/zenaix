import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Task } from '../../Tasks/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskPreviewProps {
  tasks: Task[];
}

export function TaskPreview({ tasks }: TaskPreviewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No tasks available. Create your first task!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {task.completed ? (
              <CheckSquare className="w-5 h-5 text-[#7f00ff]" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
            <div>
              <p className={`font-medium ${
                task.completed 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-800 dark:text-gray-200'
              }`}>
                {task.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due {format(new Date(task.dueDate), "d 'de' MMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}