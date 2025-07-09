import { API_CONFIG } from './config';

interface RequestOptions extends RequestInit {
  payload?: unknown;
  timeout?: number;
}

class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = 'Erro no servidor. Por favor, tente novamente.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      try {
        errorMessage = await response.text();
      } catch {
        // Keep default error message if both JSON and text parsing fail
      }
    }
    throw new HttpError(
      errorMessage,
      response.status,
      response.statusText
    );
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Tempo limite da requisição excedido'));
    }, ms);
  });
}

export async function makeRequest(
  endpoint: string,
  options: RequestOptions = {}
) {
  const { payload, timeout: customTimeout = API_CONFIG.requestTimeout, ...requestOptions } = options;
  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const fetchOptions: RequestInit = {
    ...requestOptions,
    mode: 'cors',
    credentials: 'omit',
    headers: {
      ...API_CONFIG.headers.json,
      ...requestOptions.headers,
    },
  };

  if (payload) {
    if (payload instanceof FormData) {
      delete fetchOptions.headers['Content-Type'];
      fetchOptions.headers = {
        ...API_CONFIG.headers.formData,
        ...requestOptions.headers,
      };
      fetchOptions.body = payload;
    } else {
      fetchOptions.body = JSON.stringify(payload);
    }
  }

  try {
    const response = await Promise.race([
      fetch(url, fetchOptions),
      timeout(customTimeout),
    ]);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(
        error.message === 'Tempo limite da requisição excedido'
          ? error.message
          : 'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    }
    throw new Error('Ocorreu um erro inesperado. Por favor, tente novamente.');
  }
}