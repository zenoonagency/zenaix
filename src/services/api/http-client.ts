import { API_CONFIG } from './config';
import { NetworkError, TimeoutError } from '../errors/api.errors';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  timeout?: number;
}

async function fetchWithTimeout(url: string, options: RequestOptions = {}) {
  const { timeout = API_CONFIG.timeouts.default } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new NetworkError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = API_CONFIG.retries.count,
  delay: number = API_CONFIG.retries.delay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
}

export const httpClient = {
  async post(endpoint: string, data?: unknown, options: RequestOptions = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const requestOptions: RequestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    };

    if (data instanceof FormData) {
      requestOptions.body = data;
    } else if (data) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Content-Type': 'application/json'
      };
      requestOptions.body = JSON.stringify(data);
    }

    return retryRequest(() => fetchWithTimeout(url, requestOptions));
  }
};