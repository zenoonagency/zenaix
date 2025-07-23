import { create } from "zustand";
import { persist } from "zustand/middleware";
import { transactionService } from "../services/transaction/transaction.service";
import {
  OutputTransactionDTO,
  DashboardTransactionState,
  CachedDashboardFilters,
} from "../types/transaction";
import { cleanUserData } from "../utils/dataOwnership";

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
        if (get().isLoading && !forceRefresh) {
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

        // Cache mais longo para evitar calls repetidas (15 minutos)
        const now = Date.now();
        const lastFetched = get().lastFetched;
        const fifteenMinutes = 15 * 60 * 1000;

        if (
          !forceRefresh &&
          !filtersChanged &&
          get().transactions.length > 0 &&
          lastFetched &&
          now - lastFetched < fifteenMinutes
        ) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          let allTransactions: OutputTransactionDTO[] = [];

          if (filters?.startDate && filters?.endDate) {
            // Determinar todos os meses que precisamos buscar
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);

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

          const fetchedSummary = await transactionService.getSummary(
            token,
            organizationId,
            apiFilters
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

      cleanUserData: () => {
        set({
          transactions: [],
          summary: null,
          isLoading: false,
          error: null,
          lastFetched: null,
          lastFilters: null,
        });
      },

      // Função para limpar cache forçadamente (útil para debug)
      clearCache: () => {
        set({
          transactions: [],
          summary: null,
          lastFetched: null,
          lastFilters: null,
          error: null,
        });
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
