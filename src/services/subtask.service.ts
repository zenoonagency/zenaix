import { API_CONFIG } from "../config/api.config";
import {
  SubtaskDTO,
  SubtaskResponse,
  SubtaskSingleResponse,
  InputCreateSubtaskDTO,
  InputUpdateSubtaskDTO,
} from "../types/card";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const subtaskService = {
  // Criar Nova Subtarefa
  async createSubtask(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    data: InputCreateSubtaskDTO
  ): Promise<SubtaskDTO[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.subtasks.create(
        organizationId,
        boardId,
        listId,
        cardId
      )}`;

      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao criar subtarefa.");
        (error as any).status = response.status;
        throw error;
      }

      const responseData: SubtaskResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar a subtarefa.");
    }
  },

  // Listar Subtarefas
  async getSubtasks(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string
  ): Promise<SubtaskDTO[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.subtasks.findAll(
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
        const error = formatApiError(errorData, "Falha ao buscar subtarefas.");
        (error as any).status = response.status;
        throw error;
      }

      const responseData: SubtaskResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar as subtarefas.");
    }
  },

  // Listar Subtarefa por ID
  async getSubtaskById(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    subtaskId: string
  ): Promise<SubtaskDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.subtasks.findById(
        organizationId,
        boardId,
        listId,
        cardId,
        subtaskId
      )}`;

      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao buscar subtarefa.");
        (error as any).status = response.status;
        throw error;
      }

      const responseData: SubtaskSingleResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar a subtarefa.");
    }
  },

  // Atualizar Subtarefa
  async updateSubtask(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    subtaskId: string,
    data: InputUpdateSubtaskDTO
  ): Promise<SubtaskDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.subtasks.update(
        organizationId,
        boardId,
        listId,
        cardId,
        subtaskId
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
          "Falha ao atualizar subtarefa."
        );
        (error as any).status = response.status;
        throw error;
      }

      const responseData: SubtaskSingleResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao atualizar a subtarefa."
      );
    }
  },

  // Deletar Subtarefa
  async deleteSubtask(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    subtaskId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.subtasks.delete(
        organizationId,
        boardId,
        listId,
        cardId,
        subtaskId
      )}`;

      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao deletar subtarefa.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar a subtarefa.");
    }
  },
};
