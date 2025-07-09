import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    if (!config || !config.retry) {
      config.retry = 0;
    }

    if (config.retry < MAX_RETRIES) {
      config.retry += 1;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.retry));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export { api };