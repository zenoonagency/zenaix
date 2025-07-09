import React, { useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { useDataTablesStore } from '../../../store/dataTablesStore';
import { DataColumn, DataColumnType } from '../../../types/dataTables';
import { normalizeText, normalizeTableData } from '../../../utils/textNormalization';
import { generateId } from '../../../utils/generateId';
import Papa from 'papaparse';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const columnTypes: { value: DataColumnType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'select', label: 'Seleção' },
];

export function TableModal({ isOpen, onClose }: TableModalProps) {
  const { addTable } = useDataTablesStore();
  const [name, setName] = useState('');
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [importedData, setImportedData] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        id: generateId(),
        name: '',
        type: 'text',
      },
    ]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter((col) => col.id !== id));
  };

  const handleUpdateColumn = (
    id: string,
    key: keyof DataColumn,
    value: string
  ) => {
    setColumns(
      columns.map((col) =>
        col.id === id ? { ...col, [key]: value } : col
      )
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      encoding: 'ISO-8859-1', // Handle special characters
      complete: (results) => {
        if (results.data && Array.isArray(results.data)) {
          // Create columns from headers with normalized names
          if (results.meta.fields) {
            const newColumns: DataColumn[] = results.meta.fields.map((field) => ({
              id: generateId(),
              name: normalizeText(field),
              type: 'text',
            }));
            setColumns(newColumns);
          }

          // Store normalized imported data
          const normalizedData = normalizeTableData(results.data as Record<string, any>[]);
          setImportedData(normalizedData);
        }
      },
      error: (error) => {
        setError(`Erro ao importar arquivo: ${error.message}`);
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Por favor, insira um nome para a tabela');
      return;
    }

    if (columns.length === 0) {
      setError('Por favor, adicione pelo menos uma coluna');
      return;
    }

    if (columns.some((col) => !col.name.trim())) {
      setError('Todas as colunas precisam ter um nome');
      return;
    }

    try {
      // Normalize column names before adding the table
      const normalizedColumns = columns.map(col => ({
        ...col,
        name: normalizeText(col.name)
      }));

      addTable({
        name: normalizeText(name),
        columns: normalizedColumns,
        data: importedData,
      });
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao criar tabela. Por favor, tente novamente.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Nova Tabela
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Tabela
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Colunas
                </label>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="text-[#7f00ff] hover:text-[#7f00ff]/80 flex items-center text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Coluna
                </button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {columns.map((column) => (
                  <div key={column.id} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Coluna"
                      value={column.name}
                      onChange={(e) =>
                        handleUpdateColumn(column.id, 'name', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
                    />
                    <select
                      value={column.type}
                      onChange={(e) =>
                        handleUpdateColumn(
                          column.id,
                          'type',
                          e.target.value as DataColumnType
                        )
                      }
                      className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-gray-700 dark:text-gray-100"
                    >
                      {columnTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(column.id)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-center">
                <label className="relative cursor-pointer bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Importar CSV/Excel
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90"
            >
              Criar Tabela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}