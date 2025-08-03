import React from "react";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "../../../utils/formatters";
import {
  OutputTransactionDTO,
  TransactionState,
} from "../../../types/transaction";

interface TransactionDetailModalProps {
  transaction: OutputTransactionDTO;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "CANCELED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Concluída";
      case "PENDING":
        return "Pendente";
      case "CANCELED":
        return "Cancelada";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                {transaction.type === "INCOME" ? (
                  <ArrowUpCircle className="w-8 h-8 text-green-500 mr-4" />
                ) : (
                  <ArrowDownCircle className="w-8 h-8 text-red-500 mr-4" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {transaction.description}
                  </h2>
                  <p
                    className={`text-xl font-semibold mt-2 ${
                      transaction.type === "INCOME"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}{" "}
                    {formatCurrency(Math.abs(transaction.value))}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Data
                </div>
                <div className="text-gray-900 dark:text-gray-100">
                  {format(new Date(transaction.date), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tipo
                </div>
                <div className="text-gray-900 dark:text-gray-100 capitalize">
                  {transaction.type === "INCOME" ? "Entrada" : "Saída"}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </div>
                <div className="text-gray-900 dark:text-gray-100">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {getStatusText(transaction.status)}
                  </span>
                </div>
              </div>

              {transaction.category && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Categoria
                  </div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {transaction.category}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
