import { API_CONFIG } from "../config/api.config";
import { ApiResponse } from "../types/api.types";
import {
  OutputListDTO,
  InputCreateListDTO,
  InputUpdateListDTO,
  ListResponse,
  ListListResponse,
} from "../types/list";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const listService = {
  async createList(
    token: string,
    boardId: string,
    data: InputCreateListDTO
  ): Promise<OutputListDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.lists.create(boardId)}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao criar lista.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ListResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar a lista.");
    }
  },

  async getLists(token: string, boardId: string): Promise<OutputListDTO[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.lists.findAll(boardId)}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao buscar listas.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ListListResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar as listas.");
    }
  },

  async getListById(
    token: string,
    boardId: string,
    listId: string
  ): Promise<OutputListDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.lists.findById(
        boardId,
        listId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao buscar lista.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ListResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar a lista.");
    }
  },

  async updateList(
    token: string,
    boardId: string,
    listId: string,
    data: InputUpdateListDTO
  ): Promise<OutputListDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.lists.update(
        boardId,
        listId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao atualizar lista.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ListResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar a lista.");
    }
  },

  async deleteList(
    token: string,
    boardId: string,
    listId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.lists.delete(
        boardId,
        listId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = formatApiError(errorData, "Falha ao deletar lista.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar a lista.");
    }
  },
};
