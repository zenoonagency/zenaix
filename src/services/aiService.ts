import { API_CONFIG } from './config';

export const aiService = {
  async start() {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/liga`, {
        method: 'POST',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao ativar a IA');
      }
    } catch (error) {
      console.error('AI Start Error:', error);
      throw error;
    }
  },

  async stop() {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/desliga`, {
        method: 'POST',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao desativar a IA');
      }
    } catch (error) {
      console.error('AI Stop Error:', error);
      throw error;
    }
  },
};