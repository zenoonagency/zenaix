import { API_CONFIG } from "../../config/api.config";
import {
  PlanInput,
  PlanOutput,
  ApiResponse,
  PlanUpdate,
} from "../../types/plan";
import { APIError } from "../errors/api.errors";

// Helper para obter os cabeçalhos de autenticação
const getAuthHeaders = (token: string): HeadersInit => {
  if (!token) {
    throw new APIError("Token de autenticação é obrigatório.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const planService = {
  async create(token: string, data: PlanInput): Promise<PlanOutput> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.plans.create}`,
        {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );
      const responseData: ApiResponse<PlanOutput> = await response.json();
      if (!response.ok) {
        throw new APIError(responseData.message || "Falha ao criar o plano.");
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar o plano.");
    }
  },

  async update(
    token: string,
    id: string,
    data: PlanUpdate
  ): Promise<PlanOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.plans.update(id)}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<PlanOutput> = await response.json();
      if (!response.ok) {
        throw new APIError(
          responseData.message || "Falha ao atualizar o plano."
        );
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao atualizar o plano:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar o plano.");
    }
  },

  async delete(token: string, id: string): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.plans.delete(id)}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(errorData?.message || "Falha ao deletar o plano.");
      }
    } catch (error) {
      console.error("Erro ao deletar o plano:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar o plano.");
    }
  },

  async findAll(token: string, name?: string): Promise<PlanOutput[]> {
    try {
      let url = `${API_CONFIG.baseUrl}${API_CONFIG.plans.readAll}`;

      if (name) {
        url += `?name=${encodeURIComponent(name)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData: ApiResponse<PlanOutput[]> = await response.json();
      if (!response.ok) {
        throw new APIError(
          responseData.message || "Falha ao buscar os planos."
        );
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar os planos:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar os planos.");
    }
  },

  async findById(token: string, id: string): Promise<PlanOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.plans.readById(id)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData: ApiResponse<PlanOutput> = await response.json();
      if (!response.ok) {
        throw new APIError(responseData.message || "Falha ao buscar o plano.");
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar o plano:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar o plano.");
    }
  },
};
