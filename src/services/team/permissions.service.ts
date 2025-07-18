import { API_CONFIG } from "../../config/api.config";
import { getAuthHeaders } from "../../utils/authHeaders";
import { formatApiError } from "../../utils/formatters";
import { APIError } from "../errors/api.errors";
import { fetchWithAuth } from "../apiClient";
import {
  OutputPermissionDTO,
  GrantPermissionsDTO,
  RevokePermissionsDTO,
} from "../../types/team.types";

export const permissionsService = {
  async list(
    token: string,
    organizationId: string,
    memberId: string
  ): Promise<OutputPermissionDTO[]> {
    try {
      const url = `${
        API_CONFIG.baseUrl
      }${API_CONFIG.teamMembers.permissions.list(organizationId, memberId)}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw formatApiError(
          responseData,
          "Falha ao buscar permissões do membro."
        );
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao buscar permissões do membro.");
    }
  },

  async grant(
    token: string,
    organizationId: string,
    memberId: string,
    data: GrantPermissionsDTO
  ): Promise<void> {
    try {
      const url = `${
        API_CONFIG.baseUrl
      }${API_CONFIG.teamMembers.permissions.grant(organizationId, memberId)}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao conceder permissões.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao conceder permissões.");
    }
  },

  async revoke(
    token: string,
    organizationId: string,
    memberId: string,
    data: RevokePermissionsDTO
  ): Promise<void> {
    try {
      const url = `${
        API_CONFIG.baseUrl
      }${API_CONFIG.teamMembers.permissions.revoke(organizationId, memberId)}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao revogar permissões.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao revogar permissões.");
    }
  },
};
