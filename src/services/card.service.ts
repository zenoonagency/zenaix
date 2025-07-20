import { API_CONFIG } from "../config/api.config";
import { ApiResponse } from "../types/api.types";
import {
  OutputCardDTO,
  InputCreateCardDTO,
  InputUpdateCardDTO,
  CardResponse,
  CardListResponse,
} from "../types/card";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const cardService = {
  async createCard(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    data: InputCreateCardDTO
  ): Promise<OutputCardDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.create(
        organizationId,
        boardId,
        listId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao criar card:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao criar card.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CardResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao criar card:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar o card.");
    }
  },

  async getCards(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    title?: string
  ): Promise<OutputCardDTO[]> {
    try {
      let url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.findAll(
        organizationId,
        boardId,
        listId
      )}`;
      if (title) {
        url += `?title=${encodeURIComponent(title)}`;
      }
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao buscar cards:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao buscar cards.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CardListResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar cards:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar os cards.");
    }
  },

  async getCardById(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string
  ): Promise<OutputCardDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.findById(
        organizationId,
        boardId,
        listId,
        cardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao buscar card.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CardResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar o card.");
    }
  },

  async updateCard(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    data: InputUpdateCardDTO
  ): Promise<OutputCardDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.update(
        organizationId,
        boardId,
        listId,
        cardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao atualizar card:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao atualizar card.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CardResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao atualizar card:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar o card.");
    }
  },

  async deleteCard(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.delete(
        organizationId,
        boardId,
        listId,
        cardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro na API ao deletar card:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao deletar card.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      console.error("Erro ao deletar card:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar o card.");
    }
  },
};
