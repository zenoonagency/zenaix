import { User } from "../../types/auth";
import { APIError } from "../errors/api.errors";
import { API_CONFIG } from "../../config/api.config";
import { ApiResponse } from "../../types/api.types";
import { fetchWithAuth } from "../apiClient";
import { getAuthHeaders } from "../../utils/authHeaders";



export const userService = {
  async updateUser(
    token: string,
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.update(userId)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      console.log("responseData");
      console.log(responseData);
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

      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.me_avatar}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
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
      const response = await fetchWithAuth(
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
      const response = await fetchWithAuth(
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

  async getMe(token: string, signal?: AbortSignal): Promise<User> {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.baseUrl}${API_CONFIG.users.me}`,
        {
          method: "GET",
          headers: getAuthHeaders(token),
          signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new APIError(
          errorData?.message ||
            `Erro ${response.status}: Falha ao buscar dados do utilizador.`
        );
      }

      const responseData: ApiResponse<User> = await response.json();
      return responseData.data;
    } catch (error: any) {
      if (
        error.name === "AbortError" ||
        (error instanceof TypeError && error.message === "Failed to fetch")
      ) {
        console.log(
          "Serviço: Requisição cancelada pelo cliente (AbortError ou TypeError). Relançando para ser ignorado."
        );
        throw error; 
      }

      if (error instanceof APIError) {
        throw error;
      }

      console.error(
        "Serviço: Erro de API ou rede não tratado detectado.",
        error
      );
      throw new APIError("Ocorreu um erro inesperado ao buscar os seus dados.");
    }
  },
};
