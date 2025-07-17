import { create } from "zustand";
import { persist } from "zustand/middleware";
import { transactionService } from "../services/transaction/transaction.service";
import {
  OutputTransactionDTO,
  FinancialSummaryDTO,
} from "../types/transaction";

interface IDateFilters {
  year?: number;
  month?: number;
}

export interface TransactionState {
  transactions: OutputTransactionDTO[];
  summary: FinancialSummaryDTO | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  setTransactions: (transactions: OutputTransactionDTO[]) => void;
  addTransaction: (transaction: OutputTransactionDTO) => void;
  updateTransaction: (transaction: OutputTransactionDTO) => void;
  deleteTransaction: (transactionId: string) => void;
  setSummary: (summary: FinancialSummaryDTO) => void;

  fetchAllTransactions: (
    token: string,
    organizationId: string,
    filters?: IDateFilters
  ) => Promise<void>;
  fetchSummary: (
    token: string,
    organizationId: string,
    filters?: IDateFilters
  ) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      summary: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (newTransaction) =>
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        })),
      updateTransaction: (updatedTransaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === updatedTransaction.id ? updatedTransaction : t
          ),
        })),
      deleteTransaction: (transactionId) =>
        set((state) => ({
          transactions: state.transactions.filter(
            (t) => t.id !== transactionId
          ),
        })),
      setSummary: (summary) => set({ summary }),

      fetchAllTransactions: async (token, organizationId, filters) => {
        if (get().isLoading) return;

        if (get().transactions.length === 0) {
          set({ isLoading: true });
        }

        try {
          const fetchedTransactions = await transactionService.findAll(
            token,
            organizationId,
            filters
          );
          set({
            transactions: fetchedTransactions,
            isLoading: false,
            lastFetched: Date.now(),
            error: null,
          });
        } catch (err: any) {
          console.error("[TransactionStore] Erro ao buscar transações:", err);
          set({
            error: err.message || "Falha ao carregar transações.",
            isLoading: false,
          });
        }
      },

      fetchSummary: async (token, organizationId, filters) => {
        try {
          const fetchedSummary = await transactionService.getSummary(
            token,
            organizationId,
            filters
          );
          set({ summary: fetchedSummary });
        } catch (err: any) {
          console.error("[TransactionStore] Erro ao buscar resumo:", err);
        }
      },
    }),
    {
      name: "transaction-store",
      partialize: (state) => ({
        transactions: state.transactions,
        summary: state.summary,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
