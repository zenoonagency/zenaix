import { LoginData, RegisterData, AuthSuccessPayload } from "../types/auth";
import { API_CONFIG } from "../config/api.config";
import { ApiResponse } from "../types/api.types";
import { APIError } from "./errors/api.errors";

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
        throw new APIError(responseData.message || "Email ou senha inválidos.");
      }

      return {
        user: responseData.data,
        token: responseData.token,
        organization: responseData.data.organization || null,
      };
    } catch (error) {
      console.error("Login Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao fazer o login.");
    }
  },

  async register(data: RegisterData): Promise<AuthSuccessPayload> {
    try {
      let requestBody: FormData | string;
      let headers: HeadersInit = {};

      if (data.avatar) {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        if (data.language) formData.append("language", data.language);
        if (data.timezone) formData.append("timezone", data.timezone);
        formData.append("avatar", data.avatar);

        requestBody = formData;
      } else {
        requestBody = JSON.stringify(data);
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.register}`,
        {
          method: "POST",
          headers,
          body: requestBody,
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new APIError(
          responseData.message || "Erro ao registar utilizador."
        );
      }

      return {
        user: responseData.data,
        token: responseData.token,
        organization: responseData.data.organization || null,
      };
    } catch (error) {
      console.error("Register Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado durante o registo.");
    }
  },
};
