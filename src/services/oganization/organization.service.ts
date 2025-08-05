import { API_CONFIG } from "../../config/api.config";
import {
  InputCreateOrgAndSubscribeDTO,
  InputUpdateOrganizationDTO,
  OrganizationOutput,
  CreateOrgResponse,
} from "../../types/organization";
import { ApiResponse } from "../../types/api.types";
import { APIError } from "../errors/api.errors";
import { getAuthHeaders } from "../../utils/authHeaders";
import { formatApiError } from "../../utils/formatters";

export const organizationService = {
  async createCheckoutSessionForNewOrg(
    data: InputCreateOrgAndSubscribeDTO,
    token: string
  ): Promise<CreateOrgResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.organizations.create}`,
        {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(responseData, "Erro ao criar sessão de checkout.");
      }

      return responseData.data;
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(error);
    }
  },

  async findAll(token: string, name?: string): Promise<OrganizationOutput[]> {
    try {
      let url = `${API_CONFIG.baseUrl}${API_CONFIG.organizations.readAll}`;
      if (name) {
        url += `?name=${encodeURIComponent(name)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      const responseData: ApiResponse<OrganizationOutput[]> =
        await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao buscar organizações.");
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async findById(
    token: string,
    organizationId: string
  ): Promise<OrganizationOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.organizations.readById(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      const responseData: ApiResponse<OrganizationOutput> =
        await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao buscar a organização.");
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao buscar a organização:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async update(
    token: string,
    organizationId: string,
    data: InputUpdateOrganizationDTO
  ): Promise<OrganizationOutput> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.organizations.update(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

      const responseData: ApiResponse<OrganizationOutput> =
        await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao atualizar a organização.");
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao atualizar a organização:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async delete(token: string, organizationId: string): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.organizations.delete(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw formatApiError(errorData, "Falha ao deletar a organização.");
      }
    } catch (error) {
      console.error("Erro ao deletar a organização:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },
};
