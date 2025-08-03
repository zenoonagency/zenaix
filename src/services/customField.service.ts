import { API_CONFIG } from "../config/api.config";
import {
  CustomFieldDTO,
  CustomFieldResponse,
  CustomFieldSingleResponse,
  InputCreateCustomFieldDTO,
  InputUpdateCustomFieldDTO,
} from "../types/card";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const customFieldService = {
  async createCustomField(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    data: InputCreateCustomFieldDTO
  ): Promise<CustomFieldDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.customFields.create(
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
        const error = formatApiError(
          errorData,
          "Falha ao criar campo personalizado."
        );
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CustomFieldSingleResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao criar o campo personalizado."
      );
    }
  },

  async getCustomFields(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string
  ): Promise<CustomFieldDTO[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.customFields.findAll(
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
        const error = formatApiError(
          errorData,
          "Falha ao buscar campos personalizados."
        );
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CustomFieldResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao buscar os campos personalizados."
      );
    }
  },

  async getCustomFieldById(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    customFieldId: string
  ): Promise<CustomFieldDTO> {
    try {
      const url = `${
        API_CONFIG.baseUrl
      }${API_CONFIG.cards.customFields.findById(
        organizationId,
        boardId,
        listId,
        cardId,
        customFieldId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(
          errorData,
          "Falha ao buscar campo personalizado."
        );
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CustomFieldSingleResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao buscar o campo personalizado."
      );
    }
  },

  async updateCustomField(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    customFieldId: string,
    data: InputUpdateCustomFieldDTO
  ): Promise<CustomFieldDTO> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.customFields.update(
        organizationId,
        boardId,
        listId,
        cardId,
        customFieldId
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
          "Falha ao atualizar campo personalizado."
        );
        (error as any).status = response.status;
        throw error;
      }
      const responseData: CustomFieldSingleResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao atualizar o campo personalizado."
      );
    }
  },

  async deleteCustomField(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    customFieldId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.customFields.delete(
        organizationId,
        boardId,
        listId,
        cardId,
        customFieldId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(
          errorData,
          "Falha ao deletar campo personalizado."
        );
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao deletar o campo personalizado."
      );
    }
  },
};
