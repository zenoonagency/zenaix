import React, { useMemo } from "react";
import { format } from "date-fns";
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
  Eye,
} from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useTagStore } from "../../../store/tagStore";
import type { OutputCardDTO, SubtaskDTO } from "../../../types/card";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { subtaskService } from "../../../services/subtask.service";
import { useAuthStore } from "../../../store/authStore";
import { cardService } from "../../../services/card.service";
import { attachmentService } from "../../../services/attachment.service";
import { PDFViewer } from "../../../components/PDFViewer";
import { useState } from "react";

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: OutputCardDTO;
  boardId: string;
  listId: string;
  onEdit?: () => void;
}

const priorityColors = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const priorityIcons = {
  LOW: <AlertTriangle className="w-4 h-4" />,
  MEDIUM: <AlertTriangle className="w-4 h-4" />,
  HIGH: <AlertCircle className="w-4 h-4" />,
  URGENT: <AlertOctagon className="w-4 h-4" />,
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
  const { token, organization, hasPermission } = useAuthStore();
  const { showToast } = useToast();
  const [showDeleteAttachmentConfirm, setShowDeleteAttachmentConfirm] =
    React.useState<string | null>(null);
  const [subtasks, setSubtasks] = React.useState<SubtaskDTO[]>(
    card.subtasks || []
  );
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] =
    React.useState(false);
  const [isDeletingCard, setIsDeletingCard] = React.useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = React.useState<
    string | null
  >(null);
  const [viewingAttachment, setViewingAttachment] = useState<any | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  React.useEffect(() => {
    setSubtasks(card.subtasks || []);
  }, [card.subtasks]);

  const cardTags = useMemo(
    () =>
      (card.tag_ids || [])
        .map((tagId) => tags.find((t) => t.id === tagId))
        .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined),
    [card.tag_ids, tags]
  );

  const assignedMembers = useMemo(
    () =>
      (card.assignee_id ? [card.assignee_id] : [])
        .map((memberId) => members.find((m) => m.id === memberId))
        .filter(
          (member): member is NonNullable<typeof member> => member !== undefined
        ),
    [card.assignee_id, members]
  );

  const completedSubtasks = useMemo(
    () => (subtasks || []).filter((subtask) => subtask.is_completed).length,
    [subtasks]
  );

  const totalSubtasks = useMemo(() => (subtasks || []).length, [subtasks]);

  const progress = useMemo(
    () => (totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0),
    [completedSubtasks, totalSubtasks]
  );

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;
    if (!token || !organization?.id) {
      showToast("Erro de autenticação", "error");
      return;
    }
    try {
      const updated = await subtaskService.updateSubtask(
        token,
        organization.id,
        boardId,
        listId,
        card.id,
        subtaskId,
        { is_completed: !subtask.is_completed }
      );
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId
            ? {
                ...s,
                is_completed: updated.is_completed,
                title: updated.title,
                description: updated.description || "",
              }
            : s
        )
      );
      showToast(
        updated.is_completed ? "Subtarefa concluída!" : "Subtarefa desmarcada",
        "success"
      );
      if (onEdit) onEdit();
    } catch (error: any) {
      showToast(error.message || "Erro ao atualizar subtarefa", "error");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!token || !organization?.id) {
      showToast("Erro de autenticação", "error");
      return;
    }
    try {
      await subtaskService.deleteSubtask(
        token,
        organization.id,
        boardId,
        listId,
        card.id,
        subtaskId
      );
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      showToast("Subtarefa removida com sucesso!", "success");
      if (onEdit) onEdit();
    } catch (error: any) {
      showToast(error.message || "Erro ao remover subtarefa", "error");
    }
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
    showToast("Anexo removido com sucesso!", "success");
    setShowDeleteAttachmentConfirm(null);
  };

  // Função para abrir anexo em nova guia
  const handleOpenAttachment = async (attachment: any) => {
    if (attachment.file_name?.toLowerCase().endsWith(".pdf")) {
      setViewingAttachment(attachment);
      setLoadingPdf(true);
      setPdfUrl(null);
      try {
        const url = await attachmentService.downloadAttachment(
          token,
          organization.id,
          boardId,
          listId,
          card.id,
          attachment.id
        );
        // Se não for blob/data, faz fetch e converte para blob
        let safeUrl = url;
        if (url && !url.startsWith("blob:") && !url.startsWith("data:")) {
          const response = await fetch(url);
          const blob = await response.blob();
          safeUrl = URL.createObjectURL(blob);
        }
        setPdfUrl(safeUrl);
      } catch (e) {
        showToast("Erro ao carregar PDF", "error");
        setPdfUrl(null);
      }
      setLoadingPdf(false);
      return;
    }
    if (!token || !organization?.id) return;
    setDownloadingAttachmentId(attachment.id);
    try {
      const url = await attachmentService.downloadAttachment(
        token,
        organization.id,
        boardId,
        listId,
        card.id,
        attachment.id
      );
      window.open(url, "_blank");
    } catch (error: any) {
      showToast(error.message || "Erro ao abrir anexo", "error");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };
  // Função para baixar anexo
  const handleDownloadAttachment = async (attachment: any) => {
    if (attachment.file_url) {
      // Download direto em nova aba
      const a = document.createElement("a");
      a.href = attachment.file_url;
      a.target = "_blank";
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (!token || !organization?.id) return;
    setDownloadingAttachmentId(attachment.id);
    try {
      const url = await attachmentService.downloadAttachment(
        token,
        organization.id,
        boardId,
        listId,
        card.id, // cardId correto
        attachment.id
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      showToast(error.message || "Erro ao baixar anexo", "error");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center !mt-0">
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
          {card.priority && (
            <div
              className={`rounded-lg flex items-center gap-2 bg-white dark:bg-dark-800`}
            >
              <span
                className={`inline-flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-md ${
                  priorityColors[card.priority as keyof typeof priorityColors]
                }`}
              >
                {priorityIcons[card.priority as keyof typeof priorityIcons]}
                <span className="capitalize">
                  {card.priority === "LOW"
                    ? "Baixa"
                    : card.priority === "MEDIUM"
                    ? "Média"
                    : card.priority === "HIGH"
                    ? "Alta"
                    : "Urgente"}
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit();
              }}
              className="p-2 rounded-full text-[#7f00ff] hover:text-purple-700 transition-colors"
              title="Editar card"
              disabled={isDeletingCard}
              style={{
                display: hasPermission("lists:update") ? "block" : "none",
              }}
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDeleteCardConfirm(true)}
              className="p-2 rounded-full text-red-500 hover:text-red-600 transition-colors"
              title="Excluir card"
              disabled={isDeletingCard}
              style={{
                display: hasPermission("lists:update") ? "block" : "none",
              }}
            >
              {isDeletingCard ? (
                <svg
                  className="animate-spin w-5 h-5 text-red-500"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <Trash2 className="w-5 h-5 text-red-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors`}
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-lg border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
            <div
              className={`text-2xl font-semibold ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              } mb-2 break-words w-full`}
              style={{ wordBreak: "break-word", whiteSpace: "normal" }}
            >
              {card.title}
            </div>
            <p
              className={`${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } whitespace-pre-wrap break-words`}
            >
              {card.description || "Sem descrição"}
            </p>
          </div>

          {/* Valor e Telefone juntos em linha */}
          <div className="flex flex-col md:flex-row gap-4">
            <div
              className={`flex-1 p-4 rounded-lg flex items-center gap-2 border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800`}
            >
              <DollarSign className="w-5 h-5 text-green-500" />
              <span
                className={theme === "dark" ? "text-gray-400" : "text-gray-500"}
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
            <div
              className={`flex-1 p-4 rounded-lg flex items-center justify-between gap-2 border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800`}
            >
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

          {/* 5. Data e 6. Hora */}
          {card.due_date && (
            <div
              className={`p-4 rounded-lg flex items-center gap-6 border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800`}
            >
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }
                >
                  Data:
                </span>
                <span
                  className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {card.due_date
                    ? new Date(card.due_date).toLocaleDateString("pt-BR")
                    : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }
                >
                  Hora:
                </span>
                <span
                  className={`font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {card.due_date
                    ? new Date(card.due_date).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          )}

          {/* 7. Responsável e 8. Prioridade juntos em linha */}
          {(card.assignee_id || card.priority) && (
            <div className="flex flex-col md:flex-row gap-4">
              {card.assignee_id && (
                <div
                  className={`flex-1 p-4 rounded-lg flex items-center gap-2 border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800`}
                >
                  <User className="w-5 h-5 text-orange-500" />
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                  >
                    Responsável:
                  </span>
                  <span
                    className={`font-medium ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {assignedMembers[0]?.name || "-"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 9. Marcadores */}
          {card.tags && card.tags.length > 0 && (
            <div className="p-4 rounded-lg border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
              <h4
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                Marcadores
              </h4>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: tag.color, color: "#fff" }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 10. Subtarefas */}
          {subtasks.length > 0 && (
            <div className="p-4 rounded-lg border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
              <h4
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                Subtarefas (
                {subtasks.filter((task) => task.is_completed).length}/
                {subtasks.length})
              </h4>
              <div className="space-y-2">
                {subtasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
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
                          task.is_completed
                            ? "bg-[#7f00ff] text-white"
                            : theme === "dark"
                            ? "border-2 border-gray-400 hover:border-[#7f00ff]"
                            : "border-2 border-gray-500 hover:border-[#7f00ff]"
                        }`}
                      >
                        {task.is_completed ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <span
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-200" : "text-gray-900"
                        } ${
                          task.is_completed ? "line-through opacity-50" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSubtask(task.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Remover subtarefa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. Anexos */}
          {card.attachments && card.attachments.length > 0 && (
            <div className="mt-8 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-dark-800/80">
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
                    className="flex items-center justify-between p-4 rounded-lg bg-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-5 h-5 text-blue-500" />
                      <h5
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {attachment.file_name}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {/* Trocar ExternalLink por Eye para PDF */}
                      {attachment.file_name?.toLowerCase().endsWith(".pdf") ? (
                        <button
                          onClick={() => handleOpenAttachment(attachment)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Visualizar PDF"
                          disabled={downloadingAttachmentId === attachment.id}
                        >
                          {downloadingAttachmentId === attachment.id ? (
                            <svg
                              className="animate-spin w-4 h-4 text-blue-500"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          ) : (
                            <Eye className="w-4 h-4 text-blue-500" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAttachment(attachment)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Abrir em nova aba"
                          disabled={downloadingAttachmentId === attachment.id}
                        >
                          {downloadingAttachmentId === attachment.id ? (
                            <svg
                              className="animate-spin w-4 h-4 text-blue-500"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          ) : (
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Baixar anexo"
                        disabled={downloadingAttachmentId === attachment.id}
                      >
                        {downloadingAttachmentId === attachment.id ? (
                          <svg
                            className="animate-spin w-4 h-4 text-blue-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                        ) : (
                          <Download className="w-4 h-4 text-blue-500" />
                        )}
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
        <ConfirmationModal
          isOpen={showDeleteCardConfirm}
          onClose={() => setShowDeleteCardConfirm(false)}
          onConfirm={async () => {
            if (!token || !organization?.id) return;
            setIsDeletingCard(true);
            try {
              await cardService.deleteCard(
                token,
                organization.id,
                boardId,
                listId,
                card.id
              );
              showToast("Card removido com sucesso!", "success");
              setShowDeleteCardConfirm(false);
              onClose();
            } catch (error: any) {
              showToast(error.message || "Erro ao remover card", "error");
            } finally {
              setIsDeletingCard(false);
            }
          }}
          title="Excluir Card"
          message="Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita."
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
          isLoading={isDeletingCard}
        />
      </div>{" "}
      {/* Modal de visualização de PDF */}
      {viewingAttachment && (
        <div className="modal-container z-[9999]">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl p-4 max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {viewingAttachment.file_name}
              </span>
              <button
                onClick={() => {
                  setViewingAttachment(null);
                  setPdfUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {loadingPdf ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7f00ff]"></div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Carregando PDF...
                </p>
              </div>
            ) : pdfUrl ? (
              <PDFViewer
                fileUrl={pdfUrl}
                fileName={viewingAttachment?.file_name}
                height="70vh"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <p className="text-red-500 dark:text-red-400">
                  Erro ao carregar PDF
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
