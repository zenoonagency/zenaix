import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Tag as TagIcon,
  Calendar,
  Clock,
  User,
  ListTodo,
  CheckSquare,
  Square,
  DollarSign,
  Phone,
  AlertTriangle,
  Upload,
  Paperclip,
} from "lucide-react";
import { useTagStore } from "../../../store/tagStore";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { CustomFieldType, Attachment } from "../types";
import { useThemeStore } from "../../../store/themeStore";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { useToast } from "../../../hooks/useToast";
import { generateId } from "../../../utils/generateId";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { attachmentService } from "../../../services/attachment.service";
import { subtaskService } from "../../../services/subtask.service";
import { useAuthStore } from "../../../store/authStore";
import {
  AttachmentDTO,
  InputCreateSubtaskDTO,
  InputUpdateSubtaskDTO,
} from "../../../types/card";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: any) => void;
  mode: "add" | "edit";
  boardId: string;
  listId: string;
  card?: any;
}

interface CustomFieldInput {
  id: string;
  name: string;
  value: string;
}

interface Subtask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function CardModal({
  isOpen,
  onClose,
  onSave,
  mode,
  boardId,
  listId,
  card,
}: CardModalProps) {
  const { theme } = useThemeStore();
  const { tags } = useTagStore();
  const { members } = useTeamMembersStore();
  const { showToast } = useToast();
  const { token, organization } = useAuthStore();
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [isUpdatingSubtask, setIsUpdatingSubtask] = useState(false);
  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [value, setValue] = useState(card?.value?.toString() || "");
  const [phone, setPhone] = useState(card?.phone || "");
  const [priority, setPriority] = useState(card?.priority || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    card?.tagIds || []
  );
  const [scheduledDate, setScheduledDate] = useState(card?.scheduledDate || "");
  const [scheduledTime, setScheduledTime] = useState(card?.scheduledTime || "");
  const [responsibleId, setResponsibleId] = useState(card?.responsibleId || "");
  const [customFields, setCustomFields] = useState<CustomFieldInput[]>(
    card?.customFields
      ? Object.entries(card.customFields).map(([name, field]) => ({
          id: generateId(),
          name,
          value: field.value.toString(),
        }))
      : []
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(card?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
  const [showNewSubtaskForm, setShowNewSubtaskForm] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmDeleteField, setShowConfirmDeleteField] = useState<
    string | null
  >(null);
  const [attachments, setAttachments] = useState<Attachment[]>(
    card?.attachments || []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const hasChanges = () => {
    if (mode === "add") return title.trim() !== "" || description.trim() !== "";

    if (!card) return false;

    return (
      title !== card.title ||
      description !== card.description ||
      value !== card.value ||
      phone !== card.phone ||
      scheduledDate !== card.scheduledDate ||
      scheduledTime !== card.scheduledTime ||
      responsibleId !== card.responsibleId ||
      JSON.stringify(selectedTagIds) !== JSON.stringify(card.tagIds) ||
      JSON.stringify(customFields) !==
        JSON.stringify(
          Object.entries(card.customFields).map(([name, field]) => ({
            id: name,
            name,
            type: field.type,
            value: field.value,
          }))
        ) ||
      JSON.stringify(subtasks) !== JSON.stringify(card.subtasks)
    );
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleUpdateCustomField = (
    id: string,
    field: string,
    value: string
  ) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleRemoveCustomField = (fieldId: string) => {
    setShowConfirmDeleteField(fieldId);
  };

  const confirmDeleteField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== fieldId));
    setShowConfirmDeleteField(null);
    showToast("Campo personalizado removido com sucesso!", "success");
  };

  const handleAddCustomField = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCustomFields([
      ...customFields,
      { id: generateId(), name: "", value: "" },
    ]);
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    // Para criação de card (mode === "add"), manter comportamento local
    if (mode === "add") {
      const newSubtask: Subtask = {
        id: generateId(),
        title: newSubtaskTitle.trim(),
        description: newSubtaskDescription.trim(),
        completed: false,
      };

      setSubtasks((prev) => [...prev, newSubtask]);
      setNewSubtaskTitle("");
      setNewSubtaskDescription("");
      setShowNewSubtaskForm(false);
      showToast("Subtarefa adicionada com sucesso!", "success");
      return;
    }

    // Para edição de card (mode === "edit"), usar API
    if (!token || !organization?.id || !card?.id) {
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
        card.id,
        subtaskData
      );

      // Converter para formato local
      const newSubtasks = createdSubtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description || "",
        completed: subtask.is_completed,
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
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
      return;
    }

    // Para edição de card (mode === "edit"), usar API
    if (!token || !organization?.id || !card?.id) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsUpdatingSubtask(true);

    try {
      const updateData: InputUpdateSubtaskDTO = {
        is_completed: !subtask.completed,
      };

      const updatedSubtask = await subtaskService.updateSubtask(
        token,
        organization.id,
        boardId,
        listId,
        card.id,
        id,
        updateData
      );

      // Atualizar estado local
      setSubtasks(
        subtasks.map((task) =>
          task.id === id
            ? {
                ...task,
                completed: updatedSubtask.is_completed,
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
    // Para criação de card (mode === "add"), manter comportamento local
    if (mode === "add") {
      setSubtasks(subtasks.filter((task) => task.id !== id));
      showToast("Subtarefa removida com sucesso!", "success");
      return;
    }

    // Para edição de card (mode === "edit"), usar API
    if (!token || !organization?.id || !card?.id) {
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
        id
      );

      setSubtasks(subtasks.filter((task) => task.id !== id));
      showToast("Subtarefa removida com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao remover subtarefa:", error);
      showToast(error.message || "Erro ao remover subtarefa", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limite conforme documentação: 1 anexo por card, 5MB
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
    ];

    // Verificar se já atingiu o limite de anexos (1 por card conforme doc)
    if (attachments.length >= 1) {
      showToast("Limite máximo de 1 anexo por cartão atingido", "error");
      return;
    }

    if (!token || !organization?.id) {
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

        // Se for uma imagem, comprimir antes do upload
        if (file.type.startsWith("image/")) {
          const compressedBlob = await compressImage(file);
          finalFile = new File([compressedBlob], file.name, {
            type: file.type,
          });
        }

        // Upload via API
        const uploadedAttachments = await attachmentService.createAttachment(
          token,
          organization.id,
          boardId,
          listId,
          card?.id || "temp", // Para cards novos, será atualizado após criação
          finalFile
        );

        // Converter para formato local
        const newAttachments = uploadedAttachments.map(
          (attachment: AttachmentDTO) => ({
            id: attachment.id,
            name: attachment.file_name,
            url: attachment.file_url,
            size: attachment.fileSize,
            createdAt: attachment.created_at,
          })
        );

        setAttachments((prev) => [...prev, ...newAttachments]);
        showToast(`Arquivo ${file.name} adicionado com sucesso!`, "success");
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

  // Função para comprimir imagens
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionar se a imagem for muito grande
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Não foi possível obter o contexto do canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Falha ao comprimir imagem"));
            }
          },
          file.type,
          0.6 // Qualidade da compressão reduzida para 60%
        );
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    });
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!token || !organization?.id || !card?.id) {
      // Para cards novos, apenas remover do estado local
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      return;
    }

    try {
      await attachmentService.deleteAttachment(
        token,
        organization.id,
        boardId,
        listId,
        card.id,
        attachmentId
      );

      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      showToast("Anexo removido com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao remover anexo:", error);
      showToast(error.message || "Erro ao remover anexo", "error");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }

    const cardData = {
      title: title.trim(),
      description: description.trim(),
      value: value ? parseFloat(value) : 0,
      phone: phone.trim(),
      priority: priority as Card["priority"],
      tagIds: selectedTagIds,
      scheduledDate,
      scheduledTime,
      responsibleId,
      customFields: customFields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: { type: "text", value: field.value },
        }),
        {}
      ),
      subtasks,
      // attachments são gerenciados separadamente via attachmentService
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(cardData);
    onClose();
  };

  if (!isOpen) return null;

  const completedSubtasks = subtasks.filter((task) => task.completed).length;
  const progress =
    subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <div
          className={`${
            isDark
              ? "bg-dark-900 border border-white/10"
              : "bg-white border border-gray-200"
          } 
            rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto shadow-xl
          `}
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
              className={`${
                isDark
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
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
                  className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                    isDark
                      ? "bg-dark-800 text-gray-100 border-gray-600"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
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
                  className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                    isDark
                      ? "bg-dark-800 text-gray-100 border-gray-600"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
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
                    className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                      isDark
                        ? "bg-dark-800 text-gray-100 border-gray-600"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
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
                    className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                      isDark
                        ? "bg-dark-800 text-gray-100 border-gray-600"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
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
                    className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                      isDark
                        ? "bg-dark-800 text-gray-100 border-gray-600"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
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
                    className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                      isDark
                        ? "bg-dark-800 text-gray-100 border-gray-600"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
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
                  className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                    isDark
                      ? "bg-dark-800 text-gray-100 border-gray-600"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
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
                  className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                    isDark
                      ? "bg-dark-800 text-gray-100 border-gray-600"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="">Selecione a prioridade</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
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
                      className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-opacity-100"
                          : "bg-opacity-20"
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
                    <ListTodo className="w-4 h-4 text-pink-500" />
                    <label
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Campos Personalizados
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-[#7f00ff] hover:bg-[#7f00ff]/10 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Campo
                  </button>
                </div>
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex gap-3">
                      <Input
                        type="text"
                        value={field.name}
                        onChange={(e) =>
                          handleUpdateCustomField(
                            field.id,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Nome do campo"
                        className={`flex-1 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                          isDark
                            ? "bg-dark-800 text-gray-100 border-gray-600"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                      <Input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          handleUpdateCustomField(
                            field.id,
                            "value",
                            e.target.value
                          )
                        }
                        placeholder="Valor"
                        className={`flex-1 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                          isDark
                            ? "bg-dark-800 text-gray-100 border-gray-600"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
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
                        className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                          isDark
                            ? "bg-dark-800 text-gray-100 border-gray-600"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                      <Textarea
                        value={newSubtaskDescription}
                        onChange={(e) =>
                          setNewSubtaskDescription(e.target.value)
                        }
                        placeholder="Descrição da subtarefa"
                        rows={2}
                        className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                          isDark
                            ? "bg-dark-800 text-gray-100 border-gray-600"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewSubtaskForm(false);
                            setNewSubtaskTitle("");
                            setNewSubtaskDescription("");
                          }}
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
                            !newSubtaskTitle.trim() || isCreatingSubtask
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
                        disabled={isUpdatingSubtask}
                        className={`mt-1 ${
                          task.completed
                            ? "text-[#7f00ff]"
                            : isDark
                            ? "text-gray-600"
                            : "text-gray-400"
                        } ${
                          isUpdatingSubtask
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-medium ${
                            task.completed ? "line-through opacity-50" : ""
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p
                            className={`text-sm mt-1 ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            } ${
                              task.completed ? "line-through opacity-50" : ""
                            }`}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(task.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
                    disabled={isUploadingAttachment}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingAttachment ? "Enviando..." : "Adicionar Anexo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
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
                          {attachment.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className={`p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 ${
                          isDark ? "text-red-400" : "text-red-500"
                        }`}
                      >
                        <X className="w-4 h-4" />
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
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
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

      <ConfirmationModal
        isOpen={!!showConfirmDeleteField}
        onClose={() => setShowConfirmDeleteField(null)}
        onConfirm={() =>
          showConfirmDeleteField && confirmDeleteField(showConfirmDeleteField)
        }
        title="Remover campo"
        message="Tem certeza que deseja remover este campo personalizado?"
        confirmText="Sim, remover"
        cancelText="Não, manter"
      />
    </>
  );
}
