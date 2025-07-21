import { LoginData, RegisterData, AuthSuccessPayload } from "../types/auth";
import { API_CONFIG } from "../config/api.config";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const authService = {
  async login(data: LoginData): Promise<AuthSuccessPayload> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.login}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(responseData, "Email ou senha inválidos.");
      }

      const payloadFromApi = responseData.data;

      return {
        user: payloadFromApi.user,
        token: payloadFromApi.token,
        refreshToken: payloadFromApi.refreshToken,
        organization: payloadFromApi.user.organization || null,
        permissions: payloadFromApi.user.permissions || [],
      };
    } catch (error) {
      console.error("Login Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao fazer o login.");
    }
  },

  async register(
    data: Omit<RegisterData, "avatar" | "confirmPassword">
  ): Promise<AuthSuccessPayload> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.register}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(responseData, "Erro ao registar utilizador.");
      }

      const payloadFromApi = responseData.data;

      return {
        user: payloadFromApi.user,
        token: payloadFromApi.token,
        refreshToken: payloadFromApi.refreshToken,
        organization: payloadFromApi.user.organization || null,
        permissions: payloadFromApi.user.permissions || [],
      };
    } catch (error) {
      console.error("Register Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado durante o registo.");
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }

    const data = await response.json();
    return data;
  },
};
