import React, { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { useTransactionStore } from "../../store/transactionStore";
import { useAuthStore } from "../../store/authStore";
import { NewTransactionModal } from "./components/NewTransactionModal";
import { EditTransactionModal } from "./components/EditTransactionModal";
import { CustomModal } from "../../components/CustomModal";
import { Trash2, Plus, Calendar, Edit, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Box } from "../../components/Box";
import { formatCurrency } from "../../utils/formatters";
import { convertUTCToUserTimezone } from "../../utils/dateUtils";
import { transactionService } from "../../services/transaction/transaction.service";
import { useState as useLocalState } from "react";

export function Financial() {
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] =
    useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<string>(() => {
    const now = new Date();
    return format(now, "yyyy-MM");
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "year" | "all">("month");
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const { token, organizationId, hasPermission } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
    hasPermission: state.hasPermission,
  }));
  const {
    transactions,
    summary,
    isLoading,
    fetchAllTransactions,
    fetchSummary,
  } = useTransactionStore();

  // Verificar se o usuário tem permissão para visualizar o financeiro
  if (!hasPermission("finance:read")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const now = new Date();
    if (viewMode === "year") {
      const year = now.getFullYear().toString();
      if (filterDate !== year) setFilterDate(year);
    } else if (viewMode === "month") {
      const month = format(now, "yyyy-MM");
      if (filterDate !== month) setFilterDate(month);
    }
  }, [viewMode]);

  useEffect(() => {
    if (token && organizationId) {
      // Para mudanças de filtro, usar isFetching
      if (!isInitialLoading) {
        setIsFetching(true);
      }

      let filters: any = {};

      if (viewMode === "month") {
        const [year, month] = filterDate.split("-").map(Number);
        filters = { year, month };
      } else if (viewMode === "year") {
        const year = parseInt(filterDate);
        filters = { year };
      }
      if (
        (viewMode === "month" && filterDate.match(/^\d{4}-\d{2}$/)) ||
        (viewMode === "year" && filterDate.match(/^\d{4}$/)) ||
        viewMode === "all"
      ) {
        Promise.all([
          fetchAllTransactions(token, organizationId, filters),
          fetchSummary(token, organizationId, filters),
        ]).finally(() => {
          setIsFetching(false);
          setIsInitialLoading(false);
        });
      } else {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    }
  }, [token, organizationId, filterDate, viewMode]);

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return "Nunca atualizado";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleClearTransactions = async () => {
    if (!hasPermission("finance:delete")) {
      return;
    }
    setIsClearing(true);
    try {
      const { token, user } = useAuthStore.getState();
      if (!token || !user?.organization_id) {
        setIsClearing(false);
        return;
      }
      if (viewMode === "all") {
        await transactionService.deleteAll(token, user.organization_id);
      } else if (viewMode === "year") {
        const year = parseInt(filterDate);
        await transactionService.deleteAll(token, user.organization_id, {
          year,
        });
      } else {
        const [year, month] = filterDate.split("-").map(Number);
        await transactionService.deleteAll(token, user.organization_id, {
          year,
          month,
        });
      }
    } catch (error) {
      console.error("Erro ao limpar transações:", error);
    } finally {
      setShowClearModal(false);
      setIsClearing(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!hasPermission("finance:delete")) {
      return;
    }
    if (selectedTransaction) {
      setIsDeleting(true);
      const { token, user } = useAuthStore.getState();
      if (!token || !user?.organization_id) {
        setIsDeleting(false);
        return;
      }
      try {
        await transactionService.delete(
          token,
          user.organization_id,
          selectedTransaction.id
        );
      } catch (error) {
        console.log(error);
      } finally {
        setShowDeleteModal(false);
        setSelectedTransaction(null);
        setIsDeleting(false);
      }
    }
  };

  const handleEditClick = (transaction: any) => {
    if (!hasPermission("finance:update")) {
      return;
    }
    setSelectedTransaction(transaction);
    setShowEditTransactionModal(true);
  };

  const handleDeleteClick = (transaction: any) => {
    if (!hasPermission("finance:delete")) {
      return;
    }
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const newValue = e.target.value;
    if (viewMode === "year") {
      setFilterDate(newValue);
    } else {
      setFilterDate(newValue);
    }
  };

  const handleTransactionDateChange = (transactionDate: string) => {
    if (viewMode === "month") {
      const transactionMonth = transactionDate.substring(0, 7);
      if (transactionMonth !== filterDate) {
        setFilterDate(transactionMonth);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Cabeçalho alinhado à esquerda e colado na borda */}
      <div className="p-8 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 border border-purple-500 rounded-lg">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text">
            Financeiro
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-8 pb-8">
        {/* Filtros de data e modo */}
        <div
          className={`flex items-center justify-between mb-6 ${
            isInitialLoading || isFetching
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              {viewMode === "all" ? (
                <div className="w-[180px] h-[40px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-400 text-sm opacity-80 select-none">
                  Todas as transações
                </div>
              ) : (
                <>
                  <Calendar className="absolute left-3 w-4 h-4 text-gray-400" />
                  {viewMode === "year" ? (
                    <div
                      className="relative flex items-center"
                      style={{ width: 120, height: 40 }}
                    >
                      <Calendar
                        className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
                        style={{ zIndex: 2 }}
                      />
                      <select
                        value={filterDate}
                        onChange={handleFilterChange}
                        onFocus={() => setYearDropdownOpen(true)}
                        onBlur={() => setYearDropdownOpen(false)}
                        className="pl-10 pr-8 py-2 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none w-full cursor-pointer"
                        disabled={isLoading || isInitialLoading || isFetching}
                        style={{ zIndex: 1 }}
                      >
                        {Array.from(
                          { length: new Date().getFullYear() - 2020 + 1 },
                          (_, i) => new Date().getFullYear() - i
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {yearDropdownOpen ? (
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M7 14l5-5 5 5"
                              stroke="#888"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M7 10l5 5 5-5"
                              stroke="#888"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="month"
                      value={filterDate}
                      onChange={handleFilterChange}
                      className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      disabled={isLoading || isInitialLoading || isFetching}
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === "month"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setViewMode("year")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === "year"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600"
                }`}
              >
                Anual
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600"
                }`}
              >
                Tudo
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                hasPermission("finance:delete") && setShowClearModal(true)
              }
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              disabled={isLoading || isInitialLoading || isFetching}
              style={{
                display: hasPermission("finance:delete") ? "flex" : "none",
              }}
            >
              <Trash2 className="w-4 h-4" />
              Limpar Transações
            </button>
            <button
              onClick={() =>
                hasPermission("finance:create") &&
                setShowNewTransactionModal(true)
              }
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              style={{
                display: hasPermission("finance:create") ? "flex" : "none",
              }}
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <Box className="p-6 rounded-xl flex-1">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Receitas</span>
            </div>
            {isInitialLoading || isFetching ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                <span className="text-gray-400 text-sm">Carregando...</span>
              </div>
            ) : (
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(summary?.income ?? 0)}
              </span>
            )}
          </Box>

          <Box className="p-6 rounded-xl flex-1">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm">Despesas</span>
            </div>
            {isInitialLoading || isFetching ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                <span className="text-gray-400 text-sm">Carregando...</span>
              </div>
            ) : (
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(summary?.expenses ?? 0)}
              </span>
            )}
          </Box>

          <Box className="p-6 rounded-xl flex-1">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm">Saldo</span>
            </div>
            {isInitialLoading || isFetching ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                <span className="text-gray-400 text-sm">Carregando...</span>
              </div>
            ) : (
              <span
                className={`text-2xl font-semibold ${
                  (summary?.balance ?? 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatCurrency(summary?.balance ?? 0)}
              </span>
            )}
          </Box>
        </div>

        <Box className="rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {isInitialLoading || isFetching ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                <span className="text-purple-600">
                  {isInitialLoading
                    ? "Carregando dados..."
                    : "Carregando transações..."}
                </span>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-750">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-200 dark:border-dark-700 last:border-0"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {convertUTCToUserTimezone(transaction.date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {transaction.category}
                      </td>
                      <td
                        className={`py-3 px-4 text-sm text-right ${
                          transaction.type === "INCOME"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}{" "}
                        {formatCurrency(Number(transaction.value))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : transaction.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() =>
                              hasPermission("finance:update") &&
                              handleEditClick(transaction)
                            }
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            style={{
                              display: hasPermission("finance:update")
                                ? "block"
                                : "none",
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              hasPermission("finance:delete") &&
                              handleDeleteClick(transaction)
                            }
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            style={{
                              display: hasPermission("finance:delete")
                                ? "block"
                                : "none",
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Box>
      </div>

      <NewTransactionModal
        isOpen={showNewTransactionModal && hasPermission("finance:create")}
        onClose={() => setShowNewTransactionModal(false)}
        filterDate={filterDate}
        onTransactionCreated={handleTransactionDateChange}
      />

      {selectedTransaction && (
        <EditTransactionModal
          isOpen={showEditTransactionModal && hasPermission("finance:update")}
          onClose={() => {
            setShowEditTransactionModal(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onTransactionUpdated={handleTransactionDateChange}
        />
      )}

      <CustomModal
        isOpen={showClearModal && hasPermission("finance:delete")}
        onClose={() => setShowClearModal(false)}
        title="Limpar Transações"
        message="Tem certeza que deseja limpar todas as transações? Esta ação não pode ser desfeita."
        type="confirm"
        onConfirm={
          hasPermission("finance:delete") ? handleClearTransactions : undefined
        }
        confirmLoading={isClearing}
        confirmDisabled={isClearing}
      />

      <CustomModal
        isOpen={showDeleteModal && hasPermission("finance:delete")}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTransaction(null);
        }}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        type="confirm"
        onConfirm={
          hasPermission("finance:delete") ? handleDeleteTransaction : undefined
        }
        confirmLoading={isDeleting}
        confirmDisabled={isDeleting}
      />
    </div>
  );
}
