import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { userService } from "../../services/user/user.service";
import { useToast } from "../../hooks/useToast";
import { imageService } from "../../services/imageService";
import { LANGUAGE_OPTIONS } from "../../contexts/LocalizationContext";
import { TIMEZONE_OPTIONS } from "../../utils/dateUtils";
import { compressImage } from "../../utils/imageCompression";
import { Eye, EyeOff } from "lucide-react";

export function ProfileTab() {
  const { user, token, updateUser, logout } = useAuthStore();
  const { showToast } = useToast();
  const organization = user?.organization;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    language: user?.language || "pt-BR",
    timezone: user?.timezone || "America/Sao_Paulo",
  });

  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        language: user.language || "pt-BR",
        timezone: user.timezone || "America/Sao_Paulo",
      });
      setPreviewUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione apenas ficheiros de imagem", "error");
      return;
    }

    setIsLoadingAvatar(true);
    try {
      if (!token) throw new Error("Utilizador não autenticado.");

      const result = await compressImage(file, { maxSizeKB: 300 });

      if (!result.success || !result.file) {
        showToast(result.error || "Erro ao processar imagem", "error");
        setIsLoadingAvatar(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(result.file);

      const updatedUserFromApi = await userService.updateAvatar(
        token,
        result.file
      );
      updateUser(updatedUserFromApi);

      if (
        result.compressedSize &&
        result.compressedSize < result.originalSize
      ) {
        showToast("Imagem processada com sucesso!", "success");
      }
      showToast("Avatar atualizado com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao atualizar avatar. Tente novamente.", "error");
      setPreviewUrl(user?.avatar_url || "");
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsLoadingAvatar(true);
    try {
      if (!token) throw new Error("Utilizador não autenticado.");
      await userService.removeAvatar(token);

      updateUser({ avatar_url: "" });
      setPreviewUrl("");

      showToast("Avatar removido com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao remover avatar. Tente novamente.", "error");
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name } = formData;
    if (!name.trim()) {
      showToast("O nome é obrigatório", "error");
      return;
    }
    if (!user?.id || !token) {
      showToast("Sessão inválida. Por favor, faça login novamente.", "error");
      return;
    }

    setIsLoading(true);
    try {
      console.log(user.id);
      const updatedUserFromApi = await userService.updateUser(token, user.id, {
        name: name.trim(),
        language: formData.language,
        timezone: formData.timezone,
      });

      updateUser(updatedUserFromApi);

      showToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao atualizar perfil.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast("Informe sua senha para deletar a conta.", "error");
      return;
    }
    if (!token) {
      showToast("Sessão inválida.", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await userService.deleteAccount(token, deletePassword);
      logout();

      window.location.href = "/login";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao deletar conta. Verifique sua senha.";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-6">
        {/* Conteúdo do formulário de perfil do usuário */}
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Preview */}
          <div className="relative w-24 h-24 mb-2">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl text-gray-400 border-2 border-gray-200 shadow-sm">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            {isLoadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7f00ff]"></div>
              </div>
            )}
          </div>
          {/* Nome do arquivo */}
          {previewUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">Avatar atual</p>
              <p className="text-xs text-gray-500 mt-1">Imagem carregada</p>
            </div>
          )}
          {/* Botões de upload e remoção */}
          <div className="flex gap-2 w-full justify-center">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isLoadingAvatar}
                className="hidden"
              />
              <div className="w-full bg-gradient-to-r from-[#7f00ff] to-[#7f00ff]/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium text-center cursor-pointer hover:from-[#7f00ff]/90 hover:to-[#7f00ff]/80 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {isLoadingAvatar ? "Carregando..." : "Escolher"}
              </div>
            </label>
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isLoadingAvatar}
              className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Remover
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-2 font-medium text-gray-700">Nome</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7f00ff]/20 focus:border-[#7f00ff] transition-all duration-200 bg-white shadow-sm"
            disabled={isLoading}
            placeholder="Digite seu nome completo"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Linguagem
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7f00ff]/20 focus:border-[#7f00ff] transition-all duration-200 bg-white shadow-sm cursor-pointer"
            disabled={isLoading}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Timezone
          </label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7f00ff]/20 focus:border-[#7f00ff] transition-all duration-200 bg-white shadow-sm cursor-pointer"
            disabled={isLoading}
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-[#7f00ff] to-[#7f00ff]/90 text-white px-6 py-3 rounded-lg font-medium hover:from-[#7f00ff]/90 hover:to-[#7f00ff]/80 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Salvar alterações
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline transition-colors duration-200 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Deletar conta
        </button>
      </form>
      {/* Modal de confirmação para deletar conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative">
            {/* Botão de fechar (X) */}
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label="Fechar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Deletar conta
                </h2>
                <p className="text-sm text-gray-600">
                  Esta ação é irreversível
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ Atenção
              </p>
              <p className="text-sm text-red-700">
                Ao deletar sua conta, todos os seus dados serão permanentemente
                removidos, incluindo:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Perfil e configurações</li>
                <li>• Dados de clientes e projetos</li>
                <li>• Histórico de atividades</li>
                <li>• Arquivos e documentos</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7f00ff]/20 focus:border-[#7f00ff] transition-all duration-200 bg-white shadow-sm pr-12"
                  disabled={isDeleting}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => setShowDeletePassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showDeletePassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deletando...
                  </>
                ) : (
                  <>Confirmar exclusão</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
