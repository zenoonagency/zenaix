/**
 * Utilitários para manipulação de fusos horários
 */

// Lista de fusos horários comuns no Brasil
export const brazilianTimezones = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' }
];

// Função para converter uma data para o fuso horário local
export function toLocalTimezone(date: Date): Date {
  return new Date(date);
}

// Função para converter uma data para UTC
export function toUTC(date: Date): Date {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ));
}

// Função para formatar uma data considerando o fuso horário
export function formatWithTimezone(date: Date, timezone: string = 'America/Sao_Paulo'): string {
  try {
    return date.toLocaleString('pt-BR', { timeZone: timezone });
  } catch (error) {
    console.error('Erro ao formatar data com fuso horário:', error);
    return date.toLocaleString('pt-BR');
  }
}

// Função para obter o offset do fuso horário em minutos
export function getTimezoneOffset(timezone: string = 'America/Sao_Paulo'): number {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (utcDate.getTime() - tzDate.getTime()) / 60000;
}

// Função para verificar se uma data está no horário de verão
export function isDaylightSavingTime(date: Date = new Date(), timezone: string = 'America/Sao_Paulo'): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  
  const janOffset = getTimezoneOffset(timezone);
  const julOffset = getTimezoneOffset(timezone);
  
  const currentOffset = getTimezoneOffset(timezone);
  
  // Se o offset atual for diferente do offset de janeiro ou julho, estamos no horário de verão
  return currentOffset !== Math.max(janOffset, julOffset);
} 