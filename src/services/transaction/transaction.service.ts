import { APIError } from "../errors/api.errors";
import { API_CONFIG } from "../../config/api.config";
import { ApiResponse } from "../../types/api.types";
import { fetchWithAuth } from "../apiClient";
import { getAuthHeaders } from "../../utils/authHeaders";
import { formatApiError } from "../../utils/formatters";
import {
  InputCreateTransactionDTO,
  OutputTransactionDTO,
  FinancialSummaryDTO,
  InputUpdateTransactionDTO,
} from "../../types/transaction";

interface IDateFilters {
  year?: number;
  month?: number;
}

export const transactionService = {
  async create(
    token: string,
    organizationId: string,
    dto: InputCreateTransactionDTO
  ): Promise<OutputTransactionDTO> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.finance.create(organizationId)}`,
        {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify(dto),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao criar transação.");
      }

      const responseData: ApiResponse<OutputTransactionDTO> =
        await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar a transação.");
    }
  },

  async findAll(
    token: string,
    organizationId: string,
    filters?: IDateFilters
  ): Promise<OutputTransactionDTO[]> {
    try {
      const url = new URL(
        `${API_CONFIG.baseUrl}${API_CONFIG.finance.findAll(organizationId)}`,
        window.location.origin
      );
      if (filters?.year)
        url.searchParams.append("year", filters.year.toString());
      if (filters?.month)
        url.searchParams.append("month", filters.month.toString());

      const response = await fetchWithAuth(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao listar transações.");
      }

      const responseData: ApiResponse<OutputTransactionDTO[]> =
        await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao listar as transações.");
    }
  },

  async getSummary(
    token: string,
    organizationId: string,
    filters?: IDateFilters
  ): Promise<FinancialSummaryDTO> {
    try {
      const url = new URL(
        `${API_CONFIG.baseUrl}${API_CONFIG.finance.getSummary(organizationId)}`,
        window.location.origin
      );
      if (filters?.year)
        url.searchParams.append("year", filters.year.toString());
      if (filters?.month)
        url.searchParams.append("month", filters.month.toString());

      const response = await fetchWithAuth(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao obter resumo financeiro.");
      }

      const responseData: ApiResponse<FinancialSummaryDTO> =
        await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao obter o resumo financeiro."
      );
    }
  },

  async update(
    token: string,
    organizationId: string,
    transactionId: string,
    dto: InputUpdateTransactionDTO
  ): Promise<OutputTransactionDTO> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.finance.update(
          organizationId,
          transactionId
        )}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(token),
          body: JSON.stringify(dto),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao atualizar transação.");
      }

      const responseData: ApiResponse<OutputTransactionDTO> =
        await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao atualizar a transação."
      );
    }
  },

  async delete(
    token: string,
    organizationId: string,
    transactionId: string
  ): Promise<void> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.finance.delete(
          organizationId,
          transactionId
        )}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao apagar transação.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao apagar a transação.");
    }
  },

  async deleteAll(
    token: string,
    organizationId: string,
    filters?: IDateFilters
  ): Promise<void> {
    try {
      const url = new URL(
        `${API_CONFIG.baseUrl}${API_CONFIG.finance.deleteAll(organizationId)}`,
        window.location.origin
      );
      if (filters?.year)
        url.searchParams.append("year", filters.year.toString());
      if (filters?.month)
        url.searchParams.append("month", filters.month.toString());

      const response = await fetchWithAuth(url.toString(), {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao limpar transações.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao limpar as transações.");
    }
  },
};
