import React, { useState, useEffect } from "react";
import { X, Bell, Hash, Palette, User, Trash2 } from "lucide-react";
import { useCalendarStore } from "../../../store/calendarStore";
import { useAuthStore } from "../../../store/authStore";
import { calendarService } from "../../../services/calendar";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import {
  CalendarEvent,
  InputCreateEventDTO,
  InputUpdateEventDTO,
} from "../../../types/calendar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useToast } from "../../../hooks/useToast";
import { Modal } from "../../../components/Modal";
import { ConfirmationModal } from "../../../components/ConfirmationModal";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates?: {
    start: Date;
    end: Date;
  } | null;
  event?: CalendarEvent | null;
  isEditing?: boolean;
}

const EVENT_COLORS = [
  { name: "Roxo", value: "#7f00ff" },
  { name: "Azul", value: "#0066ff" },
  { name: "Verde", value: "#00cc66" },
  { name: "Amarelo", value: "#ffcc00" },
  { name: "Vermelho", value: "#ff3333" },
  { name: "Rosa", value: "#ff33cc" },
];

const NOTIFICATION_OPTIONS = [
  { label: "Sem notificação", value: "NONE" },
  { label: "15 minutos antes", value: "MINUTES_15" },
  { label: "1 hora antes", value: "HOUR_1" },
  { label: "1 dia antes", value: "DAY_1" },
];

export function EventModal({
  isOpen,
  onClose,
  selectedDates,
  event,
  isEditing,
}: EventModalProps) {
  const { token, user } = useAuthStore();
  const { members } = useTeamMembersStore();
  const { showToast } = useToast();
  const organizationId = user?.organization_id;

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startDate, setStartDate] = useState(
    event?.start_at
      ? new Date(event.start_at)
      : selectedDates?.start || new Date()
  );
  const [endDate, setEndDate] = useState(
    event?.end_at ? new Date(event.end_at) : selectedDates?.end || new Date()
  );
  const [color, setColor] = useState(event?.color || EVENT_COLORS[0].value);
  const [categories, setCategories] = useState<
    { name: string; color: string }[]
  >(
    event?.categories?.map((cat) => ({ name: cat.name, color: cat.color })) ||
      []
  );
  const [notification, setNotification] = useState<
    "NONE" | "MINUTES_15" | "HOUR_1" | "DAY_1"
  >(event?.notifications?.length ? "MINUTES_15" : "NONE");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(
    EVENT_COLORS[0].value
  );
  const [assigneeId, setAssigneeId] = useState(event?.assignee_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (event && isEditing) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartDate(new Date(event.start_at));
      setEndDate(new Date(event.end_at));
      setColor(event.color || EVENT_COLORS[0].value);
      setCategories(
        event.categories?.map((cat) => ({
          name: cat.name,
          color: cat.color,
        })) || []
      );
      setNotification(event.notifications?.length ? "MINUTES_15" : "NONE");
      setAssigneeId(event.assignee_id || "");
    } else if (selectedDates) {
      setStartDate(selectedDates.start);
      setEndDate(selectedDates.end);
    }
  }, [event, selectedDates, isEditing]);

  const handleAddCategory = () => {
    if (newCategory && !categories.some((cat) => cat.name === newCategory)) {
      setCategories([
        ...categories,
        { name: newCategory, color: newCategoryColor },
      ]);
      setNewCategory("");
      setNewCategoryColor(EVENT_COLORS[0].value);
      setShowCategoryInput(false);
    }
  };

  const handleRemoveCategory = (categoryName: string) => {
    setCategories(categories.filter((c) => c.name !== categoryName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      showToast("Aguarde, já está processando...", "error");
      return;
    }

    if (!token || !organizationId) {
      showToast("Erro de autenticação. Faça login novamente.", "error");
      return;
    }

    if (endDate < startDate) {
      showToast(
        "Data de fim não pode ser anterior à data de início. Ajuste as datas e tente novamente.",
        "error"
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const eventData: InputCreateEventDTO | InputUpdateEventDTO = {
        title,
        description,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        color,
        notification,
        assignee_id: assigneeId || undefined,
        categories: categories.length > 0 ? categories : undefined,
      };

      if (isEditing && event) {
        await calendarService.updateEvent(
          token,
          organizationId,
          event.id,
          eventData as InputUpdateEventDTO
        );
        showToast(`Evento "${title}" atualizado com sucesso!`, "success");
      } else {
        await calendarService.createEvent(
          token,
          organizationId,
          eventData as InputCreateEventDTO
        );
        showToast(`Evento "${title}" criado com sucesso!`, "success");
        onClose();
      }
    } catch (error: any) {
      let errorMessage = "Erro ao salvar evento. Tente novamente.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.name === "APIError") {
        errorMessage = error.message || errorMessage;
      }

      if (
        error?.status === 403 ||
        errorMessage.includes("Acesso negado") ||
        errorMessage.includes("permissão")
      ) {
        errorMessage =
          "Você não tem permissão para criar eventos no calendário. Entre em contacto com o administrador da organização.";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!token || !organizationId || !event) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(token, organizationId, event.id);
      showToast(`Evento "${event.title}" excluído com sucesso!`, "success");
      onClose();
    } catch (error: any) {
      let errorMessage = "Erro ao excluir evento. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      }

      if (
        error?.status === 403 ||
        errorMessage.includes("Acesso negado") ||
        errorMessage.includes("permissão")
      ) {
        errorMessage =
          "Você não tem permissão para excluir eventos do calendário. Entre em contacto com o administrador da organização.";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Editar Evento" : "Novo Evento"}
        size="medium"
      >
        <div className="event-modal-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="modal-form-field">
              <Input
                label="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="modal-form-field">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-orange-500" />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Responsável
                </label>
              </div>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              >
                <option value="">Selecione um responsável</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-form-field">
              <Textarea
                label="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="modal-form-field">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data e Hora de Início
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                />
              </div>

              <div className="modal-form-field">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data e Hora de Fim
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                />
              </div>
            </div>

            <div className="modal-form-field">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-purple-500" />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cor do Evento
                </label>
              </div>
              <div className="flex gap-2">
                {EVENT_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === colorOption.value
                        ? "border-gray-800 dark:border-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>

            <div className="modal-form-field">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-yellow-500" />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificação
                </label>
              </div>
              <select
                value={notification}
                onChange={(e) =>
                  setNotification(
                    e.target.value as "NONE" | "MINUTES_15" | "HOUR_1" | "DAY_1"
                  )
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              >
                {NOTIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {isEditing && event && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(true)}
                  disabled={isSubmitting || isDeleting}
                  className="px-4 py-2 items-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>{isEditing ? "Atualizar" : "Criar"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleDeleteEvent}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o evento "${event?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        isLoading={isDeleting}
      />
    </>
  );
}
