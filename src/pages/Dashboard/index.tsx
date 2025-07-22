import React, { useState, useEffect, Suspense, useMemo } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import { useContractStore } from "../../store/contractStore";
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
  Clock,
  Search,
  LineChart,
  AreaChart,
  BarChart2,
} from "lucide-react";
import {
  format,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import { BoardSelector } from "../Clients/components/BoardSelector";
import { ProtectedLink } from "../../components/ProtectedLink";
import { useCalendarStore } from "../../store/calendarStore";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { useBoardStore } from "../../store/boardStore";
import { useInviteStore } from "../../store/inviteStore";
import { useTransactionStore } from "../../store/transactionStore";
import { useDashboardTransactionStore } from "../../store/dashboardTransactionStore";
import { useTeamMembersStore } from "../../store/teamMembersStore";

// Registrar locale ptBR para o DatePicker
registerLocale("pt-BR", ptBR);

// Componente de fallback para carregamento
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7f00ff]"></div>
  </div>
);

// Componente de loading para dados do board
const BoardDataLoading = ({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7f00ff]"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Carregando dados...
            </span>
          </div>
        </div>
        <div className="opacity-50">{children}</div>
      </div>
    );
  }
  return <>{children}</>;
};

// Componente de erro
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="text-center p-4">
    <p className="text-red-500">{message}</p>
  </div>
);

export function Dashboard() {
  const { logout } = useAuthStore();
  const [isLoadingBoardData, setIsLoadingBoardData] = useState(false);
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

  const { summary: transactionSummary } = useTransactionStore();
  const {
    transactions: dashboardTransactions,
    summary: dashboardSummary,
    isLoading: isDashboardLoading,
    fetchDashboardTransactions,
    fetchDashboardSummary,
  } = useDashboardTransactionStore();
  const { token, user, organization } = useAuthStore();

  // Estado para filtro de data range
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês atual
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês atual
  });

  // Estado para tipo de gráfico (removido 'bar' - barras horizontais)
  const [chartType, setChartType] = useState<"area" | "line" | "column">(
    "area"
  );

  // Converter column para bar vertical (ApexCharts não suporta column diretamente)
  const getApexChartType = (
    type: typeof chartType
  ): "area" | "line" | "bar" => {
    return type === "column" ? "bar" : type;
  };

  // Helper para criar data sem problemas de timezone
  const createDateFromInput = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month é 0-indexed
  };

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

  const {
    boards,
    boardDashboardActiveId,
    boardDashboardActive,
    fetchAllBoards,
    selectAndLoadDashboardBoard,
    isLoading,
  } = useBoardStore();
  const contractStore = useContractStore();
  const { members } = useTeamMembersStore();
  const { topSellers } = useBoardStore();

  const { transactions } = useTransactionStore();
  const contracts = contractStore?.contracts ?? [];

  // Usar transações do dashboard em vez da store principal
  const dashboardTransactionsData = dashboardTransactions || [];

  // Debug: logar dados para entender o que está acontecendo
  React.useEffect(() => {
    console.log("[Dashboard] Dashboard transactions data:", {
      count: dashboardTransactionsData.length,
      data: dashboardTransactionsData.slice(0, 3), // Primeiras 3 para não poluir o log
      summary: dashboardSummary,
      isLoading: isDashboardLoading,
    });
  }, [dashboardTransactionsData, dashboardSummary, isDashboardLoading]);
  // Temporariamente removido até implementar com as novas stores
  const getCompletedListId = () => null;

  // Usar o boardDashboardActive que já vem com listas e cards
  const selectedKanbanBoard = boardDashboardActive;

  const completedListId = React.useMemo(() => {
    try {
      if (!boardDashboardActiveId || !getCompletedListId) return null;
      return getCompletedListId();
    } catch {
      console.warn("Erro ao buscar lista completada");
      return null;
    }
  }, [boardDashboardActiveId, getCompletedListId]);

  const completedList = React.useMemo(
    () => selectedKanbanBoard?.lists?.find((l) => l?.id === completedListId),
    [selectedKanbanBoard, completedListId]
  );

  // Usar diretamente os dados da store (já filtrados pela busca manual)
  const filteredTransactions = React.useMemo(() => {
    try {
      return dashboardTransactionsData || [];
    } catch {
      return [];
    }
  }, [dashboardTransactionsData]);

  // Dados de status de contrato com verificações de segurança
  const contractData = React.useMemo(
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

  // Função helper para gerenciar loading
  const setLoadingOperation = (operation: string, isLoading: boolean) => {
    setLoadingOperations((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(operation);
      } else {
        newSet.delete(operation);
      }
      setIsLoadingBoardData(newSet.size > 0);
      return newSet;
    });
  };

  useEffect(() => {
    if (boardDashboardActiveId) {
      console.log(
        "[Dashboard] Iniciando fetch de top sellers para board:",
        boardDashboardActiveId
      );
      setLoadingOperation("topSellers", true);
      const { fetchTopSellers } = useBoardStore.getState();
      fetchTopSellers(boardDashboardActiveId).finally(() => {
        setLoadingOperation("topSellers", false);
        console.log("[Dashboard] Fetch de top sellers finalizado");
      });
    } else {
      // Limpar dados quando não há board selecionado
      useBoardStore.getState().topSellers = { data: [] };
    }
  }, [boardDashboardActiveId]);

  // Dados financeiros com verificações de segurança
  const financialData = useMemo(() => {
    try {
      if (
        !dashboardTransactionsData ||
        dashboardTransactionsData.length === 0
      ) {
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
      const groupedTransactions = dashboardTransactionsData.reduce(
        (acc, transaction) => {
          if (!transaction?.date || !transaction?.value || !transaction?.type)
            return acc;

          const date = format(new Date(transaction.date), "yyyy-MM-dd");
          const value = Number(transaction.value);

          if (!acc[date]) {
            acc[date] = { income: 0, expenses: 0 };
          }

          if (transaction.type === "INCOME") {
            acc[date].income += value;
          } else if (transaction.type === "EXPENSE") {
            acc[date].expenses += value;
          }

          return acc;
        },
        {} as Record<string, { income: number; expenses: number }>
      );

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
  }, [dashboardTransactionsData]);

  // handleExport será definido depois das variáveis calculadas

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Mapeamento de ícones para tipos de gráfico (removido barras horizontais)
  const chartTypeIcons = {
    area: AreaChart,
    line: LineChart,
    column: BarChart2,
  };

  const chartTypeLabels = {
    area: "Área",
    line: "Linha",
    column: "Colunas",
  };

  // Dados do gráfico de vendas
  const salesChartOptions = useMemo(
    () => ({
      chart: {
        type: getApexChartType(chartType),
        toolbar: {
          show: false,
        },
        background: "transparent",
        locales: [
          {
            name: "pt-br",
            options: {
              months: [
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro",
              ],
              shortMonths: [
                "Jan",
                "Fev",
                "Mar",
                "Abr",
                "Mai",
                "Jun",
                "Jul",
                "Ago",
                "Set",
                "Out",
                "Nov",
                "Dez",
              ],
              days: [
                "Domingo",
                "Segunda",
                "Terça",
                "Quarta",
                "Quinta",
                "Sexta",
                "Sábado",
              ],
              shortDays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
              toolbar: {
                download: "Baixar SVG",
                selection: "Seleção",
                selectionZoom: "Zoom da Seleção",
                zoomIn: "Zoom In",
                zoomOut: "Zoom Out",
                pan: "Panorâmica",
                reset: "Resetar Zoom",
              },
            },
          },
        ],
        defaultLocale: "pt-br",
      },
      theme: {
        mode: theme === "dark" ? ("dark" as const) : ("light" as const),
      },
      stroke: {
        curve: "smooth" as const,
        width: chartType === "line" ? 3 : chartType === "area" ? 2 : 0,
      },
      colors: ["#7f00ff", "#00e396"],
      fill: (() => {
        if (chartType === "area") {
          return {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.2,
              stops: [0, 100],
            },
            opacity: 1,
          };
        }
        return {
          type: "solid",
          opacity: 0.9,
        };
      })(),
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
          formatter: function (value: any) {
            return new Date(value).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            });
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
          formatter: function (value: any) {
            return new Date(value).toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          },
        },
        y: {
          formatter: (value: number) => formatCurrency(value),
          title: {
            formatter: (seriesName: string) => seriesName + ":",
          },
        },
      },
      legend: {
        labels: {
          colors: theme === "dark" ? "#cbd5e1" : "#475569",
        },
      },
      plotOptions: {
        bar: {
          horizontal: false, // Sempre vertical (colunas)
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
    }),
    [theme, chartType]
  );

  // Preparar dados para o gráfico de vendas (só recalcula quando os dados mudam, não as datas do filtro)
  const salesChartData = useMemo(() => {
    console.log("[Dashboard] Preparando dados do gráfico com:", {
      filteredTransactionsCount: filteredTransactions.length,
      sampleTransactions: filteredTransactions.slice(0, 3),
    });

    if (!filteredTransactions.length) {
      return [
        { name: "Receitas", data: [] },
        { name: "Despesas", data: [] },
      ];
    }

    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    const allDates = new Set<string>();

    // Agrupar transações por data
    filteredTransactions.forEach((transaction) => {
      if (!transaction.date || !transaction.value || !transaction.type) return;

      const date = new Date(transaction.date).toISOString().split("T")[0];
      const value = Number(transaction.value);
      allDates.add(date);

      if (transaction.type === "INCOME") {
        incomeMap.set(date, (incomeMap.get(date) || 0) + value);
      } else if (transaction.type === "EXPENSE") {
        expenseMap.set(date, (expenseMap.get(date) || 0) + value);
      }
    });

    // Criar séries de dados
    const sortedDates = Array.from(allDates).sort();
    const chartData = [
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

    console.log("[Dashboard] Dados do gráfico gerados:", {
      chartData,
      totalIncome: Array.from(incomeMap.values()).reduce((a, b) => a + b, 0),
      totalExpenses: Array.from(expenseMap.values()).reduce((a, b) => a + b, 0),
    });

    return chartData;
  }, [filteredTransactions]);

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
      contracts.filter((c) => c?.status === "ACTIVE").length,
      contracts.filter((c) => c?.status === "PENDING").length,
      contracts.filter((c) => c?.status === "DRAFT").length,
    ],
    [contracts]
  );

  // Buscar eventos do calendário
  const { events: calendarEvents } = useCalendarStore();

  // Carregar eventos do calendário quando o componente montar
  useEffect(() => {
    if (token && user?.organization_id) {
      const { fetchEvents } = useCalendarStore.getState();
      fetchEvents(); // Buscar eventos do calendário
    }
  }, [token, user?.organization_id]); // Usando getState() para evitar dependência

  // Calcular os próximos eventos (mostrar os próximos 3)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return calendarEvents
      .filter((event) => {
        // Usar start_at e end_at que vêm da API
        const eventStart = new Date(event.start_at || event.start);
        const eventEnd = new Date(event.end_at || event.end);

        // Incluir eventos que:
        // 1. Ainda não começaram (estão no futuro)
        // 2. Já começaram mas ainda não terminaram (estão acontecendo agora)
        return (
          (isAfter(eventStart, now) &&
            isBefore(eventStart, endOfDay(nextWeek))) ||
          (isBefore(eventStart, now) && isAfter(eventEnd, now))
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_at || a.start).getTime() -
          new Date(b.start_at || b.start).getTime()
      )
      .slice(0, 3);
  }, [calendarEvents]);

  // Função para calcular o status do tempo do evento
  const getEventTimeStatus = (event) => {
    const now = new Date();
    const eventStart = new Date(event.start_at || event.start);
    const eventEnd = new Date(event.end_at || event.end);

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
    const calendarEvent = {
      ...newEvent,
      id: crypto.randomUUID(),
      start_at: newEvent.start.toISOString(),
      end_at: newEvent.end.toISOString(),
      color: "#7f00ff",
      organization_id: user?.organization_id || "",
      creator_id: user?.id || "",
      creator: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organization_id: user.organization_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
          }
        : {
            id: "",
            email: "",
            name: "",
            role: "",
            organization_id: "",
            created_at: "",
            updated_at: "",
          },
      categories: [],
      notifications: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addEvent(calendarEvent);

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

  // Função para buscar dados manualmente
  const handleSearchTransactions = React.useCallback(() => {
    if (!token || !user?.organization_id) return;

    const filters = {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };

    console.log("[Dashboard] Busca manual iniciada com filtros:", filters);

    setLoadingOperation("dashboardTransactions", true);

    // Usar getState() para evitar dependências circulares
    const { fetchDashboardTransactions, fetchDashboardSummary } =
      useDashboardTransactionStore.getState();

    // Buscar transações e summary simultaneamente
    Promise.all([
      fetchDashboardTransactions(token, user.organization_id, filters, true),
      fetchDashboardSummary(token, user.organization_id, filters),
    ]).finally(() => {
      setLoadingOperation("dashboardTransactions", false);
    });
  }, [token, user?.organization_id, startDate, endDate]); // Removidas as funções das dependências

  // Buscar dados iniciais apenas uma vez quando carregar o componente
  useEffect(() => {
    if (token && user?.organization_id) {
      console.log("[Dashboard] Iniciando fetch inicial de transações");

      // Busca inicial com as datas padrão
      const initialFilters = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      setLoadingOperation("dashboardTransactions", true);

      // Usar getState() para evitar dependências
      const { fetchDashboardTransactions, fetchDashboardSummary } =
        useDashboardTransactionStore.getState();

      Promise.all([
        fetchDashboardTransactions(
          token,
          user.organization_id,
          initialFilters,
          true
        ),
        fetchDashboardSummary(token, user.organization_id, initialFilters),
      ]).finally(() => {
        setLoadingOperation("dashboardTransactions", false);
        console.log("[Dashboard] Fetch inicial de transações finalizado");
      });
    }
  }, [token, user?.organization_id]);

  // Identificar listas do sistema pelo nome (ignorando acentos e espaços)
  function normalize(str) {
    return str
      ? str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .toLowerCase()
      : "";
  }
  const systemLists = React.useMemo(() => {
    if (!boardDashboardActive?.lists)
      return { andamento: null, pendente: null, concluido: null };
    const andamento = boardDashboardActive.lists.find((l) =>
      normalize(l.name).includes("emandamento")
    );
    const pendente = boardDashboardActive.lists.find((l) =>
      normalize(l.name).includes("pendente")
    );
    const concluido = boardDashboardActive.lists.find((l) =>
      normalize(l.name).includes("concluido")
    );
    return { andamento, pendente, concluido };
  }, [boardDashboardActive]);

  // Valor total em negociação = andamento + pendente
  const totalKanbanValue = React.useMemo(() => {
    const { andamento, pendente } = systemLists;
    const sumList = (list) =>
      list?.cards?.reduce((sum, card) => sum + (Number(card.value) || 0), 0) ||
      0;
    return sumList(andamento) + sumList(pendente);
  }, [systemLists]);

  // Vendas concluídas = concluído
  const completedSalesValue = React.useMemo(() => {
    const { concluido } = systemLists;
    return (
      concluido?.cards?.reduce(
        (sum, card) => sum + (Number(card.value) || 0),
        0
      ) || 0
    );
  }, [systemLists]);

  // Taxa de conversão = concluído / (andamento + pendente)
  const conversionRate = React.useMemo(() => {
    if (totalKanbanValue === 0) return 0;
    return (completedSalesValue / totalKanbanValue) * 100;
  }, [completedSalesValue, totalKanbanValue]);

  // Função de exportação de relatório
  const handleExport = () => {
    try {
      const today = format(new Date(), "dd-MM-yyyy");
      const periodStart = format(startDate, "dd/MM/yyyy");
      const periodEnd = format(endDate, "dd/MM/yyyy");
      const boardName = boardDashboardActive?.name || "Não selecionado";

      // Calcular resumo financeiro a partir das transações filtradas
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

      // Buscar informações dos vendedores do time
      const getSellerInfo = (seller) => {
        const member = members.find((m) => m.id === seller.user?.id);
        return {
          name: seller.user?.name || "Vendedor Desconhecido",
          role: member?.role || "Não informado",
          email: member?.email || "Não informado",
        };
      };

      let csvContent = "";

      // Cabeçalho do relatório
      csvContent += `RELATÓRIO DASHBOARD - ${today}\n`;
      csvContent += `Período: ${periodStart} a ${periodEnd}\n`;
      csvContent += `Board: ${boardName}\n`;
      csvContent += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}\n\n`;

      // Valores do Kanban
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

      // Status dos Contratos
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

      // Resumo Financeiro (calculado das transações)
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

      // Transações Detalhadas
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

      // Top Vendedores
      if (exportOptions.sellerRanking && topSellers.data.length > 0) {
        csvContent += "=== RANKING DE VENDEDORES ===\n";
        csvContent += "Posição,Vendedor,Valor Total,Função,E-mail\n";
        topSellers.data.forEach((seller, index) => {
          const position = index + 1;
          const sellerInfo = getSellerInfo(seller);
          const value = formatCurrency(seller.totalValue);
          csvContent += `${position},"${sellerInfo.name}",${value},"${sellerInfo.role}","${sellerInfo.email}"\n`;
        });
        csvContent += "\n";
      }

      // Rodapé
      csvContent += "=== INFORMAÇÕES ADICIONAIS ===\n";
      csvContent += `Organização: ${
        organization?.name || "Não identificada"
      }\n`;
      csvContent += `Usuário: ${user?.name || "Não identificado"}\n`;
      csvContent += `Relatório gerado pela plataforma Zenaix\n`;

      // Criar e baixar o arquivo com encoding correto
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

      console.log("[Dashboard] Relatório exportado com sucesso:", {
        kanbanValues: exportOptions.kanbanValues,
        contractStatus: exportOptions.contractStatus,
        financialData: exportOptions.financialData,
        sellerRanking: exportOptions.sellerRanking,
        transactionsCount: filteredTransactions.length,
        sellersCount: topSellers.data.length,
        contractsCount: contracts.length,
        boardName,
        period: `${periodStart} a ${periodEnd}`,
        organization: organization?.name || "Não identificada",
        calculatedSummary,
      });
    } catch (err) {
      console.error("Erro ao exportar dados:", err);
      alert("Erro ao exportar relatório. Tente novamente.");
    }
  };

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
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button
                onClick={() => setShowBoardSelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <span className="text-sm font-medium">
                  {boardDashboardActive ? (
                    boardDashboardActive.name
                  ) : (
                    <span className="inline-block w-32 h-5 bg-gray-200 rounded animate-pulse" />
                  )}
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
            activeBoardId={boardDashboardActiveId}
            onSelectBoard={selectAndLoadDashboardBoard}
            isOpen={showBoardSelector}
            onClose={() => setShowBoardSelector(false)}
          />

          {/* Quick Access Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <ProtectedLink
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
            </ProtectedLink>
            <ProtectedLink
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
            </ProtectedLink>
            <ProtectedLink
              to="/dashboard/contracts"
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
            </ProtectedLink>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Loading apenas quando não há board selecionado */}
            {isLoadingBoardData && !boardDashboardActive && (
              <div className="absolute inset-0 bg-white dark:bg-dark-800 z-10 flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7f00ff]"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Carregando dados do board...
                  </span>
                </div>
              </div>
            )}

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
                {`${conversionRate.toFixed(1)}%`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Vendas concluídas / Total em negociação
              </p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-start justify-between mb-6 flex-col gap-4">
                <div className="flex items-center gap-3 w-full justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Movimentação Financeira
                  </h3>

                  {/* Seletor de tipo de gráfico */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                    {(
                      ["area", "line", "column"] as Array<
                        "area" | "line" | "column"
                      >
                    ).map((type) => {
                      const Icon = chartTypeIcons[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setChartType(type)}
                          className={`p-2 rounded-md transition-colors ${
                            chartType === type
                              ? "bg-[#7f00ff] text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600"
                          }`}
                          title={chartTypeLabels[type]}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      De:
                    </label>
                    <input
                      type="date"
                      value={format(startDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setStartDate(createDateFromInput(e.target.value))
                      }
                      className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-200"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Até:
                    </label>
                    <input
                      type="date"
                      value={format(endDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setEndDate(createDateFromInput(e.target.value))
                      }
                      className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-200"
                    />
                  </div>
                  <button
                    onClick={handleSearchTransactions}
                    disabled={isDashboardLoading}
                    className="flex items-center justify-center p-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Buscar transações no período selecionado"
                  >
                    {isDashboardLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="h-[400px] relative">
                {isDashboardLoading &&
                  dashboardTransactionsData.length === 0 && (
                    <div className="absolute inset-0 bg-white dark:bg-dark-800 z-10 flex items-center justify-center rounded-xl">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7f00ff]"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Carregando dados financeiros...
                        </span>
                      </div>
                    </div>
                  )}
                <ReactApexChart
                  key={`chart-${chartType}`} // Force re-render quando muda o tipo
                  options={salesChartOptions}
                  series={salesChartData}
                  type={getApexChartType(chartType)}
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
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm relative">
              {/* Loading apenas quando está carregando e não há dados ainda */}
              {isLoadingBoardData && topSellers.data.length === 0 && (
                <div className="absolute inset-0 bg-white dark:bg-dark-800 z-10 flex items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7f00ff]"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Carregando vendedores...
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Top Vendedores
                </h3>
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
              </div>

              <div className="mt-4">
                {isLoadingBoardData &&
                (!topSellers.data || topSellers.data.length === 0) ? (
                  <div className="h-24 flex items-center justify-center">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7f00ff]" />
                  </div>
                ) : !isLoadingBoardData && topSellers.data.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-gray-400">
                    Nenhum vendedor encontrado
                  </div>
                ) : (
                  <>
                    <div className="mb-2 px-1">
                      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span>Vendedor</span>
                        <span>Desempenho</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {topSellers.data.slice(0, 3).map((seller, index) => {
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

                        const user = seller.user;
                        const sellerName =
                          user?.name || "Responsável Desconhecido";
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
                            key={user?.id || index}
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
                                {user?.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={sellerName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarBgClass} flex items-center justify-center text-white text-sm font-medium shadow-sm`}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {sellerName}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Vendas realizadas
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
                    {topSellers.data.length > 3 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700">
                        <button
                          onClick={() => setShowAllSellersModal(true)}
                          className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                        >
                          Ver todos os vendedores ({topSellers.data.length})
                          <ChevronDown className="w-3 h-3 transform rotate-[-90deg]" />
                        </button>
                      </div>
                    )}
                  </>
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
                      const eventDate = new Date(event.start_at || event.start);

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
                                {format(
                                  new Date(event.start_at || event.start),
                                  "HH:mm"
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(event.end_at || event.end),
                                  "HH:mm"
                                )}
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
                      {topSellers.data.map((seller, index) => {
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
                        const sellerName = seller.user?.name || "Vendedor";
                        const initials = sellerName
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
                            key={seller.user?.id || `seller-${index}`}
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
                                  {sellerName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Vendas
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] !mt-0">
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
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.sellerRanking}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          sellerRanking: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-[#7f00ff] focus:ring-[#7f00ff]"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Ranking de Vendedores
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] !mt-0">
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] !mt-0">
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
                              new Date(
                                selectedCalendarEvent.start_at ||
                                  selectedCalendarEvent.start
                              ),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR }
                            )}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {format(
                              new Date(
                                selectedCalendarEvent.start_at ||
                                  selectedCalendarEvent.start
                              ),
                              "HH:mm",
                              { locale: ptBR }
                            )}{" "}
                            -
                            {format(
                              new Date(
                                selectedCalendarEvent.end_at ||
                                  selectedCalendarEvent.end
                              ),
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
