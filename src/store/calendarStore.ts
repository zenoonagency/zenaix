import { create } from "zustand";
import { calendarService } from "../services/calendar/calendar.service";
import {
  CalendarEvent,
  InputCreateEventDTO,
  InputUpdateEventDTO,
  CalendarFilters,
} from "../types/calendar";
import { useAuthStore } from "./authStore";
import { toast } from "react-hot-toast";

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  selectedEvent: CalendarEvent | null;

  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  removeEvent: (eventId: string) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;

  fetchEvents: (filters?: CalendarFilters) => Promise<void>;
  createEventApi: (eventData: InputCreateEventDTO) => Promise<void>;
  updateEventApi: (
    eventId: string,
    eventData: InputUpdateEventDTO
  ) => Promise<void>;
  deleteEventApi: (eventId: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  selectedEvent: null,

  setEvents: (events) => set({ events }),
  addEvent: (event) => {
    set((state) => ({
      events: state.events.some((e) => e.id === event.id)
        ? state.events
        : [...state.events, event],
    }));
  },
  updateEvent: (event) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === event.id ? event : e)),
    }));
  },
  removeEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
    }));
  },
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  fetchEvents: async (filters) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) return;

    if (get().isLoading) return;

    if (get().events.length === 0) {
      set({ isLoading: true });
    }

    try {
      const fetchedEvents = await calendarService.getEvents(
        token,
        organization.id,
        filters
      );
      set({ events: fetchedEvents, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao buscar eventos";
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  createEventApi: async (eventData) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) throw new Error("Não autenticado");

    await calendarService.createEvent(token, organization.id, eventData);
    // Recarregar eventos após criar um novo
    await get().fetchEvents();
  },

  updateEventApi: async (eventId, eventData) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) throw new Error("Não autenticado");

    await calendarService.updateEvent(
      token,
      organization.id,
      eventId,
      eventData
    );
    // Recarregar eventos após atualizar
    await get().fetchEvents();
  },

  deleteEventApi: async (eventId) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) throw new Error("Não autenticado");

    await calendarService.deleteEvent(token, organization.id, eventId);
    // Recarregar eventos após deletar
    await get().fetchEvents();
  },
}));
