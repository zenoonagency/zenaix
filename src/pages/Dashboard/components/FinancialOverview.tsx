import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from 'styled-components';
import { Box } from '../../../components/Box';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useToast } from '../../../hooks/useToast';
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';

interface Transaction {
  valor: number;
  operacao: string;
  hora: string;
  nome: string;
  chave_pix: string;
}

interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export const FinancialOverview = () => {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totals, setTotals] = useState<Totals>({ income: 0, expense: 0, balance: 0 });
  const { showToast } = useToast();

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Dados de exemplo para teste
      const mockTransactions = [
        {
          valor: 1500,
          operacao: 'CREDIT',
          hora: '2024-03-15T10:30:00Z',
          nome: 'João Silva',
          chave_pix: 'joao@email.com'
        },
        {
          valor: 2500,
          operacao: 'CREDIT',
          hora: '2024-03-14T14:20:00Z',
          nome: 'Maria Santos',
          chave_pix: 'maria@email.com'
        },
        {
          valor: 800,
          operacao: 'DEBIT',
          hora: '2024-03-13T16:45:00Z',
          nome: 'Carlos Oliveira',
          chave_pix: 'carlos@email.com'
        },
        {
          valor: 3000,
          operacao: 'CREDIT',
          hora: '2024-02-28T09:15:00Z',
          nome: 'Ana Pereira',
          chave_pix: 'ana@email.com'
        },
        {
          valor: 1200,
          operacao: 'DEBIT',
          hora: '2024-02-25T11:30:00Z',
          nome: 'Pedro Costa',
          chave_pix: 'pedro@email.com'
        }
      ];

      setTransactions(mockTransactions);

      // Calcula os totais
      const newTotals = mockTransactions.reduce((acc: Totals, transaction: Transaction) => {
        if (transaction.operacao === 'CREDIT' || transaction.operacao === 'RECEIVED') {
          acc.income += transaction.valor;
        } else if (transaction.operacao === 'DEBIT' || transaction.operacao === 'SENT') {
          acc.expense += transaction.valor;
        }
        return acc;
      }, { income: 0, expense: 0, balance: 0 });

      newTotals.balance = newTotals.income - newTotals.expense;
      setTotals(newTotals);

    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      showToast('Erro ao buscar transações', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchTransactions();
  }, []);

  // Process transactions by month
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.hora);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, expense: 0 };
    }
    
    if (transaction.operacao === 'CREDIT' || transaction.operacao === 'RECEIVED') {
      acc[monthKey].income += transaction.valor;
    } else if (transaction.operacao === 'DEBIT' || transaction.operacao === 'SENT') {
      acc[monthKey].expense += transaction.valor;
    }
    
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  // Sort months and prepare series data
  const sortedMonths = Object.keys(monthlyData).sort();
  const series = [
    {
      name: 'Receitas',
      data: sortedMonths.map(month => monthlyData[month].income)
    },
    {
      name: 'Despesas',
      data: sortedMonths.map(month => monthlyData[month].expense)
    }
  ];

  const options = {
    chart: {
      type: 'area' as const,
      height: 350,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    colors: ['#7f00ff', '#ff0080'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    grid: {
      borderColor: theme.colors.border,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      categories: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}/${year}`;
      }),
      labels: {
        style: {
          colors: theme.colors.text
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value: number) => formatCurrency(value),
        style: {
          colors: theme.colors.text
        }
      }
    },
    tooltip: {
      theme: theme.title,
      y: {
        formatter: (value: number) => formatCurrency(value)
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total de Entradas */}
        <Box className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-green-500" />
                Total de Entradas
              </p>
              <h3 className="text-2xl font-bold text-green-500 mt-1">
                {formatCurrency(totals.income)}
              </h3>
            </div>
          </div>
        </Box>

        {/* Total de Saídas */}
        <Box className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                Total de Saídas
              </p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">
                {formatCurrency(totals.expense)}
              </h3>
            </div>
          </div>
        </Box>

        {/* Saldo */}
        <Box className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-500" />
                Saldo
              </p>
              <h3 className="text-2xl font-bold text-purple-500 mt-1">
                {formatCurrency(totals.balance)}
              </h3>
            </div>
          </div>
        </Box>
      </div>

      <Box>
        {isLoading ? (
          <div className="flex items-center justify-center h-[350px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={350}
          />
        )}
      </Box>
    </div>
  );
};
