import { httpClient } from './http-client';
import { API_CONFIG } from './config';

export const documentService = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', new Date().toISOString());

    await httpClient.post(
      API_CONFIG.endpoints.uploadDocument,
      formData,
      { timeout: API_CONFIG.timeouts.upload }
    );
  }
};