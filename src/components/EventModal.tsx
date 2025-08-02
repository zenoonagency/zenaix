import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarEvent } from "../types/calendar";

registerLocale("pt-BR", ptBR);

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEvent, "id">) => Promise<void>;
  selectedDates?: {
    start: Date;
    end: Date;
  };
}

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDates,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (selectedDates) {
      setStartDate(selectedDates.start);
      setEndDate(selectedDates.end);
    }
  }, [selectedDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      color: "#7f00ff",
      organization_id: "",
      creator_id: "",
      creator: {
        id: "",
        email: "",
        name: "",
        role: "",
        organization_id: "",
        created_at: "",
        updated_at: "",
      },
      categories: [],
      notifications: [],
    });
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-200">Novo Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Título
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data de Início
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date) => setStartDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                locale="pt-BR"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data de Término
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date) => setEndDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                locale="pt-BR"
                minDate={startDate}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
