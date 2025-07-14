import { APIError } from "../services/errors/api.errors";


export const getAuthHeaders = (
  token: string,
  contentType = "application/json"
): HeadersInit => {
  if (!token) {
    throw new APIError(
      "Token de autenticação é obrigatório para esta operação."
    );
  }
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
};
