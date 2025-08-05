import { httpClient } from './http-client';
import { WEBHOOK_API_CONFIG } from '../../config/webhook.config';

export const aiService = {
  async start() {
    await httpClient.post(WEBHOOK_API_CONFIG.endpoints.startAI, {
      timestamp: new Date().toISOString()
    });
  },

  async stop() {
    await httpClient.post(WEBHOOK_API_CONFIG.endpoints.stopAI, {
      timestamp: new Date().toISOString()
    });
  }
};