import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { userService } from "../../services/user/user.service";
import { useToast } from "../../hooks/useToast";
import { compressImage } from "../../utils/imageCompression";
import { User, Camera, Trash2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../../components/ui/Input";

export function ProfileTab() {
  const { user, token, updateUser, logout } = useAuthStore();
  const { showToast } = useToast();
  const organization = user?.organization;

  const [formData, setFormData] = useState({
    name: user?.name || "",
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
      });
      setPreviewUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsLoading(true);

    try {
      if (!token || !user?.id) throw new Error("Utilizador não autenticado.");

      const updatedUser = await userService.updateUser(token, user.id, {
        ...formData,
        language: user?.language || "pt-BR",
        timezone: user?.timezone || "America/Sao_Paulo",
      });

      updateUser(updatedUser);
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao atualizar perfil. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast("Digite sua senha para confirmar", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await userService.deleteAccount(token, deletePassword);
      showToast("Conta deletada com sucesso", "success");
      logout();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao deletar conta";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Seção de Informações Básicas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações Básicas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Atualize suas informações pessoais
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-700">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                {isLoadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto do Perfil
                </h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoadingAvatar}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Escolher
                  </button>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isLoadingAvatar}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Nome */}
            <div>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                label="Nome Completo"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            {/* Email (somente leitura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-gray-50 dark:bg-dark-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                O email não pode ser alterado por questões de segurança
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Seção de Deletar Conta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800"
      >
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Deletar Conta
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Ao deletar sua conta, todos os seus dados serão permanentemente
            removidos. Esta ação não pode ser desfeita.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar Conta
          </button>
        </div>
      </motion.div>

      {/* Modal de Confirmação */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmar Deletação
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Para confirmar a deletação da sua conta, digite sua senha:
            </p>

            <div className="relative mb-4">
              <Input
                type={showDeletePassword ? "text" : "password"}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                label="Senha"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deletando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
