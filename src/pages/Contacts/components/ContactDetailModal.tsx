import React from 'react';
import { X, Phone, Tag as TagIcon } from 'lucide-react';
import { Contact } from '../types';
import { useTagStore } from '../../../store/tagStore';

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
}

export function ContactDetailModal({ contact, onClose }: ContactDetailModalProps) {
  const { tags } = useTagStore();
  const contactTags = tags.filter(tag => contact.tagIds.includes(tag.id));

  const renderCustomFieldValue = (type: string, value: string) => {
    switch (type) {
      case 'boolean':
        return value === 'true' ? 'Sim' : 'Não';
      case 'file':
        return (
          <a href="#" className="text-[#7f00ff] hover:underline">
            {value}
          </a>
        );
      default:
        return value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contact.name}
            </h2>
            <div className="flex items-center mt-2 text-gray-600 dark:text-gray-400">
              <Phone className="w-5 h-5 mr-2" />
              {contact.phone}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {contactTags.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <TagIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Marcadores
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {contactTags.map(tag => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      border: `1px solid ${tag.color}`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contact.customFields && Object.entries(contact.customFields).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Campos Personalizados
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(contact.customFields).map(([name, field]) => (
                  <div
                    key={name}
                    className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg"
                  >
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {name}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {renderCustomFieldValue(field.type, field.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Criado em: {new Date(contact.createdAt).toLocaleDateString()}</p>
            <p>Última atualização: {new Date(contact.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}