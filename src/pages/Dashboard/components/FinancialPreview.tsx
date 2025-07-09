import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Box } from '../../../components/Box';

interface FinancialPreviewProps {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  recentTransactions: any[];
}

export function FinancialPreview({
  totalIncome,
  totalExpenses,
  netIncome,
  recentTransactions
}: FinancialPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Box className="p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Entradas</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </Box>
        <Box className="p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Saídas</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </Box>
        <Box className="p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo</p>
              <p className={`text-lg font-bold ${
                netIncome >= 0 
                  ? 'text-[#7f00ff] dark:text-[#9f3fff]' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(netIncome)}
              </p>
            </div>
          </div>
        </Box>
      </div>
      
      {recentTransactions.length > 0 && (
        <Box className="p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transações Recentes</h3>
          <div className="space-y-3">
            {recentTransactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(tx.date), 'd MMM yyyy', { locale: ptBR })}
                  </p>
                </div>
                <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
          
          {recentTransactions.length > 3 && (
            <div className="mt-3 text-center">
              <a href="/dashboard/financial" className="text-sm text-[#7f00ff] hover:text-[#9f3fff] dark:text-[#9f3fff] dark:hover:text-[#bf5fff]">
                Ver todas as transações
              </a>
            </div>
          )}
        </Box>
      )}
    </div>
  );
}