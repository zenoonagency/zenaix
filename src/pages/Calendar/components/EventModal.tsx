import React, { useState, useEffect } from "react";
import { X, Bell, Hash, Palette, User } from "lucide-react";
import { useCalendarStore } from "../../../store/calendarStore";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { Input } from "../../../components/ui/Input";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { Modal } from "../../../components/Modal";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates?: {
    start: Date;
    end: Date;
  } | null;
  event?: any;
  isEditing?: boolean;
}

interface CustomField {
  id: string;
  name: string;
  value: string;
  type: "text" | "number" | "date" | "select";
}

const EVENT_COLORS = [
  { name: "Roxo", value: "#7f00ff" },
  { name: "Azul", value: "#0066ff" },
  { name: "Verde", value: "#00cc66" },
  { name: "Amarelo", value: "#ffcc00" },
  { name: "Vermelho", value: "#ff3333" },
  { name: "Rosa", value: "#ff33cc" },
];

const EVENT_CATEGORIES = [
  "Reunião",
  "Tarefa",
  "Lembrete",
  "Compromisso",
  "Pessoal",
  "Trabalho",
];

const NOTIFICATION_OPTIONS = [
  { label: "Sem notificação", value: "none" },
  { label: "5 minutos antes", value: "5" },
  { label: "15 minutos antes", value: "15" },
  { label: "30 minutos antes", value: "30" },
  { label: "1 hora antes", value: "60" },
  { label: "1 dia antes", value: "1440" },
];

export function EventModal({
  isOpen,
  onClose,
  selectedDates,
  event,
  isEditing,
}: EventModalProps) {
  const { addEvent, updateEvent } = useCalendarStore();
  const { members } = useTeamMembersStore();
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startDate, setStartDate] = useState(
    event?.start || selectedDates?.start || new Date()
  );
  const [endDate, setEndDate] = useState(
    event?.end || selectedDates?.end || new Date()
  );
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const [categories, setCategories] = useState<string[]>(
    event?.categories || []
  );
  const [notification, setNotification] = useState(
    event?.notification || "none"
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [responsibleId, setResponsibleId] = useState(event?.responsible || "");

  useEffect(() => {
    if (event && isEditing) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartDate(new Date(event.start));
      setEndDate(new Date(event.end));
      setCustomFields(event.customFields || []);
      setColor(event.color || EVENT_COLORS[0].value);
      setCategories(event.categories || []);
      setNotification(event.notification || "none");
      setResponsibleId(event.responsible || "");
    } else if (selectedDates) {
      setStartDate(selectedDates.start);
      setEndDate(selectedDates.end);
    }
  }, [event, selectedDates, isEditing]);

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        value: "",
        type: "text",
      },
    ]);
  };

  const handleCustomFieldChange = (
    id: string,
    field: keyof CustomField,
    value: string
  ) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
      setShowCategoryInput(false);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      title,
      description,
      start: startDate,
      end: endDate,
      color,
      categories,
      notification,
      customFields,
      responsible: responsibleId,
    };

    if (isEditing && event) {
      updateEvent(event.id, eventData);
      toast.success(`Evento "${title}" atualizado com sucesso!`);
    } else {
      addEvent(eventData);
      toast.success(`Evento "${title}" criado com sucesso!`);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Evento" : "Novo Evento"}
      size="large"
    >
      <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-orange-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Responsável
              </label>
            </div>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border bg-white dark:bg-dark-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="">Selecione um responsável</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Início
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => date && setStartDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Fim
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => date && setEndDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              />
            </div>
          </div>

          {/* Cor do Evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor do Evento
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-300 dark:border-dark-600 hover:bg-gray-100 dark:hover:bg-dark-600"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <Palette size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Selecionar Cor
                </span>
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-dark-700 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 grid grid-cols-3 gap-2 z-10">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setColor(color.value);
                        setShowColorPicker(false);
                      }}
                      className="w-8 h-8 rounded-full hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Categorias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categorias
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-dark-700 rounded-full text-sm"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            {showCategoryInput ? (
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nova categoria"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
                >
                  Adicionar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCategoryInput(true)}
                className="flex items-center gap-2 text-sm text-[#7f00ff] hover:text-[#7f00ff]/80"
              >
                <Hash size={16} />
                Adicionar Categoria
              </button>
            )}
          </div>

          {/* Notificações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notificação
            </label>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-500" />
              <select
                value={notification}
                onChange={(e) => setNotification(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              >
                {NOTIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
            >
              {isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
