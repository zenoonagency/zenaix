import { API_CONFIG } from '../config/api.config';
import { REQUEST_CONFIG } from '../config/request.config';
import { makeRequest } from '../http/request.handler';

export const documentService = {
  async upload(file: File) {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.uploadDocument}`;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', new Date().toISOString());

      await makeRequest(url, {
        method: 'POST',
        payload: formData,
        timeout: REQUEST_CONFIG.timeouts.upload,
      });
    } catch (error) {
      console.error('Document Upload Error:', error);
      throw error;
    }
  },
};