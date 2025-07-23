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
          credentials: "include", // Para receber cookies do refresh token
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(responseData, "Email ou senha inválidos.");
      }

      return {
        user: responseData.data,
        token: responseData.token,
        organization: responseData.data.organization || null,
        permissions: responseData.data.permissions || [],
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
          credentials: "include", // Para receber cookies do refresh token
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(responseData, "Erro ao registar utilizador.");
      }

      return {
        user: responseData.data,
        token: responseData.token,
        organization: responseData.data.organization || null,
        permissions: responseData.data.permissions || [],
      };
    } catch (error) {
      console.error("Register Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado durante o registo.");
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    console.log("AuthService: Tentando refresh token...");
    console.log("AuthService: URL:", `${API_CONFIG.baseUrl}/auth/refresh`);

    const response = await fetch(`${API_CONFIG.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Essencial para enviar cookies
    });

    console.log("AuthService: Status da resposta:", response.status);
    console.log(
      "AuthService: Headers da resposta:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("AuthService: Erro na resposta:", errorData);
      throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }

    const data = await response.json();
    console.log("AuthService: Token renovado com sucesso");
    return { token: data.token };
  },
};
