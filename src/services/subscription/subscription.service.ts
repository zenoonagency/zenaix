import { API_CONFIG } from "../../config/api.config";
import {
  InputCreateSubscriptionDTO,
  InputChangePlanDTO,
  InputAddSlotsDTO,
  InputRemoveSlotsDTO,
  InputPurchaseOneTimeTriggersDTO,
  CreateSessionResponse,
  PortalSessionResponse,
} from "../../types/subscription.ts";
import { APIError } from "../errors/api.errors";

const getAuthHeaders = (token: string): HeadersInit => {
  if (!token) {
    throw new APIError(
      "Token de autenticação é obrigatório para esta operação."
    );
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const subscriptionService = {
  async createCheckoutSession(
    token: string,
    organizationId: string,
    data: InputCreateSubscriptionDTO
  ): Promise<CreateSessionResponse> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.create(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new APIError(
          responseData.message || "Falha ao criar sessão de checkout."
        );
      }
      return responseData.data;
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async managePlan(
    token: string,
    organizationId: string
  ): Promise<PortalSessionResponse> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.manage(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      const responseData = await response.json();

      return responseData.data;
    } catch (error) {
      console.error("Erro ao gerenciar o plano:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async cancel(token: string, organizationId: string): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.cancel(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(
          errorData?.message || "Falha ao cancelar assinatura."
        );
      }
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async reactivate(token: string, organizationId: string): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.reactivate(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(
          errorData?.message || "Falha ao reativar assinatura."
        );
      }
    } catch (error) {
      console.error("Erro ao reativar assinatura:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async changePlan(
    token: string,
    organizationId: string,
    data: InputChangePlanDTO
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.changePlan(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(errorData?.message || "Falha ao alterar o plano.");
      }
    } catch (error) {
      console.error("Erro ao alterar o plano:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async addSlots(
    token: string,
    organizationId: string,
    data: InputAddSlotsDTO
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.addSlots(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(errorData?.message || "Falha ao adicionar slots.");
      }
    } catch (error) {
      console.error("Erro ao adicionar slots:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async removeSlots(
    token: string,
    organizationId: string,
    data: InputRemoveSlotsDTO
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.subscriptions.removeSlots(
        organizationId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(errorData?.message || "Falha ao remover slots.");
      }
    } catch (error) {
      console.error("Erro ao remover slots:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },

  async purchaseOneTimeTriggers(
    token: string,
    organizationId: string,
    data: InputPurchaseOneTimeTriggersDTO
  ): Promise<void> {
    try {
      const url = `${
        API_CONFIG.baseUrl
      }${API_CONFIG.subscriptions.purchaseOneTime(organizationId)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(errorData?.message || "Falha ao comprar disparos.");
      }
    } catch (error) {
      console.error("Erro ao comprar disparos:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado.");
    }
  },
};
