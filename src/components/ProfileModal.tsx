import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Input } from "./ui/Input";
import { useAuthStore } from "../store/authStore";
import {
  Camera,
  X,
  Loader,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { userService } from "../services/user/user.service";
import { compressImage } from "../utils/imageCompression";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, token, updateUser } = useAuthStore();
  const { showToast } = useToast();

  const organization = user?.organization;

  const [formData, setFormData] = useState({
    name: "",
    photo: "",
    phoneNumber: "",
    email: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || "",
        photo: user.avatar_url || "",
        phoneNumber: user.phone_number || "",
        email: user.email || "",
      });
      setPreviewUrl(user.avatar_url || "");
    }
  }, [isOpen, user]);


  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Por favor, selecione apenas arquivos de imagem");
      showToast("Por favor, selecione apenas arquivos de imagem", "error");
      return;
    } else {
      setImageError(null);
    }

    setIsLoadingAvatar(true);
    try {
      if (!token) throw new Error("Utilizador não autenticado.");
      let fileToSend = file;
      const result = await compressImage(file, { maxSizeKB: 300 });

      if (!result.success || !result.file) {
        setImageError(result.error || "Erro ao processar imagem");
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
      updateUser({ avatar_url: updatedUserFromApi.avatar_url });

  
      showToast("Avatar atualizado com sucesso!", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar avatar.";
      showToast(message, "error");
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

      showToast("Avatar removido com sucesso!", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao remover avatar.";
      showToast(message, "error");
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("O nome é obrigatório", "error");
      return;
    }

    if (!user?.id || !token) {
      showToast("Sessão inválida. Por favor, faça login novamente.", "error");
      return;
    }

    setIsLoadingProfile(true);
    try {
      const updatedUserFromApi = await userService.updateUser(token, user.id, {
        name: formData.name.trim(),
      });

      console.log(updatedUserFromApi);

      updateUser(updatedUserFromApi);

      showToast("Perfil atualizado com sucesso!", "success");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar perfil.";
      showToast(message, "error");
    } finally {
      setIsLoadingProfile(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-700">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera size={32} />
                </div>
              )}
            </div>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isLoadingAvatar}
                className={`absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 ${
                  isLoadingAvatar ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoadingAvatar ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            )}
          </div>
          <div>
            <label
              htmlFor="photo-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 ${
                isLoadingAvatar ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoadingAvatar ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Camera size={16} className="mr-2" />
                  Alterar foto
                </>
              )}
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isLoadingAvatar}
                className="hidden"
              />
            </label>
            {imageError && (
              <div className="text-red-600 text-sm mt-1">{imageError}</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Seu nome"
            required
          />

          {/* Exibir o email como informação, não como campo editável */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">
              {formData.email}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              O email é sincronizado automaticamente com sua conta
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Plano atual:{" "}
              <span className="font-medium text-[#7f00ff]">{user?.plan}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoadingProfile}
            className={`px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 flex items-center ${
              isLoadingProfile ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoadingProfile ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
