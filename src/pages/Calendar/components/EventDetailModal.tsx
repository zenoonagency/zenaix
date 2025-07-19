import React from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Modal } from "../../../components/Modal";
import { useCalendarStore } from "../../../store/calendarStore";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { CalendarEvent } from "../../../types/calendar";
import { toast } from "react-hot-toast";

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
}: EventDetailModalProps) {
  const { deleteEventApi } = useCalendarStore();
  const { members } = useTeamMembersStore();
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!event) return null;

  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);

  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm", { locale: ptBR });
  };

  // Encontrar o nome do responsável pelo ID
  const getResponsibleName = (id: string) => {
    const member = members.find((member) => member.id === id);
    return member ? member.name : id;
  };

  const handleEdit = () => {
    onClose();
    if (onEdit) {
      onEdit(event);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEventApi(event.id);
      toast.success(`Evento "${event.title}" excluído com sucesso!`);
      setShowConfirmDelete(false);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast.error("Erro ao excluir evento. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={isDeleting ? () => {} : onClose}
        title="Detalhes do Evento"
      >
        <div className="space-y-6">
          {/* Título */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {event.title}
          </h2>

          {/* Data e hora */}
          <div className="space-y-4">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-[#7f00ff] mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(startDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="w-5 h-5 text-[#7f00ff] mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horário
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(startDate)} - {formatTime(endDate)}
                </p>
              </div>
            </div>

            {event.assignee_id && (
              <div className="flex items-start">
                <User className="w-5 h-5 text-[#7f00ff] mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Responsável
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getResponsibleName(event.assignee_id)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          {event.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Descrição
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Categorias */}
          {event.categories && event.categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                Categorias
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-2 py-0.5 text-xs rounded-full"
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

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} className="mr-2" />
              Excluir
            </button>
            <button
              onClick={handleEdit}
              disabled={isDeleting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil size={16} className="mr-2" />
              Editar
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={isDeleting ? () => {} : () => setShowConfirmDelete(false)}
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
            onClick={() => setShowConfirmDelete(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={confirmDelete}
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
