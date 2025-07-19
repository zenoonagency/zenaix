import { create } from "zustand";
import { calendarService } from "../services/calendar/calendar.service";
import {
  CalendarEvent,
  InputCreateEventDTO,
  InputUpdateEventDTO,
  CalendarFilters,
} from "../types/calendar";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  selectedEvent: CalendarEvent | null;
  lastFetchTime?: number;

  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  removeEvent: (eventId: string) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  clearDuplicateEvents: () => void;

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

  setEvents: (events) => {
    // Remover duplicatas antes de definir os eventos
    const uniqueEvents = events.filter(
      (event, index, self) => index === self.findIndex((e) => e.id === event.id)
    );
    set({ events: uniqueEvents });
  },

  addEvent: (event) => {
    set((state) => {
      // Verificar se o evento já existe
      const existingEvent = state.events.find((e) => e.id === event.id);
      if (existingEvent) {
        // Se existe, atualizar em vez de adicionar
        return {
          events: state.events.map((e) => (e.id === event.id ? event : e)),
        };
      }
      // Se não existe, adicionar
      return {
        events: [...state.events, event],
      };
    });
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

  clearDuplicateEvents: () => {
    set((state) => {
      const uniqueEvents = state.events.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      );
      return { events: uniqueEvents };
    });
  },

  fetchEvents: async (filters) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) return;

    if (get().isLoading) {
      console.log(
        "[CalendarStore] Já está carregando eventos, ignorando nova requisição"
      );
      return;
    }

    const currentTime = Date.now();
    const lastFetchTime = get().lastFetchTime || 0;
    if (currentTime - lastFetchTime < 1000) {
      // 1 segundo de debounce
      console.log(
        "[CalendarStore] Debounce: ignorando requisição muito próxima da anterior"
      );
      return;
    }

    set({ isLoading: true, lastFetchTime: currentTime });

    try {
      const fetchedEvents = await calendarService.getEvents(
        token,
        organization.id,
        filters
      );

      // Remover duplicatas antes de definir os eventos
      const uniqueEvents = fetchedEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      );

      set({ events: uniqueEvents, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao buscar eventos";
      set({ error: errorMessage, isLoading: false });
      useToastStore.getState().addToast(errorMessage, "error");
    }
  },

  createEventApi: async (eventData) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) throw new Error("Não autenticado");

    const newEvent = await calendarService.createEvent(
      token,
      organization.id,
      eventData
    );
    // Adicionar o evento diretamente ao store em vez de recarregar tudo
    get().addEvent(newEvent);
  },

  updateEventApi: async (eventId, eventData) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) throw new Error("Não autenticado");

    const updatedEvent = await calendarService.updateEvent(
      token,
      organization.id,
      eventId,
      eventData
    );
    // Atualizar o evento diretamente no store em vez de recarregar tudo
    get().updateEvent(updatedEvent);
  },

  deleteEventApi: async (eventId) => {
    const { token, organization } = useAuthStore.getState();
    if (!token || !organization.id) throw new Error("Não autenticado");

    await calendarService.deleteEvent(token, organization.id, eventId);
    // Remover o evento diretamente do store em vez de recarregar tudo
    get().removeEvent(eventId);
  },
}));
