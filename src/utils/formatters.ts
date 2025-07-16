import { ErrorApiResponse } from "../types/api.types";
import { ApiResponse } from "../types/plan";

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
  errorData: ErrorApiResponse,
  fallback = "Ocorreu um erro."
) {
  let errorMessage = errorData.message || fallback;

  if (errorData.errors && typeof errorData.errors === "object") {
    const details = Object.values(errorData.errors).flat().join(" | ");
    errorMessage = details || errorMessage;
  }

  return errorMessage;
}

function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    email: "E-mail",
    password: "Senha",
    name: "Nome",
  };

  return map[field] || field.charAt(0).toUpperCase() + field.slice(1);
}
