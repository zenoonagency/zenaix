import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";

interface ContractChartProps {
  contracts: any[];
  theme: string;
  isLoading?: boolean;
}

export function ContractChart({ contracts, theme, isLoading }: ContractChartProps) {
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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7f00ff]"></div>
      </div>
    );
  }

  return (
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
  );
}
