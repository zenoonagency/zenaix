import {
  AuthSuccessPayload,
  MePayload,
  RegisterData,
  User,
} from "../../types/auth";
import { APIError } from "../errors/api.errors";
import { API_CONFIG } from "../../config/api.config";
import { ApiResponse } from "../../types/api.types";

const getAuthHeaders = (
  token: string,
  contentType = "application/json"
): HeadersInit => {
  if (!token) {
    throw new APIError(
      "Token de autenticação é obrigatório para esta operação."
    );
  }
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
};

export const userService = {
  async register(data: RegisterData): Promise<AuthSuccessPayload> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.auth.register}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(
          errorData?.message || "Falha ao registar utilizador."
        );
      }

      const responseData: ApiResponse<AuthSuccessPayload> =
        await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Register Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado durante o registo.");
    }
  },

  async updateUser(
    token: string,
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.update(userId)}`,
        {
          method: "PUT",
          headers: getAuthHeaders(token),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(
          errorData?.message || "Falha ao atualizar utilizador."
        );
      }

      const responseData: ApiResponse<User> = await response.json();
      return responseData.data;
    } catch (error) {
      console.error("Update User Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao atualizar o utilizador."
      );
    }
  },

  async updateAvatar(token: string, avatarFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.me_avatar}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            // NÃO envie Content-Type aqui!
          },
          body: formData,
        }
      );

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => null);
          throw new APIError(
            errorData?.message || "Falha ao atualizar avatar."
          );
        } else {
          const errorText = await response.text();
          throw new APIError(errorText || "Falha ao atualizar avatar.");
        }
      }

      if (contentType && contentType.includes("application/json")) {
        const responseData: ApiResponse<User> = await response.json();
        return responseData.data;
      } else {
        throw new APIError(
          "Resposta inesperada do servidor ao atualizar avatar."
        );
      }
    } catch (error) {
      console.error("Update Avatar Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao atualizar o avatar.");
    }
  },

  async removeAvatar(token: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.me_avatar}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || "Falha ao remover avatar.");
      }
    } catch (error) {
      console.error("Remove Avatar Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao remover o avatar.");
    }
  },

  async deleteAccount(token: string, password: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.me}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || "Falha ao apagar a conta.");
      }
    } catch (error) {
      console.error("Delete Account Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao apagar a conta.");
    }
  },

  // ATENÇÃO: O backend deve garantir que o objeto user retornado já inclui organization e plan embutidos!
  async getMe(token: string): Promise<MePayload> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.me}`,
        {
          method: "GET",
          headers: getAuthHeaders(token),
        }
      );

      const responseData: ApiResponse<MePayload> = await response.json();

      if (!response.ok) {
        throw new APIError(
          responseData.message || "Falha ao buscar dados do utilizador."
        );
      }

      return responseData.data;
    } catch (error) {
      console.error("Get Me Error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar os seus dados.");
    }
  },
};
