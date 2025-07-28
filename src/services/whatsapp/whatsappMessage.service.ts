import { API_CONFIG } from '../../config/api.config';
import { fetchWithAuth } from '../apiClient';
import { getAuthHeaders } from '../../utils/authHeaders';
import { APIError } from '../errors/api.errors';
import {
  WhatsappMessage,
  InputSendMessageDTO,
  WhatsappMessageListResponse,
} from '../../types/whatsapp';
import { formatApiError } from '../../utils/formatters';

export const whatsappMessageService = {
  async send(token: string, organizationId: string, instanceId: string, dto: InputSendMessageDTO): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.whatsapp.messages.send(organizationId, instanceId)}`;
      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, 'Falha ao enviar mensagem.');
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Ocorreu um erro inesperado ao enviar mensagem.');
    }
  },

  async list(token: string, organizationId: string, instanceId: string, contact: string, limit = 20, cursor?: string): Promise<WhatsappMessage[]> {
    try {
      const baseUrl = `${API_CONFIG.baseUrl}${API_CONFIG.whatsapp.messages.list(organizationId, instanceId)}`;
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.append('contact', contact);
      url.searchParams.append('limit', String(limit));
      if (cursor) url.searchParams.append('cursor', cursor);
      
      const response = await fetchWithAuth(url.toString(), {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      const responseData: WhatsappMessageListResponse = await response.json();
      if (!response.ok) {
        throw formatApiError(responseData, 'Falha ao listar mensagens.');
      }
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Ocorreu um erro inesperado ao listar mensagens.');
    }
  },
}; 