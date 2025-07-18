import { API_CONFIG } from "../../config/api.config";
import { getAuthHeaders } from "../../utils/authHeaders";
import { formatApiError } from "../../utils/formatters";
import { APIError } from "../errors/api.errors";
import { fetchWithAuth } from "../apiClient";
import { ApiResponse } from "../../types/api.types";
import {
  InputAddTeamMemberDTO,
  OutputInvitation,
  InputAcceptInvitationDTO,
  AcceptInvitationResponse,
} from "../../types/invites.types";

export const inviteService = {
  async sendInvite(
    token: string,
    organizationId: string,
    data: InputAddTeamMemberDTO
  ): Promise<OutputInvitation> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.invites.send(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<OutputInvitation> = await response.json();
      if (!response.ok) {
        console.log("cai no erro");
        throw formatApiError(responseData, "Falha ao enviar convite.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao enviar convite.");
    }
  },

  async acceptInvite(
    token: string,
    data: InputAcceptInvitationDTO
  ): Promise<AcceptInvitationResponse> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.invites.accept}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<AcceptInvitationResponse> =
        await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao aceitar convite.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao aceitar convite.");
    }
  },

  async findAll(
    token: string,
    organizationId: string
  ): Promise<OutputInvitation[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.invites.findAll(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData: ApiResponse<OutputInvitation[]> =
        await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao buscar convites.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao buscar convites.");
    }
  },

  async findById(
    token: string,
    organizationId: string,
    invitationId: string
  ): Promise<OutputInvitation> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.invites.findById(
        organizationId,
        invitationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData: ApiResponse<OutputInvitation> = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao buscar convite.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao buscar convite.");
    }
  },

  async revoke(
    token: string,
    organizationId: string,
    invitationId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.invites.revoke(
        organizationId,
        invitationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao revogar convite.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro ao revogar convite.");
    }
  },
};
