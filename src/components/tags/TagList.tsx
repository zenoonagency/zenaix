import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useTagStore, Tag } from '../../store/tagStore';
import { TagModal } from './TagModal';

export function TagList() {
  const { tags, addTag, updateTag, deleteTag } = useTagStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setShowModal(true);
  };

  const handleSave = (tagData: Omit<Tag, 'id'>) => {
    if (editingTag) {
      updateTag(editingTag.id, tagData);
      setEditingTag(null);
    } else {
      addTag(tagData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Marcadores</h3>
        <button
          onClick={() => {
            setEditingTag(null);
            setShowModal(true);
          }}
          className="text-[#7f00ff] hover:text-[#7f00ff]/80 flex items-center text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </button>
      </div>

      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {tag.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEdit(tag)}
                className="text-gray-400 hover:text-[#7f00ff]"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteTag(tag.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TagModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingTag(null);
          }}
          onSave={handleSave}
          tag={editingTag || undefined}
        />
      )}
    </div>
  );
}