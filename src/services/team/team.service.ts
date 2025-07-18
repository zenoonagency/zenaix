import { API_CONFIG } from "../../config/api.config";
import { getAuthHeaders } from "../../utils/authHeaders";
import { formatApiError } from "../../utils/formatters";
import { APIError } from "../errors/api.errors";
import { fetchWithAuth } from "../apiClient";
import {
  TeamMember,
  InputUpdateTeamMemberRoleDTO,
} from "../../types/team.types";

export const teamService = {
  async findAll(token: string, organizationId: string): Promise<TeamMember[]> {
    try {
      const url = `${API_CONFIG.baseUrl}/organizations/${organizationId}/members`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw formatApiError(
          responseData,
          "Falha ao buscar membros da equipe."
        );
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao buscar membros da equipe.");
    }
  },

  async findById(
    token: string,
    organizationId: string,
    memberId: string
  ): Promise<TeamMember> {
    try {
      const url = `${API_CONFIG.baseUrl}/organizations/${organizationId}/members/${memberId}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao buscar membro.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao buscar membro.");
    }
  },

  async updateRole(
    token: string,
    organizationId: string,
    memberId: string,
    data: InputUpdateTeamMemberRoleDTO
  ): Promise<TeamMember> {
    try {
      const url = `${API_CONFIG.baseUrl}/organizations/${organizationId}/members/${memberId}/role`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw formatApiError(
          responseData,
          "Falha ao atualizar papel do membro."
        );
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao atualizar papel do membro.");
    }
  },

  async remove(
    token: string,
    organizationId: string,
    memberId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}/organizations/${organizationId}/members/${memberId}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao remover membro.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao remover membro.");
    }
  },
};
