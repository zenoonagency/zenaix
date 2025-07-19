import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Calendar, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "../../../types/calendar";
import { useCalendarStore } from "../../../store/calendarStore";
import { useAuthStore } from "../../../store/authStore";
import { calendarService } from "../../../services/calendar";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../../components/ConfirmationModal";

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function DayEventsModal({
  isOpen,
  onClose,
  date,
  events,
  onEventClick,
}: DayEventsModalProps) {
  const { fetchEvents } = useCalendarStore();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const organizationId = user?.organization_id;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

  const handleDeleteAllEvents = async () => {
    if (!token || !organizationId) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsDeleting(true);
    try {
      // Usar filtros específicos por data para deletar apenas o dia
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const filters = {
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
      };

      await calendarService.deleteAllEvents(token, organizationId, filters);

      showToast(
        `Todos os ${events.length} eventos de ${formattedDate} foram excluídos com sucesso!`,
        "success"
      );

      // Atualizar a lista de eventos
      await fetchEvents();

      // Fechar o modal de confirmação e o modal principal
      setShowDeleteConfirm(false);
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao excluir eventos";
      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            // Não fechar se o ConfirmationModal estiver aberto
            if (!showDeleteConfirm) {
              onClose();
            }
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                // Não fechar se o ConfirmationModal estiver aberto
                if (!showDeleteConfirm) {
                  onClose();
                }
              }}
            />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#7f00ff]" />
                        {formattedDate}
                      </div>
                    </Dialog.Title>
                    <div className="flex items-center gap-2">
                      {events.length > 0 && (
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={`Excluir todos os ${events.length} eventos`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        Nenhum evento neste dia
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 text-sm text-gray-400">
                                {format(new Date(event.start_at), "HH:mm")}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {event.title}
                                </h4>
                                {event.description && (
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {format(new Date(event.start_at), "HH:mm")}{" "}
                                    - {format(new Date(event.end_at), "HH:mm")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal de confirmação para deletar todos os eventos - FORA do Dialog */}
      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            handleDeleteAllEvents();
          }}
          title="Confirmar exclusão"
          message={`Tem certeza que deseja excluir todos os ${events.length} eventos de ${formattedDate}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir Todos"
          cancelText="Cancelar"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
