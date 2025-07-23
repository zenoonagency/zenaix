import React, { useMemo } from "react";
import { Search, AreaChart, LineChart, BarChart2 } from "lucide-react";
import ReactApexChart from "react-apexcharts";
import { format } from "date-fns";

interface FinancialChartProps {
  startDate: Date;
  endDate: Date;
  chartType: "area" | "line" | "column";
  theme: string;
  isLoading: boolean;
  dashboardTransactionsData: any[];
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onChartTypeChange: (type: "area" | "line" | "column") => void;
  onSearchTransactions: () => void;
  formatCurrency: (value: number) => string;
}

export function FinancialChart({
  startDate,
  endDate,
  chartType,
  theme,
  isLoading,
  dashboardTransactionsData,
  onStartDateChange,
  onEndDateChange,
  onChartTypeChange,
  onSearchTransactions,
  formatCurrency,
}: FinancialChartProps) {
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

  const getApexChartType = (
    type: typeof chartType
  ): "area" | "line" | "bar" => {
    return type === "column" ? "bar" : type;
  };

  const createDateFromInput = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

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
          horizontal: false,
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
    }),
    [theme, chartType]
  );

  const salesChartData = useMemo(() => {
    if (!dashboardTransactionsData.length) {
      return [
        { name: "Receitas", data: [] },
        { name: "Despesas", data: [] },
      ];
    }

    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    const allDates = new Set<string>();

    dashboardTransactionsData.forEach((transaction) => {
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

    const sortedDates = Array.from(allDates).sort();
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
  }, [dashboardTransactionsData]);

  return (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm">
      <div className="flex items-start justify-between mb-6 flex-col gap-4">
        <div className="flex items-center gap-3 w-full justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Movimentação Financeira
          </h3>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
            {(
              ["area", "line", "column"] as Array<"area" | "line" | "column">
            ).map((type) => {
              const Icon = chartTypeIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => onChartTypeChange(type)}
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
                onStartDateChange(createDateFromInput(e.target.value))
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
                onEndDateChange(createDateFromInput(e.target.value))
              }
              className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-200"
            />
          </div>
          <button
            onClick={onSearchTransactions}
            disabled={isLoading}
            className="flex items-center justify-center p-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Buscar transações no período selecionado"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <div className="h-[400px] relative">
        {isLoading && dashboardTransactionsData.length === 0 && (
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
          key={`chart-${chartType}`}
          options={salesChartOptions}
          series={salesChartData}
          type={getApexChartType(chartType)}
          height="100%"
        />
      </div>
    </div>
  );
}
