import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  EventPropGetter,
  View,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useCalendarStore } from "../../store/calendarStore";
import { useAuthStore } from "../../store/authStore";
import { useTeamMembersStore } from "../../store/teamMembersStore";
import { calendarService } from "../../services/calendar";
import { EventModal } from "./components/EventModal";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { SearchEventsModal } from "./components/SearchEventsModal";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { EventDetailModal } from "./components/EventDetailModal";
import { DayEventsModal } from "./components/DayEventsModal";
import { CalendarSelector } from "./components/CalendarSelector";
import { CalendarEvent } from "../../types/calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./styles.css";
import { useToast } from "../../hooks/useToast";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop(BigCalendar);

export function Calendar() {
  const { events, fetchEvents, isLoading, clearDuplicateEvents } =
    useCalendarStore();

  const { token, user } = useAuthStore();
  const { members, fetchAllMembers } = useTeamMembersStore();
  const { showToast } = useToast();
  const organizationId = user?.organization_id;

  const [view, setView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [visibleCalendars, setVisibleCalendars] = useState<string[]>(["all"]);

  // Estados para loading otimista
  const [optimisticEvents, setOptimisticEvents] = useState<CalendarEvent[]>([]);
  const [updatingEventIds, setUpdatingEventIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Proteção contra múltiplas chamadas
    if (!token || !organizationId) return;

    console.log("[Calendar] Carregando eventos...");
    fetchEvents();
  }, [fetchEvents, token, organizationId]);

  useEffect(() => {
    if (token && organizationId) {
      fetchAllMembers(token, organizationId);
    }
  }, [token, organizationId, fetchAllMembers]);

  useEffect(() => {
    const uniqueIds = new Set(events.map((e) => e.id));
    if (uniqueIds.size !== events.length) {
      clearDuplicateEvents();
    }
  }, [events, clearDuplicateEvents]);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setSelectedSlot({ start, end });
      setShowEventModal(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  }, []);

  const handleEventDrop = useCallback(
    async ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date;
      end: Date;
    }) => {
      if (!token || !organizationId) {
        showToast("Erro de autenticação", "error");
        return;
      }

      // Validação de data
      if (end <= start) {
        showToast("A data de fim deve ser posterior à data de início", "error");
        return;
      }

      // Bloquear interações
      setUpdatingEventIds((prev) => new Set([...prev, event.id]));

      // Criar evento otimista (nova posição)
      const optimisticEvent = {
        ...event,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      };

      // Aplicar mudança otimista imediatamente
      setOptimisticEvents((prev) =>
        prev.length > 0
          ? prev.map((e) => (e.id === event.id ? optimisticEvent : e))
          : events.map((e) => (e.id === event.id ? optimisticEvent : e))
      );

      try {
        await calendarService.updateEvent(token, organizationId, event.id, {
          start_at: start.toISOString(),
          end_at: end.toISOString(),
        });

        // Sucesso: confirmar mudança otimista
        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? optimisticEvent : e))
        );
        showToast("Evento movido com sucesso!", "success");
      } catch (error: any) {
        console.error("Erro ao mover evento:", error);

        // Erro: reverter para posição original
        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );

        let errorMessage = "Erro ao mover evento";
        if (error?.message) {
          errorMessage = error.message;
        }

        // Verificar se é um erro de permissão específico
        if (
          error?.status === 403 ||
          errorMessage.includes("Acesso negado") ||
          errorMessage.includes("permissão")
        ) {
          errorMessage =
            "Você não tem permissão para mover eventos no calendário. Entre em contacto com o administrador da organização.";
        }

        showToast(errorMessage, "error");
      } finally {
        // Liberar interações
        setUpdatingEventIds(
          (prev) => new Set([...prev].filter((id) => id !== event.id))
        );
      }
    },
    [token, organizationId, events]
  );

  const handleEventResize = useCallback(
    async ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date;
      end: Date;
    }) => {
      if (!token || !organizationId) {
        showToast("Erro de autenticação", "error");
        return;
      }

      // Validação de data
      if (end <= start) {
        showToast("A data de fim deve ser posterior à data de início", "error");
        return;
      }

      // Bloquear interações
      setUpdatingEventIds((prev) => new Set([...prev, event.id]));

      // Criar evento otimista (novo tamanho)
      const optimisticEvent = {
        ...event,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      };

      // Aplicar mudança otimista imediatamente
      setOptimisticEvents((prev) =>
        prev.length > 0
          ? prev.map((e) => (e.id === event.id ? optimisticEvent : e))
          : events.map((e) => (e.id === event.id ? optimisticEvent : e))
      );

      try {
        await calendarService.updateEvent(token, organizationId, event.id, {
          start_at: start.toISOString(),
          end_at: end.toISOString(),
        });

        // Sucesso: confirmar mudança otimista
        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? optimisticEvent : e))
        );
        showToast("Evento redimensionado com sucesso!", "success");
      } catch (error: any) {
        console.error("Erro ao redimensionar evento:", error);

        // Erro: reverter para tamanho original
        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );

        let errorMessage = "Erro ao redimensionar evento";
        if (error?.message) {
          errorMessage = error.message;
        }

        // Verificar se é um erro de permissão específico
        if (
          error?.status === 403 ||
          errorMessage.includes("Acesso negado") ||
          errorMessage.includes("permissão")
        ) {
          errorMessage =
            "Você não tem permissão para redimensionar eventos no calendário. Entre em contacto com o administrador da organização.";
        }

        showToast(errorMessage, "error");
      } finally {
        // Liberar interações
        setUpdatingEventIds(
          (prev) => new Set([...prev].filter((id) => id !== event.id))
        );
      }
    },
    [token, organizationId, events]
  );

  const handleEditClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setShowEventModal(true);
  }, []);

  const handleDeleteEvent = useCallback(
    async (id: string, title: string) => {
      if (!token || !organizationId) {
        showToast("Erro de autenticação", "error");
        return;
      }

      // Remoção otimista imediata
      const originalEvents =
        optimisticEvents.length > 0 ? optimisticEvents : events;
      setOptimisticEvents(originalEvents.filter((e) => e.id !== id));

      try {
        await calendarService.deleteEvent(token, organizationId, id);
        // Sucesso: manter remoção otimista
        showToast(`Evento "${title}" excluído com sucesso!`, "success");
      } catch (error: any) {
        console.error("Erro ao excluir evento:", error);

        // Erro: reverter remoção otimista
        setOptimisticEvents(originalEvents);

        let errorMessage = "Erro ao excluir evento";
        if (error?.message) {
          errorMessage = error.message;
        }

        // Verificar se é um erro de permissão específico
        if (
          error?.status === 403 ||
          errorMessage.includes("Acesso negado") ||
          errorMessage.includes("permissão")
        ) {
          errorMessage =
            "Você não tem permissão para excluir eventos do calendário. Entre em contacto com o administrador da organização.";
        }

        showToast(errorMessage, "error");
      }
    },
    [token, organizationId, events, optimisticEvents]
  );

  const eventPropGetter: EventPropGetter<CalendarEvent> = useCallback(
    (event) => {
      const isThisEventUpdating = updatingEventIds.has(event.id);

      return {
        className: `rbc-event ${
          isThisEventUpdating ? "rbc-event-updating" : ""
        }`,
        style: {
          backgroundColor: event.color || "#7f00ff",
          color: "white",
          opacity: isThisEventUpdating ? 0.7 : 1,
          cursor: isThisEventUpdating ? "not-allowed" : "pointer",
          pointerEvents: isThisEventUpdating ? "none" : "auto",
        },
      };
    },
    [updatingEventIds]
  );

  const handleShowMore = useCallback((events: CalendarEvent[], date: Date) => {
    setSelectedDate(date);
    setShowDayEventsModal(true);
  }, []);

  const getDayEvents = useCallback(
    (date: Date) => {
      return events.filter((event) =>
        isSameDay(new Date(event.start_at), date)
      );
    },
    [events]
  );

  const filteredEvents = useMemo(() => {
    // Usar eventos otimistas se disponíveis, senão usar eventos normais
    const eventsToFilter =
      optimisticEvents.length > 0 ? optimisticEvents : events;

    if (visibleCalendars.includes("all")) {
      return eventsToFilter;
    }

    return eventsToFilter.filter((event) => {
      if (!event.assignee_id) return false;
      return visibleCalendars.includes(event.assignee_id);
    });
  }, [events, optimisticEvents, visibleCalendars]);

  useEffect(() => {
    const allAssignees = Array.from(
      new Set(
        events.map((event) => event.assignee_id || "").filter((id) => id !== "")
      )
    );

    if (visibleCalendars.length === 0) {
      setVisibleCalendars(["all"]);
    }
  }, [events]);

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      events.forEach((event) => {
        event.notifications?.forEach((notification) => {
          if (notification.status === "PENDING") {
            const notificationTime = new Date(notification.sendAt);
            const timeDiff = notificationTime.getTime() - now.getTime();

            if (timeDiff > 0 && timeDiff < 60000) {
              showToast(
                `O evento "${event.title}" começará em breve!`,
                "warning"
              );
            }
          }
        });
      });
    };

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [events]);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 border border-purple-500 rounded-lg">
              <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text">
              Calendário
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCalendarSelector(true)}
              className="p-2 bg-white dark:bg-dark-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
              title="Selecionar agendas"
            >
              <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 bg-white dark:bg-dark-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
              title="Buscar eventos"
            >
              <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => {
                setShowEventModal(true);
                setSelectedEvent(null);
                setIsEditing(false);
              }}
              className="flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
            >
              <Plus className="w-5 h-5 mr-1" />
              Novo Evento
            </button>
          </div>
        </div>

        <div className="flex">
          <div className="flex-grow">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="relative">
                  {updatingEventIds.size > 0 && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Atualizando {updatingEventIds.size} evento
                      {updatingEventIds.size > 1 ? "s" : ""}...
                    </div>
                  )}
                  <DragAndDropCalendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor={(event: CalendarEvent) =>
                      new Date((event as CalendarEvent).start_at)
                    }
                    endAccessor={(event: CalendarEvent) =>
                      new Date((event as CalendarEvent).end_at)
                    }
                    allDayAccessor={() => false}
                    titleAccessor={(event: CalendarEvent) =>
                      (event as CalendarEvent).title
                    }
                    step={30}
                    timeslots={2}
                    style={{ height: "calc(100vh - 240px)" }}
                    selectable
                    resizable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    eventPropGetter={eventPropGetter}
                    resizableAccessor={(event) =>
                      !updatingEventIds.has((event as CalendarEvent).id)
                    }
                    messages={{
                      allDay: "Dia inteiro",
                      previous: "Anterior",
                      next: "Próximo",
                      today: "Hoje",
                      month: "Mês",
                      week: "Semana",
                      day: "Dia",
                      agenda: "Agenda",
                      date: "Data",
                      time: "Hora",
                      event: "Evento",
                      noEventsInRange: "Não há eventos neste período.",
                      showMore: (total: number) =>
                        `+ Ver mais ${total} eventos`,
                    }}
                    culture="pt-BR"
                    views={["month", "week", "day", "agenda"]}
                    defaultView="month"
                    view={view}
                    onView={(newView) => setView(newView)}
                    onShowMore={(events: any[], date) => {
                      handleShowMore(events as CalendarEvent[], date);
                    }}
                    popup={false}
                    doShowMoreDrillDown={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-2 bg-white dark:bg-dark-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors mx-2"
              title={
                sidebarVisible
                  ? "Esconder próximos eventos"
                  : "Mostrar próximos eventos"
              }
            >
              {sidebarVisible ? (
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>

          <div
            className={`w-80 transition-all duration-300 ease-in-out overflow-hidden ${
              sidebarVisible ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"
            }`}
          >
            <div className="p-6">
              <UpcomingEvents />
            </div>
          </div>
        </div>
      </div>

      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            setSelectedSlot(null);
            setIsEditing(false);
          }}
          selectedDates={selectedSlot}
          event={selectedEvent}
          isEditing={isEditing}
        />
      )}

      {showSearchModal && (
        <SearchEventsModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {showDetailModal && selectedEvent && (
        <EventDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onEdit={() => handleEditClick(selectedEvent)}
        />
      )}

      {showDayEventsModal && selectedDate && (
        <DayEventsModal
          isOpen={showDayEventsModal}
          onClose={() => {
            setShowDayEventsModal(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          events={getDayEvents(selectedDate)}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setShowDayEventsModal(false);
            setShowDetailModal(true);
          }}
        />
      )}

      <CalendarSelector
        isOpen={showCalendarSelector}
        onClose={() => setShowCalendarSelector(false)}
        visibleCalendars={visibleCalendars}
        setVisibleCalendars={setVisibleCalendars}
      />
    </div>
  );
}
