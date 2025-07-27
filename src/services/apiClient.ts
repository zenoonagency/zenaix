import { useAuthStore } from "../store/authStore";
import { authService } from "./authService";
import { APIError } from "./errors/api.errors";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Função para tratar erros globais
function handleApiError(error: any) {
  if (error?.status === 401 || error?.status === 403 || error?.message?.includes('token is expired')) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }
  throw error;
}

// Exemplo de uso em fetch genérico:
export async function apiFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleApiError({ status: response.status, ...errorData });
    }
    return response.json();
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Erro na requisição: ${response.statusText}`,
    }));
    throw new APIError(errorData.message || "Ocorreu um erro na sua requisição.");
  }

  return response;
}
