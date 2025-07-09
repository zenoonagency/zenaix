import React, { useEffect } from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import { useTagStore } from '../../../store/tagStore';

interface TagFilterProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTags = [], onChange }: TagFilterProps) {
  const { tags = [] } = useTagStore() || {};
  
  const safeTags = Array.isArray(tags) ? tags : [];
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  // Log para diagnóstico
  useEffect(() => {
    console.log("TagFilter - Tags disponíveis:", safeTags.length);
    console.log("TagFilter - Tags selecionadas:", safeSelectedTags.length);
    
    if (safeTags.length > 0) {
      console.log("TagFilter - Amostra de tags:", safeTags.slice(0, 3).map(t => `${t.name} (${t.id})`));
    }
  }, [safeTags, safeSelectedTags]);

  const handleTagClick = (tagId: string) => {
    if (safeSelectedTags.includes(tagId)) {
      onChange(safeSelectedTags.filter(id => id !== tagId));
    } else {
      onChange([...safeSelectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <TagIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por Marcadores ({safeSelectedTags.length > 0 ? safeSelectedTags.length : 'Nenhum'})
          </h3>
        </div>
        {safeSelectedTags.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar filtros
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {safeTags.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum marcador encontrado</p>
        ) : (
          safeTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                safeSelectedTags.includes(tag.id)
                  ? 'bg-opacity-100'
                  : 'bg-opacity-20 hover:bg-opacity-30'
              }`}
              style={{
                backgroundColor: safeSelectedTags.includes(tag.id) ? tag.color : `${tag.color}20`,
                borderColor: tag.color,
                borderWidth: '1px',
                color: safeSelectedTags.includes(tag.id) ? '#fff' : tag.color,
              }}
            >
              {tag.name}
            </button>
          ))
        )}
      </div>
      {safeTags.length > 0 && safeSelectedTags.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <p>Tags selecionadas: {safeSelectedTags.map(id => {
            const tag = safeTags.find(t => t.id === id);
            return tag ? tag.name : id;
          }).join(', ')}</p>
        </div>
      )}
    </div>
  );
}