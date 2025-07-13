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

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status !== 401) {
    return response;
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((newToken) => {
      headers["Authorization"] = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    });
  }

  isRefreshing = true;

  try {
    const { token } = await authService.refreshToken();

    useAuthStore.getState().setToken(token);

    processQueue(null, token);

    headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  } catch (error: any) {
    processQueue(error, null);
    useAuthStore.getState().logout();
    console.error("Falha CRÍTICA na renovação do token:", error);
    throw new APIError(
      "A sua sessão expirou. Por favor, faça login novamente."
    );
  } finally {
    isRefreshing = false;
  }
}
