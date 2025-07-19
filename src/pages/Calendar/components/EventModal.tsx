import React, { useState, useEffect } from "react";
import { X, Bell, Hash, Palette, User } from "lucide-react";
import { useCalendarStore } from "../../../store/calendarStore";
import { useAuthStore } from "../../../store/authStore";
import { calendarService } from "../../../services/calendar";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
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
  const { fetchEvents } = useCalendarStore();
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(
    EVENT_COLORS[0].value
  );
  const [assigneeId, setAssigneeId] = useState(event?.assignee_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    console.log("🔄 [EventModal] Iniciando submissão do formulário...");

    // Proteção contra múltiplas submissões
    if (isSubmitting) {
      console.log(
        "⚠️ [EventModal] Já está submetendo, ignorando nova submissão"
      );
      showToast("Aguarde, já está processando...", "error");
      return;
    }

    console.log("🔍 [EventModal] Verificando autenticação...");
    if (!token || !organizationId) {
      console.log(
        "❌ [EventModal] Erro de autenticação - token ou organizationId ausente"
      );
      showToast("Erro de autenticação. Faça login novamente.", "error");
      return;
    }
    console.log("✅ [EventModal] Autenticação válida");

    // Validação de data no frontend
    console.log("📅 [EventModal] Validando datas:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isValid: endDate >= startDate,
    });

    if (endDate < startDate) {
      console.log(
        "[EventModal] Validação de data falhou - endDate < startDate"
      );
      showToast(
        " Data de fim não pode ser anterior à data de início. Ajuste as datas e tente novamente.",
        "error"
      );
      return;
    }
    setIsSubmitting(true);

    try {
      console.log("📝 [EventModal] Preparando dados do evento...");

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

      console.log("📊 [EventModal] Dados do evento preparados:", eventData);

      if (isEditing && event) {
        console.log("✏️ [EventModal] Atualizando evento existente...");

        await calendarService.updateEvent(
          token,
          organizationId,
          event.id,
          eventData as InputUpdateEventDTO
        );
        console.log("✅ [EventModal] Evento atualizado com sucesso!");
        showToast(`Evento "${title}" atualizado com sucesso!`, "success");

        console.log("🔄 [EventModal] Atualizando lista de eventos...");
        await fetchEvents();
      } else {
        console.log("➕ [EventModal] Criando novo evento...");

        await calendarService.createEvent(
          token,
          organizationId,
          eventData as InputCreateEventDTO
        );
        console.log("✅ [EventModal] Evento criado com sucesso no servidor!");
        showToast(`Evento "${title}" criado com sucesso!`, "success");

        console.log("🔄 [EventModal] Atualizando lista de eventos...");
        await fetchEvents();
      }

      console.log("🚪 [EventModal] Fechando modal...");
      onClose();
    } catch (error: any) {
      console.error(
        "💥 [EventModal] Erro durante a criação/atualização:",
        error
      );

      // Capturar mensagem de erro específica
      let errorMessage = "Erro ao salvar evento. Tente novamente.";

      if (error?.message) {
        errorMessage = error.message;
        console.log("📋 [EventModal] Mensagem de erro:", error.message);
      } else if (error?.name === "APIError") {
        errorMessage = error.message || errorMessage;
        console.log("🔌 [EventModal] Erro da API:", error.message);
      }

      // Verificar se é um erro de permissão específico
      if (
        error?.status === 403 ||
        errorMessage.includes("Acesso negado") ||
        errorMessage.includes("permissão")
      ) {
        errorMessage =
          "Você não tem permissão para criar eventos no calendário. Entre em contacto com o administrador da organização.";
        console.log("🚫 [EventModal] Erro de permissão detectado");
      }

      console.log(
        "❌ [EventModal] Exibindo erro para o usuário:",
        errorMessage
      );
      showToast(errorMessage, "error");
    } finally {
      console.log("🏁 [EventModal] Finalizando processo...");
      setIsSubmitting(false);
    }
  };

  return (
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
              <Hash className="w-4 h-4 text-blue-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categorias
              </label>
            </div>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded-lg"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                    {category.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category.name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {showCategoryInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nome da categoria"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                  />
                  <div className="flex gap-1">
                    {EVENT_COLORS.slice(0, 6).map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        onClick={() => setNewCategoryColor(colorOption.value)}
                        className={`w-6 h-6 rounded-full border ${
                          newCategoryColor === colorOption.value
                            ? "border-gray-800 dark:border-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        style={{ backgroundColor: colorOption.value }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Adicionar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCategoryInput(true)}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  + Adicionar categoria
                </button>
              )}
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
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
  );
}
