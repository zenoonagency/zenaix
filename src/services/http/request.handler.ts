import { REQUEST_CONFIG } from '../config/request.config';
import { TimeoutError, NetworkError } from './errors';
import { handleResponse } from './response.handler';

interface RequestOptions extends RequestInit {
  payload?: unknown;
  timeout?: number;
}

function createTimeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new TimeoutError()), ms);
  });
}

async function retryRequest(
  fn: () => Promise<any>,
  retries: number,
  delay: number
): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0 || !(error instanceof Error)) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
}

export async function makeRequest(
  url: string,
  options: RequestOptions = {}
): Promise<any> {
  const {
    payload,
    timeout = REQUEST_CONFIG.timeouts.default,
    ...requestOptions
  } = options;

  const fetchOptions: RequestInit = {
    ...requestOptions,
    mode: 'cors',
    credentials: 'omit',
    headers: {
      ...REQUEST_CONFIG.headers.base,
      ...REQUEST_CONFIG.headers.json,
      ...requestOptions.headers,
    },
  };

  if (payload) {
    if (payload instanceof FormData) {
      delete fetchOptions.headers['Content-Type'];
    } else {
      fetchOptions.body = JSON.stringify(payload);
    }
    fetchOptions.body = payload instanceof FormData ? payload : JSON.stringify(payload);
  }

  try {
    const fetchPromise = retryRequest(
      async () => {
        const response = await Promise.race([
          fetch(url, fetchOptions),
          createTimeout(timeout),
        ]);
        return handleResponse(response);
      },
      REQUEST_CONFIG.retries.count,
      REQUEST_CONFIG.retries.delay
    );

    return await fetchPromise;
  } catch (error) {
    if (error instanceof TimeoutError) throw error;
    if (error instanceof TypeError) throw new NetworkError();
    throw error;
  }
}