import { useAuthStore } from "../store/authStore";
import { authService } from "./authService";
import { APIError } from "./errors/api.errors";
import { supabase } from "../lib/supabaseClient";

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

// Função para renovar token automaticamente
async function refreshToken(): Promise<string | null> {
  try {
    console.log("[ApiClient] Tentando renovar token...");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("[ApiClient] Erro ao renovar token:", error);
      throw error;
    }
    
    if (data.session) {
      console.log("[ApiClient] Token renovado com sucesso");
      // Atualizar o token na store imediatamente
      useAuthStore.getState().updateToken(data.session.access_token);
      return data.session.access_token;
    }
    
    return null;
  } catch (error) {
    console.error("[ApiClient] Falha ao renovar token:", error);
    throw error;
  }
}

// Função para obter o token mais atualizado da store
function getCurrentToken(): string | null {
  return useAuthStore.getState().token;
}

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
    const token = getCurrentToken();
    const headers: HeadersInit = { ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const response = await fetch(url, { ...options, headers });
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
  // Sempre obter o token mais atualizado da store
  let token = getCurrentToken();
  let headers: HeadersInit = { ...options.headers };
  
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  
  let response = await fetch(url, { ...options, headers });
  
  // Se receber 401, tentar renovar o token automaticamente
  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    
    try {
      const newToken = await refreshToken();
      
      if (newToken) {
        // Tentar a requisição novamente com o novo token
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        // Se não conseguiu renovar, fazer logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new APIError("Sessão expirada. Faça login novamente.");
      }
    } catch (error) {
      // Se falhou ao renovar, fazer logout
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new APIError("Sessão expirada. Faça login novamente.");
    } finally {
      isRefreshing = false;
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Erro na requisição: ${response.statusText}`,
    }));
    throw new APIError(errorData.message || "Ocorreu um erro na sua requisição.");
  }
  
  return response;
}
