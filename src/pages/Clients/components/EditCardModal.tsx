import React, { useState, useRef } from "react";
import { X, Upload, Paperclip } from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { OutputCardDTO } from "../../../types/card";
import { AttachmentDTO } from "../../../types/card";
// Temporariamente removido até implementar com as novas stores
import { useToast } from "../../../hooks/useToast";
import { useTeamMembersStore } from "../../../store/teamMembersStore";

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: OutputCardDTO;
  boardId: string;
  listId: string;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  onClose,
  card,
  boardId,
  listId,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  // Temporariamente removido até implementar com as novas stores
  const updateCard = () => {
    showToast(
      "Funcionalidade de atualizar cartão não disponível no momento.",
      "info"
    );
  };
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [value, setValue] = useState(card.value?.toString() || "");
  const [phone, setPhone] = useState(card.phone || "");
  const [assigneeId, setAssigneeId] = useState(card.assignee_id || "");
  const [attachments, setAttachments] = useState<AttachmentDTO[]>(
    card.attachments || []
  );
  const { members } = useTeamMembersStore();
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    for (const file of files) {
      if (file.size > maxSize) {
        showToast(`O arquivo ${file.name} excede o limite de 10MB`, "error");
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        showToast(`O tipo de arquivo ${file.name} não é permitido`, "error");
        continue;
      }
      try {
        const url = URL.createObjectURL(file);
        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            file_name: file.name,
            file_url: url,
            fileType: file.type,
            fileSize: file.size,
            card_id: card.id,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        showToast(`Erro ao fazer upload do arquivo ${file.name}`, "error");
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("O título é obrigatório", "error");
      return;
    }
    if (!assigneeId) {
      showToast("O responsável é obrigatório", "error");
      return;
    }
    const updatedCard = {
      ...card,
      title: title.trim(),
      description: description.trim(),
      value: value ? parseFloat(value) : undefined,
      phone: phone.trim(),
      attachments,
      assignee_id: assigneeId,
      updatedAt: new Date().toISOString(),
    };
    showToast("Cartão atualizado com sucesso!", "success");
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center !mt-0">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-2xl p-6 rounded-lg shadow-xl ${
          isDark ? "bg-dark-900" : "bg-white"
        } max-h-[90vh] overflow-y-auto`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className={`block text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              } mb-1`}
            >
              Título
            </label>
            <input
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
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                isDark
                  ? "bg-dark-800 text-gray-100 border-gray-600"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                } mb-1`}
              >
                Valor
              </label>
              <input
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
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                } mb-1`}
              >
                Telefone
              </label>
              <input
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

          <div>
            <label
              className={`block text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              } mb-1`}
            >
              Responsável
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f00ff] border ${
                isDark
                  ? "bg-dark-800 text-gray-100 border-gray-600"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
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
            <div className="flex items-center justify-between mb-2">
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Anexos
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#7f00ff] hover:bg-[#7f00ff]/10 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Adicionar Anexo
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
                    isDark ? "bg-dark-800" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span
                      className={`text-sm ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {attachment.file_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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
  );
};
