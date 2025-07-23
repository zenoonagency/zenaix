import React from "react";
import { X } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportOptions: {
    kanbanValues: boolean;
    contractStatus: boolean;
    financialData: boolean;
    sellerRanking: boolean;
  };
  onExportOptionsChange: (options: any) => void;
  onExport: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  exportOptions,
  onExportOptionsChange,
  onExport,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] !mt-0">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-96 shadow-xl m-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Exportar Relatório
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 py-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.kanbanValues}
              onChange={(e) =>
                onExportOptionsChange({
                  ...exportOptions,
                  kanbanValues: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Valores do Kanban
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.contractStatus}
              onChange={(e) =>
                onExportOptionsChange({
                  ...exportOptions,
                  contractStatus: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Status dos Contratos
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.financialData}
              onChange={(e) =>
                onExportOptionsChange({
                  ...exportOptions,
                  financialData: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Dados Financeiros
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.sellerRanking}
              onChange={(e) =>
                onExportOptionsChange({
                  ...exportOptions,
                  sellerRanking: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Ranking de Vendedores
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-dark-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-50 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onExport();
              onClose();
            }}
            className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
