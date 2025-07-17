import React, { useState, useEffect } from "react";
import { Plus, ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react";
import { useTransactionStore } from "../../../store/transactionStore";
import { useAuthStore } from "../../../store/authStore";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "../../../utils/formatters";

export function TransactionList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
  }));
  const { transactions, fetchAllTransactions, isLoading } =
    useTransactionStore();

  useEffect(() => {
    if (token && organizationId) {
      fetchAllTransactions(token, organizationId);
    }
  }, [token, organizationId, fetchAllTransactions]);

  const filteredTransactions = transactions.filter((transaction) => {
    if (!startDate && !endDate) return true;
    const transactionDate = new Date(transaction.date);
    if (startDate && endDate) {
      return (
        transactionDate >= new Date(startDate) &&
        transactionDate <= new Date(endDate)
      );
    }
    if (startDate) {
      return transactionDate >= new Date(startDate);
    }
    if (endDate) {
      return transactionDate <= new Date(endDate);
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-dark-700 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Transações Recentes
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Transação
          </button>
        </div>

        {/* Date Filter */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-dark-700 dark:text-gray-100"
              placeholder="Data inicial"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff] dark:bg-dark-700 dark:text-gray-100"
              placeholder="Data final"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            onClick={() => setSelectedTransaction(transaction)}
            className="p-6 hover:bg-dark-50 dark:hover:bg-dark-700/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {transaction.type === "INCOME" ? (
                  <ArrowUpCircle className="w-8 h-8 text-green-500 mr-4" />
                ) : (
                  <ArrowDownCircle className="w-8 h-8 text-red-500 mr-4" />
                )}
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(
                      new Date(transaction.date),
                      "d 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              </div>
              <p
                className={`font-semibold ${
                  transaction.type === "INCOME"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {transaction.type === "INCOME" ? "+" : "-"}{" "}
                {formatCurrency(Math.abs(Number(transaction.value) || 0))}
              </p>
            </div>
          </div>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Nenhuma transação encontrada
          </div>
        )}
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
