import { CustomField } from '../../types/customFields';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  associatedExpense?: number;
  customFields?: Record<string, CustomField>;
}

export interface FinancialState {
  transactions: Transaction[];
  selectedDate: string;
  showAllTime: boolean;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  addTransaction: (transaction: Transaction) => void;
  setSelectedDate: (date: string) => void;
  setShowAllTime: (show: boolean) => void;
  getFilteredTransactions: () => Transaction[];
  calculateTotals: (transactions: Transaction[]) => void;
}