import { create } from "zustand";
import { calendarService } from "../services/calendar/calendar.service";
import { CalendarEvent, CalendarFilters } from "../types/calendar";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";

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
  removeEventsByFilter: (filters: {
    start_date: string;
    end_date: string;
  }) => void;

  fetchEvents: (filters?: CalendarFilters) => Promise<void>;
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

  removeEventsByFilter: (filters) => {
    set((state) => {
      const startDate = new Date(filters.start_date);
      const endDate = new Date(filters.end_date);

      const filteredEvents = state.events.filter((event) => {
        const eventStartDate = new Date(event.start_at);
        return !(eventStartDate >= startDate && eventStartDate <= endDate);
      });

      return { events: filteredEvents };
    });
  },
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
      const errorMessage =
        error instanceof APIError ? error.message : "Erro ao buscar eventos";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },
}));
