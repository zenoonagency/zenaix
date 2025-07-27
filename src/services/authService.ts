import { API_CONFIG } from "../config/api.config";
import { fetchWithAuth } from "./apiClient"; 
import { formatApiError } from "../utils/formatters";
import { RegisterApiResponse, RegisterData } from "../types/auth";
import { APIError } from "./errors/api.errors";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  async sendConfirmationEmail(email: string): Promise<{ message: string }> {
    const url = `${API_CONFIG.baseUrl}/auth/send-confirmation`;
    const response = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw formatApiError(errorData, "Erro ao reenviar confirmação.");
    }
    return response.json();
  },

  async register(data: RegisterData): Promise<RegisterApiResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.register}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, "Erro ao criar conta.");
      }
      return responseData;

    } catch (error) {
      console.error("Register Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao criar a conta.");
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.auth.forgotPassword}`;
    const response = await fetch(url, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw formatApiError(errorData, "Erro ao solicitar recuperação.");
    }
    return response.json();
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const url = `${API_CONFIG.baseUrl}/auth/change-password`;
    const response = await fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};