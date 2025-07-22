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

interface CachedFilters extends IDateFilters {
  organizationId: string;
}

export interface TransactionState {
  transactions: OutputTransactionDTO[];
  summary: FinancialSummaryDTO | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastFilters: CachedFilters | null;

  setTransactions: (transactions: OutputTransactionDTO[]) => void;
  addTransaction: (transaction: OutputTransactionDTO) => void;
  updateTransaction: (transaction: OutputTransactionDTO) => void;
  deleteTransaction: (transactionId: string) => void;
  setSummary: (summary: FinancialSummaryDTO) => void;

  fetchAllTransactions: (
    token: string,
    organizationId: string,
    filters?: IDateFilters,
    forceRefresh?: boolean
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
      lastFilters: null,
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

      fetchAllTransactions: async (
        token,
        organizationId,
        filters,
        forceRefresh = false
      ) => {
        if (get().isLoading) return;

        // Verificar se os filtros são os mesmos do cache
        const currentFilters: CachedFilters = { ...filters, organizationId };
        const lastFilters = get().lastFilters;
        const filtersChanged =
          !lastFilters ||
          JSON.stringify(currentFilters) !== JSON.stringify(lastFilters);

        // Se já tem dados em cache e foi buscado recentemente (últimos 5 minutos), não buscar novamente
        const now = Date.now();
        const lastFetched = get().lastFetched;
        const fiveMinutes = 5 * 60 * 1000;

        if (
          !forceRefresh &&
          !filtersChanged &&
          get().transactions.length > 0 &&
          lastFetched &&
          now - lastFetched < fiveMinutes
        ) {
          console.log("[TransactionStore] Usando dados do cache");

          // Fazer refresh em background após 10 minutos sem mostrar loading
          const tenMinutes = 10 * 60 * 1000;
          if (now - lastFetched > tenMinutes) {
            console.log("[TransactionStore] Fazendo refresh em background");
            setTimeout(() => {
              get().fetchAllTransactions(token, organizationId, filters, true);
            }, 100);
          }
          return;
        }

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
            lastFilters: { ...filters, organizationId },
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
        lastFilters: state.lastFilters,
      }),
    }
  )
);
