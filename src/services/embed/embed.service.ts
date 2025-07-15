import { API_CONFIG } from "../../config/api.config";
import {
  EmbedOutput,
  InputCreateEmbedDTO,
  InputUpdateEmbedDTO,
} from "../../types/embed";
import { ApiResponse } from "../../types/plan";
import { getAuthHeaders } from "../../utils/authHeaders";
import { fetchWithAuth } from "../apiClient";
import { APIError } from "../errors/api.errors";

export const embedService = {
  async findAll(
    token: string,
    organization_id: string
  ): Promise<EmbedOutput[]> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.embed.findAll(organization_id)}`,
        {
          method: "GET",
          headers: getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || "Falha ao buscar as páginas embed."
        );
      }

      const responseData: ApiResponse<EmbedOutput[]> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error("EmbedService (findAll):", error);
      throw new APIError("Ocorreu um erro inesperado ao buscar as páginas.");
    }
  },

  async findById(
    token: string,
    organization_id: string,
    embed_id: string
  ): Promise<EmbedOutput> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.embed.findById(
          organization_id,
          embed_id
        )}`,
        {
          method: "GET",
          headers: getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || "Falha ao buscar a página embed."
        );
      }

      const responseData: ApiResponse<EmbedOutput> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error("EmbedService (findById):", error);
      throw new APIError(
        "Ocorreu um erro inesperado ao buscar a página especificada."
      );
    }
  },

  async create(
    token: string,
    organization_id: string,
    input: InputCreateEmbedDTO
  ): Promise<EmbedOutput> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.embed.create(organization_id)}`,
        {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || "Falha ao criar a página.");
      }

      const responseData: ApiResponse<EmbedOutput> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error("EmbedService (create):", error);
      throw new APIError("Ocorreu um erro inesperado ao criar a página.");
    }
  },

  async update(
    token: string,
    organization_id: string,
    embed_id: string,
    input: InputUpdateEmbedDTO
  ): Promise<EmbedOutput> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.embed.update(
          organization_id,
          embed_id
        )}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(token),
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || "Falha ao atualizar a página.");
      }

      const responseData: ApiResponse<EmbedOutput> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error("EmbedService (update):", error);
      throw new APIError("Ocorreu um erro inesperado ao atualizar a página.");
    }
  },

  async delete(
    token: string,
    organization_id: string,
    embed_id: string
  ): Promise<void> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.embed.delete(
          organization_id,
          embed_id
        )}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || "Falha ao deletar a página.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error("EmbedService (delete):", error);
      throw new APIError("Ocorreu um erro inesperado ao deletar a página.");
    }
  },
};
