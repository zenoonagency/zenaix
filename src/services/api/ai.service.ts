import { httpClient } from './http-client';
import { API_CONFIG } from './config';

export const aiService = {
  async start() {
    await httpClient.post(API_CONFIG.endpoints.startAI, {
      timestamp: new Date().toISOString()
    });
  },

  async stop() {
    await httpClient.post(API_CONFIG.endpoints.stopAI, {
      timestamp: new Date().toISOString()
    });
  }
};