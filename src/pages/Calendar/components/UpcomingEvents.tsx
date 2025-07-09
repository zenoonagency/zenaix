import React, { useMemo, useState } from 'react';
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays, isPast, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCalendarStore } from '../../../store/calendarStore';
import { Pencil, Trash2 } from 'lucide-react';
import { EventModal } from './EventModal';
import { EventDetailModal } from './EventDetailModal';
import { toast } from 'react-hot-toast';
import { Modal } from '../../../components/Modal';

export function UpcomingEvents() {
  const { events, deleteEvent } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return events
      .filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Incluir eventos que:
        // 1. Ainda não começaram (estão no futuro)
        // 2. Já começaram mas ainda não terminaram (estão acontecendo agora)
        return (isAfter(eventStart, now) && isBefore(eventStart, endOfDay(nextWeek))) || 
               (isBefore(eventStart, now) && isAfter(eventEnd, now));
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [events]);

  const getTimeStatus = (event: any) => {
    const now = new Date();
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Evento está acontecendo agora
    if (isBefore(eventStart, now) && isAfter(eventEnd, now)) {
      const minutesLeft = differenceInMinutes(eventEnd, now);
      if (minutesLeft < 60) {
        return {
          status: 'happening',
          label: `${minutesLeft} min restantes`,
          color: 'border-green-500 bg-green-50 dark:bg-green-900/20'
        };
      } else {
        const hoursLeft = differenceInHours(eventEnd, now);
        return {
          status: 'happening',
          label: `${hoursLeft}h restantes`,
          color: 'border-green-500 bg-green-50 dark:bg-green-900/20'
        };
      }
    }
    
    // Evento vai acontecer hoje
    if (isAfter(eventStart, now) && startOfDay(eventStart).getTime() === startOfDay(now).getTime()) {
      const minutesToStart = differenceInMinutes(eventStart, now);
      if (minutesToStart < 60) {
        return {
          status: 'soon',
          label: `Em ${minutesToStart} min`,
          color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
        };
      } else {
        const hoursToStart = differenceInHours(eventStart, now);
        return {
          status: 'soon',
          label: `Em ${hoursToStart}h`,
          color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
        };
      }
    }
    
    // Evento vai acontecer nos próximos dias
    const daysToStart = differenceInDays(eventStart, now);
    return {
      status: 'upcoming',
      label: `Em ${daysToStart} ${daysToStart === 1 ? 'dia' : 'dias'}`,
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    };
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleEditClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o card do evento
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleDeleteClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o card do evento
    setEventToDelete(event);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id);
      toast.success(`Evento "${eventToDelete.title}" excluído com sucesso!`);
      setEventToDelete(null);
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
              className={`p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors cursor-pointer relative group border-l-4 ${timeStatus.color}`}
            >
              <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleEditClick(event, e)}
                  className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  title="Editar evento"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(event, e)}
                  className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  title="Excluir evento"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 pr-16">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {event.title}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  timeStatus.status === 'happening' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : timeStatus.status === 'soon'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {timeStatus.label}
                </span>
              </div>
              
              {event.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(event.start), "dd 'de' MMMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </div>
              {event.customFields && event.customFields.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.customFields.map((field) => (
                    <span
                      key={field.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#7f00ff]/10 text-[#7f00ff]"
                    >
                      {field.name}: {field.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

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

      {/* Modal de confirmação de exclusão */}
      <Modal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)}
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
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
            onClick={confirmDelete}
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
} 