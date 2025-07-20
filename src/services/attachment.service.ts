import { API_CONFIG } from "../config/api.config";
import {
  AttachmentDTO,
  AttachmentResponse,
  AttachmentDownloadResponse,
} from "../types/card";
import { fetchWithAuth } from "./apiClient";
import { getAuthHeaders } from "../utils/authHeaders";
import { APIError } from "./errors/api.errors";
import { formatApiError } from "../utils/formatters";

export const attachmentService = {
  // Adicionar Anexo
  async createAttachment(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    file: File
  ): Promise<AttachmentDTO[]> {
    try {
      console.log("[AttachmentService] Iniciando upload de anexo");
      console.log("[AttachmentService] Parâmetros:", {
        organizationId,
        boardId,
        listId,
        cardId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.attachments.create(
        organizationId,
        boardId,
        listId,
        cardId
      )}`;

      console.log("[AttachmentService] URL:", url);

      const formData = new FormData();
      formData.append("file", file);

      console.log("[AttachmentService] FormData criado, fazendo requisição...");
      console.log(
        "[AttachmentService] Tamanho do arquivo:",
        file.size,
        "bytes"
      );
      console.log("[AttachmentService] Tipo do arquivo:", file.type);
      console.log("[AttachmentService] Nome do arquivo:", file.name);

      // Seguir o mesmo padrão dos outros serviços que funcionam
      const headers = getAuthHeaders(token);
      delete headers["Content-Type"]; // Remover Content-Type para FormData

      console.log("[AttachmentService] Headers finais:", headers);

      const response = await fetchWithAuth(url, {
        method: "POST",
        headers,
        body: formData,
      });

      console.log("[AttachmentService] Resposta recebida:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("[AttachmentService] Erro na resposta:", errorData);
        const error = formatApiError(errorData, "Falha ao adicionar anexo.");
        (error as any).status = response.status;
        throw error;
      }

      const responseData: AttachmentResponse = await response.json();
      console.log(
        "[AttachmentService] Upload concluído com sucesso:",
        responseData
      );
      return responseData.data;
    } catch (error) {
      console.error("[AttachmentService] Erro no upload:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao adicionar o anexo.");
    }
  },

  // Listar Anexos
  async getAttachments(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string
  ): Promise<AttachmentDTO[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.attachments.findAll(
        organizationId,
        boardId,
        listId,
        cardId
      )}`;

      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao buscar anexos.");
        (error as any).status = response.status;
        throw error;
      }

      const responseData: AttachmentResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao buscar os anexos.");
    }
  },

  // Baixar Anexo
  async downloadAttachment(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    attachmentId: string
  ): Promise<string> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.attachments.download(
        organizationId,
        boardId,
        listId,
        cardId,
        attachmentId
      )}`;

      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(
          errorData,
          "Falha ao gerar URL de download."
        );
        (error as any).status = response.status;
        throw error;
      }

      const responseData: AttachmentDownloadResponse = await response.json();
      return responseData.data.url;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        "Ocorreu um erro inesperado ao gerar URL de download."
      );
    }
  },

  // Substituir Anexo
  async updateAttachment(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    attachmentId: string,
    file: File
  ): Promise<AttachmentDTO[]> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.attachments.update(
        organizationId,
        boardId,
        listId,
        cardId,
        attachmentId
      )}`;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetchWithAuth(url, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(token),
          // Remover Content-Type para deixar o browser definir com boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao substituir anexo.");
        (error as any).status = response.status;
        throw error;
      }

      const responseData: AttachmentResponse = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao substituir o anexo.");
    }
  },

  // Deletar Anexo
  async deleteAttachment(
    token: string,
    organizationId: string,
    boardId: string,
    listId: string,
    cardId: string,
    attachmentId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.cards.attachments.delete(
        organizationId,
        boardId,
        listId,
        cardId,
        attachmentId
      )}`;

      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = formatApiError(errorData, "Falha ao deletar anexo.");
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("Ocorreu um erro inesperado ao deletar o anexo.");
    }
  },
};
