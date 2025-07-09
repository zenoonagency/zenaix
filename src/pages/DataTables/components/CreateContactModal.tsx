// src/pages/DataTables/components/CreateContactModal.tsx
import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useContactsStore } from '../../../store/contactsStore';
import { useTagStore } from '../../../store/tagStore';
import { DataColumn } from '../../../types/dataTables';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowsData: Record<string, any>[];
  columns: DataColumn[];
}

export function CreateContactModal({ isOpen, onClose, rowsData, columns }: CreateContactModalProps) {
  const navigate = useNavigate();
  const { addContact } = useContactsStore();
  const { tags } = useTagStore();
  const { showToast } = useToast();
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>({
    name: '',
    phone: '',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleFieldSelect = (field: string, mappedField: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: mappedField
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateContacts = () => {
    if (!selectedFields.name || !selectedFields.phone) {
      showToast('Por favor, selecione os campos de nome e telefone', 'error');
      return;
    }

    let createdCount = 0;
    let errorCount = 0;

    rowsData.forEach(rowData => {
      try {
        const name = rowData[selectedFields.name];
        const phone = rowData[selectedFields.phone];

        if (!name || !phone) {
          errorCount++;
          return;
        }

        const normalizedPhone = phone.toString().replace(/\D/g, '');
        const contactData = {
          name: name.toString().trim(),
          phone: normalizedPhone,
          tagIds: selectedTagIds,
          customFields: {},
        };

        addContact(contactData);
        createdCount++;
      } catch (error) {
        errorCount++;
        console.error('Erro ao criar contato:', error);
      }
    });

    if (createdCount > 0) {
      showToast(
        `${createdCount} contato${createdCount > 1 ? 's' : ''} criado${createdCount > 1 ? 's' : ''} com sucesso${errorCount > 0 ? `. ${errorCount} falha${errorCount > 1 ? 's' : ''}.` : '!'}`,
        'success'
      );
      onClose();
      navigate('/dashboard/contacts'); // Changed from /messaging to /contacts
    } else {
      showToast('Não foi possível criar nenhum contato. Verifique os dados.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Criar {rowsData.length} Contato{rowsData.length > 1 ? 's' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Campo para Nome *
            </label>
            <select
              value={selectedFields.name}
              onChange={(e) => handleFieldSelect('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
              required
            >
              <option value="">Selecione o campo</option>
              {columns.map((column) => (
                <option key={column.id} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Campo para Telefone *
            </label>
            <select
              value={selectedFields.phone}
              onChange={(e) => handleFieldSelect('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
              required
            >
              <option value="">Selecione o campo</option>
              {columns.map((column) => (
                <option key={column.id} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4 mr-1" />
              Marcadores (opcional)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateContacts}
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90"
            >
              Criar Contatos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
