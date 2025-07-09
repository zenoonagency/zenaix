import { API_CONFIG } from '../config/api.config';
import { REQUEST_CONFIG } from '../config/request.config';
import { makeRequest } from '../http/request.handler';

export const aiService = {
  async start() {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.startAI}`;
    
    try {
      await makeRequest(url, {
        method: 'POST',
        payload: {
          action: 'start',
          timestamp: new Date().toISOString(),
        },
        timeout: REQUEST_CONFIG.timeouts.default,
      });
    } catch (error) {
      console.error('AI Start Error:', error);
      throw error;
    }
  },

  async stop() {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.stopAI}`;
    
    try {
      await makeRequest(url, {
        method: 'POST',
        payload: {
          action: 'stop',
          timestamp: new Date().toISOString(),
        },
        timeout: REQUEST_CONFIG.timeouts.default,
      });
    } catch (error) {
      console.error('AI Stop Error:', error);
      throw error;
    }
  },
};