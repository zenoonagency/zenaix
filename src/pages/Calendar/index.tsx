import React, { useState, useCallback, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, EventPropGetter, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Trash2, Edit, Calendar as CalendarIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import { EventModal } from './components/EventModal';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { SearchEventsModal } from './components/SearchEventsModal';
import { UpcomingEvents } from './components/UpcomingEvents';
import { EventDetailModal } from './components/EventDetailModal';
import { DayEventsModal } from './components/DayEventsModal';
import { CalendarSelector } from './components/CalendarSelector';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './styles.css';
import { toast } from 'react-hot-toast';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Criar o calendário com suporte a drag and drop
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

const messages = {
  next: "Próximo",
  previous: "Anterior",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há eventos neste período.",
  showMore: (total: number) => `+ Ver mais (${total})`,
  allDay: "Dia inteiro",
  work_week: "Semana de trabalho",
  yesterday: "Ontem",
  tomorrow: "Amanhã",
  // Meses
  month_0: "Janeiro",
  month_1: "Fevereiro",
  month_2: "Março",
  month_3: "Abril",
  month_4: "Maio",
  month_5: "Junho",
  month_6: "Julho",
  month_7: "Agosto",
  month_8: "Setembro",
  month_9: "Outubro",
  month_10: "Novembro",
  month_11: "Dezembro",
  // Dias da semana
  week_0: "Domingo",
  week_1: "Segunda-feira",
  week_2: "Terça-feira",
  week_3: "Quarta-feira",
  week_4: "Quinta-feira",
  week_5: "Sexta-feira",
  week_6: "Sábado",
};

export function Calendar() {
  const { events, updateEvent, deleteEvent, clearEvents, visibleCalendars, setVisibleCalendars } = useCalendarStore();
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setShowEventModal(true);
    setIsEditing(false);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
    setIsEditing(false);
  }, []);

  const handleEventDrop = useCallback(({ event, start, end }: any) => {
    updateEvent(event.id, { ...event, start, end });
    toast.success(`Evento "${event.title}" movido com sucesso!`);
  }, [updateEvent]);

  const handleEventResize = useCallback(({ event, start, end }: any) => {
    updateEvent(event.id, { ...event, start, end });
    toast.success(`Duração do evento "${event.title}" atualizada!`);
  }, [updateEvent]);

  const handleEditClick = useCallback((event: any) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setShowEventModal(true);
  }, []);

  const handleDeleteEvent = useCallback((id: string, title: string) => {
    deleteEvent(id);
    toast.success(`Evento "${title}" excluído com sucesso!`);
  }, [deleteEvent]);

  const eventPropGetter: EventPropGetter<any> = useCallback((event) => ({
    className: `cursor-move ${event.categories?.length ? 'has-categories' : ''}`,
    style: {
      backgroundColor: event.color || '#7f00ff',
      borderRadius: '4px',
      border: 'none',
      color: 'white'
    }
  }), []);

  const handleShowMore = useCallback((events: any[], date: Date) => {
    setSelectedDate(date);
    setShowDayEventsModal(true);
  }, []);

  const getDayEvents = useCallback((date: Date) => {
    return events.filter(event => isSameDay(new Date(event.start), date));
  }, [events]);

  // Filtrar eventos baseado nas agendas selecionadas
  const filteredEvents = events.filter(event => 
    visibleCalendars.length === 0 || visibleCalendars.includes(event.responsible)
  );

  // Inicializar todas as agendas como visíveis
  useEffect(() => {
    const allResponsibles = Array.from(new Set(events.map(event => event.responsible)));
    setVisibleCalendars(allResponsibles);
  }, [events, setVisibleCalendars]);

  // Função para gerenciar notificações
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      events.forEach(event => {
        if (event.notification) {
          const notificationTime = new Date(event.start);
          notificationTime.setMinutes(notificationTime.getMinutes() - parseInt(event.notification));
          
          const timeDiff = notificationTime.getTime() - now.getTime();
          
          if (timeDiff > 0 && timeDiff < 60000) { // Menos de 1 minuto para a notificação
            if (event.notification === '0') {
              toast.success(`O evento "${event.title}" está começando agora!`);
            } else {
              toast(`O evento "${event.title}" começará em ${event.notification} minutos`, {
                icon: '⚠️',
              });
            }
          }
        }
      });
    };

    // Solicita permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Verifica notificações a cada minuto
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
              <DragAndDropCalendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor={(event: any) => new Date(event.start)}
                endAccessor={(event: any) => new Date(event.end)}
                style={{ height: 'calc(100vh - 240px)' }}
                selectable
                resizable
                timeslots={1}
                step={60}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                eventPropGetter={eventPropGetter}
                resizableAccessor={() => true}
                messages={messages}
                culture="pt-BR"
                views={['month', 'week', 'day', 'agenda']}
                defaultView="month"
                onShowMore={(events, date) => {
                  handleShowMore(events, date);
                }}
                popup={false}
                doShowMoreDrillDown={false}
              />
            </div>
          </div>

          {/* Botão para mostrar/esconder a barra lateral */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-2 bg-white dark:bg-dark-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors mx-2"
              title={sidebarVisible ? "Esconder próximos eventos" : "Mostrar próximos eventos"}
            >
              {sidebarVisible ? (
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* Barra lateral de próximos eventos com transição */}
          <div 
            className={`w-80 transition-all duration-300 ease-in-out overflow-hidden ${
              sidebarVisible ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
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
          onEdit={handleEditClick}
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
      />
    </div>
  );
} 