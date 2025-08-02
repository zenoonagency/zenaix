import { API_CONFIG } from "../../config/api.config";
import { fetchWithAuth } from "../apiClient";
import { getAuthHeaders } from "../../utils/authHeaders";
import { APIError } from "../errors/api.errors";
import {
  WhatsappContact,
  InputCreateWhatsappContactDTO,
  InputUpdateWhatsappContactDTO,
  WhatsappContactListResponse,
  WhatsappContactResponse,
} from "../../types/whatsapp";
import { formatApiError } from "../../utils/formatters";

export const whatsappContactService = {
  async findAll(
    token: string,
    organizationId: string,
    instanceId: string
  ): Promise<WhatsappContact[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsapp.contacts.findAll(
        organizationId,
        instanceId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });
      const responseData: WhatsappContactListResponse = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao listar contatos.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao listar contatos.");
    }
  },

  async create(
    token: string,
    organizationId: string,
    instanceId: string,
    dto: InputCreateWhatsappContactDTO
  ): Promise<WhatsappContact> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsapp.contacts.create(
        organizationId,
        instanceId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(dto),
      });
      const responseData: WhatsappContactResponse = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao criar contato.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar contato.");
    }
  },

  async update(
    token: string,
    organizationId: string,
    instanceId: string,
    contactId: string,
    dto: InputUpdateWhatsappContactDTO
  ): Promise<WhatsappContact> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsapp.contacts.update(
        organizationId,
        instanceId,
        contactId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(dto),
      });
      const responseData: WhatsappContactResponse = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Falha ao atualizar contato.");
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar contato.");
    }
  },

  async delete(
    token: string,
    organizationId: string,
    instanceId: string,
    contactId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsapp.contacts.delete(
        organizationId,
        instanceId,
        contactId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao deletar contato.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar contato.");
    }
  },

  async markAsRead(
    token: string,
    organizationId: string,
    instanceId: string,
    contactId: string
  ): Promise<void> {
    try {
      const url = `${
        API_CONFIG.baseUrl
      }${API_CONFIG.whatsapp.contacts.markAsRead(
        organizationId,
        instanceId,
        contactId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, "Falha ao marcar conversa como lida.");
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao marcar conversa como lida."
      );
    }
  },
};
