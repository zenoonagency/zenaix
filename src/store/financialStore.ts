import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "../utils/generateId";
import { getCurrentISOString } from "../utils/dateUtils";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  status: "pendente" | "concluido" | "cancelado";
}

interface FinancialState {
  transactions: Transaction[];
  selectedDate: string;
  showAllTime: boolean;
  viewMode: "month" | "year" | "all";
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  addTransaction: (
    transaction: Omit<Transaction, "id"> & { id?: string }
  ) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setShowAllTime: (show: boolean) => void;
  setViewMode: (mode: "month" | "year" | "all") => void;
  getFilteredTransactions: () => Transaction[];
  calculateTotals: (transactions: Transaction[]) => void;
  clearTransactions: (startDate?: string, endDate?: string) => void;
}

function generateSampleData(): Transaction[] {
  const today = new Date();
  const transactions: Transaction[] = [];

  // Adicionar a transação ArrudaCred específica
  const arrudaDate = new Date(2025, 2, 13);
  arrudaDate.setHours(12, 0, 0, 0); // Definir meio-dia para evitar problemas de fuso horário

  transactions.push({
    id: generateId(),
    date: arrudaDate.toISOString(), // 13/03/2025
    amount: 5000,
    type: "income", // Corrigido para income
    description: "ArrudaCred",
    category: "agente de IA",
    status: "concluido",
  });

  // Gerar transações para os últimos 30 dias
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0); // Definir meio-dia para evitar problemas de fuso horário

    // Gerar receita
    if (Math.random() > 0.3) {
      // 70% de chance de ter receita no dia
      transactions.push({
        id: generateId(),
        date: date.toISOString(),
        amount: Math.floor(Math.random() * 5000) + 1000, // Valor entre 1000 e 6000
        type: "income",
        description: `Receita ${date.toLocaleDateString("pt-BR")}`,
        category: "Salário",
        status: "concluido",
      });
    }

    // Gerar despesa
    if (Math.random() > 0.4) {
      // 60% de chance de ter despesa no dia
      transactions.push({
        id: generateId(),
        date: date.toISOString(),
        amount: Math.floor(Math.random() * 2000) + 500, // Valor entre 500 e 2500
        type: "expense",
        description: `Despesa ${date.toLocaleDateString("pt-BR")}`,
        category: "Alimentação",
        status: "concluido",
      });
    }
  }

  return transactions;
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: generateSampleData(),
              selectedDate: getCurrentISOString(),
      showAllTime: false,
      viewMode: "month",
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,

      addTransaction: (transaction) => {
        const newTransaction = {
          ...transaction,
          id: transaction.id || generateId(),
        };

        set((state) => {
          const newTransactions = [...state.transactions, newTransaction];
          return {
            transactions: newTransactions,
          };
        });

        // Recalcular totais após adicionar a transação
        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const newTransactions = state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction
          );
          return {
            transactions: newTransactions,
          };
        });

        // Recalcular totais após atualizar a transação
        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
      },

      deleteTransaction: (id) => {
        set((state) => {
          const newTransactions = state.transactions.filter(
            (transaction) => transaction.id !== id
          );
          return {
            transactions: newTransactions,
          };
        });

        // Recalcular totais após excluir a transação
        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
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

      setViewMode: (mode) => {
        set({ viewMode: mode });
        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
      },

      getFilteredTransactions: () => {
        const state = get();

        if (state.viewMode === "all") {
          return state.transactions;
        }

        // Extrair a data diretamente da string ISO
        const selectedDate = new Date(state.selectedDate);

        // Usar UTC para evitar problemas com fuso horário
        const year = selectedDate.getUTCFullYear();
        const month = selectedDate.getUTCMonth();

        // Criar datas de início e fim do período
        let start, end;

        if (state.viewMode === "month") {
          // Criar as datas de início e fim do mês explicitamente usando UTC
          start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
          end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Último dia do mês
        } else {
          // Filtro anual usando UTC
          start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
          end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        }

        // Período selecionado para filtro

        return state.transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);

          // Verificar datas das transações

          // Comparar ano e mês para filtro mensal, ou apenas ano para filtro anual
          if (state.viewMode === "month") {
            const match =
              transactionDate.getUTCFullYear() === year &&
              transactionDate.getUTCMonth() === month;

            // Verificar correspondência da transação

            return match;
          } else {
            // Filtro anual
            return transactionDate.getUTCFullYear() === year;
          }
        });
      },

      calculateTotals: (transactions) => {
        const totals = transactions.reduce(
          (acc, curr) => {
            if (curr.type === "income") {
              acc.income += curr.amount;
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

      clearTransactions: (startDate?: string, endDate?: string) => {
        set((state) => {
          let newTransactions;

          if (!startDate || !endDate) {
            newTransactions = [];
          } else {
            newTransactions = state.transactions.filter((transaction) => {
              const transactionDate = new Date(transaction.date);
              const start = new Date(startDate);
              const end = new Date(endDate);
              return !isWithinInterval(transactionDate, { start, end });
            });
          }

          return { transactions: newTransactions };
        });

        const filteredTransactions = get().getFilteredTransactions();
        get().calculateTotals(filteredTransactions);
      },
    }),
    {
      name: "financial-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const filteredTransactions = state.getFilteredTransactions();
          state.calculateTotals(filteredTransactions);
        }
      },
    }
  )
);
