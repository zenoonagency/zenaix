import React, { useState, useEffect } from "react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useFinancialStore } from "../../store/financialStore";
import { useSettingsStore } from "../../store/settingsStore";
import { NewTransactionModal } from "./components/NewTransactionModal";
import { EditTransactionModal } from "./components/EditTransactionModal";
import { CustomModal } from "../../components/CustomModal";
import {
  Trash2,
  Plus,
  Filter,
  Calendar,
  Edit,
  Trash,
  ListFilter,
  RefreshCw,
  AlertCircle,
  Bug,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Box } from "../../components/Box";
import { formatCurrency } from "../../utils/formatters";

export function Financial() {
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] =
    useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<string>(
    format(new Date(), "yyyy-MM")
  );

  const {
    transactions,
    totalIncome,
    totalExpenses,
    netIncome,
    clearTransactions,
    deleteTransaction,
    setSelectedDate,
    calculateTotals,
    getFilteredTransactions,
    updateTransaction,
    viewMode,
    setViewMode,
  } = useFinancialStore();

  const { asaas, checkAsaasBalance } = useSettingsStore();

  useEffect(() => {
    // Inicializar os totais quando o componente montar
    const filteredTransactions = getFilteredTransactions();
    calculateTotals(filteredTransactions);
  }, [calculateTotals, getFilteredTransactions]);

  // Corrigir a transação com problema
  useEffect(() => {
    const transactionToFix = transactions.find(
      (t) =>
        t.description === "ArrudaCred" &&
        t.category === "agente de IA" &&
        t.type === "expense"
    );

    if (transactionToFix) {
      updateTransaction(transactionToFix.id, { type: "income" });
    }
  }, [transactions, updateTransaction]);

  // Verificar saldo do Asaas quando a página carregar e a cada hora
  useEffect(() => {
    // Verificar saldo ao carregar a página se tiver API key configurada
    if (asaas.apiKey) {
      checkAsaasBalance().catch(console.error);
    }

    // Configurar intervalo para verificar a cada hora
    const intervalId = setInterval(() => {
      if (asaas.apiKey) {
        checkAsaasBalance().catch(console.error);
      }
    }, 60 * 60 * 1000); // 1 hora em milissegundos

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [asaas.apiKey, checkAsaasBalance]);

  const handleRefreshAsaasBalance = () => {
    checkAsaasBalance().catch((error) => {
      console.error("Erro ao atualizar saldo:", error);
    });
  };

  // Função para depuração
  const handleDebug = () => {
    // Obter o estado atual do store
    const currentState = useSettingsStore.getState();
    console.log("Estado atual do store:", currentState);

    // Forçar a atualização do saldo diretamente
    useSettingsStore.setState((state) => ({
      ...state,
      asaas: {
        ...state.asaas,
        balance: 1621.14,
        lastUpdated: new Date().toISOString(),
      },
    }));

    console.log("Saldo atualizado manualmente para 1621.14");

    // Verificar o estado após a atualização
    const updatedState = useSettingsStore.getState();
    console.log("Estado após atualização manual:", updatedState);
  };

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return "Nunca atualizado";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleClearTransactions = () => {
    clearTransactions();
    setShowClearModal(false);
  };

  const handleDeleteTransaction = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id);
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleEditClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowEditTransactionModal(true);
  };

  const handleDeleteClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFilterDate(newDate);

    // Extrair ano e mês do valor do input (formato YYYY-MM)
    const [year, month] = newDate.split("-").map(Number);

    // Criar uma data no primeiro dia do mês selecionado
    // Mês em JavaScript é 0-indexed, então subtraímos 1
    // Definimos a hora como 00:00:00 para evitar problemas com fuso horário
    const selectedDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));

    // Converter para ISO string e passar para o store
    console.log("Data selecionada:", selectedDate.toISOString());
    setSelectedDate(selectedDate.toISOString());
  };

  // Função para obter o título do período atual
  const getPeriodTitle = () => {
    if (viewMode === "all") {
      return "Todas as Transações";
    } else if (viewMode === "year") {
      return `Transações de ${new Date(filterDate).getFullYear()}`;
    } else {
      // Extrair ano e mês do valor do input (formato YYYY-MM)
      const [year, month] = filterDate.split("-").map(Number);

      // Criar uma data no primeiro dia do mês selecionado
      // Mês em JavaScript é 0-indexed, então subtraímos 1
      const date = new Date(year, month - 1, 1);

      // Formatar o mês e ano para exibição
      return format(date, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Cabeçalho alinhado à esquerda e colado na borda */}
      <div className="p-8 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 border border-purple-500 rounded-lg">
            <BanknotesIcon className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text">
            Financeiro
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={filterDate}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                disabled={viewMode === "all"}
              />
            </div>

            {/* Botões de modo de visualização */}
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
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Transações
            </button>
            <button
              onClick={() => setShowNewTransactionModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
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
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalIncome)}
            </span>
          </Box>

          <Box className="p-6 rounded-xl flex-1">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm">Despesas</span>
            </div>
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalExpenses)}
            </span>
          </Box>

          <Box className="p-6 rounded-xl flex-1">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm">Saldo</span>
            </div>
            <span
              className={`text-2xl font-semibold ${
                netIncome >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatCurrency(netIncome)}
            </span>
          </Box>

          <Box className="p-6 rounded-xl flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">Saldo Asaas</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDebug}
                  className="p-1 text-gray-500 hover:text-purple-500 transition-colors"
                  title="Depurar"
                >
                  <Bug className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRefreshAsaasBalance}
                  disabled={asaas.isLoading || !asaas.apiKey}
                  className="p-1 text-gray-500 hover:text-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Atualizar saldo"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      asaas.isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
            {asaas.apiKey ? (
              <>
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(asaas.balance)}
                </span>
                {asaas.lastUpdated && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Atualizado: {formatLastUpdated(asaas.lastUpdated)}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>Configure a API do Asaas</span>
              </div>
            )}
          </Box>
        </div>

        <Box className="rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
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
                {getFilteredTransactions().map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-200 dark:border-dark-700 last:border-0"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {transaction.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {transaction.category}
                    </td>
                    <td
                      className={`py-3 px-4 text-sm text-right ${
                        transaction.type === "income"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}{" "}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === "concluido"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : transaction.status === "pendente"
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
                          onClick={() => handleEditClick(transaction)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Box>
      </div>

      <NewTransactionModal
        isOpen={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
      />

      {selectedTransaction && (
        <EditTransactionModal
          isOpen={showEditTransactionModal}
          onClose={() => {
            setShowEditTransactionModal(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}

      <CustomModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Limpar Transações"
        message="Tem certeza que deseja limpar todas as transações? Esta ação não pode ser desfeita."
        type="confirm"
        onConfirm={handleClearTransactions}
      />

      <CustomModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTransaction(null);
        }}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        type="confirm"
        onConfirm={handleDeleteTransaction}
      />
    </div>
  );
}
