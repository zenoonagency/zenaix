import React from "react";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "../../../utils/formatters";
import { CustomFieldsDisplay } from "../../../components/CustomFieldsDisplay";
import { Transaction } from "../types";

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  return (
    <div className="modal-overlay">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-lg p-6 border border-gray-200 dark:border-dark-700">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            {transaction.type === "income" ? (
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
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}{" "}
                {formatCurrency(Math.abs(transaction.amount))}
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

          {transaction.type === "income" &&
            transaction.associatedExpense !== undefined && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Despesa Associada
                </div>
                <div className="text-red-600 dark:text-red-400 font-medium">
                  {formatCurrency(transaction.associatedExpense)}
                </div>
              </div>
            )}

          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tipo
            </div>
            <div className="text-gray-900 dark:text-gray-100 capitalize">
              {transaction.type === "income" ? "Entrada" : "Saída"}
            </div>
          </div>

          {transaction.customFields &&
            Object.keys(transaction.customFields).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Campos Personalizados
                </h3>
                <CustomFieldsDisplay fields={transaction.customFields} />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
