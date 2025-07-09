import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useFinancialStore } from '../store/financialStore';
import { CustomFieldType } from '../../../types/customFields';
import { generateId } from '../../../utils/generateId';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomFieldInput {
  id: string;
  name: string;
  type: CustomFieldType;
  value: string;
}

const fieldTypes: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'file', label: 'Arquivo' },
];

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const addTransaction = useFinancialStore((state) => state.addTransaction);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [associatedExpense, setAssociatedExpense] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldInput[]>([]);

  if (!isOpen) return null;

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: generateId(),
        name: '',
        type: 'text',
        value: '',
      },
    ]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((field) => field.id !== id));
  };

  const handleUpdateCustomField = (
    id: string,
    key: keyof CustomFieldInput,
    value: string
  ) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const renderFieldInput = (field: CustomFieldInput) => {
    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            value={field.value}
            onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={field.value}
            onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
          />
        );
      case 'boolean':
        return (
          <select
            value={field.value}
            onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Selecione</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        );
      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUpdateCustomField(field.id, 'value', file.name);
              }
            }}
            className="flex-1"
          />
        );
      default:
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
          />
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const processedCustomFields = customFields.reduce((acc, field) => {
      if (field.name.trim()) {
        acc[field.name] = {
          type: field.type,
          value: field.value,
        };
      }
      return acc;
    }, {} as Record<string, { type: CustomFieldType; value: string }>);

    addTransaction({
      id: generateId(),
      type,
      amount: parseFloat(amount),
      description,
      date,
      associatedExpense: associatedExpense ? parseFloat(associatedExpense) : undefined,
      customFields: processedCustomFields,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nova Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Transação
            </label>
            <div className="flex gap-4">
              <label className="flex-1">
                <input
                  type="radio"
                  className="sr-only"
                  checked={type === 'income'}
                  onChange={() => setType('income')}
                />
                <div className={`text-center px-4 py-2 rounded-md cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#7f00ff] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  Entrada
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  className="sr-only"
                  checked={type === 'expense'}
                  onChange={() => setType('expense')}
                />
                <div className={`text-center px-4 py-2 rounded-md cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#7f00ff] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  Saída
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#7f00ff] focus:ring focus:ring-[#7f00ff]/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#7f00ff] focus:ring focus:ring-[#7f00ff]/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#7f00ff] focus:ring focus:ring-[#7f00ff]/20"
              required
            />
          </div>

          {type === 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Despesa Associada (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={associatedExpense}
                onChange={(e) => setAssociatedExpense(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#7f00ff] focus:ring focus:ring-[#7f00ff]/20"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Campos Personalizados
              </label>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-[#7f00ff] hover:text-[#7f00ff]/80 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Adicionar Campo
              </button>
            </div>

            {customFields.map((field) => (
              <div key={field.id} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Nome do Campo"
                  value={field.name}
                  onChange={(e) => handleUpdateCustomField(field.id, 'name', e.target.value)}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#7f00ff] focus:ring focus:ring-[#7f00ff]/20"
                />
                <select
                  value={field.type}
                  onChange={(e) => handleUpdateCustomField(field.id, 'type', e.target.value as CustomFieldType)}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#7f00ff] focus:ring focus:ring-[#7f00ff]/20"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {renderFieldInput(field)}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(field.id)}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}