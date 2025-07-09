import { makeRequest } from './httpClient';
import { API_CONFIG } from './config';

export const documentService = {
  async upload(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', new Date().toISOString());

      await makeRequest(API_CONFIG.endpoints.uploadDocument, {
        method: 'POST',
        payload: formData,
        timeout: 60000, // 60 seconds for file uploads
      });
    } catch (error) {
      console.error('Document Upload Error:', error);
      throw error;
    }
  },
};