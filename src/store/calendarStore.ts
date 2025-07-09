import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/generateId';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: string;
  categories?: string[];
  notification?: string;
  customFields?: any[];
  responsible: string;
}

interface CalendarState {
  events: CalendarEvent[];
  visibleCalendars: string[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  clearEvents: () => void;
  setVisibleCalendars: (calendars: string[]) => void;
  toggleCalendarVisibility: (calendar: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      visibleCalendars: [],
      addEvent: (event) =>
        set((state) => ({
          events: [
            ...state.events,
            {
              ...event,
              id: generateId(),
            },
          ],
        })),
      updateEvent: (id, updatedEvent) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updatedEvent } : event
          ),
        })),
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),
      clearEvents: () => set({ events: [] }),
      setVisibleCalendars: (calendars) => set({ visibleCalendars: calendars }),
      toggleCalendarVisibility: (calendar) =>
        set((state) => ({
          visibleCalendars: state.visibleCalendars.includes(calendar)
            ? state.visibleCalendars.filter((c) => c !== calendar)
            : [...state.visibleCalendars, calendar],
        })),
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        events: state.events.map((event) => ({
          ...event,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.events = state.events.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }));
        }
      },
    }
  )
); 