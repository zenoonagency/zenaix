import React, { useState, useEffect, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useAuthStore } from "../../store/authStore";
import { useTeamMembersStore } from "../../store/teamMembersStore";
import { useDashboardTransactionStore } from "../../store/dashboardTransactionStore";
import { useDashboardData, useDashboardCalculations } from "./hooks";
import {
  DashboardHeader,
  QuickAccessShortcuts,
  SummaryCards,
  FinancialChart,
  ContractChart,
  TopSellers,
  UpcomingEvents,
  AllSellersModal,
  ExportModal,
  EventDetailsModal,
} from "./components";
import { format } from "date-fns";
import { useContractStore } from "../../store/contractStore";

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7f00ff]"></div>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="text-center p-4">
    <p className="text-red-500">{message}</p>
  </div>
);

export function Dashboard() {
  const { user, organization, token } = useAuthStore();
  const { members } = useTeamMembersStore();

  const {
    boards,
    dashboardActiveBoardId,
    dashboardActiveBoard,
    dashboardTopSellers,
    isDashboardLoadingBoard,
    isDashboardLoadingTopSellers,
    dashboardSelectAndLoadBoard,
    dashboardTransactionsData,
    isDashboardLoading,
    calendarEvents,
    initialTransactionsFetched,
    setInitialTransactionsFetched,
  } = useDashboardData();

  const {
    totalKanbanValue,
    completedSalesValue,
    conversionRate,
    contractData,
    filteredTransactions,
    contracts,
  } = useDashboardCalculations(dashboardActiveBoard, dashboardTransactionsData);

  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(
    new Set()
  );
  const [exportOptions, setExportOptions] = useState({
    kanbanValues: true,
    contractStatus: true,
    financialData: true,
    sellerRanking: true,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showAllSellersModal, setShowAllSellersModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any>(null);

  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });
  const [chartType, setChartType] = useState<"area" | "line" | "column">(
    "area"
  );
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const anyModalOpen =
      showAllSellersModal || showExportModal || showBoardSelector;
    if (anyModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showAllSellersModal, showExportModal, showBoardSelector]);

  const setLoadingOperation = (operation: string, isLoading: boolean) => {
    setLoadingOperations((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(operation);
      } else {
        newSet.delete(operation);
      }
      return newSet;
    });
  };

  const isLoadingBoardData =
    isDashboardLoadingBoard || loadingOperations.size > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSearchTransactions = React.useCallback(() => {
    const { token: currentToken, user: currentUser } = useAuthStore.getState();

    if (!currentToken || !currentUser?.organization_id) {
      return;
    }

    const currentStore = useDashboardTransactionStore.getState();
    const filters = {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };

    // Verificar se os filtros mudaram para evitar chamadas desnecessárias
    const lastFilters = currentStore.lastFilters;
    const filtersChanged =
      !lastFilters ||
      lastFilters.startDate !== filters.startDate ||
      lastFilters.endDate !== filters.endDate;

    if (!filtersChanged) {
      return;
    }

    setLoadingOperation("dashboardTransactions", true);

    const { fetchDashboardTransactions, fetchDashboardSummary } =
      useDashboardTransactionStore.getState();

    Promise.all([
      fetchDashboardTransactions(
        currentToken,
        currentUser.organization_id,
        filters,
        true
      ),
      fetchDashboardSummary(currentToken, currentUser.organization_id, filters),
    ]).finally(() => {
      setLoadingOperation("dashboardTransactions", false);
    });
  }, [startDate, endDate]);

  useEffect(() => {
    if (user?.organization_id && !initialTransactionsFetched) {
      const currentStore = useDashboardTransactionStore.getState();
      const hasExistingData = currentStore.transactions.length > 0;
      const hasExistingSummary = currentStore.summary !== null;

      if (hasExistingData && hasExistingSummary) {
        setInitialTransactionsFetched(true);
        return;
      }

      const initialFilters = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      setLoadingOperation("dashboardTransactions", true);

      const { fetchDashboardTransactions, fetchDashboardSummary } =
        useDashboardTransactionStore.getState();

      Promise.all([
        fetchDashboardTransactions(
          token,
          user.organization_id,
          initialFilters,
          false
        ),
        fetchDashboardSummary(token, user.organization_id, initialFilters),
      ]).finally(() => {
        setLoadingOperation("dashboardTransactions", false);
        setInitialTransactionsFetched(true);
      });
    }
  }, [user?.organization_id, initialTransactionsFetched]); // Removido startDate e endDate das dependências

  const handleExport = () => {
    try {
      const today = format(new Date(), "dd-MM-yyyy");
      const periodStart = format(startDate, "dd/MM/yyyy");
      const periodEnd = format(endDate, "dd/MM/yyyy");
      const boardName = dashboardActiveBoard?.name || "Não selecionado";

      let income = 0;
      let expenses = 0;

      filteredTransactions.forEach((transaction) => {
        if (transaction?.value && transaction?.type) {
          const value = Number(transaction.value);
          if (transaction.type === "INCOME") {
            income += value;
          } else if (transaction.type === "EXPENSE") {
            expenses += value;
          }
        }
      });

      const calculatedSummary = {
        income,
        expenses,
        balance: income - expenses,
      };

      const getSellerInfo = (seller: any) => {
        const member = members.find((m) => m.id === seller.user?.id);
        return {
          name: seller.user?.name || "Vendedor Desconhecido",
          role: member?.role || "Não informado",
          email: member?.email || "Não informado",
        };
      };

      let csvContent = "";

      csvContent += `RELATÓRIO DASHBOARD - ${today}\n`;
      csvContent += `Período: ${periodStart} a ${periodEnd}\n`;
      csvContent += `Board: ${boardName}\n`;
      csvContent += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}\n\n`;

      if (exportOptions.kanbanValues) {
        csvContent += "=== VALORES DO KANBAN ===\n";
        csvContent += "Métrica,Valor\n";
        csvContent += `Total em Negociação,${formatCurrency(
          totalKanbanValue
        )}\n`;
        csvContent += `Vendas Concluídas,${formatCurrency(
          completedSalesValue
        )}\n`;
        csvContent += `Taxa de Conversão,${conversionRate.toFixed(1)}%\n\n`;
      }

      if (exportOptions.contractStatus) {
        csvContent += "=== STATUS DOS CONTRATOS ===\n";
        csvContent += "Status,Quantidade\n";
        contractData.forEach(({ status, value }) => {
          csvContent += `${status},${value}\n`;
        });
        csvContent += `Total de Contratos,${contractData.reduce(
          (sum, item) => sum + item.value,
          0
        )}\n\n`;
      }

      if (exportOptions.financialData) {
        csvContent += "=== RESUMO FINANCEIRO ===\n";
        csvContent += "Tipo,Valor\n";
        csvContent += `Total de Receitas,${formatCurrency(
          calculatedSummary.income
        )}\n`;
        csvContent += `Total de Despesas,${formatCurrency(
          calculatedSummary.expenses
        )}\n`;
        csvContent += `Saldo Líquido,${formatCurrency(
          calculatedSummary.balance
        )}\n`;
        csvContent += `Número de Transações,${filteredTransactions.length}\n\n`;
      }

      if (exportOptions.financialData && filteredTransactions.length > 0) {
        csvContent += "=== TRANSAÇÕES DETALHADAS ===\n";
        csvContent += "Data,Tipo,Descrição,Valor,Categoria\n";
        filteredTransactions.forEach((transaction) => {
          if (transaction?.date && transaction?.type && transaction?.value) {
            const date = format(new Date(transaction.date), "dd/MM/yyyy");
            const type = transaction.type === "INCOME" ? "Receita" : "Despesa";
            const description =
              transaction.description?.replace(/,/g, " -") || "Sem descrição";
            const value = formatCurrency(Number(transaction.value));
            const category =
              transaction.category?.replace(/,/g, " -") || "Sem categoria";
            csvContent += `${date},${type},"${description}",${value},"${category}"\n`;
          }
        });
        csvContent += "\n";
      }

      if (exportOptions.sellerRanking && dashboardTopSellers.data.length > 0) {
        csvContent += "=== RANKING DE VENDEDORES ===\n";
        csvContent += "Posição,Vendedor,Valor Total,Função,E-mail\n";
        dashboardTopSellers.data.forEach((seller, index) => {
          const position = index + 1;
          const sellerInfo = getSellerInfo(seller);
          const value = formatCurrency(seller.totalValue);
          csvContent += `${position},"${sellerInfo.name}",${value},"${sellerInfo.role}","${sellerInfo.email}"\n`;
        });
        csvContent += "\n";
      }

      csvContent += "=== INFORMAÇÕES ADICIONAIS ===\n";
      csvContent += `Organização: ${
        organization?.name || "Não identificada"
      }\n`;
      csvContent += `Usuário: ${user?.name || "Não identificado"}\n`;
      csvContent += `Relatório gerado pela plataforma Zenaix\n`;

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `dashboard-report-${today}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar dados:", err);
      alert("Erro ao exportar relatório. Tente novamente.");
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedCalendarEvent(event);
    setShowEventDetails(true);
  };

  const contractStore = useContractStore();
  const isContractsLoading = contractStore.isLoading;

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <ErrorDisplay
          message={
            error?.message || "Ocorreu um erro ao renderizar o dashboard"
          }
        />
      )}
      onError={(error, errorInfo) => {
        console.error("Erro no Dashboard:", error, errorInfo);
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <div className="p-6 space-y-6">
          <DashboardHeader
            dashboardActiveBoard={dashboardActiveBoard}
            dashboardActiveBoardId={dashboardActiveBoardId}
            boards={boards}
            onSelectBoard={dashboardSelectAndLoadBoard}
            onShowBoardSelector={() => setShowBoardSelector(true)}
            onShowExportModal={() => setShowExportModal(true)}
            showBoardSelector={showBoardSelector}
            onCloseBoardSelector={() => setShowBoardSelector(false)}
            isLoadingBoard={isDashboardLoadingBoard}
          />

          <QuickAccessShortcuts />

          <SummaryCards
            totalKanbanValue={totalKanbanValue}
            completedSalesValue={completedSalesValue}
            conversionRate={conversionRate}
            isLoading={isLoadingBoardData}
            formatCurrency={formatCurrency}
          />

          {dashboardActiveBoard?.goal && (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {dashboardActiveBoard.goal.name}
                    </h3>
                    {dashboardActiveBoard.goal.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {dashboardActiveBoard.goal.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(dashboardActiveBoard.goal.value)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Meta
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progresso
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.min(
                      Math.round(
                        (completedSalesValue /
                          dashboardActiveBoard.goal.value) *
                          100
                      ),
                      100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (completedSalesValue /
                          dashboardActiveBoard.goal.value) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {formatCurrency(completedSalesValue)} de{" "}
                    {formatCurrency(dashboardActiveBoard.goal.value)}
                  </span>
                  <span>
                    {formatCurrency(
                      dashboardActiveBoard.goal.value - completedSalesValue
                    )}{" "}
                    restantes
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <FinancialChart
              startDate={startDate}
              endDate={endDate}
              chartType={chartType}
              theme={theme}
              isLoading={isDashboardLoading}
              dashboardTransactionsData={dashboardTransactionsData}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onChartTypeChange={setChartType}
              onSearchTransactions={handleSearchTransactions}
              formatCurrency={formatCurrency}
            />

            <ContractChart
              contracts={contracts}
              theme={theme}
              isLoading={isContractsLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <TopSellers
              dashboardTopSellers={dashboardTopSellers}
              isDashboardLoadingTopSellers={isDashboardLoadingTopSellers}
              formatCurrency={formatCurrency}
              onShowAllSellersModal={() => setShowAllSellersModal(true)}
            />

            <UpcomingEvents
              calendarEvents={calendarEvents}
              members={members}
              onEventClick={handleEventClick}
            />
          </div>

          <AllSellersModal
            isOpen={showAllSellersModal}
            onClose={() => setShowAllSellersModal(false)}
            dashboardTopSellers={dashboardTopSellers}
            formatCurrency={formatCurrency}
          />

          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            exportOptions={exportOptions}
            onExportOptionsChange={setExportOptions}
            onExport={handleExport}
          />

          <EventDetailsModal
            isOpen={showEventDetails}
            onClose={() => setShowEventDetails(false)}
            event={selectedCalendarEvent}
            members={members}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
