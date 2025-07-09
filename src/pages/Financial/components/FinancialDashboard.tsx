import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { Box } from '../../../components/Box';

interface FinancialDashboardProps {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export function FinancialDashboard({ totalIncome, totalExpenses, netIncome }: FinancialDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Box className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Entradas</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Box>

      <Box className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Saídas</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </Box>

      <Box className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Saldo</p>
            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-primary-500 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netIncome)}
            </p>
          </div>
          <div className={`${netIncome >= 0 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-red-100 dark:bg-red-900/30'} p-3 rounded-full`}>
            <DollarSign className={`w-6 h-6 ${netIncome >= 0 ? 'text-primary-500 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
        </div>
      </Box>
    </div>
  );
}