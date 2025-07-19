import  { useState } from "react";
import {  Edit, Trash2, Calendar, Clock, User, Hash } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "../../../types/calendar";
import { useAuthStore } from "../../../store/authStore";
import { calendarService } from "../../../services/calendar";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { useToast } from "../../../hooks/useToast";
import { Modal } from "../../../components/Modal";

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
  onEdit?: () => void;
}

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
}: EventDetailModalProps) {
  const { token, user } = useAuthStore();
  const { members } = useTeamMembersStore();
  const { showToast } = useToast();
  const organizationId = user?.organization_id;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const assignee = members.find((member) => member.id === event.assignee_id);

  const handleDelete = async () => {
    if (!token || !organizationId) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(token, organizationId, event.id);
      showToast(`Evento "${event.title}" excluído com sucesso!`, "success");
      onClose();
    } catch (error: any) {
      console.error("Erro ao excluir evento:", error);

      let errorMessage = "Erro ao excluir evento. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      }

      // Verificar se é um erro de permissão específico
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
      setShowConfirmModal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Evento">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div
              className="w-4 h-4 rounded-full mt-1"
              style={{ backgroundColor: event.color || "#7f00ff" }}
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {event.title}
              </h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isSameDay(
                      new Date(event.start_at),
                      new Date(event.end_at)
                    ) ? (
                      format(
                        new Date(event.start_at),
                        "dd 'de' MMMM 'de' yyyy",
                        {
                          locale: ptBR,
                        }
                      )
                    ) : (
                      <>
                        {format(new Date(event.start_at), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}{" "}
                        -{" "}
                        {format(
                          new Date(event.end_at),
                          "dd 'de' MMMM 'de' yyyy",
                          {
                            locale: ptBR,
                          }
                        )}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(event.start_at), "HH:mm")} -{" "}
                    {format(new Date(event.end_at), "HH:mm")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {assignee && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Responsável
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {assignee.name}
              </p>
            </div>
          )}

          {event.categories && event.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Categorias
              </h3>
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isDeleting}
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Excluir
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Editar
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={isDeleting ? () => {} : () => setShowConfirmModal(false)}
        title="Confirmar exclusão"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Tem certeza que deseja excluir o evento "{event.title}"?
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDelete}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </button>
        </div>
      </Modal>
    </>
  );
}
