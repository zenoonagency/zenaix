import { APIError } from "../errors/api.errors";
import { API_CONFIG } from "../../config/api.config";
import { ApiResponse } from "../../types/api.types";
import { fetchWithAuth } from "../apiClient";
import { getAuthHeaders } from "../../utils/authHeaders";
import { formatApiError } from "../../utils/formatters";
import {
  InputCreateTagDTO,
  InputUpdateTagDTO,
  OutputTagDTO,
} from "../../types/tag";

export const tagService = {
  async create(
    token: string,
    organizationId: string,
    dto: InputCreateTagDTO
  ): Promise<OutputTagDTO> {
    try {
      // Assumindo uma rota como: POST /organizations/{orgId}/tags
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.tags.create(organizationId)}`,
        {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify(dto),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao criar marcador.");
      }

      const responseData: ApiResponse<OutputTagDTO> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar o marcador.");
    }
  },

  async findAll(
    token: string,
    organizationId: string,
    name?: string
  ): Promise<OutputTagDTO[]> {
    try {
      const baseUrl = `${API_CONFIG.baseUrl}${API_CONFIG.tags.findAll(
        organizationId
      )}`;

      const url = new URL(baseUrl, window.location.origin);
      if (name) {
        url.searchParams.append("name", name);
      }

      const response = await fetchWithAuth(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao listar marcadores.");
      }

      const responseData: ApiResponse<OutputTagDTO[]> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao listar os marcadores.");
    }
  },

  async findById(
    token: string,
    organizationId: string,
    tagId: string
  ): Promise<OutputTagDTO> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.tags.findById(
          organizationId,
          tagId
        )}`,
        {
          method: "GET",
          headers: getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao buscar marcador.");
      }

      const responseData: ApiResponse<OutputTagDTO> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar o marcador.");
    }
  },

  async update(
    token: string,
    organizationId: string,
    tagId: string,
    dto: InputUpdateTagDTO
  ): Promise<OutputTagDTO> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.tags.update(organizationId, tagId)}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(token),
          body: JSON.stringify(dto),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao atualizar marcador.");
      }

      const responseData: ApiResponse<OutputTagDTO> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar o marcador.");
    }
  },

  async delete(
    token: string,
    organizationId: string,
    tagId: string
  ): Promise<void> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.tags.delete(organizationId, tagId)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
        }
      );

      // Resposta 204 No Content não tem corpo JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao apagar marcador.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao apagar o marcador.");
    }
  },
};
