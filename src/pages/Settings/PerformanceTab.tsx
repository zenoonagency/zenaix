import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Gauge, Clock, AlertTriangle, CheckCircle, RefreshCw, Trash2, Zap } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { performanceMonitor } from '../../services/performanceMonitor';
import { kanbanService } from '../../services/kanbanService';

// Cores para os gráficos
const COLORS = ['#7F00FF', '#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

export function PerformanceTab() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const cardBg = isDark ? 'bg-dark-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  const [stats, setStats] = useState<any>(null);
  const [slowOperations, setSlowOperations] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Atualizar estatísticas a cada 5 segundos
    const getStats = () => {
      const performanceStats = performanceMonitor.getStats();
      setStats(performanceStats);
      setSlowOperations(performanceMonitor.getSlowestOperations(5));
    };

    getStats();
    const interval = setInterval(getStats, 5000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  // Preparar dados para os gráficos
  const operationCountData = stats ? Object.entries(stats.operationCounts).map(
    ([name, count]) => ({ name, count })
  ) : [];

  const refreshStats = () => {
    setRefreshKey(prev => prev + 1);
  };

  const clearStats = () => {
    performanceMonitor.clearMetrics();
    refreshStats();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-semibold ${textColor}`}>Diagnóstico de Desempenho</h2>
        <div className="flex gap-2">
          <button 
            onClick={refreshStats}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button 
            onClick={clearStats}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50"
          >
            <Trash2 size={16} />
            Limpar Dados
          </button>
        </div>
      </div>

      {/* Cards com métricas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${textColor}`}>Operações Totais</h3>
            <Zap className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-purple-500">{stats?.total || 0}</p>
        </div>

        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${textColor}`}>Tempo Médio</h3>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-500">
            {stats?.averageDuration ? Math.round(stats.averageDuration) : 0}
            <span className="text-sm ml-1">ms</span>
          </p>
        </div>

        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${textColor}`}>Taxa de Sucesso</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-green-500">
            {stats?.successRate ? Math.round(stats.successRate) : 100}
            <span className="text-sm ml-1">%</span>
          </p>
        </div>

        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${textColor}`}>Operações Lentas</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-orange-500">{stats?.slowOperations || 0}</p>
        </div>
      </div>

      {/* Operações mais lentas */}
      <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
        <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Operações Mais Lentas</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? 'bg-dark-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Operação</th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Duração (ms)</th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Metadata</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {slowOperations.length > 0 ? (
                slowOperations.map((op, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? (isDark ? 'bg-dark-700/30' : 'bg-gray-50') : ''}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>{op.operation}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${op.duration > 1000 ? 'text-red-500' : op.duration > 500 ? 'text-orange-500' : 'text-green-500'}`}>
                      {Math.round(op.duration)} ms
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                      <span className={`px-2 py-1 rounded-full text-xs ${op.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {op.success ? 'Sucesso' : 'Falhou'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor} truncate max-w-xs`}>
                      {op.metaData ? JSON.stringify(op.metaData) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={`px-6 py-4 text-center text-sm ${textColor}`}>
                    Nenhuma operação lenta registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de contagem de operações */}
        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
          <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Contagem de Operações</h3>
          <div className="h-80">
            {operationCountData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={operationCountData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#ccc'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: isDark ? '#aaa' : '#666' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#1e1e2d' : '#fff', borderColor: isDark ? '#444' : '#ccc' }}
                    labelStyle={{ color: isDark ? '#eee' : '#333' }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#7F00FF" name="Contagem" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className={`${textColor} text-sm`}>Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de pizza de operações */}
        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm`}>
          <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Distribuição de Operações</h3>
          <div className="h-80">
            {operationCountData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={operationCountData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {operationCountData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#1e1e2d' : '#fff', borderColor: isDark ? '#444' : '#ccc' }}
                    labelStyle={{ color: isDark ? '#eee' : '#333' }}
                  />
                  <Legend formatter={(value) => <span className={textColor}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className={`${textColor} text-sm`}>Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dicas de otimização */}
      <div className={`${cardBg} ${borderColor} border rounded-lg p-4 shadow-sm mt-6`}>
        <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Dicas de Otimização</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mt-0.5">
              <Gauge className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <h4 className={`font-medium ${textColor}`}>Reduza a frequência de consultas</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Uso excessivo das operações `getBoards` e `getBoardDetails` pode causar lentidão.
                Considere aumentar o tempo de cache ou implementar polling inteligente.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 mt-0.5">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h4 className={`font-medium ${textColor}`}>Otimize operações lentas</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Se você observar operações consistentemente lentas,
                considere simplificar consultas complexas ou adicionar índices no banco de dados.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <h4 className={`font-medium ${textColor}`}>Verifique operações com erros</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Operações que falham frequentemente podem indicar problemas de permissão ou
                configuração no Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 