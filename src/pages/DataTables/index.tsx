import React, { useState } from 'react';
import { Plus, Table, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableList } from './components/TableList';
import { TableView } from './components/TableView';
import { TableModal } from './components/TableModal';
import { useDataTablesStore } from '../../store/dataTablesStore';

export function DataTables() {
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { tables, activeTableId } = useDataTablesStore();
  const activeTable = tables.find(table => table.id === activeTableId);

  return (
    <div className="p-6 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Tabela de Dados
          </h1>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            {showSidebar ? (
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Tabela
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {showSidebar && (
          <div className="w-80 flex-shrink-0">
            <TableList />
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {activeTable ? (
            <TableView table={activeTable} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
              <Table className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma tabela selecionada
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Selecione uma tabela existente ou crie uma nova para começar
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TableModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}