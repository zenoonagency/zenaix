import {
  format,
  parseISO,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// Lista de fusos horários globais (incluindo os mais usados no sistema)
export const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+1)" },
  { value: "America/New_York", label: "Nova York (GMT-4)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Asia/Tokyo", label: "Tóquio (GMT+9)" },
];

/**
 * Formata uma data ISO para o formato de hora HH:mm no fuso horário do Brasil
 * @param isoString String ISO de data e hora
 * @returns Hora formatada como HH:mm
 */
export function formatMessageTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    return format(date, "HH:mm", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar horário da mensagem:", error);

    try {
      return new Date(isoString).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
    } catch {
      return "??:??";
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
    console.error("Erro ao formatar data e hora:", error);
    return "??/??/???? ??:??";
  }
}

/**
 * Formata uma data (aceita string ISO ou Date) para formato brasileiro
 * @param date Data como string ISO ou objeto Date
 * @returns Data formatada como dd/MM/yyyy
 */
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR").format(dateObj);
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "??/??/????";
  }
}

/**
 * Obtém o fuso horário atual do usuário
 * @returns String do fuso horário (ex: America/Sao_Paulo")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Converte uma data do formulário (YYYY-MM-DD) para UTC
 * Interpreta a data como meio-dia no fuso horário do usuário
 * @param dateString Data no formato YYYY-MM-DD
 * @returns String ISO em UTC
 */
export function convertFormDateToUTC(dateString: string): string {
  try {
    const [year, month, day] = dateString.split("-").map(Number);

    // Criar data como meio-dia no fuso horário do usuário
    const userDate = new Date(year, month - 1, day, 12);
    // Converter para UTC
    const utcDate = new Date(
      userDate.getTime() - userDate.getTimezoneOffset() * 60000
    );

    return utcDate.toISOString();
  } catch (error) {
    console.error("Erro ao converter data do formulário para UTC:", error);
    return "";
  }
}

/**
 * Converte uma data UTC para o fuso horário do usuário
 * @param utcDateString Data UTC em formato ISO
 * @returns Data formatada no fuso horário do usuário
 */
export function convertUTCToUserTimezone(utcDateString: string): string {
  try {
    const utcDate = new Date(utcDateString);
    const userTimezone = getUserTimezone();

    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: userTimezone,
    }).format(utcDate);
  } catch (error) {
    console.error("Erro ao converter UTC para fuso do usuário:", error);
    return "??/??/????";
  }
}

/**
 * Formata uma data de transação, interpretando como meio-dia no fuso horário local
 * @param date Data como string ISO ou objeto Date
 * @returns Data formatada como dd/MM/yyyy
 */
export function formatTransactionDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    // Para transações, interpretamos a data como meio-dia no fuso local
    // Isso evita problemas de conversão UTC que podem mudar o dia
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();
    const localDate = new Date(year, month, day, 12);
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(localDate);
  } catch (error) {
    console.error("Erro ao formatar data de transação:", error);
    return "??/??/????";
  }
}

/**
 * Formata data e hora (aceita string ISO ou Date) para formato brasileiro
 * @param date Data como string ISO ou objeto Date
 * @returns Data e hora formatadas
 */
export function formatDateTimeGeneral(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(dateObj);
  } catch (error) {
    console.error("Erro ao formatar data e hora:", error);
    return "??/??/???? ??:??";
  }
}

/**
 * Converte uma data para o fuso horário de Brasília
 * @param date Data a ser convertida
 * @returns Data ajustada para o fuso horário de Brasília
 */
export function toBrasiliaTimezone(date: Date): Date {
  return new Date(
    date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
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
    console.error("Erro ao ajustar data para fuso de Brasília:", error);
    return isoString;
  }
}

/**
 * Converte uma data para o fuso horário local
 * @param date Data a ser convertida
 * @returns Data no fuso horário local
 */
export function toLocalTimezone(date: Date): Date {
  return new Date(date);
}

/**
 * Converte uma data para UTC
 * @param date Data a ser convertida
 * @returns Data em UTC
 */
export function toUTC(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  );
}

/**
 * Formata uma data considerando o fuso horário
 * @param date Data a ser formatada
 * @param timezone Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data formatada no fuso horário especificado
 */
export function formatWithTimezone(
  date: Date,
  timezone: string = "America/Sao_Paulo"
): string {
  try {
    return date.toLocaleString("pt-BR", { timeZone: timezone });
  } catch (error) {
    console.error("Erro ao formatar data com fuso horário:", error);
    return date.toLocaleString("pt-BR");
  }
}

/**
 * Obtém o offset do fuso horário em minutos
 * @param timezone Fuso horário (padrão: America/Sao_Paulo)
 * @returns Offset em minutos
 */
export function getTimezoneOffset(
  timezone: string = "America/Sao_Paulo"
): number {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return (utcDate.getTime() - tzDate.getTime()) / 60000;
}

/**
 * Verifica se uma data está no horário de verão
 * @param date Data a ser verificada (padrão: data atual)
 * @param timezone Fuso horário (padrão: America/Sao_Paulo)
 * @returns true se estiver no horário de verão
 */
export function isDaylightSavingTime(
  date: Date = new Date(),
  timezone: string = "America/Sao_Paulo"
): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);

  const janOffset = getTimezoneOffset(timezone);
  const julOffset = getTimezoneOffset(timezone);

  const currentOffset = getTimezoneOffset(timezone);

  return currentOffset !== Math.max(janOffset, julOffset);
}

/**
 * Converte uma data para string ISO com tratamento de erro
 * @param date Data a ser convertida
 * @returns String ISO ou string vazia em caso de erro
 */
export function toISOString(date: Date): string {
  try {
    return date.toISOString();
  } catch (error) {
    console.error("Erro ao converter data para ISO:", error);
    return "";
  }
}

/**
 * Cria uma data a partir de componentes com tratamento de fuso horário
 * @param year Ano
 * @param month Mês (1-12)
 * @param day Dia
 * @param hour Hora (opcional, padrão: 12)
 * @param minute Minuto (opcional, padrão: 0)
 * @param second Segundo (opcional, padrão: 0)
 * @returns String ISO da data criada
 */
export function createISODate(
  year: number,
  month: number,
  day: number,
  hour: number = 12,
  minute: number = 0,
  second: number = 0
): string {
  try {
    // Mês em JavaScript é 0-indexed, então subtraímos 1
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return date.toISOString();
  } catch (error) {
    console.error("Erro ao criar data ISO:", error);
    return "";
  }
}

/**
 * Verifica se uma string é uma data ISO válida
 * @param isoString String a ser verificada
 * @returns true se for uma data ISO válida
 */
export function isValidISOString(isoString: string): boolean {
  try {
    const date = new Date(isoString);
    return !isNaN(date.getTime()) && isoString.includes("T");
  } catch {
    return false;
  }
}

/**
 * Obtém a data atual em formato ISO
 * @returns String ISO da data atual
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Formata uma data para exibição em listas (formato compacto)
 * @param date Data como string ISO ou Date
 * @returns Data formatada de forma compacta
 */
export function formatCompactDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoje";
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays <= 7) {
      return `${diffDays} dias atrás`;
    } else {
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    }
  } catch (error) {
    console.error("Erro ao formatar data compacta:", error);
    return "??/??/????";
  }
}

/**
 * Formata data de expiração de contrato (sempre UTC, formato brasileiro)
 * @param date Data como string ISO ou Date
 * @returns Data formatada como dd/MM/yyyy (UTC)
 */
export function formatContractExpirationDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch (error) {
    console.error("Erro ao formatar data de expiração do contrato:", error);
    return "??/??/????";
  }
}
