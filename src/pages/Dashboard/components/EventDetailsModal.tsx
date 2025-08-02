import React from "react";
import { X, Clock, Calendar, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  members: any[];
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  members,
}: EventDetailsModalProps) {
  if (!isOpen || !event) return null;

  const eventStart = new Date(event.start_at || event.start);
  const eventEnd = new Date(event.end_at || event.end);

  const responsible = members.find((member) => member.id === event.responsible);

  const initials = responsible
    ? responsible.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Detalhes do Evento
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {event.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {format(eventStart, "EEEE, dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {format(eventStart, "HH:mm")} - {format(eventEnd, "HH:mm")}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Local
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              {responsible && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Responsável
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {responsible.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {event.attendees && event.attendees.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Participantes
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.attendees.map((attendee: any, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {attendee.name || attendee.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
