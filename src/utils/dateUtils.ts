import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data ISO para o formato de hora HH:mm no fuso horário do Brasil
 * @param isoString String ISO de data e hora
 * @returns Hora formatada como HH:mm
 */
export function formatMessageTime(isoString: string): string {
  // Certifica-se de que estamos trabalhando com uma data ISO válida
  try {
    const date = parseISO(isoString);
    
    // Ajusta para o fuso horário do Brasil (GMT-3)
    // Podemos usar diretamente o locale ptBR que já inclui o ajuste
    return format(date, 'HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar horário da mensagem:', error);
    
    // Fallback para tentar exibir algo mesmo em caso de erro
    try {
      return new Date(isoString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch {
      return '??:??'; // Último fallback
    }
  }
}

/**
 * Formata uma data ISO para o formato completo de data e hora do Brasil
 * @param isoString String ISO de data e hora
 * @returns Data e hora formatadas como dd/MM/yyyy HH:mm
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return '??/??/???? ??:??'; // Fallback em caso de erro
  }
}

/**
 * Converte uma data para o fuso horário de Brasília
 * @param date Data a ser convertida
 * @returns Data ajustada para o fuso horário de Brasília
 */
export function toBrasiliaTimezone(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

/**
 * Ajusta uma string ISO de data para o fuso horário de Brasília (GMT-3)
 * @param isoString String ISO original
 * @returns String ISO ajustada para o fuso de Brasília
 */
export function adjustDateToBrasilia(isoString: string): string {
  try {
    const date = new Date(isoString);
    return toBrasiliaTimezone(date).toISOString();
  } catch (error) {
    console.error('Erro ao ajustar data para fuso de Brasília:', error);
    return isoString; // Em caso de erro, retorna a string original
  }
} 