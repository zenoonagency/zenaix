import { API_CONFIG } from "../config/api.config";
import { ApiResponse } from "../types/api.types";
import {
  WhatsAppInstanceOutput,
  InputCreateWhatsAppInstanceDTO,
  InputUpdateWhatsAppInstanceDTO,
} from "../types/whatsappInstance";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const whatsappInstanceService = {
  async create(
    token: string,
    organizationId: string,
    dto: InputCreateWhatsAppInstanceDTO
  ): Promise<WhatsAppInstanceOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsappInstances.create(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao criar instância WhatsApp:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao criar instância WhatsApp.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ApiResponse<WhatsAppInstanceOutput> = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao criar instância WhatsApp:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar a instância WhatsApp.");
    }
  },

  async findAll(
    token: string,
    organizationId: string
  ): Promise<WhatsAppInstanceOutput[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsappInstances.findAll(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao buscar instâncias WhatsApp:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao buscar instâncias WhatsApp.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ApiResponse<WhatsAppInstanceOutput[]> = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar instâncias WhatsApp:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar as instâncias WhatsApp.");
    }
  },

  async findById(
    token: string,
    organizationId: string,
    instanceId: string
  ): Promise<WhatsAppInstanceOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsappInstances.findById(
        organizationId,
        instanceId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao buscar instância WhatsApp:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao buscar instância WhatsApp.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ApiResponse<WhatsAppInstanceOutput> = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar instância WhatsApp:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar a instância WhatsApp.");
    }
  },

  async update(
    token: string,
    organizationId: string,
    instanceId: string,
    dto: InputUpdateWhatsAppInstanceDTO
  ): Promise<WhatsAppInstanceOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsappInstances.update(
        organizationId,
        instanceId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao atualizar instância WhatsApp:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao atualizar instância WhatsApp.");
        (error as any).status = response.status;
        throw error;
      }
      const responseData: ApiResponse<WhatsAppInstanceOutput> = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Erro ao atualizar instância WhatsApp:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar a instância WhatsApp.");
    }
  },

  async delete(
    token: string,
    organizationId: string,
    instanceId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsappInstances.delete(
        organizationId,
        instanceId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao deletar instância WhatsApp:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao deletar instância WhatsApp.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      console.error("Erro ao deletar instância WhatsApp:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar a instância WhatsApp.");
    }
  },

  async connect(
    token: string,
    organizationId: string,
    instanceId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsappInstances.connect(
        organizationId,
        instanceId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro na API ao conectar instância WhatsApp:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        const error = formatApiError(errorData, "Falha ao conectar instância WhatsApp.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      console.error("Erro ao conectar instância WhatsApp:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao conectar a instância WhatsApp.");
    }
  },
}; 