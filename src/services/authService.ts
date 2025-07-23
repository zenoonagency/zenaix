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
        throw formatApiError(responseData, "Erro ao criar conta.");
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
      throw new APIError("Ocorreu um erro inesperado ao criar a conta.");
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await fetch(
      `${API_CONFIG.baseUrl}${API_CONFIG.auth.refresh}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Essencial para enviar cookies
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }

    const data = await response.json();
    return { token: data.token };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.forgotPassword}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(
          responseData,
          "Erro ao solicitar recuperação de senha."
        );
      }

      return { message: responseData.message };
    } catch (error) {
      console.error("ForgotPassword Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao solicitar recuperação de senha."
      );
    }
  },

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.resetPassword}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw formatApiError(responseData, "Erro ao redefinir senha.");
      }

      return { message: responseData.message };
    } catch (error) {
      console.error("ResetPassword Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao redefinir senha.");
    }
  },

  async loginWithOAuth(provider: string): Promise<void> {
    // Redireciona para o backend que iniciará o OAuth
    window.location.href = `${API_CONFIG.baseUrl}/auth/oauth/${provider}`;
  },

  async handleOAuthCallback(
    urlParams: URLSearchParams
  ): Promise<AuthSuccessPayload | null> {
    const token = urlParams.get("token");
    const oauthSuccess = urlParams.get("oauth_success");
    const isNewUser = urlParams.get("new_user") === "true";

    if (!token || oauthSuccess !== "true") {
      return null;
    }

    try {
      // Validar token obtendo dados do usuário
      const response = await fetch(`${API_CONFIG.baseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token OAuth inválido");
      }

      const userData = await response.json();

      return {
        user: userData.data,
        token: token,
        organization: userData.data.organization || null,
        permissions: userData.data.permissions || [],
      };
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      throw new APIError("Erro ao processar login social.");
    }
  },
};
