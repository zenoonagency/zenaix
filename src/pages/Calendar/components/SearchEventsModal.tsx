import React, { useState, useMemo } from "react";
import { X, Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCalendarStore } from "../../../store/calendarStore";
import { Modal } from "../../../components/Modal";
import { EventDetailModal } from "./EventDetailModal";
import { EventModal } from "./EventModal";
import { CalendarEvent } from "../../../types/calendar";

interface SearchEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchEventsModal({ isOpen, onClose }: SearchEventsModalProps) {
  const { events } = useCalendarStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesDateRange =
        (!startDate || new Date(event.start_at) >= new Date(startDate)) &&
        (!endDate || new Date(event.end_at) <= new Date(endDate));

      return matchesSearch && matchesDateRange;
    });
  }, [events, searchTerm, startDate, endDate]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Buscar Eventos">
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resultados ({filteredEvents.length})
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {format(
                          new Date(event.start_at),
                          "dd 'de' MMMM 'às' HH:mm",
                          {
                            locale: ptBR,
                          }
                        )}
                      </span>
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
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum evento encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <EventDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          event={selectedEvent}
          onEdit={handleEditFromDetail}
        />
      )}

      {/* Modal de edição do evento */}
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
    </>
  );
}
