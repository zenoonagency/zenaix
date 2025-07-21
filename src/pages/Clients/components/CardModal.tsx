import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Tag as TagIcon,
  Calendar,
  Clock,
  User,
  CheckSquare,
  Square,
  DollarSign,
  Phone,
  AlertTriangle,
  Upload,
  Paperclip,
  Eye,
  ExternalLink,
  Download,
} from "lucide-react";
import { useTagStore } from "../../../store/tagStore";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { Attachment } from "../types";
import { useThemeStore } from "../../../store/themeStore";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { useToast } from "../../../hooks/useToast";
import { generateId } from "../../../utils/generateId";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { attachmentService } from "../../../services/attachment.service";
import { subtaskService } from "../../../services/subtask.service";
import { useAuthStore } from "../../../store/authStore";
import { compressImage } from "../../../utils/imageCompression";
import {
  AttachmentDTO,
  InputCreateSubtaskDTO,
  InputUpdateSubtaskDTO,
  CardPriority,
  OutputCardDTO,
  SubtaskDTO,
} from "../../../types/card";
import { PDFViewer } from "../../../components/PDFViewer";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: any) => Promise<OutputCardDTO>;
  mode: "add" | "edit";
  boardId: string;
  listId: string;
  initialData?: any;
}

// Função utilitária para normalizar nomes de arquivos
function normalizeFileName(name: string) {
  return name
    .replace(/\s+/g, "_") // espaços por underline
    .replace(/[^a-zA-Z0-9._-]/g, "") // remove caracteres especiais
    .replace(/_+/g, "_"); // múltiplos underlines para um só
}

export function CardModal({
  isOpen,
  onClose,
  onSave,
  mode,
  boardId,
  listId,
  initialData,
}: CardModalProps) {
  const { theme } = useThemeStore();
  const { tags } = useTagStore();
  const { members } = useTeamMembersStore();
  const { showToast } = useToast();
  const { token, organization } = useAuthStore();
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [isUpdatingSubtask, setIsUpdatingSubtask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [value, setValue] = useState(initialData?.value?.toString() || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [priority, setPriority] = useState(initialData?.priority || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map((tag: any) => tag.id) || []
  );
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduledDate || ""
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialData?.scheduledTime || ""
  );
  const [responsibleId, setResponsibleId] = useState(
    initialData?.assignee_id || ""
  );
  const [subtasks, setSubtasks] = useState<SubtaskDTO[]>(
    initialData?.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
  const [showNewSubtaskForm, setShowNewSubtaskForm] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialData?.attachments || []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<
    string | null
  >(null);
  const [removingSubtaskId, setRemovingSubtaskId] = useState<string | null>(
    null
  );
  const [viewingAttachment, setViewingAttachment] = useState<any | null>(null);

  React.useEffect(() => {
    if (initialData?.tags) {
      setSelectedTagIds(initialData.tags.map((tag: any) => tag.id));
    } else {
      setSelectedTagIds([]);
    }
  }, [initialData?.tags]);

  // DATA: Preencher campo de data/hora se existir due_date
  React.useEffect(() => {
    if (mode === "edit" && initialData?.due_date) {
      const d = new Date(initialData.due_date);
      setScheduledDate(d.toISOString().slice(0, 10));
      setScheduledTime(d.toISOString().slice(11, 16));
    }
  }, [mode, initialData?.due_date]);

  const isDark = theme === "dark";

  const hasChanges = () => {
    if (mode === "add") return title.trim() !== "" || description.trim() !== "";

    if (!initialData) return false;

    return (
      title !== initialData.title ||
      description !== initialData.description ||
      value !== initialData.value ||
      phone !== initialData.phone ||
      scheduledDate !== initialData.scheduledDate ||
      scheduledTime !== initialData.scheduledTime ||
      responsibleId !== initialData.assignee_id ||
      JSON.stringify(selectedTagIds) !== JSON.stringify(initialData.tag_ids) ||
      JSON.stringify(subtasks) !== JSON.stringify(initialData.subtasks)
    );
  };

  const handleClose = () => {
    if (isSubmitting) {
      return; // Não permitir fechar durante o salvamento
    }

    if (hasChanges()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    // Para criação de card (mode === "add"), manter comportamento local
    if (mode === "add") {
      const newSubtask: SubtaskDTO = {
        id: generateId(),
        title: newSubtaskTitle.trim(),
        description: newSubtaskDescription.trim(),
        is_completed: false,
        card_id: initialData?.id || "",
      };

      setSubtasks((prev) => [...prev, newSubtask]);
      setNewSubtaskTitle("");
      setNewSubtaskDescription("");
      setShowNewSubtaskForm(false);
      // Não mostrar toast na criação local
      return;
    }

    // Para edição de card (mode === "edit"), usar API
    if (!token || !organization?.id || !initialData?.id) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsCreatingSubtask(true);

    try {
      const subtaskData: InputCreateSubtaskDTO = {
        title: newSubtaskTitle.trim(),
        description: newSubtaskDescription.trim() || undefined,
      };

      const createdSubtasks = await subtaskService.createSubtask(
        token,
        organization.id,
        boardId,
        listId,
        initialData.id,
        subtaskData
      );

      // Garantir que createdSubtasks seja sempre um array
      const subtasksArray = Array.isArray(createdSubtasks)
        ? createdSubtasks
        : [createdSubtasks];

      // Converter para formato local
      const newSubtasks = subtasksArray.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description || "",
        is_completed: subtask.is_completed,
        card_id: subtask.card_id,
      }));

      setSubtasks((prev) => [...prev, ...newSubtasks]);
      setNewSubtaskTitle("");
      setNewSubtaskDescription("");
      setShowNewSubtaskForm(false);
      showToast("Subtarefa adicionada com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao criar subtarefa:", error);
      showToast(error.message || "Erro ao criar subtarefa", "error");
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  const handleToggleSubtask = async (id: string) => {
    const subtask = subtasks.find((task) => task.id === id);
    if (!subtask) return;

    // Para criação de card (mode === "add"), manter comportamento local
    if (mode === "add") {
      setSubtasks(
        subtasks.map((task) =>
          task.id === id
            ? {
                ...task,
                is_completed: !task.is_completed,
                card_id: task.card_id,
              }
            : task
        )
      );
      return;
    }

    // Para edição de card (mode === "edit"), usar API
    if (!token || !organization?.id || !initialData?.id) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsUpdatingSubtask(true);

    try {
      const updateData: InputUpdateSubtaskDTO = {
        is_completed: !subtask.is_completed,
      };

      const updatedSubtask = await subtaskService.updateSubtask(
        token,
        organization.id,
        boardId,
        listId,
        initialData.id,
        id,
        updateData
      );

      // Atualizar estado local
      setSubtasks(
        subtasks.map((task) =>
          task.id === id
            ? {
                ...task,
                is_completed: updatedSubtask.is_completed,
                title: updatedSubtask.title,
                description: updatedSubtask.description || "",
              }
            : task
        )
      );
    } catch (error: any) {
      console.error("Erro ao atualizar subtarefa:", error);
      showToast(error.message || "Erro ao atualizar subtarefa", "error");
    } finally {
      setIsUpdatingSubtask(false);
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    setRemovingSubtaskId(id);
    // Para criação de card (mode === "add"), manter comportamento local
    if (mode === "add") {
      setSubtasks(subtasks.filter((task) => task.id !== id));
      showToast("Subtarefa removida com sucesso!", "success");
      setRemovingSubtaskId(null);
      return;
    }
    // Para edição de card (mode === "edit"), usar API
    if (!token || !organization?.id || !initialData?.id) {
      showToast("Erro de autenticação", "error");
      setRemovingSubtaskId(null);
      return;
    }
    try {
      await subtaskService.deleteSubtask(
        token,
        organization.id,
        boardId,
        listId,
        initialData.id,
        id
      );
      setSubtasks(subtasks.filter((task) => task.id !== id));
      showToast("Subtarefa removida com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao remover subtarefa:", error);
      showToast(error.message || "Erro ao remover subtarefa", "error");
    } finally {
      setRemovingSubtaskId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
    ];

    if (mode === "add") {
      console.log("[CardModal] Modo 'add' - armazenando arquivo localmente");

      // Permitir apenas um anexo: pega o último arquivo válido
      let lastValidAttachment = null;
      for (const file of files) {
        if (file.size > maxSize) {
          showToast(`O arquivo ${file.name} excede o limite de 5MB`, "error");
          continue;
        }
        if (!allowedTypes.includes(file.type)) {
          showToast(`O tipo de arquivo ${file.name} não é permitido`, "error");
          continue;
        }
        let finalFile = file;
        if (file.type.startsWith("image/")) {
          const result = await compressImage(file, { maxSizeKB: 300 });
          if (result.success && result.file) {
            finalFile = result.file;
          } else {
            showToast(result.error || "Erro ao comprimir imagem", "error");
            continue;
          }
        }
        lastValidAttachment = {
          id: generateId(),
          name: file.name,
          file: finalFile,
          size: finalFile.size,
          createdAt: new Date().toISOString(),
        };
      }
      if (lastValidAttachment) {
        setAttachments([lastValidAttachment]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Para edição de card (mode === "edit"), enviar diretamente
    if (!token || !organization?.id || !initialData?.id) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsUploadingAttachment(true);

    try {
      for (const file of files) {
        if (file.size > maxSize) {
          showToast(`O arquivo ${file.name} excede o limite de 5MB`, "error");
          continue;
        }

        if (!allowedTypes.includes(file.type)) {
          showToast(`O tipo de arquivo ${file.name} não é permitido`, "error");
          continue;
        }

        let finalFile = file;
        const normalizedFileName = normalizeFileName(file.name);
        if (file.name !== normalizedFileName) {
          // Cria um novo File com o nome normalizado
          finalFile = new File([file], normalizedFileName, { type: file.type });
        }

        // Se for uma imagem, comprimir antes do upload
        if (file.type.startsWith("image/")) {
          const result = await compressImage(file, { maxSizeKB: 300 });

          if (result.success && result.file) {
            finalFile = result.file;
          } else {
            console.error("[CardModal] Erro na compressão:", result.error);
            showToast(result.error || "Erro ao comprimir imagem", "error");
            continue;
          }
        }

        // Upload via API
        let newAttachments = [];
        if (attachments.length > 0) {
          // Já existe anexo, substituir o primeiro
          const existing = attachments[0];
          const updated: any = await attachmentService.updateAttachment(
            token,
            organization.id,
            boardId,
            listId,
            initialData.id,
            existing.id,
            finalFile
          );
          // O backend pode retornar array ou objeto único
          let updatedArray = [];
          if (Array.isArray(updated)) {
            updatedArray = updated;
          } else if (updated?.data) {
            updatedArray = [updated.data];
          } else if (updated) {
            updatedArray = [updated];
          }
          newAttachments = updatedArray.map((attachment: any) => ({
            id: attachment.id,
            name: attachment.file_name,
            url: attachment.file_url,
            size: attachment.file_size,
            createdAt: attachment.created_at,
          }));
          setAttachments(newAttachments); // substitui o antigo
          showToast(`Arquivo ${file.name} atualizado com sucesso!`, "success");
        } else {
          // Não existe anexo, criar
          const uploadedAttachments: any =
            await attachmentService.createAttachment(
              token,
              organization.id,
              boardId,
              listId,
              initialData.id,
              finalFile
            );
          let attachmentsArray = [];
          if (Array.isArray(uploadedAttachments)) {
            attachmentsArray = uploadedAttachments;
          } else if (uploadedAttachments?.data) {
            attachmentsArray = [uploadedAttachments.data];
          } else if (uploadedAttachments) {
            attachmentsArray = [uploadedAttachments];
          }
          newAttachments = attachmentsArray.map((attachment: any) => ({
            id: attachment.id,
            name: attachment.file_name,
            url: attachment.file_url,
            size: attachment.file_size,
            createdAt: attachment.created_at,
          }));
          setAttachments((prev) => [...prev, ...newAttachments]);
          showToast(`Arquivo ${file.name} adicionado com sucesso!`, "success");
        }
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      showToast(error.message || "Erro ao fazer upload do arquivo", "error");
    } finally {
      setIsUploadingAttachment(false);
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    setRemovingAttachmentId(attachmentId);
    if (!token || !organization?.id || !initialData?.id) {
      // Para cards novos, apenas remover do estado local
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      setRemovingAttachmentId(null);
      return;
    }

    try {
      await attachmentService.deleteAttachment(
        token,
        organization.id,
        boardId,
        listId,
        initialData.id,
        attachmentId
      );

      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      showToast("Anexo removido com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao remover anexo:", error);
      showToast(error.message || "Erro ao remover anexo", "error");
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combinar data e hora para due_date
      let dueDate = null;
      if (scheduledDate && scheduledTime) {
        const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        dueDate = dateTime.toISOString();
      } else if (scheduledDate) {
        const dateTime = new Date(`${scheduledDate}T00:00`);
        dueDate = dateTime.toISOString();
      }

      const cardData = {
        title: title.trim(),
        description: description.trim(),
        value: value ? parseFloat(value) : 0,
        phone: phone.trim(),
        priority: priority as CardPriority,
        tag_ids: selectedTagIds,
        due_date: dueDate,
        assignee_id: responsibleId || null,
        subtasks: subtasks.map(({ title, description }) => ({
          title,
          description,
        })),
        // attachments são gerenciados separadamente via attachmentService
      };

      console.log("[CardModal] Salvando card com dados:", cardData);
      console.log("[CardModal] Anexos pendentes:", attachments);

      const createdCard = await onSave(cardData);

      console.log("[CardModal] Card criado:", createdCard);

      // Se há anexos pendentes, fazer upload após criação do card
      if (mode === "add" && attachments.length > 0 && createdCard?.id) {
        console.log("[CardModal] Iniciando upload de anexos...");
        const pendingAttachments = attachments.filter((att) => att.file);

        console.log("[CardModal] Anexos com arquivo:", pendingAttachments);

        for (const attachment of pendingAttachments) {
          try {
            await attachmentService.createAttachment(
              token!,
              organization!.id,
              boardId,
              listId,
              createdCard.id,
              attachment.file!
            );
            showToast(
              `Anexo ${attachment.name} enviado com sucesso!`,
              "success"
            );
          } catch (error: any) {
            console.error("Erro ao fazer upload do anexo:", error);
            showToast(
              `Erro ao fazer upload do anexo ${attachment.name}`,
              "error"
            );
          }
        }
      } else {
        console.log(
          "[CardModal] Nenhum anexo para upload ou card não foi criado corretamente"
        );
        console.log("[CardModal] mode:", mode);
        console.log("[CardModal] attachments.length:", attachments.length);
        console.log("[CardModal] createdCard?.id:", createdCard?.id);
        console.log("[CardModal] createdCard completo:", createdCard);
      }

      // Só fechar a modal após todo o processo estar completo
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar card:", error);
      showToast(error.message || "Erro ao salvar card", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const completedSubtasks = subtasks.filter((task) => task.is_completed).length;
  const progress =
    subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] !mt-0">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        className="relative max-w-4xl w-full bg-white dark:bg-dark-900 rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-xl font-semibold ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {mode === "edit" ? "Editar Cartão" : "Novo Cartão"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`${
              isDark
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-700"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                } mb-1`}
              >
                Título
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                } mb-1`}
              >
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 resize-none"
                rows={4}
                placeholder="Digite a descrição do cartão..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <label
                    className={`block text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Valor
                  </label>
                </div>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  step="0.01"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <label
                    className={`block text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Telefone
                  </label>
                </div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <label
                    className={`block text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Data
                  </label>
                </div>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <label
                    className={`block text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Hora
                  </label>
                </div>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-orange-500" />
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Responsável
                </label>
              </div>
              <Select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                <option value="">Selecione um responsável</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Prioridade
                </label>
              </div>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                <option value="">Selecione a prioridade</option>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="w-4 h-4 text-emerald-500" />
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Marcadores
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setSelectedTagIds((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    disabled={isSubmitting}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? "bg-opacity-100"
                        : "bg-opacity-20 opacity-60"
                    }`}
                    style={{
                      backgroundColor: selectedTagIds.includes(tag.id)
                        ? tag.color
                        : `${tag.color}20`,
                      color: selectedTagIds.includes(tag.id)
                        ? "#fff"
                        : tag.color,
                    }}
                  >
                    <TagIcon className="w-3.5 h-3.5" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-cyan-500" />
                  <label
                    className={`block text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Subtarefas
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewSubtaskForm(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-[#7f00ff] hover:bg-[#7f00ff]/10 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Subtarefa
                </button>
              </div>

              {showNewSubtaskForm && (
                <div className="mb-4 p-4 rounded-lg border border-[#7f00ff]/20 bg-[#7f00ff]/5">
                  <div className="space-y-3">
                    <Input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Título da subtarefa"
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    />
                    <Textarea
                      value={newSubtaskDescription}
                      onChange={(e) => setNewSubtaskDescription(e.target.value)}
                      placeholder="Descrição da subtarefa"
                      rows={2}
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewSubtaskForm(false);
                          setNewSubtaskTitle("");
                          setNewSubtaskDescription("");
                        }}
                        disabled={isSubmitting}
                        className={`px-3 py-1.5 rounded-md ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        disabled={
                          !newSubtaskTitle.trim() ||
                          isCreatingSubtask ||
                          isSubmitting
                        }
                        className="px-3 py-1.5 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingSubtask ? "Criando..." : "Adicionar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {subtasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    } flex items-start gap-3`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(task.id)}
                      disabled={isUpdatingSubtask || isSubmitting}
                      className={`mt-1 ${
                        task.is_completed
                          ? "text-[#7f00ff]"
                          : isDark
                          ? "text-gray-600"
                          : "text-gray-400"
                      } ${
                        isUpdatingSubtask || isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {task.is_completed ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4
                        className={`text-sm font-medium ${
                          task.is_completed ? "line-through opacity-50" : ""
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p
                          className={`text-sm mt-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          } ${
                            task.is_completed ? "line-through opacity-50" : ""
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(task.id)}
                      disabled={isSubmitting || removingSubtaskId === task.id}
                      className={`p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors ${
                        isSubmitting || removingSubtaskId === task.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {removingSubtaskId === task.id ? (
                        <svg
                          className="animate-spin w-4 h-4"
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
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {subtasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-500"}
                    >
                      {completedSubtasks} de {subtasks.length} concluídas
                    </span>
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-500"}
                    >
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7f00ff] rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className={`flex items-center gap-2 text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <Paperclip className="w-4 h-4 text-blue-500" />
                  Anexos
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment || isSubmitting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingAttachment
                    ? "Enviando..."
                    : attachments.length > 0
                    ? "Substituir Anexo"
                    : "Adicionar Anexo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </div>

              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark
                        ? "bg-dark-800/80 border border-blue-900/30"
                        : "bg-blue-50 border border-blue-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-500" />
                      <span
                        className={`text-sm ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {attachment.name ||
                          attachment.url ||
                          "Sem nome"}
                      </span>
                      {typeof attachment.size === "number" &&
                        !isNaN(attachment.size) && (
                          <span className="text-xs text-gray-400">
                            ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                      {/* Botão visualizar PDF se for PDF */}
                      {attachment.url &&
                        attachment.name?.toLowerCase().endsWith(".pdf") && (
                          <button
                            type="button"
                            className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 text-[#7f00ff]"
                            title="Visualizar PDF"
                            onClick={() => setViewingAttachment(attachment)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      {/* Botão abrir em nova aba */}
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 text-blue-500"
                          title="Abrir em nova aba"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {/* Botão download */}
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={attachment.name}
                          className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 text-green-600"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      disabled={
                        isSubmitting || removingAttachmentId === attachment.id
                      }
                      className={`p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 ${
                        isDark ? "text-red-400" : "text-red-500"
                      } ${
                        isSubmitting || removingAttachmentId === attachment.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {removingAttachmentId === attachment.id ? (
                        <svg
                          className="animate-spin w-4 h-4"
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
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg ${
                isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? attachments.length > 0 && mode === "add"
                  ? "Salvando e enviando anexos..."
                  : "Salvando..."
                : "Salvar"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={onClose}
        title="Cancelar edição"
        message="Tem certeza que deseja cancelar? Todas as alterações serão perdidas."
        confirmText="Sim, cancelar"
        cancelText="Não, continuar editando"
      />
      {/* Modal de visualização de PDF */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl p-4 max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {viewingAttachment.name}
              </span>
              <button
                onClick={() => setViewingAttachment(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PDFViewer
              fileUrl={viewingAttachment.url}
              fileName={viewingAttachment.name}
              height="70vh"
            />
          </div>
        </div>
      )}
    </div>
  );
}
