import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  associatedExpense?: number;
}

interface FinancialState {
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

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      selectedDate: new Date().toISOString(),
      showAllTime: false,
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,

      addTransaction: (transaction) => {
        set((state) => {
          const newTransactions = [...state.transactions, transaction];
          const filteredTransactions = get().getFilteredTransactions();
          get().calculateTotals(filteredTransactions);
          
          return {
            transactions: newTransactions,
          };
        });
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
      },

      setShowAllTime: (show) => {
        set({ showAllTime: show });
        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
      },

      getFilteredTransactions: () => {
        const state = get();
        if (state.showAllTime) {
          return state.transactions;
        }

        const selectedDate = new Date(state.selectedDate);
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);

        return state.transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return isWithinInterval(transactionDate, { start, end });
        });
      },

      calculateTotals: (transactions) => {
        const totals = transactions.reduce(
          (acc, curr) => {
            if (curr.type === 'income') {
              acc.income += curr.amount;
              if (curr.associatedExpense) {
                acc.expenses += curr.associatedExpense;
              }
            } else {
              acc.expenses += curr.amount;
            }
            return acc;
          },
          { income: 0, expenses: 0 }
        );

        set({
          totalIncome: totals.income,
          totalExpenses: totals.expenses,
          netIncome: totals.income - totals.expenses,
        });
      },
    }),
    {
      name: 'financial-store',
    }
  )
);