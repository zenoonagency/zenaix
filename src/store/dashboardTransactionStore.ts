import { create } from "zustand";
import { persist } from "zustand/middleware";
import { transactionService } from "../services/transaction/transaction.service";
import {
  OutputTransactionDTO,
  FinancialSummaryDTO,
} from "../types/transaction";

interface IDateRangeFilters {
  startDate?: string; // formato YYYY-MM-DD
  endDate?: string; // formato YYYY-MM-DD
}

interface CachedDashboardFilters extends IDateRangeFilters {
  organizationId: string;
}

export interface DashboardTransactionState {
  transactions: OutputTransactionDTO[];
  summary: FinancialSummaryDTO | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastFilters: CachedDashboardFilters | null;

  setTransactions: (transactions: OutputTransactionDTO[]) => void;
  setSummary: (summary: FinancialSummaryDTO | null) => void;
  setLoading: (loading: boolean) => void;

  fetchDashboardTransactions: (
    token: string,
    organizationId: string,
    filters?: IDateRangeFilters,
    forceRefresh?: boolean
  ) => Promise<void>;

  fetchDashboardSummary: (
    token: string,
    organizationId: string,
    filters?: IDateRangeFilters
  ) => Promise<void>;

  clearError: () => void;
}

export const useDashboardTransactionStore = create<DashboardTransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      summary: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      lastFilters: null,

      setTransactions: (transactions) => set({ transactions }),
      setSummary: (summary) => set({ summary }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearError: () => set({ error: null }),

      fetchDashboardTransactions: async (
        token,
        organizationId,
        filters,
        forceRefresh = false
      ) => {
        console.log(
          "[DashboardTransactionStore] fetchDashboardTransactions iniciado",
          { filters, forceRefresh }
        );

        if (get().isLoading && !forceRefresh) {
          console.log(
            "[DashboardTransactionStore] Já está carregando, ignorando..."
          );
          return;
        }

        // Verificar se os filtros são os mesmos do cache
        const currentFilters: CachedDashboardFilters = {
          ...filters,
          organizationId,
        };
        const lastFilters = get().lastFilters;
        const filtersChanged =
          !lastFilters ||
          JSON.stringify(currentFilters) !== JSON.stringify(lastFilters);

        // Aumentar tempo de cache para 5 minutos para evitar calls repetidas
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
          console.log(
            "[DashboardTransactionStore] Usando dados do cache (cache estendido para 5min)"
          );
          return;
        }

        set({ isLoading: true, error: null });

        try {
          let allTransactions: OutputTransactionDTO[] = [];

          if (filters?.startDate && filters?.endDate) {
            // Determinar todos os meses que precisamos buscar
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);

            console.log(
              "[DashboardTransactionStore] Buscando transações para range:",
              { startDate, endDate }
            );

            // Gerar lista de anos/meses para buscar
            const monthsToFetch = [];
            let currentDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              1
            );
            const endMonth = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              1
            );

            while (currentDate <= endMonth) {
              monthsToFetch.push({
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1, // API espera 1-12
              });
              currentDate.setMonth(currentDate.getMonth() + 1);
            }

            console.log(
              "[DashboardTransactionStore] Meses para buscar:",
              monthsToFetch
            );

            // Buscar transações para cada mês sequencialmente para evitar sobrecarga
            for (const { year, month } of monthsToFetch) {
              try {
                const monthTransactions = await transactionService.findAll(
                  token,
                  organizationId,
                  { year, month }
                );
                allTransactions = [...allTransactions, ...monthTransactions];
              } catch (err) {
                console.error(
                  `[DashboardTransactionStore] Erro ao buscar mês ${month}/${year}:`,
                  err
                );
              }
            }

            // Filtrar por range de datas exato
            allTransactions = allTransactions.filter((transaction) => {
              if (!transaction.date) return false;

              const transactionDate = new Date(transaction.date);
              const filterStartDate = new Date(filters.startDate!);
              const filterEndDate = new Date(filters.endDate!);

              // Normalizar para comparar apenas datas (sem horário)
              const transactionDay = new Date(
                transactionDate.getFullYear(),
                transactionDate.getMonth(),
                transactionDate.getDate()
              );
              const startDay = new Date(
                filterStartDate.getFullYear(),
                filterStartDate.getMonth(),
                filterStartDate.getDate()
              );
              const endDay = new Date(
                filterEndDate.getFullYear(),
                filterEndDate.getMonth(),
                filterEndDate.getDate()
              );

              return transactionDay >= startDay && transactionDay <= endDay;
            });
          } else {
            // Se não há filtros específicos, buscar o mês atual
            const now = new Date();
            allTransactions = await transactionService.findAll(
              token,
              organizationId,
              {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
              }
            );
          }

          console.log(
            "[DashboardTransactionStore] Transações encontradas:",
            allTransactions.length
          );

          set({
            transactions: allTransactions,
            isLoading: false,
            lastFetched: Date.now(),
            lastFilters: currentFilters,
            error: null,
          });
        } catch (err: any) {
          console.error(
            "[DashboardTransactionStore] Erro ao buscar transações:",
            err
          );
          set({
            error: err.message || "Falha ao carregar transações do dashboard.",
            isLoading: false,
          });
        }
      },

      fetchDashboardSummary: async (token, organizationId, filters) => {
        console.log(
          "[DashboardTransactionStore] fetchDashboardSummary iniciado",
          { filters }
        );

        try {
          // Para o summary, vamos usar apenas o mês da startDate por simplicidade
          // ou o mês atual se não há filtros
          let apiFilters: any = {};

          if (filters?.startDate) {
            const startDate = new Date(filters.startDate);
            apiFilters = {
              year: startDate.getFullYear(),
              month: startDate.getMonth() + 1,
            };
          } else {
            const now = new Date();
            apiFilters = {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
            };
          }

          console.log(
            "[DashboardTransactionStore] Buscando summary com filtros:",
            apiFilters
          );

          const fetchedSummary = await transactionService.getSummary(
            token,
            organizationId,
            apiFilters
          );

          console.log(
            "[DashboardTransactionStore] Summary recebido:",
            fetchedSummary
          );

          set({ summary: fetchedSummary });
        } catch (err: any) {
          console.error(
            "[DashboardTransactionStore] Erro ao buscar resumo:",
            err
          );
          // Não definir erro para o summary, apenas logar
        }
      },
    }),
    {
      name: "dashboard-transaction-store",
      partialize: (state) => ({
        transactions: state.transactions,
        summary: state.summary,
        lastFetched: state.lastFetched,
        lastFilters: state.lastFilters,
      }),
    }
  )
);
