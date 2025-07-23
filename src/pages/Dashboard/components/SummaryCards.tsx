import React from "react";
import { DollarSign, CheckCircle, Target } from "lucide-react";

interface SummaryCardsProps {
  totalKanbanValue: number;
  completedSalesValue: number;
  conversionRate: number;
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}

export function SummaryCards({
  totalKanbanValue,
  completedSalesValue,
  conversionRate,
  isLoading,
  formatCurrency,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-32"></div>
              <div className="p-2 bg-gray-200 dark:bg-dark-700 rounded-lg animate-pulse w-10 h-10"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Valor Total em Negociação
          </h3>
          <div className="p-2 bg-[#7f00ff]/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-[#7f00ff]" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(totalKanbanValue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          No quadro selecionado
        </p>
      </div>

      <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Vendas Concluídas
          </h3>
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(completedSalesValue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          No período selecionado
        </p>
      </div>

      <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Taxa de Conversão
          </h3>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {`${conversionRate.toFixed(1)}%`}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Vendas concluídas / Total em negociação
        </p>
      </div>
    </div>
  );
}
