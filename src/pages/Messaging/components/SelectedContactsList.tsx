import React from 'react';
import { X } from 'lucide-react';
import { Contact } from '../types';

interface SelectedContactsListProps {
  contacts: Contact[];
  onRemove: (contactId: string) => void;
}

export function SelectedContactsList({ contacts, onRemove }: SelectedContactsListProps) {
  if (contacts.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum contato selecionado para disparo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Contatos para Disparo ({contacts.length})
      </h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700/50 rounded-md"
          >
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {contact.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {contact.phone}
              </p>
            </div>
            <button
              onClick={() => onRemove(contact.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}