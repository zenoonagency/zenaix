import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calendarService } from "../services/calendar/calendar.service";
import {
  CalendarEvent,
  CalendarFilters,
  CalendarState,
} from "../types/calendar";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";
import { cleanUserData } from "../utils/dataOwnership";

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      isLoading: false,
      error: null,
      selectedEvent: null,
      lastFetched: null,

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
      removeAllEvents: () => {
        set({ events: [], selectedEvent: null });
      },
      fetchEvents: async (filters, forceRefresh = false) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) return;

        if (get().isLoading) return;

        const now = Date.now();
        const lastFetched = get().lastFetched;
        const threeMinutes = 3 * 60 * 1000;

        if (
          !forceRefresh &&
          get().events.length > 0 &&
          lastFetched &&
          now - lastFetched < threeMinutes
        ) {
          const tenMinutes = 10 * 60 * 1000;
          if (now - lastFetched > tenMinutes) {
            setTimeout(() => {
              get().fetchEvents(filters, true);
            }, 100);
          }
          return;
        }

        if (get().events.length === 0) {
          set({ isLoading: true });
        }

        try {
          const fetchedEvents = await calendarService.getEvents(
            token,
            organization.id,
            filters
          );
          set({
            events: fetchedEvents,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });
        } catch (error: any) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : "Erro ao buscar eventos";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },
      cleanUserData: () => {
        set({
          events: [],
          lastFetched: null,
          selectedEvent: null,
        });
      },
    }),
    {
      name: "calendar-store",
      partialize: (state) => ({
        events: state.events,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
