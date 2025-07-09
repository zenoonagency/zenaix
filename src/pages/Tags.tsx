import React from 'react';
import { TagList } from '../components/tags/TagList';

export function Tags() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marcadores</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie seus marcadores e categorias</p>
      </div>
      
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <TagList />
      </div>
    </div>
  );
} 