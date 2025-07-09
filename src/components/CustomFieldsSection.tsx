import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CustomFieldInput, CustomFieldType } from '../types/customFields';

interface CustomFieldsSectionProps {
  fields: CustomFieldInput[];
  onAddField: () => void;
  onRemoveField: (id: string) => void;
  onUpdateField: (id: string, key: string, value: string) => void;
}

export function CustomFieldsSection({
  fields,
  onAddField,
  onRemoveField,
  onUpdateField,
}: CustomFieldsSectionProps) {
  const fieldTypes: CustomFieldType[] = ['text', 'number', 'date', 'email', 'phone', 'url'];

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={field.name}
              onChange={(e) => onUpdateField(field.id, 'name', e.target.value)}
              placeholder="Nome do campo"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:text-white"
            />
          </div>
          <div className="w-32">
            <select
              value={field.type}
              onChange={(e) => onUpdateField(field.id, 'type', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:text-white"
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={field.value}
              onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
              placeholder="Valor"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:text-white"
            />
          </div>
          <button
            onClick={() => onRemoveField(field.id)}
            className="p-2 text-red-500 hover:text-red-600 focus:outline-none"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
      <button
        onClick={onAddField}
        className="flex items-center px-4 py-2 text-[#7f00ff] hover:bg-[#7f00ff]/10 rounded-md transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Adicionar Campo
      </button>
    </div>
  );
}