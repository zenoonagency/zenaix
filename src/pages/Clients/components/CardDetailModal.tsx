import React, { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckSquare,
  Clock,
  DollarSign,
  Hash,
  Link,
  Mail,
  Phone,
  Square,
  Tag as TagIcon,
  User,
  X,
  Edit2,
  Copy,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Download,
  Paperclip,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useTagStore } from "../../../store/tagStore";
import { Card as CardType, CustomFieldType } from "../../../types";
import { useKanbanStore } from "../store/kanbanStore";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { useTeamMembersStore } from "../../../store/teamMembersStore";

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardType;
  boardId: string;
  listId: string;
  onEdit?: () => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const priorityIcons = {
  low: <AlertTriangle className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  high: <AlertCircle className="w-4 h-4" />,
  urgent: <AlertOctagon className="w-4 h-4" />,
};

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  isOpen,
  onClose,
  card,
  boardId,
  listId,
  onEdit,
}) => {
  const { theme } = useThemeStore();
  const { tags } = useTagStore();
  const { members } = useTeamMembersStore();
  const { updateCard, deleteAttachment } = useKanbanStore();
  const { showToast } = useToast();
  const [showDeleteAttachmentConfirm, setShowDeleteAttachmentConfirm] =
    React.useState<string | null>(null);

  const cardTags = useMemo(
    () =>
      (card.tagIds || [])
        .map((tagId) => tags.find((t) => t.id === tagId))
        .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined),
    [card.tagIds, tags]
  );

  const assignedMembers = useMemo(
    () =>
      (card.assignedTo || [])
        .map((memberId) => members.find((m) => m.id === memberId))
        .filter(
          (member): member is NonNullable<typeof member> => member !== undefined
        ),
    [card.assignedTo, members]
  );

  const completedSubtasks = useMemo(
    () => (card.subtasks || []).filter((subtask) => subtask.completed).length,
    [card.subtasks]
  );

  const totalSubtasks = useMemo(
    () => (card.subtasks || []).length,
    [card.subtasks]
  );

  const progress = useMemo(
    () => (totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0),
    [completedSubtasks, totalSubtasks]
  );

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = card.subtasks.map((subtask) => {
      if (subtask.id === subtaskId) {
        const newStatus = !subtask.completed;
        // Mostra toast baseado no novo status
        showToast(
          newStatus ? "Subtarefa concluída!" : "Subtarefa desmarcada",
          "success"
        );
        return { ...subtask, completed: newStatus };
      }
      return subtask;
    });

    updateCard(boardId, listId, card.id, { subtasks: updatedSubtasks });
  };

  const handleCopyPhone = async (phone: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = phone;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      showToast("Número copiado para a área de transferência!", "success");
    } catch (err) {
      showToast("Erro ao copiar número", "error");
      console.error("Erro ao copiar número:", err);
    }
  };

  const renderCustomFieldValue = (field: { type: string; value: string }) => {
    switch (field.type) {
      case "text":
      case "number":
      case "email":
      case "tel":
        return field.value;
      case "date":
        return field.value ? format(new Date(field.value), "dd/MM/yyyy") : "";
      case "checkbox":
        return field.value === "true" ? "Sim" : "Não";
      default:
        return field.value;
    }
  };

  const getCustomFieldIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4 mr-1 text-blue-500" />;
      case "tel":
        return <Phone className="w-4 h-4 mr-1 text-green-500" />;
      case "url":
        return <Link className="w-4 h-4 mr-1 text-purple-500" />;
      case "number":
        return <Hash className="w-4 h-4 mr-1 text-orange-500" />;
      case "checkbox":
        return <CheckSquare className="w-4 h-4 mr-1 text-indigo-500" />;
      default:
        return <TagIcon className="w-4 h-4 mr-1 text-blue-400" />;
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    deleteAttachment(boardId, listId, card.id, attachmentId);
    showToast("Anexo removido com sucesso!", "success");
    setShowDeleteAttachmentConfirm(null);
  };

  const handleOpenAttachment = (url: string) => {
    // Se for uma URL base64, criar um objeto URL temporário
    if (url.startsWith("data:")) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>
        `);
      }
    } else {
      window.open(url, "_blank");
    }
  };

  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      // Se for uma URL base64
      if (url.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      showToast("Erro ao baixar o arquivo", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-4xl p-8 rounded-lg shadow-xl ${
          theme === "dark" ? "bg-dark-900" : "bg-white"
        } max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-2xl font-semibold ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              } mb-2`}
            >
              {card.title}
            </h3>
            <p
              className={`${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } whitespace-pre-wrap break-words`}
            >
              {card.description || "Sem descrição"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-600 hover:text-gray-700"
                }`}
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors ${
                theme === "dark"
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-700"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {card.priority && (
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-dark-800" : "bg-gray-100"
                }`}
              >
                <div
                  className={`inline-flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-md ${
                    priorityColors[card.priority as keyof typeof priorityColors]
                  }`}
                >
                  <span>
                    {priorityIcons[card.priority as keyof typeof priorityIcons]}
                  </span>
                  <span className="capitalize">
                    {card.priority === "low"
                      ? "Baixa"
                      : card.priority === "medium"
                      ? "Média"
                      : card.priority === "high"
                      ? "Alta"
                      : "Urgente"}
                  </span>
                </div>
              </div>
            )}

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-dark-800" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }
                >
                  Valor:
                </span>
                <span
                  className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(card.value || 0)}
                </span>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-dark-800" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                  >
                    Telefone:
                  </span>
                  <span
                    className={`font-medium ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {card.phone || "Não informado"}
                  </span>
                </div>
                {card.phone && (
                  <button
                    onClick={() => handleCopyPhone(card.phone)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-full transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {card.scheduledDate && (
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-dark-800" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {new Date(card.scheduledDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {card.scheduledTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {card.scheduledTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {card.responsibleId && (
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-dark-800" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                <span
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {members.find((m) => m.id === card.responsibleId)?.name ||
                    "Responsável não encontrado"}
                </span>
              </div>
            </div>
          )}

          {card.tagIds?.length > 0 && (
            <div>
              <h4
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                Marcadores
              </h4>
              <div className="flex flex-wrap gap-2">
                {card.tagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: tag.color, color: "#fff" }}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {Object.keys(card.customFields || {}).length > 0 && (
            <div>
              <h4
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                Campos Personalizados
              </h4>
              <div className="space-y-2">
                {Object.entries(card.customFields).map(([name, field]) => (
                  <div
                    key={name}
                    className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-dark-800" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {name}:
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {field.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {card.subtasks?.length > 0 && (
            <div>
              <h4
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                Subtarefas (
                {card.subtasks.filter((task) => task.completed).length}/
                {card.subtasks.length})
              </h4>
              <div className="space-y-2">
                {card.subtasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-dark-800" : "bg-gray-100"
                    } hover:bg-opacity-80`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSubtask(task.id);
                        }}
                        className={`flex items-center justify-center w-5 h-5 rounded ${
                          task.completed
                            ? "bg-[#7f00ff] text-white"
                            : theme === "dark"
                            ? "border-2 border-gray-400 hover:border-[#7f00ff]"
                            : "border-2 border-gray-500 hover:border-[#7f00ff]"
                        }`}
                      >
                        {task.completed ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <span
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-200" : "text-gray-900"
                        } ${task.completed ? "line-through opacity-50" : ""}`}
                      >
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <p
                        className={`mt-1 text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        } ml-6`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seção de Anexos */}
        {card.attachments && card.attachments.length > 0 && (
          <div className="mt-8">
            <h4
              className={`text-lg font-medium mb-4 flex items-center ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}
            >
              <Paperclip className="w-5 h-5 mr-2 text-blue-500" />
              Anexos ({card.attachments.length})
            </h4>
            <div className="space-y-3">
              {card.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    theme === "dark"
                      ? "bg-dark-800/80 border border-blue-900/30"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-blue-500" />
                    <div>
                      <h5
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {attachment.name}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB •
                        {format(
                          new Date(attachment.createdAt),
                          "dd 'de' MMMM 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAttachment(attachment.url)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Visualizar anexo"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadAttachment(
                          attachment.url,
                          attachment.name
                        )
                      }
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Baixar anexo"
                    >
                      <Download className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() =>
                        setShowDeleteAttachmentConfirm(attachment.id)
                      }
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Excluir anexo"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!showDeleteAttachmentConfirm}
        onClose={() => setShowDeleteAttachmentConfirm(null)}
        onConfirm={() =>
          showDeleteAttachmentConfirm &&
          handleDeleteAttachment(showDeleteAttachmentConfirm)
        }
        title="Excluir Anexo"
        message="Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Não, manter"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
};
