import { httpClient } from './http-client';
import { WEBHOOK_API_CONFIG } from '../../config/webhook.config';

export const documentService = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', new Date().toISOString());

    await httpClient.post(
      WEBHOOK_API_CONFIG.endpoints.uploadDocument,
      formData,
      { timeout: WEBHOOK_API_CONFIG.timeouts.upload }
    );
  }
};