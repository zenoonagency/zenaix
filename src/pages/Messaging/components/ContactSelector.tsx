import React, { useState } from 'react';
import { Tag, Search, CheckSquare } from 'lucide-react';
import { useTagStore } from '../../../store/tagStore';
import { Contact } from '../types';

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  onSelectAll: () => void;
  onRemoveAll: () => void;
}

export function ContactSelector({
  contacts,
  selectedContacts,
  onSelectContact,
  selectedTagIds,
  onTagsChange,
  onSelectAll,
  onRemoveAll,
}: ContactSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { tags } = useTagStore();

  const handleTagClick = (tagId: string) => {
    const newSelectedTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    onTagsChange(newSelectedTags);
  };

  const filteredContacts = contacts.filter(contact => {
    if (!contact) return false;
    
    const matchesSearch = 
      (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.phone && contact.phone.includes(searchTerm));
    
    const matchesTags = selectedTagIds.length === 0 || 
      (contact.tagIds && Array.isArray(contact.tagIds) && contact.tagIds.some(tagId => selectedTagIds.includes(tagId)));
    
    return matchesSearch && matchesTags;
  });

  const allSelected = filteredContacts.length > 0 && 
    filteredContacts.every(contact => selectedContacts.includes(contact.id));

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selecionar Contatos
          </h3>
          <button
            onClick={allSelected ? onRemoveAll : onSelectAll}
            className="flex items-center text-sm text-[#7f00ff] hover:text-[#7f00ff]/80"
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar contatos..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md leading-5 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-opacity-100'
                  : 'bg-opacity-20 hover:bg-opacity-30'
              }`}
              style={{
                backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined,
                borderColor: tag.color,
                borderWidth: '1px',
                color: selectedTagIds.includes(tag.id) ? '#fff' : tag.color,
              }}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-dark-700 max-h-[400px] overflow-y-auto">
        {filteredContacts.map(contact => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 cursor-pointer"
            onClick={() => onSelectContact(contact.id)}
          >
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {contact.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {contact.phone}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {contact.tagIds && Array.isArray(contact.tagIds) ? contact.tagIds.map(tagId => {
                  if (!tagId) return null;
                  const tag = tags && tags.find(t => t && t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        border: `1px solid ${tag.color}`,
                      }}
                    >
                      {tag.name}
                    </span>
                  );
                }) : null}
              </div>
            </div>
            <input
              type="checkbox"
              checked={selectedContacts.includes(contact.id)}
              onChange={() => onSelectContact(contact.id)}
              className="h-5 w-5 text-[#7f00ff] focus:ring-[#7f00ff] border-gray-300 dark:border-dark-600 rounded cursor-pointer"
              onClick={e => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}