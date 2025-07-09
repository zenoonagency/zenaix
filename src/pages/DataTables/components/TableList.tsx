import React from 'react';
import { Table2, Trash2 } from 'lucide-react';
import { useDataTablesStore } from '../../../store/dataTablesStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCustomModal } from '../../../components/CustomModal';

export function TableList() {
  const { tables, activeTableId, setActiveTable, deleteTable } = useDataTablesStore();
  const { modal, customConfirm } = useCustomModal();

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm(
      'Excluir tabela',
      'Tem certeza que deseja excluir esta tabela?'
    );
    
    if (confirmed) {
      try {
        await api.delete(`/tables/${id}`);
        mutate('/tables');
        showToast('success', 'Tabela excluída com sucesso!');
      } catch (error) {
        showToast('error', 'Erro ao excluir tabela');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Suas Tabelas
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-1">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
              activeTableId === table.id ? 'bg-gray-50 dark:bg-gray-700/50' : ''
            }`}
            onClick={() => setActiveTable(table.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Table2 className="w-5 h-5 text-[#7f00ff] mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {table.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(table.updatedAt), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(table.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {table.data.length} registros • {table.columns.length} colunas
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Nenhuma tabela criada
          </div>
        )}
      </div>
      {modal}
    </div>
  );
}