import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';

interface List {
  id: string;
  title: string;
}

interface CompletedListSelectorModalProps {
  lists: List[];
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CompletedListSelectorModal({ 
  lists = [],
  selectedListId, 
  onSelectList, 
  isOpen, 
  onClose 
}: CompletedListSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const filteredLists = (lists || []).filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectList = (listId: string) => {
    onSelectList(listId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Selecionar Lista Concluída
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar listas..."
            className={`w-full px-4 py-2 pl-10 text-base rounded-lg border ${
              isDark 
                ? 'bg-dark-700 border-dark-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {filteredLists.length > 0 ? (
            <div className="space-y-2">
              {filteredLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleSelectList(list.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    list.id === selectedListId
                      ? 'bg-[#7f00ff]/10 text-[#7f00ff]'
                      : `${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'} ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`
                  }`}
                >
                  {list.title}
                </button>
              ))}
            </div>
          ) : (
            <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhuma lista encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 