import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import { useKanbanStore } from "../Clients/store/kanbanStore";
import { useFinancialStore } from "../../store/financialStore";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import { useContractStore } from "../../store/contractStore";
import { useTeamStore } from "../Team/store/teamStore";
import {
  Download,
  ChevronDown,
  Users,
  DollarSign,
  CheckCircle,
  Target,
  Calendar,
  Sliders,
  Grid,
  Bookmark,
  X,
  ChevronRight,
} from "lucide-react";
import {
  format,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import { BoardSelector } from "../Clients/components/BoardSelector";
import { useCalendarStore } from "../../store/calendarStore";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";

// Registrar locale ptBR para o DatePicker
registerLocale("pt-BR", ptBR);

// Componente de fallback para carregamento
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7f00ff]"></div>
  </div>
);

// Componente de erro
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="text-center p-4">
    <p className="text-red-500">{message}</p>
  </div>
);

export function Dashboard() {
  const { logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [exportOptions, setExportOptions] = useState({
    kanbanValues: true,
    contractStatus: true,
    financialData: true,
    sellerRanking: true,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [lastPeriodValue, setLastPeriodValue] = useState(0);
  const [currentPeriodValue, setCurrentPeriodValue] = useState(0);
  const [theme, setTheme] = useState("light");
  const [showAllSellersModal, setShowAllSellersModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    responsible: "",
  });
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any>(null);

  // Função para controlar o scroll do body quando modais estão abertos
  useEffect(() => {
    const anyModalOpen =
      showAllSellersModal || showExportModal || showBoardSelector;

    if (anyModalOpen) {
      // Bloquear scroll no body quando um modal está aberto
      document.body.classList.add("overflow-hidden");
    } else {
      // Restaurar scroll quando todos os modais estão fechados
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup - restaurar scroll se o componente for desmontado com modal aberto
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showAllSellersModal, showExportModal, showBoardSelector]);

  // Usar todos os stores necessários
  const kanbanStore = useKanbanStore();
  const financialStore = useFinancialStore();
  const contractStore = useContractStore();
  const { members } = useTeamStore();

  // Extrair os dados necessários de cada store
  const boards = kanbanStore?.boards ?? [];
  const transactions = financialStore?.transactions ?? [];
  const contracts = contractStore?.contracts ?? [];
  const getCompletedListId = kanbanStore?.getCompletedListId;

  // Melhorar a inicialização dos stores com useCallback
  const initializeStores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Garantir que os stores estão inicializados
      if (
        !kanbanStore?.initialized ||
        !financialStore?.initialized ||
        !contractStore?.initialized
      ) {
        await Promise.all([
          kanbanStore?.initialize?.(),
          financialStore?.initialize?.(),
          contractStore?.initialize?.(),
        ]);
      }

      // Verificar se os stores estão disponíveis
      if (!kanbanStore || !financialStore || !contractStore) {
        throw new Error("Falha ao carregar dados dos stores");
      }

      // Verificar se os dados necessários estão disponíveis e são válidos
      if (!Array.isArray(boards)) {
        console.warn("Boards não é um array:", boards);
        throw new Error("Dados do quadro inválidos");
      }

      if (!Array.isArray(transactions)) {
        console.warn("Transactions não é um array:", transactions);
        throw new Error("Dados financeiros inválidos");
      }

      if (!Array.isArray(contracts)) {
        console.warn("Contracts não é um array:", contracts);
        throw new Error("Dados de contratos inválidos");
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao inicializar stores:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao carregar os dados"
      );

      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 2000);
      }
    }
  }, [
    kanbanStore,
    financialStore,
    contractStore,
    retryCount,
    boards,
    transactions,
    contracts,
  ]);

  // Usar useEffect para inicialização e cleanup
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const loadData = async () => {
      if (!mounted) return;

      try {
        await initializeStores();
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        if (mounted && retryCount < 3) {
          retryTimeout = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [initializeStores]);

  useEffect(() => {
    // Se não houver quadro selecionado, selecionar o primeiro disponível
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(boards[0].id);
    }
  }, [boards, selectedBoard]);

  // Adicionar verificações de segurança extras nos cálculos
  const selectedKanbanBoard = React.useMemo(() => {
    try {
      if (!Array.isArray(boards)) return null;
      return boards.find((b) => b?.id === selectedBoard);
    } catch {
      console.warn("Erro ao buscar quadro selecionado");
      return null;
    }
  }, [boards, selectedBoard]);

  const completedListId = React.useMemo(() => {
    try {
      if (!selectedKanbanBoard?.id || !getCompletedListId) return null;
      return getCompletedListId(selectedKanbanBoard.id);
    } catch {
      console.warn("Erro ao buscar lista completada");
      return null;
    }
  }, [selectedKanbanBoard, getCompletedListId]);

  const completedList = React.useMemo(
    () => selectedKanbanBoard?.lists?.find((l) => l?.id === completedListId),
    [selectedKanbanBoard, completedListId]
  );

  const totalKanbanValue = React.useMemo(() => {
    try {
      return (
        selectedKanbanBoard?.lists?.reduce((total, list) => {
          if (!list?.cards) return total;
          const listTotal = list.cards.reduce((sum, card) => {
            if (!card) return sum;
            const cardValue = Number(card.value);
            return sum + (isNaN(cardValue) ? 0 : cardValue);
          }, 0);
          return total + (listTotal ?? 0);
        }, 0) ?? 0
      );
    } catch {
      return 0;
    }
  }, [selectedKanbanBoard]);

  const completedSalesValue = React.useMemo(() => {
    try {
      return (
        completedList?.cards?.reduce((sum, card) => {
          if (!card) return sum;
          const cardValue = Number(card.value);
          return sum + (isNaN(cardValue) ? 0 : cardValue);
        }, 0) ?? 0
      );
    } catch {
      return 0;
    }
  }, [completedList]);

  // Filtrar transações com verificações de segurança
  const filteredTransactions = React.useMemo(() => {
    try {
      return transactions.filter((t) => {
        if (!t?.date) return false;
        const date = new Date(t.date);
        return !isNaN(date.getTime()) && date >= startDate && date <= endDate;
      });
    } catch {
      return [];
    }
  }, [transactions, startDate, endDate]);

  // Dados de status de contrato com verificações de segurança
  const contractData = React.useMemo(
    () => [
      {
        status: "Rascunho",
        value: contracts.filter((c) => c?.status === "Draft").length,
      },
      {
        status: "Pendente",
        value: contracts.filter((c) => c?.status === "Pending").length,
      },
      {
        status: "Ativo",
        value: contracts.filter((c) => c?.status === "Active").length,
      },
    ],
    [contracts]
  );

  // Obter os top vendedores a partir dos cartões concluídos
  const topSellers = React.useMemo(() => {
    try {
      console.log("---------- DIAGNÓSTICO COMPLETO TOP VENDEDORES ----------");

      // 1. Verificar o quadro selecionado
      console.log("Quadro selecionado:", selectedBoard);
      console.log("Quadro encontrado:", selectedKanbanBoard);

      // 2. Verificar lista de concluídos
      console.log("ID da lista concluída:", completedListId);
      console.log("Lista concluída:", completedList);

      // 3. Verificar se a lista tem cartões
      const hasCards = completedList?.cards && completedList.cards.length > 0;
      console.log("Lista tem cartões:", hasCards);
      if (hasCards) {
        console.log("Quantidade de cartões:", completedList?.cards?.length);
      }

      // 4. Verificar membros disponíveis
      console.log("Membros disponíveis:", members);

      if (!selectedBoard) {
        console.log("Nenhum quadro selecionado");
        return [];
      }

      if (!completedListId) {
        console.log("Nenhuma lista configurada como concluída neste quadro");
        return [];
      }

      if (!completedList) {
        console.log("Lista concluída não encontrada");
        return [];
      }

      if (!completedList?.cards || completedList.cards.length === 0) {
        console.log("Lista concluída não tem cartões");
        return [];
      }

      // Verificar se os cartões têm responsáveis
      const cardsWithResponsible = completedList.cards.filter(
        (card) => card.responsibleId
      );
      console.log("Cartões com responsável:", cardsWithResponsible.length);
      console.log(
        "Detalhes dos cartões com responsável:",
        cardsWithResponsible.map((c) => ({
          id: c.id,
          title: c.title,
          responsibleId: c.responsibleId,
          value: c.value,
        }))
      );

      if (cardsWithResponsible.length === 0) {
        console.log("Nenhum cartão com responsável atribuído");
        return [];
      }

      // Agrupar os cartões por responsável
      const sellerStats = completedList.cards.reduce((acc, card) => {
        if (!card.responsibleId) {
          return acc;
        }

        const responsibleId = card.responsibleId;
        const cardValue = Number(card.value) || 0;

        // Buscar o responsável nos membros disponíveis
        const responsibleMember = members.find((m) => m.id === responsibleId);

        // Chave para agrupar os cartões do mesmo responsável
        const sellerKey = responsibleId;

        if (!acc[sellerKey]) {
          acc[sellerKey] = {
            id: responsibleId,
            name: responsibleMember?.name || "Responsável Desconhecido",
            count: 0,
            totalValue: 0,
          };
        }

        acc[sellerKey].count += 1;
        acc[sellerKey].totalValue += cardValue;

        return acc;
      }, {} as Record<string, { id: string; name: string; count: number; totalValue: number }>);

      console.log("Estatísticas finais de vendedores:", sellerStats);
      console.log("---------- FIM DIAGNÓSTICO TOP VENDEDORES ----------");

      // Converter para array e ordenar por valor total
      return Object.values(sellerStats).sort(
        (a, b) => b.totalValue - a.totalValue
      );
    } catch (error) {
      console.error("Erro ao processar top vendedores:", error);
      return [];
    }
  }, [
    completedList,
    members,
    selectedBoard,
    selectedKanbanBoard,
    completedListId,
  ]);

  // Dados financeiros com verificações de segurança
  const financialData = useMemo(() => {
    try {
      if (!transactions || transactions.length === 0) {
        return [
          {
            id: "receitas",
            data: [{ x: new Date().toISOString().split("T")[0], y: 0 }],
          },
          {
            id: "despesas",
            data: [{ x: new Date().toISOString().split("T")[0], y: 0 }],
          },
        ];
      }

      // Agrupar transações por data
      const groupedTransactions = transactions.reduce((acc, transaction) => {
        if (!transaction?.date || !transaction?.amount || !transaction?.type)
          return acc;

        const date = format(new Date(transaction.date), "yyyy-MM-dd");
        const amount = Number(transaction.amount);

        if (!acc[date]) {
          acc[date] = { income: 0, expenses: 0 };
        }

        if (transaction.type === "income") {
          acc[date].income += amount;
        } else if (transaction.type === "expense") {
          acc[date].expenses += amount;
        }

        return acc;
      }, {} as Record<string, { income: number; expenses: number }>);

      // Ordenar datas
      const dates = Object.keys(groupedTransactions).sort();

      // Criar séries de dados
      return [
        {
          id: "receitas",
          data: dates.map((date) => ({
            x: date,
            y: groupedTransactions[date].income,
          })),
        },
        {
          id: "despesas",
          data: dates.map((date) => ({
            x: date,
            y: groupedTransactions[date].expenses,
          })),
        },
      ];
    } catch (error) {
      console.error("Erro ao processar dados financeiros:", error);
      return [
        {
          id: "receitas",
          data: [{ x: new Date().toISOString().split("T")[0], y: 0 }],
        },
        {
          id: "despesas",
          data: [{ x: new Date().toISOString().split("T")[0], y: 0 }],
        },
      ];
    }
  }, [transactions]);

  // Calcula o valor do período anterior (últimos 30 dias)
  useEffect(() => {
    const calculateLastPeriodValue = () => {
      if (!transactions) return;

      const today = new Date();
      const thirtyDaysAgo = new Date(
        today.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

      const lastPeriodTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= thirtyDaysAgo && transactionDate <= today;
      });

      const lastPeriodTotal = lastPeriodTransactions.reduce(
        (total, transaction) => {
          return (
            total + (transaction.type === "income" ? transaction.value : 0)
          );
        },
        0
      );

      setLastPeriodValue(lastPeriodTotal);
    };

    calculateLastPeriodValue();
  }, [transactions]);

  const handleExport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      const today = format(new Date(), "dd-MM-yyyy");

      if (exportOptions.kanbanValues) {
        csvContent += "Valores do Kanban\n";
        csvContent += `Total do Kanban,${totalKanbanValue}\n`;
        csvContent += `Vendas Concluídas,${completedSalesValue}\n\n`;
      }

      if (exportOptions.contractStatus) {
        csvContent += "Status dos Contratos\n";
        csvContent += "Status,Quantidade\n";
        contractData.forEach(({ status, value }) => {
          csvContent += `${status},${value}\n`;
        });
        csvContent += "\n";
      }

      if (exportOptions.financialData) {
        csvContent += "Dados Financeiros\n";
        csvContent += "Data,Tipo,Valor\n";
        filteredTransactions.forEach((transaction) => {
          if (transaction?.date && transaction?.type && transaction?.amount) {
            csvContent += `${format(
              new Date(transaction.date),
              "dd/MM/yyyy"
            )},${transaction.type},${transaction.amount}\n`;
          }
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `dashboard-report-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erro ao exportar dados:", err);
      setError("Falha ao exportar o relatório. Tente novamente.");
    }
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Dados do gráfico de vendas
  const salesChartOptions = useMemo(
    () => ({
      chart: {
        type: "area" as const,
        toolbar: {
          show: false,
        },
        background: "transparent",
      },
      theme: {
        mode: theme === "dark" ? ("dark" as const) : ("light" as const),
      },
      stroke: {
        curve: "smooth" as const,
        width: 3,
      },
      colors: ["#7f00ff", "#00e396"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 100],
        },
      },
      dataLabels: {
        enabled: false,
      },
      grid: {
        borderColor: theme === "dark" ? "#333" : "#e5e7eb",
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: {
        type: "datetime" as const,
        labels: {
          style: {
            colors: theme === "dark" ? "#cbd5e1" : "#475569",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => formatCurrency(value),
          style: {
            colors: theme === "dark" ? "#cbd5e1" : "#475569",
          },
        },
      },
      tooltip: {
        x: {
          format: "dd MMM yyyy",
        },
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
    }),
    [theme]
  );

  // Preparar dados para o gráfico de vendas
  const salesChartData = useMemo(() => {
    const dates = new Set<string>();
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    // Adicionar todas as datas no intervalo
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dates.add(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Agrupar transações por data
    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toISOString().split("T")[0];
      if (transaction.type === "income") {
        incomeMap.set(date, (incomeMap.get(date) || 0) + transaction.amount);
      } else {
        expenseMap.set(date, (expenseMap.get(date) || 0) + transaction.amount);
      }
    });

    // Criar séries de dados
    const sortedDates = Array.from(dates).sort();
    return [
      {
        name: "Receitas",
        data: sortedDates.map((date) => ({
          x: date,
          y: incomeMap.get(date) || 0,
        })),
      },
      {
        name: "Despesas",
        data: sortedDates.map((date) => ({
          x: date,
          y: expenseMap.get(date) || 0,
        })),
      },
    ];
  }, [filteredTransactions, startDate, endDate]);

  // Dados do gráfico de contratos
  const contractChartOptions = useMemo(
    () => ({
      chart: {
        type: "donut" as const,
        background: "transparent",
      },
      theme: {
        mode: theme === "dark" ? ("dark" as const) : ("light" as const),
      },
      colors: ["#7f00ff", "#00e396", "#feb019"],
      labels: ["Ativos", "Pendentes", "Rascunhos"],
      stroke: {
        show: false,
      },
      legend: {
        position: "bottom" as const,
        labels: {
          colors: theme === "dark" ? "#cbd5e1" : "#475569",
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce(
                    (a: number, b: number) => a + b,
                    0
                  );
                  return total.toString();
                },
              },
            },
          },
        },
      },
    }),
    [theme]
  );

  const contractChartData = useMemo(
    () => [
      contracts.filter((c) => c?.status === "Active").length,
      contracts.filter((c) => c?.status === "Pending").length,
      contracts.filter((c) => c?.status === "Draft").length,
    ],
    [contracts]
  );

  // Buscar eventos do calendário
  const { events: calendarEvents } = useCalendarStore();

  // Calcular os próximos eventos (mostrar os próximos 3)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return calendarEvents
      .filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Incluir eventos que:
        // 1. Ainda não começaram (estão no futuro)
        // 2. Já começaram mas ainda não terminaram (estão acontecendo agora)
        return (
          (isAfter(eventStart, now) &&
            isBefore(eventStart, endOfDay(nextWeek))) ||
          (isBefore(eventStart, now) && isAfter(eventEnd, now))
        );
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [calendarEvents]);

  // Função para calcular o status do tempo do evento
  const getEventTimeStatus = (event) => {
    const now = new Date();
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Evento está acontecendo agora
    if (isBefore(eventStart, now) && isAfter(eventEnd, now)) {
      return {
        label: "AGORA",
        bgColor: "bg-red-500",
        borderColor: "border-red-500",
      };
    }

    // Evento é hoje
    if (
      isAfter(eventStart, now) &&
      startOfDay(eventStart).getTime() === startOfDay(now).getTime()
    ) {
      return {
        label: "HOJE",
        bgColor: "bg-red-500",
        borderColor: "border-red-500",
      };
    }

    // Evento é amanhã
    if (
      startOfDay(eventStart).getTime() === startOfDay(addDays(now, 1)).getTime()
    ) {
      return {
        label: "AMANHÃ",
        bgColor: "bg-amber-500",
        borderColor: "border-amber-500",
      };
    }

    // Evento futuro
    return {
      label: format(eventStart, "EEE", { locale: ptBR }).toUpperCase(),
      bgColor: "bg-gray-500",
      borderColor: "border-gray-500",
    };
  };

  // Função para adicionar um novo evento
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title) {
      return; // Evitar criar eventos sem título
    }

    // Adicionar evento ao store de calendário
    const { addEvent } = useCalendarStore.getState();
    addEvent(newEvent);

    // Resetar formulário e fechar modal
    setNewEvent({
      title: "",
      description: "",
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 1)),
      responsible: "",
    });
    setShowNewEventModal(false);
  };

  // Adicionar uma função para lidar com o clique no evento
  const handleEventClick = (event: any) => {
    setSelectedCalendarEvent(event);
    setShowEventDetails(true);
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

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
          {/* Header do Dashboard com seleção de quadro */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 border border-purple-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h4v4H4V6zm6 0h4v4h-4V6zm6 0h4v4h-4V6zM4 14h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-purple-600">Dashboards</h1>

              {/* Botão de Logout Forçado */}
              {/* <button
    onClick={() => {
      localStorage.clear();
      window.location.href = '/login';
    }}
    className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
  >
    Logout Forçado
  </button> */}
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button
                onClick={() => setShowBoardSelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <span className="text-sm font-medium">
                  {selectedKanbanBoard
                    ? selectedKanbanBoard.title
                    : "Selecionar Quadro"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
              >
                <Download className="w-5 h-5" />
                Exportar Relatório
              </button>
            </div>
          </div>

          {/* Board Selector Modal */}
          <BoardSelector
            boards={boards}
            activeBoard={selectedBoard}
            onSelectBoard={setSelectedBoard}
            isOpen={showBoardSelector}
            onClose={() => setShowBoardSelector(false)}
          />

          {/* Quick Access Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Link
              to="/dashboard/clients"
              className="p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Grid className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    Kanban
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gestão de negócios
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/dashboard/financial"
              className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    Financeiro
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Controle financeiro
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/dashboards/contracts"
              className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Bookmark className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    Contratos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gestão de contratos
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/dashboard/settings"
              className="p-4 bg-gradient-to-br from-sky-500/10 to-cyan-500/10 rounded-xl border border-sky-500/20 hover:border-sky-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 rounded-lg">
                  <Sliders className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    Configurações
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ajustes do sistema
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Valor Total em Negociação
                </h3>
                <div className="p-2 bg-[#7f00ff]/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-[#7f00ff]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalKanbanValue)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No quadro selecionado
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Vendas Concluídas
                </h3>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(completedSalesValue)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No período selecionado
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Taxa de Conversão
                </h3>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {totalKanbanValue > 0
                  ? `${((completedSalesValue / totalKanbanValue) * 100).toFixed(
                      1
                    )}%`
                  : "0%"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Vendas concluídas / Total em negociação
              </p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Movimentação Financeira
                </h3>
                <div className="flex items-center gap-2">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => date && setStartDate(date)}
                    className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-200"
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                  />
                  <span className="text-gray-500 dark:text-gray-400">até</span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => date && setEndDate(date)}
                    className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-200"
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                  />
                </div>
              </div>
              <div className="h-[400px]">
                <ReactApexChart
                  options={salesChartOptions}
                  series={salesChartData}
                  type="area"
                  height="100%"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Status dos Contratos
                </h3>
              </div>
              <div className="h-[400px]">
                <ReactApexChart
                  options={contractChartOptions}
                  series={contractChartData}
                  type="donut"
                  height="100%"
                />
              </div>
            </div>
          </div>

          {/* Top Vendedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Top Vendedores
                </h3>
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
              </div>

              <div className="mt-4">
                {topSellers.length > 0 ? (
                  <>
                    <div className="mb-2 px-1">
                      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span>Vendedor</span>
                        <span>Desempenho</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {topSellers.slice(0, 3).map((seller, index) => {
                        // Definir cores diferentes para cada posição
                        const positionColor =
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-amber-700"
                            : "bg-purple-500";

                        const cardBgClass =
                          index === 0
                            ? "bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                            : index === 1
                            ? "bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/40"
                            : index === 2
                            ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                            : "bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20";

                        const avatarBgClass =
                          index === 0
                            ? "from-yellow-400 to-amber-500"
                            : index === 1
                            ? "from-gray-400 to-gray-500"
                            : index === 2
                            ? "from-amber-700 to-amber-800"
                            : "from-purple-500 to-indigo-600";

                        // Buscar o nome correto do responsável diretamente de members
                        const sellerName =
                          seller.name || "Responsável Desconhecido";

                        // Calcular as iniciais do nome
                        const initials = sellerName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        // Posição
                        const position = index + 1;

                        return (
                          <div
                            key={seller.id}
                            className={`relative p-3 rounded-lg transition-all ${cardBgClass} group`}
                          >
                            {/* Badge de posição */}
                            <div
                              className={`absolute -top-2 -left-2 w-6 h-6 ${positionColor} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                            >
                              {position}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 pl-2">
                                <div
                                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarBgClass} flex items-center justify-center text-white text-sm font-medium shadow-sm`}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {sellerName}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {seller.count}{" "}
                                      {seller.count === 1 ? "venda" : "vendas"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                  {formatCurrency(seller.totalValue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {topSellers.length > 3 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700">
                        <button
                          onClick={() => setShowAllSellersModal(true)}
                          className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                        >
                          Ver todos os vendedores ({topSellers.length})
                          <ChevronDown className="w-3 h-3 transform rotate-[-90deg]" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedBoard
                        ? completedListId
                          ? completedList?.cards?.length
                            ? completedList.cards.some((c) => c.responsibleId)
                              ? "Erro ao processar vendedores. Verifique o console."
                              : "Os cartões concluídos não têm responsáveis atribuídos"
                            : "Não há cartões na lista concluída"
                          : "Nenhuma lista definida como concluída neste quadro"
                        : "Selecione um quadro para ver os vendedores"}
                    </p>
                    {selectedBoard && !completedListId && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-3 max-w-xs">
                        Configure uma lista como "Concluída" nas configurações
                        do quadro Kanban
                      </p>
                    )}
                    {selectedBoard &&
                      selectedKanbanBoard &&
                      !completedListId &&
                      selectedKanbanBoard.lists?.length > 0 && (
                        <div className="mb-3">
                          <select
                            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-200 mb-2"
                            onChange={(e) => {
                              const listId = e.target.value;
                              if (listId && selectedBoard) {
                                // Configurar a lista selecionada como concluída
                                kanbanStore.setCompletedList(
                                  selectedBoard,
                                  listId
                                );
                                // Forçar a atualização
                                setTimeout(() => {
                                  // Forçar re-renderização após configurar a lista
                                }, 500);
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">
                              Selecione uma lista para marcar como concluída
                            </option>
                            {selectedKanbanBoard.lists.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.title}
                              </option>
                            ))}
                          </select>
                          <button
                            className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium"
                            onClick={(e) => {
                              const select = e.currentTarget
                                .previousSibling as HTMLSelectElement;
                              const listId = select.value;
                              if (listId && selectedBoard) {
                                kanbanStore.setCompletedList(
                                  selectedBoard,
                                  listId
                                );
                                // Forçar a atualização
                                setTimeout(() => {
                                  window.location.reload();
                                }, 500);
                              }
                            }}
                          >
                            Configurar como Concluída
                          </button>
                        </div>
                      )}

                    <div className="flex gap-2">
                      <button
                        className="mt-1 py-1.5 px-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium"
                        onClick={() => setShowBoardSelector(true)}
                      >
                        {selectedBoard ? "Mudar quadro" : "Selecionar quadro"}
                      </button>

                      <button
                        className="mt-1 py-1.5 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium"
                        onClick={() => {
                          // Auto-diagnóstico e tentativa de reparo
                          console.log("Iniciando diagnóstico automático...");

                          // 1. Verificar o store do Kanban
                          if (!selectedBoard) {
                            if (boards.length > 0) {
                              setSelectedBoard(boards[0].id);
                              console.log(
                                "Selecionando automaticamente o primeiro quadro:",
                                boards[0].id
                              );
                            } else {
                              console.log(
                                "Não há quadros disponíveis para selecionar"
                              );
                              return;
                            }
                          }

                          // 2. Verificar lista completada
                          if (
                            selectedBoard &&
                            !completedListId &&
                            selectedKanbanBoard?.lists?.length > 0
                          ) {
                            // Selecionar a última lista como concluída (geralmente é a de "Concluídos")
                            const lastList =
                              selectedKanbanBoard.lists[
                                selectedKanbanBoard.lists.length - 1
                              ];
                            if (lastList) {
                              console.log(
                                "Configurando automaticamente a última lista como concluída:",
                                lastList.id
                              );
                              kanbanStore.setCompletedList(
                                selectedBoard,
                                lastList.id
                              );
                            }
                          }

                          // 3. Verificar team store
                          console.log("Team store members:", members);

                          // 4. Recarregar a página para aplicar as alterações
                          alert(
                            "Correções aplicadas. A página será recarregada para aplicar as mudanças."
                          );
                          window.location.reload();
                        }}
                      >
                        Verificação Automática
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Próximos Eventos */}
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Próximos Eventos
                </h3>
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {upcomingEvents.length > 0 ? (
                  <>
                    {upcomingEvents.map((event) => {
                      const timeStatus = getEventTimeStatus(event);
                      const eventDate = new Date(event.start);

                      // Buscar o responsável pelo evento
                      const responsible = members.find(
                        (member) => member.id === event.responsible
                      );

                      // Iniciais do responsável
                      const initials = responsible
                        ? responsible.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                        : "";

                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/50 rounded transition-colors"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="min-w-[50px] text-center">
                            <div
                              className={`${timeStatus.bgColor} text-white text-[10px] font-bold py-0.5 rounded-t-lg`}
                            >
                              {timeStatus.label}
                            </div>
                            <div className="bg-gray-100 dark:bg-dark-700 py-1 rounded-b-lg">
                              <span className="block text-base font-bold text-gray-800 dark:text-gray-200">
                                {format(eventDate, "dd")}
                              </span>
                              <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                                {format(eventDate, "MMM", {
                                  locale: ptBR,
                                }).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex-1 bg-gray-50 dark:bg-dark-700 p-2 rounded-lg border-l-3 ${timeStatus.borderColor}`}
                          >
                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-0.5">
                              {event.title}
                            </p>
                            <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.start), "HH:mm")} -{" "}
                                {format(new Date(event.end), "HH:mm")}
                              </span>
                              {event.description && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>
                                    {event.description.substring(0, 30)}
                                    {event.description.length > 30 ? "..." : ""}
                                  </span>
                                </>
                              )}
                            </div>
                            {responsible && (
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-medium">
                                  {initials}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Não há eventos programados para os próximos 7 dias
                    </p>
                  </div>
                )}

                {/* Botão para ver mais */}
                <div className="pt-2 mt-2 border-t border-gray-100 dark:border-dark-700">
                  <Link
                    to="/dashboard/calendar"
                    className="w-full py-1.5 px-3 bg-gray-50 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  >
                    Ver calendário completo
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Todos os Vendedores */}
          {showAllSellersModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-2xl overflow-hidden flex flex-col shadow-xl m-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Todos os Vendedores
                  </h3>
                  <button
                    onClick={() => setShowAllSellersModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh] pr-2">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white dark:bg-dark-800">
                      <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-700">
                        <th className="pb-2 w-16">#</th>
                        <th className="pb-2">Vendedor</th>
                        <th className="pb-2 text-center">Vendas</th>
                        <th className="pb-2 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                      {topSellers.map((seller, index) => {
                        // Definir cores para posição
                        const positionColor =
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                            ? "text-gray-400"
                            : index === 2
                            ? "text-amber-700"
                            : "text-gray-500 dark:text-gray-400";

                        // Buscar as iniciais do nome
                        const initials = seller.name
                          .split(" ")
                          .map((part: string) => part[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        const avatarBgClass =
                          index === 0
                            ? "from-yellow-400 to-amber-500"
                            : index === 1
                            ? "from-gray-400 to-gray-500"
                            : index === 2
                            ? "from-amber-700 to-amber-800"
                            : "from-purple-500 to-indigo-600";

                        return (
                          <tr
                            key={seller.id}
                            className="hover:bg-gray-50 dark:hover:bg-dark-700/50"
                          >
                            <td className="py-3">
                              <span className={`font-bold ${positionColor}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarBgClass} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                                >
                                  {initials}
                                </div>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {seller.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {seller.count}{" "}
                                {seller.count === 1 ? "venda" : "vendas"}
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium text-gray-800 dark:text-gray-200">
                              {formatCurrency(seller.totalValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 flex justify-end">
                  <button
                    onClick={() => setShowAllSellersModal(false)}
                    className="px-4 py-2 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-sm font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showExportModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-96 shadow-xl m-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Exportar Relatório
                  </h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 py-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.kanbanValues}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          kanbanValues: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Valores do Kanban
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.contractStatus}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          contractStatus: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Status dos Contratos
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.financialData}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          financialData: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Dados Financeiros
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-dark-700">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 bg-gray-50 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleExport();
                      setShowExportModal(false);
                    }}
                    className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
                  >
                    Exportar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showNewEventModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md overflow-hidden flex flex-col shadow-xl m-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Adicionar Novo Evento
                  </h3>
                  <button
                    onClick={() => setShowNewEventModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Início
                      </label>
                      <DatePicker
                        selected={newEvent.start}
                        onChange={(date: Date | null) =>
                          date && setNewEvent({ ...newEvent, start: date })
                        }
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="dd/MM/yyyy HH:mm"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                        locale="pt-BR"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Fim
                      </label>
                      <DatePicker
                        selected={newEvent.end}
                        onChange={(date: Date | null) =>
                          date && setNewEvent({ ...newEvent, end: date })
                        }
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="dd/MM/yyyy HH:mm"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                        locale="pt-BR"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Responsável
                    </label>
                    <select
                      value={newEvent.responsible}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          responsible: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                    >
                      <option value="">Selecione um responsável</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewEventModal(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
                    >
                      Adicionar Evento
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedCalendarEvent && showEventDetails && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md overflow-hidden flex flex-col shadow-xl m-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Detalhes do Evento
                  </h3>
                  <button
                    onClick={() => setShowEventDetails(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {selectedCalendarEvent.title}
                    </h4>

                    {selectedCalendarEvent.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {selectedCalendarEvent.description}
                      </p>
                    )}

                    <div className="flex flex-col space-y-3 mb-4">
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        <div>
                          <div className="font-medium">Horário</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {format(
                              new Date(selectedCalendarEvent.start),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR }
                            )}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {format(
                              new Date(selectedCalendarEvent.start),
                              "HH:mm",
                              { locale: ptBR }
                            )}{" "}
                            -
                            {format(
                              new Date(selectedCalendarEvent.end),
                              "HH:mm",
                              { locale: ptBR }
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedCalendarEvent.responsible && (
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-green-500" />
                          <div>
                            <div className="font-medium">Responsável</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {members.find(
                                (member) =>
                                  member.id ===
                                  selectedCalendarEvent.responsible
                              )?.name || "Não definido"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-dark-700">
                    <Link
                      to="/dashboard/calendar"
                      className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors text-sm"
                    >
                      Ir para Calendário
                    </Link>
                    <button
                      onClick={() => setShowEventDetails(false)}
                      className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
