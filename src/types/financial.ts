import { OutputTransactionDTO as Transaction } from "./transaction";

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
