import React, { useMemo } from "react";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  format,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingEventsProps {
  calendarEvents: any[];
  members: any[];
  onEventClick: (event: any) => void;
}

export function UpcomingEvents({
  calendarEvents,
  members,
  onEventClick,
}: UpcomingEventsProps) {
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return calendarEvents
      .filter((event) => {
        const eventStart = new Date(event.start_at || event.start);
        const eventEnd = new Date(event.end_at || event.end);

        return (
          (isAfter(eventStart, now) &&
            isBefore(eventStart, endOfDay(nextWeek))) ||
          (isBefore(eventStart, now) && isAfter(eventEnd, now))
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_at || a.start).getTime() -
          new Date(b.start_at || b.start).getTime()
      )
      .slice(0, 3);
  }, [calendarEvents]);

  const getEventTimeStatus = (event: any) => {
    const now = new Date();
    const eventStart = new Date(event.start_at || event.start);
    const eventEnd = new Date(event.end_at || event.end);

    if (isBefore(eventStart, now) && isAfter(eventEnd, now)) {
      return {
        label: "AGORA",
        bgColor: "bg-red-500",
        borderColor: "border-red-500",
      };
    }

    if (
      isAfter(eventStart, now) &&
      startOfDay(eventStart).getTime() === startOfDay(now).getTime()
    ) {
      return {
        label: "HOJE",
        bgColor: "bg-red-500",
        borderColor: "border-red-500",
      };
    }

    if (
      startOfDay(eventStart).getTime() === startOfDay(addDays(now, 1)).getTime()
    ) {
      return {
        label: "AMANHÃ",
        bgColor: "bg-amber-500",
        borderColor: "border-amber-500",
      };
    }

    return {
      label: format(eventStart, "EEE", { locale: ptBR }).toUpperCase(),
      bgColor: "bg-gray-500",
      borderColor: "border-gray-500",
    };
  };

  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Próximos Eventos
        </h3>
        <div className="p-1.5 bg-blue-500/10 rounded-lg">
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {upcomingEvents.length > 0 ? (
          <>
            {upcomingEvents.map((event) => {
              const timeStatus = getEventTimeStatus(event);
              const eventDate = new Date(event.start_at || event.start);

              const responsible = members.find(
                (member) => member.id === event.responsible
              );

              const initials = responsible
                ? responsible.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "";

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/50 rounded transition-colors"
                  onClick={() => onEventClick(event)}
                >
                  <div className="min-w-[50px] text-center">
                    <div
                      className={`${timeStatus.bgColor} text-white text-[10px] font-bold py-0.5 rounded-t-lg`}
                    >
                      {timeStatus.label}
                    </div>
                    <div className="bg-gray-100 dark:bg-dark-700 py-1 rounded-b-lg">
                      <span className="block text-base font-bold text-gray-800 dark:text-gray-200">
                        {format(eventDate, "dd")}
                      </span>
                      <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                        {format(eventDate, "MMM", {
                          locale: ptBR,
                        }).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex-1 bg-gray-50 dark:bg-dark-700 p-2 rounded-lg border-l-3 ${timeStatus.borderColor}`}
                  >
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-0.5">
                      {event.title}
                    </p>
                    <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(
                          new Date(event.start_at || event.start),
                          "HH:mm"
                        )}{" "}
                        - {format(new Date(event.end_at || event.end), "HH:mm")}
                      </span>
                      {event.description && (
                        <>
                          <span className="mx-1">•</span>
                          <span>
                            {event.description.substring(0, 30)}
                            {event.description.length > 30 ? "..." : ""}
                          </span>
                        </>
                      )}
                    </div>
                    {responsible && (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-medium">
                          {initials}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Não há eventos programados para os próximos 7 dias
            </p>
          </div>
        )}

        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-dark-700">
          <Link
            to="/dashboard/calendar"
            className="w-full py-1.5 px-3 bg-gray-50 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors text-xs font-medium flex items-center justify-center gap-1"
          >
            Ver calendário completo
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
