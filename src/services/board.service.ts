import { API_CONFIG } from "../config/api.config";
import { ApiResponse } from "../types/api.types";
import {
  Board,
  InputCreateBoardDTO,
  InputUpdateBoardDTO,
  InputSetCompletedListDTO,
  BoardResponse,
  BoardListResponse,
  BoardAccessListResponse,
  TopSellersResponse,
} from "../types/board";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const boardService = {
  async createBoard(
    token: string,
    organizationId: string,
    data: InputCreateBoardDTO
  ): Promise<Board> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.create(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao criar quadro:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao criar quadro.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: BoardResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao criar quadro:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar o quadro.");
    }
  },

  async getBoards(token: string, organizationId: string): Promise<Board[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.findAll(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao buscar quadros:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao buscar quadros.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: BoardListResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar quadros:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar os quadros.");
    }
  },

  async getBoardById(
    token: string,
    organizationId: string,
    boardId: string
  ): Promise<Board> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.findById(
        organizationId,
        boardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao buscar quadro:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao buscar quadro.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: BoardResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar quadro:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar o quadro.");
    }
  },

  async updateBoard(
    token: string,
    organizationId: string,
    boardId: string,
    data: InputUpdateBoardDTO
  ): Promise<Board> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.update(
        organizationId,
        boardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao atualizar quadro:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao atualizar quadro.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: BoardResponse = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao atualizar quadro:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar o quadro.");
    }
  },

  async deleteBoard(
    token: string,
    organizationId: string,
    boardId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.delete(
        organizationId,
        boardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro na API ao deletar quadro:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao deletar quadro.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      console.error("Erro ao deletar quadro:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar o quadro.");
    }
  },

  async setCompletedList(
    token: string,
    organizationId: string,
    boardId: string,
    data: InputSetCompletedListDTO
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.setCompleted(
        organizationId,
        boardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(
          errorData,
          "Falha ao definir lista de concluídos."
        );
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao definir lista de concluídos."
      );
    }
  },

  async getTopSellers(
    token: string,
    organizationId: string,
    boardId: string
  ): Promise<TopSellersResponse> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.topSellers(
        organizationId,
        boardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao buscar top sellers.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: TopSellersResponse = await response.json();
      return responseData;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar top sellers.");
    }
  },

  async getAccessList(
    token: string,
    organizationId: string,
    boardId: string
  ): Promise<BoardAccessListResponse> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.boards.accessList(
        organizationId,
        boardId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(
          errorData,
          "Falha ao buscar lista de acesso."
        );
        (error as any).status = response.status;
        throw error;
      }
      const responseData: BoardAccessListResponse = await response.json();
      return responseData;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao buscar lista de acesso."
      );
    }
  },
};
