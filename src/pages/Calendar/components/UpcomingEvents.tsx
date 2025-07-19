import React, { useMemo, useState } from "react";
import {
  format,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  addDays,
  isPast,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCalendarStore } from "../../../store/calendarStore";
import { useAuthStore } from "../../../store/authStore";
import { calendarService } from "../../../services/calendar";
import { Pencil, Trash2 } from "lucide-react";
import { EventModal } from "./EventModal";
import { EventDetailModal } from "./EventDetailModal";
import { CalendarEvent } from "../../../types/calendar";
import { useToast } from "../../../hooks/useToast";
import { Modal } from "../../../components/Modal";

export function UpcomingEvents() {
  const { events, fetchEvents } = useCalendarStore();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const organizationId = user?.organization_id;

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return events
      .filter((event) => {
        const eventStart = new Date(event.start_at);
        const eventEnd = new Date(event.end_at);

        return (
          (isAfter(eventStart, now) &&
            isBefore(eventStart, endOfDay(nextWeek))) ||
          (isBefore(eventStart, now) && isAfter(eventEnd, now)) ||
          startOfDay(eventStart).getTime() === startOfDay(now).getTime()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )
      .slice(0, 5);
  }, [events]);

  const getTimeStatus = (event: CalendarEvent) => {
    const now = new Date();
    const eventStart = new Date(event.start_at);
    const eventEnd = new Date(event.end_at);

    if (isBefore(eventStart, now) && isAfter(now, eventEnd)) {
      const minutesLeft = differenceInMinutes(eventEnd, now);
      if (minutesLeft < 60) {
        return {
          status: "happening",
          label: `${minutesLeft} min restantes`,
          color: "border-green-500 bg-green-50 dark:bg-green-900/20",
        };
      } else {
        const hoursLeft = differenceInHours(eventEnd, now);
        return {
          status: "happening",
          label: `${hoursLeft}h restantes`,
          color: "border-green-500 bg-green-50 dark:bg-green-900/20",
        };
      }
    }

    if (
      isAfter(eventStart, now) &&
      startOfDay(eventStart).getTime() === startOfDay(now).getTime()
    ) {
      const minutesToStart = differenceInMinutes(eventStart, now);
      if (minutesToStart < 60) {
        return {
          status: "soon",
          label: `Em ${minutesToStart} min`,
          color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
        };
      } else {
        const hoursToStart = differenceInHours(eventStart, now);
        return {
          status: "soon",
          label: `Em ${hoursToStart}h`,
          color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
        };
      }
    }

    const daysToStart = differenceInDays(eventStart, now);
    return {
      status: "upcoming",
      label: `Em ${daysToStart} ${daysToStart === 1 ? "dia" : "dias"}`,
      color: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
    };
  };

  const getEventColor = (event: CalendarEvent) => {
    // Usar a cor baseada no status do tempo (cor dos balões/tags)
    const timeStatus = getTimeStatus(event);
    switch (timeStatus.status) {
      case "happening":
        return "#10b981"; // green-500 (cor do balão verde)
      case "soon":
        return "#f59e0b"; // yellow-500 (cor do balão amarelo)
      case "upcoming":
        return "#3b82f6"; // blue-500 (cor do balão azul)
      default:
        return "#7f00ff"; // purple default
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleEditClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleDeleteClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToDelete(event);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!token || !organizationId || !eventToDelete) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(
        token,
        organizationId,
        eventToDelete.id
      );
      showToast(
        `Evento "${eventToDelete.title}" excluído com sucesso!`,
        "success"
      );
      setEventToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir evento:", error);

      let errorMessage = "Erro ao excluir evento. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
    setShowConfirmModal(false);
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Não há eventos programados para os próximos 7 dias
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Próximos Eventos
      </h2>
      <div className="space-y-3">
        {upcomingEvents.map((event) => {
          const timeStatus = getTimeStatus(event);

          return (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className={`p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-300 cursor-pointer relative group border-l-4 ${timeStatus.color} overflow-hidden`}
            >
              {/* Overlay da cor do evento */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                style={{
                  background: `linear-gradient(to right, ${getEventColor(
                    event
                  )}40 0%, ${getEventColor(event)}20 30%, ${getEventColor(
                    event
                  )}10 60%, transparent 100%)`,
                }}
              />

              {/* Botões de ação com animação */}
              <div className="absolute right-0 top-0 h-full flex items-center space-x-1 bg-gradient-to-l from-gray-100 dark:from-dark-600 via-gray-100 dark:via-dark-600 to-transparent pl-4 pr-2 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-10">
                <button
                  onClick={(e) => handleEditClick(event, e)}
                  disabled={isDeleting}
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  title="Editar evento"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(event, e)}
                  disabled={isDeleting}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  title="Excluir evento"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>

              {/* Conteúdo (sem animação de empurrar) */}
              <div className="relative z-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {event.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      timeStatus.status === "happening"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : timeStatus.status === "soon"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-blue-200"
                    }`}
                  >
                    {timeStatus.label}
                  </span>
                </div>

                {event.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(event.start_at), "dd 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
                {event.categories && event.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          event={selectedEvent}
          onEdit={handleEditFromDetail}
        />
      )}

      {selectedEvent && (
        <EventModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          isEditing={true}
        />
      )}

      <Modal
        isOpen={showConfirmModal}
        onClose={isDeleting ? () => {} : () => setShowConfirmModal(false)}
        title="Confirmar exclusão"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Tem certeza que deseja excluir o evento "{eventToDelete?.title}"?
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={confirmDelete}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
