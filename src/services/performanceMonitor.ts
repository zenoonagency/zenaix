/**
 * Sistema de monitoramento de desempenho para a aplicação
 * Rastreia e reporta métricas de desempenho para as chamadas de API e operações do Supabase
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: any;
  metaData?: Record<string, any>;
}

// Limitar o tamanho do histórico para evitar consumo excessivo de memória
const MAX_METRICS_HISTORY = 100;

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private slowThreshold: number = 1000; // 1 segundo é considerado lento
  private listeners: Array<(metrics: PerformanceMetric[]) => void> = [];
  private enabled: boolean = true;

  constructor() {
    // Limpar métricas ocasionalmente para evitar vazamento de memória
    setInterval(() => this.cleanupOldMetrics(), 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Iniciar um novo rastreamento de desempenho
   * @param operation Nome da operação sendo monitorada
   * @param metaData Dados adicionais sobre a operação
   * @returns Uma função para finalizar o rastreamento
   */
  startTracking(operation: string, metaData?: Record<string, any>) {
    if (!this.enabled) {
      return () => {}; // No-op se o monitoramento estiver desabilitado
    }
    
    const startTime = performance.now();
    
    return (success: boolean = true, error?: any) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const metric: PerformanceMetric = {
        operation,
        startTime,
        endTime,
        duration,
        success,
        error,
        metaData
      };
      
      this.metrics.push(metric);
      
      // Notificar listeners sobre nova métrica
      this.notifyListeners();
      
      // Alerta no console para operações lentas
      if (duration > this.slowThreshold) {
        console.warn(`[Performance] Operação lenta: ${operation} levou ${duration.toFixed(2)}ms`, metaData);
      }
      
      return duration;
    };
  }
  
  /**
   * Decorador para funções assíncronas que rastreia seu desempenho
   * @param operation Nome da operação
   * @param metaData Dados adicionais
   */
  async trackAsync<T>(operation: string, fn: () => Promise<T>, metaData?: Record<string, any>): Promise<T> {
    if (!this.enabled) {
      return fn(); // Se desabilitado, apenas chama a função
    }
    
    const finish = this.startTracking(operation, metaData);
    
    try {
      const result = await fn();
      finish(true);
      return result;
    } catch (error) {
      finish(false, error);
      throw error;
    }
  }
  
  /**
   * Obter estatísticas de desempenho
   */
  getStats() {
    // Se não houver métricas, retornar valores padrão
    if (this.metrics.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        successRate: 100,
        slowOperations: 0,
        operationCounts: {}
      };
    }
    
    const total = this.metrics.length;
    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    const averageDuration = totalDuration / total;
    const successCount = this.metrics.filter(m => m.success).length;
    const successRate = (successCount / total) * 100;
    const slowOperations = this.metrics.filter(m => m.duration > this.slowThreshold).length;
    
    // Contar ocorrências de cada operação
    const operationCounts: Record<string, number> = {};
    this.metrics.forEach(metric => {
      operationCounts[metric.operation] = (operationCounts[metric.operation] || 0) + 1;
    });
    
    return {
      total,
      averageDuration,
      successRate,
      slowOperations,
      operationCounts
    };
  }
  
  /**
   * Obter as métricas mais lentas
   * @param count Número de métricas a retornar
   */
  getSlowestOperations(count: number = 5) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }
  
  /**
   * Obter as operações com mais falhas
   */
  getMostFailedOperations() {
    const failedOps: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      if (!metric.success) {
        failedOps[metric.operation] = (failedOps[metric.operation] || 0) + 1;
      }
    });
    
    return Object.entries(failedOps)
      .sort(([, countA], [, countB]) => countB - countA);
  }
  
  /**
   * Limpar métricas antigas para evitar crescimento infinito
   */
  cleanupOldMetrics() {
    if (this.metrics.length > MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-MAX_METRICS_HISTORY);
    }
  }
  
  /**
   * Definir limite para considerar uma operação lenta (em ms)
   */
  setSlowThreshold(threshold: number) {
    this.slowThreshold = threshold;
  }
  
  /**
   * Adicionar um listener para receber atualizações de métricas
   */
  addListener(listener: (metrics: PerformanceMetric[]) => void) {
    this.listeners.push(listener);
  }
  
  /**
   * Remover um listener
   */
  removeListener(listener: (metrics: PerformanceMetric[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notificar todos os listeners sobre novas métricas
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.metrics);
      } catch (e) {
        console.error('Erro ao notificar listener de performance:', e);
      }
    });
  }
  
  /**
   * Habilitar ou desabilitar o monitoramento
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  
  /**
   * Limpar todas as métricas
   */
  clearMetrics() {
    this.metrics = [];
  }
}

// Exporta como singleton
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook para criar wrappers de monitoramento para as funções do Supabase
 * Use para envolver chamadas à API e avaliar o desempenho
 */
export function monitorSupabaseOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metaData?: Record<string, any>
): Promise<T> {
  return performanceMonitor.trackAsync(operation, fn, metaData);
}

// Exemplo de uso:
// const result = await monitorSupabaseOperation(
//   'getBoards',
//   () => supabase.from('boards').select('*'),
//   { userId: 'abc123' }
// ); 