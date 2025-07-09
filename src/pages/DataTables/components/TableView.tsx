import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Copy, Trash2, UserPlus } from 'lucide-react';
import { DataTable } from '../../../types/dataTables';
import { useDataTablesStore } from '../../../store/dataTablesStore';
import { CreateContactModal } from './CreateContactModal';
import { useCustomModal } from '../../../components/CustomModal';

interface TableViewProps {
  table: DataTable;
}

export function TableView({ table }: TableViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<Record<string, any>[] | null>(null);
  const { updateTable, deleteRows } = useDataTablesStore();
  const { modal, customAlert, customConfirm } = useCustomModal();

  const handleSelectRow = (index: number) => {
    setSelectedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.keys(selectedRows).length === table.data.length;
    if (allSelected) {
      setSelectedRows({});
    } else {
      const newSelected: Record<string, boolean> = {};
      table.data.forEach((_, index) => {
        newSelected[index] = true;
      });
      setSelectedRows(newSelected);
    }
  };

  const handleCreateContact = () => {
    const selectedRowsData = Object.entries(selectedRows)
      .filter(([_, selected]) => selected)
      .map(([index]) => table.data[parseInt(index)]);

    if (selectedRowsData.length === 0) {
      alert('Por favor, selecione pelo menos uma linha');
      return;
    }

    setSelectedRowData(selectedRowsData);
    setShowCreateContactModal(true);
  };

  const handleExportSelected = async () => {
    if (selectedIndices.length === 0) {
      await customAlert('Atenção', 'Por favor, selecione pelo menos uma linha');
      return;
    }
    // ... rest of the function
  };

  const handleDeleteSelected = async () => {
    if (selectedIndices.length === 0) {
      await customAlert('Atenção', 'Por favor, selecione pelo menos uma linha');
      return;
    }

    const confirmed = await customConfirm(
      'Excluir linhas',
      `Tem certeza que deseja excluir ${selectedIndices.length} linha(s)?`
    );

    if (confirmed) {
      // ... rest of the function
    }
  };

  const handlePrintSelected = async () => {
    if (selectedIndices.length === 0) {
      await customAlert('Atenção', 'Por favor, selecione pelo menos uma linha');
      return;
    }
    // ... rest of the function
  };

  const handleDuplicateRows = () => {
    const selectedRowsData = Object.entries(selectedRows)
      .filter(([_, selected]) => selected)
      .map(([index]) => ({ ...table.data[parseInt(index)] }));

    if (selectedRowsData.length === 0) {
      alert('Por favor, selecione pelo menos uma linha');
      return;
    }

    const newData = [...table.data, ...selectedRowsData];
    updateTable(table.id, { data: newData });
    setSelectedRows({});
  };

  const tableInstance = useReactTable({
    data: table.data,
    columns: table.columns.map(col => ({
      accessorKey: col.name,
      header: col.name,
    })),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {Object.keys(selectedRows).length === table.data.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          {Object.keys(selectedRows).length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateContact}
                className="flex items-center px-3 py-1.5 text-sm bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Contato
              </button>
              <button
                onClick={handleDuplicateRows}
                className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Object.keys(selectedRows).length === table.data.length}
                  onChange={handleSelectAll}
                  className="rounded text-[#7f00ff] focus:ring-[#7f00ff]"
                />
              </th>
              {tableInstance.getHeaderGroups().map(headerGroup => (
                headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tableInstance.getRowModel().rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={!!selectedRows[index]}
                    onChange={() => handleSelectRow(index)}
                    className="rounded text-[#7f00ff] focus:ring-[#7f00ff]"
                  />
                </td>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => tableInstance.previousPage()}
            disabled={!tableInstance.getCanPreviousPage()}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => tableInstance.nextPage()}
            disabled={!tableInstance.getCanNextPage()}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Página {tableInstance.getState().pagination.pageIndex + 1} de{' '}
            {tableInstance.getPageCount()}
          </span>
        </div>
      </div>

      {showCreateContactModal && selectedRowData && (
        <CreateContactModal
          isOpen={showCreateContactModal}
          onClose={() => {
            setShowCreateContactModal(false);
            setSelectedRowData(null);
          }}
          rowsData={selectedRowData}
          columns={table.columns}
        />
      )}
      {modal}
    </div>
  );
}