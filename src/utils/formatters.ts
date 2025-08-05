import { ErrorApiResponse } from "../types/api.types";
import { APIError } from "../services/errors/api.errors";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Funções de data movidas para dateUtils.ts

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function formatApiError(
  errorData: ErrorApiResponse | any,
  fallback = "Ocorreu um erro."
) {
  let errorMessage = fallback;

  // Se errorData é null ou undefined, usar fallback
  if (!errorData) {
    const error = new APIError(errorMessage);
    (error as any).status = 500;
    throw error;
  }

  // Se tem message direta, usar ela
  if (errorData.message) {
    errorMessage = errorData.message;
  }

  // Se tem errors object, extrair detalhes
  if (errorData.errors && typeof errorData.errors === "object") {
    const details = Object.values(errorData.errors).flat().join(" | ");
    if (details) {
      errorMessage = details;
    }
  }

  // Se tem status 400 e message específica, usar ela
  if (errorData.status === 400 && errorData.message) {
    errorMessage = errorData.message;
  }

  const error = new APIError(errorMessage);

  // Preservar o status do erro se existir
  if (errorData.status) {
    (error as any).status = errorData.status;
  }

  throw error;
}

function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    email: "E-mail",
    password: "Senha",
    name: "Nome",
  };

  return map[field] || field.charAt(0).toUpperCase() + field.slice(1);
}
