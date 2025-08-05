import { API_CONFIG } from "../../config/api.config";
import { ApiResponse } from "../../types/api.types";
import {
  ContractOutput,
  InputCreateContractDTO,
  InputUpdateContractDTO,
} from "../../types/contract";
import { fetchWithAuth } from "../apiClient";
import { getAuthHeaders } from "../../utils/authHeaders";
import { APIError } from "../errors/api.errors";

export const contractService = {
  async create(
    token: string,
    organizationId: string,
    dto: InputCreateContractDTO
  ): Promise<ContractOutput> {
    const isMultipart = !!dto.file;
    let body: FormData | string;
    let headers: any = getAuthHeaders(token);
    let url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.create(
      organizationId
    )}`;

    if (isMultipart) {
      const formData = new FormData();
      Object.entries(dto).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "file" && value instanceof File) {
            formData.append("file", value);
          } else {
            formData.append(key, value as any);
          }
        }
      });
      body = formData;
      delete headers["Content-Type"];
    } else {
      body = JSON.stringify(dto);
      headers["Content-Type"] = "application/json";
    }

    const response = await fetchWithAuth(url, {
      method: "POST",
      headers,
      body,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(errorData.message || "Failed to create contract.");
    }
    const responseData: ApiResponse<ContractOutput> = await response.json();
    return responseData.data;
  },

  async findAll(
    token: string,
    organizationId: string,
    title?: string
  ): Promise<ContractOutput[]> {
    let url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.findAll(
      organizationId
    )}`;
    if (title) {
      url += `?title=${encodeURIComponent(title)}`;
    }
    const response = await fetchWithAuth(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(errorData.message || "Failed to fetch contracts.");
    }
    const responseData: ApiResponse<ContractOutput[]> = await response.json();
    return responseData.data;
  },

  async findById(
    token: string,
    organizationId: string,
    contractId: string
  ): Promise<ContractOutput> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.findById(
      organizationId,
      contractId
    )}`;
    const response = await fetchWithAuth(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(errorData.message || "Failed to fetch contract.");
    }
    const responseData: ApiResponse<ContractOutput> = await response.json();
    return responseData.data;
  },

  async update(
    token: string,
    organizationId: string,
    contractId: string,
    dto: InputUpdateContractDTO
  ): Promise<ContractOutput> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.update(
      organizationId,
      contractId
    )}`;
    const response = await fetchWithAuth(url, {
      method: "PATCH",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(errorData.message || "Failed to update contract.");
    }
    const responseData: ApiResponse<ContractOutput> = await response.json();
    return responseData.data;
  },

  async delete(
    token: string,
    organizationId: string,
    contractId: string
  ): Promise<void> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.delete(
      organizationId,
      contractId
    )}`;
    const response = await fetchWithAuth(url, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(errorData.message || "Failed to delete contract.");
    }
  },

  async uploadFile(
    token: string,
    organizationId: string,
    contractId: string,
    file: File
  ): Promise<ContractOutput> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.uploadFile(
      organizationId,
      contractId
    )}`;
    const formData = new FormData();
    formData.append("file", file);
    const headers = getAuthHeaders(token);
    delete headers["Content-Type"];
    const response = await fetchWithAuth(url, {
      method: "PUT",
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || "Failed to upload contract file."
      );
    }
    const responseData: ApiResponse<ContractOutput> = await response.json();
    return responseData.data;
  },

  async downloadFile(
    token: string,
    organizationId: string,
    contractId: string
  ): Promise<string> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.downloadFile(
      organizationId,
      contractId
    )}`;
    const response = await fetchWithAuth(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || "Failed to get contract file URL."
      );
    }
    const responseData: ApiResponse<{ url: string }> = await response.json();
    console.log(responseData);
    return responseData.data.url;
  },

  async deleteFile(
    token: string,
    organizationId: string,
    contractId: string
  ): Promise<ContractOutput> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.contracts.deleteFile(
      organizationId,
      contractId
    )}`;
    const response = await fetchWithAuth(url, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || "Failed to delete contract file."
      );
    }
    const responseData: ApiResponse<ContractOutput> = await response.json();
    return responseData.data;
  },
};
