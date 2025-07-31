import { useState, useCallback, useEffect, useMemo } from "react";
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
  Trash2,
  Settings,
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
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { Modal } from "../../components/Modal";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./styles.css";
import { useToast } from "../../hooks/useToast";
import { ModalCanAcess } from "../../components/ModalCanAcess";

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
  const { events, fetchEvents, isLoading } = useCalendarStore();

  const { token, user, hasPermission } = useAuthStore();
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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<Date | null>(null);
  const [showDeleteConfigModal, setShowDeleteConfigModal] = useState(false);
  const [isDeletingEvents, setIsDeletingEvents] = useState(false);
  const [showBulkDeleteConfirmModal, setShowBulkDeleteConfirmModal] =
    useState(false);
  const [bulkDeleteData, setBulkDeleteData] = useState<{
    filters: any;
    message: string;
    confirmMessage: string;
  } | null>(null);
  const [deleteFilters, setDeleteFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    deleteType: "month" as "month" | "year" | "day" | "all",
  });

  // Estados para loading otimista
  const [optimisticEvents, setOptimisticEvents] = useState<CalendarEvent[]>([]);
  const [updatingEventIds, setUpdatingEventIds] = useState<Set<string>>(
    new Set()
  );

  const canAccess = hasPermission("calendar:read");

  useEffect(() => {
    if (!token || !organizationId) return;
    fetchEvents();
  }, [fetchEvents, token, organizationId]);

  useEffect(() => {
    if (token && organizationId) {
      fetchAllMembers(token, organizationId);
    }
  }, [token, organizationId, fetchAllMembers]);

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

      if (end <= start) {
        showToast("A data de fim deve ser posterior à data de início", "error");
        return;
      }

      setUpdatingEventIds((prev) => new Set([...prev, event.id]));

      const optimisticEvent = {
        ...event,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      };

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

        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? optimisticEvent : e))
        );
        showToast("Evento movido com sucesso!", "success");
      } catch (error: any) {
        console.error("Erro ao mover evento:", error);

        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );

        let errorMessage = "Erro ao mover evento";
        if (error?.message) {
          errorMessage = error.message;
        }

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

      if (end <= start) {
        showToast("A data de fim deve ser posterior à data de início", "error");
        return;
      }

      setUpdatingEventIds((prev) => new Set([...prev, event.id]));

      const optimisticEvent = {
        ...event,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      };

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

        setOptimisticEvents((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );

        let errorMessage = "Erro ao redimensionar evento";
        if (error?.message) {
          errorMessage = error.message;
        }

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

  const getDayEvents = useCallback(
    (date: Date) => {
      return events.filter((event) =>
        isSameDay(new Date(event.start_at), date)
      );
    },
    [events]
  );

  const confirmDeleteAllEvents = useCallback(async () => {
    if (!token || !organizationId || !dateToDelete) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsDeletingEvents(true);
    const eventsToDelete = getDayEvents(dateToDelete);

    try {
      const deletePromises = eventsToDelete.map((event) =>
        calendarService.deleteEvent(token, organizationId, event.id)
      );

      await Promise.all(deletePromises);

      showToast(
        `Todos os ${eventsToDelete.length} eventos de ${format(
          dateToDelete,
          "dd/MM/yyyy"
        )} foram excluídos com sucesso!`,
        "success"
      );

      setShowDeleteConfirmModal(false);
      setDateToDelete(null);
    } catch (error: any) {
      let errorMessage = "Erro ao excluir eventos";
      if (error?.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setIsDeletingEvents(false);
    }
  }, [token, organizationId, dateToDelete, getDayEvents, fetchEvents]);

  const handleDeleteWithFilters = useCallback(() => {
    if (!token || !organizationId) {
      showToast("Erro de autenticação", "error");
      return;
    }

    let filters = {};
    let message = "";
    let confirmMessage = "";

    switch (deleteFilters.deleteType) {
      case "month":
        filters = { year: deleteFilters.year, month: deleteFilters.month };
        const monthName = new Date(
          deleteFilters.year,
          deleteFilters.month - 1
        ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        message = `Todos os eventos de ${monthName} foram excluídos com sucesso!`;
        confirmMessage = `Tem certeza que deseja excluir todos os eventos de ${monthName}? Esta ação não pode ser desfeita.`;
        break;
      case "year":
        filters = { year: deleteFilters.year };
        message = `Todos os eventos de ${deleteFilters.year} foram excluídos com sucesso!`;
        confirmMessage = `Tem certeza que deseja excluir todos os eventos de ${deleteFilters.year}? Esta ação não pode ser desfeita.`;
        break;
      case "day":
        const startDate = new Date(deleteFilters.startDate);
        const endDate = new Date(deleteFilters.endDate);

        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        filters = {
          start_date: startOfDay.toISOString(),
          end_date: endOfDay.toISOString(),
        };

        const startFormatted = format(startDate, "dd/MM/yyyy");
        const endFormatted = format(endDate, "dd/MM/yyyy");

        if (startFormatted === endFormatted) {
          message = `Todos os eventos de ${startFormatted} foram excluídos com sucesso!`;
          confirmMessage = `Tem certeza que deseja excluir todos os eventos de ${startFormatted}? Esta ação não pode ser desfeita.`;
        } else {
          message = `Todos os eventos de ${startFormatted} a ${endFormatted} foram excluídos com sucesso!`;
          confirmMessage = `Tem certeza que deseja excluir todos os eventos de ${startFormatted} a ${endFormatted}? Esta ação não pode ser desfeita.`;
        }
        break;
      case "all":
        filters = {};
        message = "Todos os eventos foram excluídos com sucesso!";
        confirmMessage =
          "Tem certeza que deseja excluir TODOS os eventos do calendário? Esta ação é irreversível!";
        break;
    }

    setBulkDeleteData({ filters, message, confirmMessage });
    setShowBulkDeleteConfirmModal(true);
  }, [token, organizationId, deleteFilters]);

  const confirmBulkDelete = useCallback(async () => {
    if (!token || !organizationId || !bulkDeleteData) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsDeletingEvents(true);
    try {
      await calendarService.deleteAllEvents(
        token,
        organizationId,
        bulkDeleteData.filters
      );
      showToast(bulkDeleteData.message, "success");
      setShowDeleteConfigModal(false);
    } catch (error: any) {
      let errorMessage = "Erro ao excluir eventos";
      if (error?.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage, "error");
    } finally {
      setIsDeletingEvents(false);
      setShowBulkDeleteConfirmModal(false);
      setBulkDeleteData(null);
    }
  }, [token, organizationId, bulkDeleteData, fetchEvents]);

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

  const filteredEvents = useMemo(() => {
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

  if (!canAccess) {
    return <ModalCanAcess title="Calendário" />;
  }

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
            <button
              onClick={() => setShowDeleteConfigModal(true)}
              className="p-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
              title="Excluir eventos em massa"
            >
              <Trash2 className="w-5 h-5" />
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

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setDateToDelete(null);
        }}
        onConfirm={confirmDeleteAllEvents}
        title="Confirmar exclusão"
        message={
          dateToDelete
            ? `Tem certeza que deseja excluir todos os ${
                getDayEvents(dateToDelete).length
              } eventos de ${format(
                dateToDelete,
                "dd/MM/yyyy"
              )}? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmText="Excluir Todos"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        isLoading={isDeletingEvents}
      />

      <Modal
        isOpen={showDeleteConfigModal}
        onClose={() => setShowDeleteConfigModal(false)}
        title="Excluir Eventos em Massa"
        size="medium"
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Configuração de Exclusão
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Escolha o período dos eventos que deseja excluir. Esta ação
                  não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Excluir eventos:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteFilters((prev) => ({
                      ...prev,
                      deleteType: "day",
                    }))
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    deleteFilters.deleteType === "day"
                      ? "border-[#7f00ff] bg-[#7f00ff] text-white"
                      : "border-gray-200 dark:border-gray-700 hover:border-[#7f00ff] text-gray-700 dark:text-gray-300 hover:text-[#7f00ff]"
                  }`}
                >
                  Dia
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteFilters((prev) => ({
                      ...prev,
                      deleteType: "month",
                    }))
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    deleteFilters.deleteType === "month"
                      ? "border-[#7f00ff] bg-[#7f00ff] text-white"
                      : "border-gray-200 dark:border-gray-700 hover:border-[#7f00ff] text-gray-700 dark:text-gray-300 hover:text-[#7f00ff]"
                  }`}
                >
                  Mês
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteFilters((prev) => ({
                      ...prev,
                      deleteType: "year",
                    }))
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    deleteFilters.deleteType === "year"
                      ? "border-[#7f00ff] bg-[#7f00ff] text-white"
                      : "border-gray-200 dark:border-gray-700 hover:border-[#7f00ff] text-gray-700 dark:text-gray-300 hover:text-[#7f00ff]"
                  }`}
                >
                  Ano
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteFilters((prev) => ({
                      ...prev,
                      deleteType: "all",
                    }))
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    deleteFilters.deleteType === "all"
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-gray-200 dark:border-gray-700 hover:border-red-500 text-gray-700 dark:text-gray-300 hover:text-red-500"
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>

            {deleteFilters.deleteType === "month" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ano
                  </label>
                  <select
                    value={deleteFilters.year}
                    onChange={(e) =>
                      setDeleteFilters((prev) => ({
                        ...prev,
                        year: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                  >
                    {Array.from(
                      { length: 10 },
                      (_, i) => new Date().getFullYear() - 5 + i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mês
                  </label>
                  <select
                    value={deleteFilters.month}
                    onChange={(e) =>
                      setDeleteFilters((prev) => ({
                        ...prev,
                        month: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          {new Date(2024, month - 1).toLocaleDateString(
                            "pt-BR",
                            { month: "long" }
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            )}

            {deleteFilters.deleteType === "year" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ano
                </label>
                <select
                  value={deleteFilters.year}
                  onChange={(e) =>
                    setDeleteFilters((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                >
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - 5 + i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {deleteFilters.deleteType === "day" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={deleteFilters.startDate}
                    onChange={(e) =>
                      setDeleteFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={deleteFilters.endDate}
                    min={deleteFilters.startDate}
                    onChange={(e) =>
                      setDeleteFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {deleteFilters.deleteType === "all" && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Atenção!
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Esta opção irá excluir TODOS os eventos do calendário.
                      Esta ação é irreversível.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-600">
            <button
              onClick={() => setShowDeleteConfigModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteWithFilters}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Excluir Eventos
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showBulkDeleteConfirmModal}
        onClose={() => {
          setShowBulkDeleteConfirmModal(false);
          setBulkDeleteData(null);
        }}
        onConfirm={confirmBulkDelete}
        title="Confirmar exclusão"
        message={bulkDeleteData?.confirmMessage || ""}
        confirmText="Excluir Eventos"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        isLoading={isDeletingEvents}
      />
    </div>
  );
}
