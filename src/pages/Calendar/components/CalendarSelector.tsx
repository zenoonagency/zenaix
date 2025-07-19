import React from "react";
import { Calendar, Check } from "lucide-react";
import { useTeamMembersStore } from "../../../store/teamMembersStore";

interface CalendarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  visibleCalendars: string[];
  setVisibleCalendars: (calendars: string[]) => void;
}

export function CalendarSelector({
  isOpen,
  onClose,
  visibleCalendars,
  setVisibleCalendars,
}: CalendarSelectorProps) {
  const { members } = useTeamMembersStore();

  const toggleCalendarVisibility = (calendarId: string) => {
    if (calendarId === "all") {
      if (visibleCalendars.includes("all")) {
        setVisibleCalendars([]);
      } else {
        setVisibleCalendars(["all"]);
      }
    } else {
      if (visibleCalendars.includes(calendarId)) {
        const newVisible = visibleCalendars.filter((id) => id !== calendarId);
        if (newVisible.length === 0) {
          setVisibleCalendars(["all"]);
        } else {
          setVisibleCalendars(newVisible);
        }
      } else {
        const newVisible = visibleCalendars.filter((id) => id !== "all");
        setVisibleCalendars([...newVisible, calendarId]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
      <div className="bg-white dark:bg-dark-800 w-80 h-auto mt-16 mr-4 rounded-lg shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7f00ff]" />
            <h2 className="text-lg font-semibold dark:text-gray-200">
              Agendas da Equipe
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div
            className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg px-2"
            onClick={() => toggleCalendarVisibility("all")}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center
              ${
                visibleCalendars.includes("all")
                  ? "bg-[#7f00ff] text-white"
                  : "border-2 border-gray-300 dark:border-gray-600"
              }`}
            >
              {visibleCalendars.includes("all") && (
                <Check className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Todos os Eventos
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Exibir todos os eventos da equipe
              </p>
            </div>
          </div>

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg px-2"
              onClick={() => toggleCalendarVisibility(member.id)}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center
                ${
                  visibleCalendars.includes(member.id)
                    ? "bg-[#7f00ff] text-white"
                    : "border-2 border-gray-300 dark:border-gray-600"
                }`}
              >
                {visibleCalendars.includes(member.id) && (
                  <Check className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {member.name}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {member.role}
                </p>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Nenhum membro na equipe ainda
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
