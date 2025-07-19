import { API_CONFIG } from "../../config/api.config";
import { ApiResponse } from "../../types/api.types";
import {
  CalendarEvent,
  InputCreateEventDTO,
  InputUpdateEventDTO,
  CalendarFilters,
} from "../../types/calendar";
import { fetchWithAuth } from "../apiClient";
import { getAuthHeaders } from "../../utils/authHeaders";
import { APIError } from "../errors/api.errors";
import { formatApiError } from "../../utils/formatters";

export const calendarService = {
  async createEvent(
    token: string,
    organizationId: string,
    eventData: InputCreateEventDTO
  ): Promise<CalendarEvent> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.calendar.create(
        organizationId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Adicionar status ao erro para melhor tratamento
        const error = formatApiError(errorData, "Falha ao criar evento.");
        (error as any).status = response.status;

        throw error;
      }
      const responseData: ApiResponse<CalendarEvent> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) {
        // Preservar o status se existir
        if ((error as any).status) {
          (error as any).status = (error as any).status;
        }
        throw error;
      }
      throw new APIError("Ocorreu um erro inesperado ao criar o evento.");
    }
  },

  async getEvents(
    token: string,
    organizationId: string,
    filters?: CalendarFilters
  ): Promise<CalendarEvent[]> {
    try {
      const url = new URL(
        `${API_CONFIG.baseUrl}${API_CONFIG.calendar.findAll(organizationId)}`,
        window.location.origin
      );
      if (filters?.year)
        url.searchParams.append("year", filters.year.toString());
      if (filters?.month)
        url.searchParams.append("month", filters.month.toString());
      if (filters?.searchTerm)
        url.searchParams.append("searchTerm", filters.searchTerm);

      const response = await fetchWithAuth(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Adicionar status ao erro para melhor tratamento
        const error = formatApiError(errorData, "Falha ao buscar eventos.");
        (error as any).status = response.status;

        throw error;
      }
      const responseData: ApiResponse<CalendarEvent[]> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) {
        // Preservar o status se existir
        if ((error as any).status) {
          (error as any).status = (error as any).status;
        }
        throw error;
      }
      throw new APIError("Ocorreu um erro inesperado ao buscar os eventos.");
    }
  },

  async getEventById(
    token: string,
    organizationId: string,
    eventId: string
  ): Promise<CalendarEvent> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.calendar.findById(
        organizationId,
        eventId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Adicionar status ao erro para melhor tratamento
        const error = formatApiError(errorData, "Falha ao buscar evento.");
        (error as any).status = response.status;

        throw error;
      }
      const responseData: ApiResponse<CalendarEvent> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) {
        // Preservar o status se existir
        if ((error as any).status) {
          (error as any).status = (error as any).status;
        }
        throw error;
      }
      throw new APIError("Ocorreu um erro inesperado ao buscar o evento.");
    }
  },

  async updateEvent(
    token: string,
    organizationId: string,
    eventId: string,
    eventData: InputUpdateEventDTO
  ): Promise<CalendarEvent> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.calendar.update(
        organizationId,
        eventId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Adicionar status ao erro para melhor tratamento
        const error = formatApiError(errorData, "Falha ao atualizar evento.");
        (error as any).status = response.status;

        throw error;
      }
      const responseData: ApiResponse<CalendarEvent> = await response.json();
      return responseData.data;
    } catch (error) {
      if (error instanceof APIError) {
        // Preservar o status se existir
        if ((error as any).status) {
          (error as any).status = (error as any).status;
        }
        throw error;
      }
      throw new APIError("Ocorreu um erro inesperado ao atualizar o evento.");
    }
  },

  async deleteEvent(
    token: string,
    organizationId: string,
    eventId: string
  ): Promise<void> {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.calendar.delete(
        organizationId,
        eventId
      )}`;
      const response = await fetchWithAuth(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Adicionar status ao erro para melhor tratamento
        const error = formatApiError(errorData, "Falha ao apagar evento.");
        (error as any).status = response.status;

        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) {
        // Preservar o status se existir
        if ((error as any).status) {
          (error as any).status = (error as any).status;
        }
        throw error;
      }
      throw new APIError("Ocorreu um erro inesperado ao apagar o evento.");
    }
  },
};
