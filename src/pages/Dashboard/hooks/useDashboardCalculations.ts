import { useMemo } from "react";
import { useContractStore } from "../../../store/contractStore";
import { useTransactionStore } from "../../../store/transactionStore";

export function useDashboardCalculations(
  dashboardActiveBoard: any,
  dashboardTransactionsData: any[]
) {
  const contractStore = useContractStore();
  const { transactions } = useTransactionStore();
  const contracts = contractStore?.contracts ?? [];

  const normalize = (str: string) => {
    return str
      ? str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .toLowerCase()
      : "";
  };

  const completedSalesValue = useMemo(() => {
    if (!dashboardActiveBoard?.lists) return 0;

    const concluido = dashboardActiveBoard.lists.find((l: any) =>
      normalize(l.name).includes("concluido")
    );

    return (
      concluido?.cards?.reduce(
        (sum: number, card: any) => sum + (Number(card.value) || 0),
        0
      ) || 0
    );
  }, [dashboardActiveBoard]);

  const totalKanbanValue = useMemo(() => {
    if (!dashboardActiveBoard?.lists) return 0;

    const sumList = (list: any) =>
      list?.cards?.reduce(
        (sum: number, card: any) => sum + (Number(card.value) || 0),
        0
      ) || 0;

    return dashboardActiveBoard.lists.reduce(
      (total: number, list: any) => total + sumList(list),
      0
    );
  }, [dashboardActiveBoard]);

  const conversionRate = useMemo(() => {
    if (totalKanbanValue === 0) return 0;
    return (completedSalesValue / totalKanbanValue) * 100;
  }, [completedSalesValue, totalKanbanValue]);

  const contractData = useMemo(
    () => [
      {
        status: "Rascunho",
        value: contracts.filter((c) => c?.status === "DRAFT").length,
      },
      {
        status: "Pendente",
        value: contracts.filter((c) => c?.status === "PENDING").length,
      },
      {
        status: "Ativo",
        value: contracts.filter((c) => c?.status === "ACTIVE").length,
      },
    ],
    [contracts]
  );

  const filteredTransactions = useMemo(() => {
    try {
      return dashboardTransactionsData || [];
    } catch {
      return [];
    }
  }, [dashboardTransactionsData]);

  return {
    totalKanbanValue,
    completedSalesValue,
    conversionRate,
    contractData,
    filteredTransactions,
    contracts,
  };
}
