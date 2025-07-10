import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/user/user.service';
import { toast } from 'react-toastify';
import { LANGUAGE_OPTIONS } from '../../contexts/LocalizationContext';
import { TIMEZONE_OPTIONS } from '../../utils/timezones';

export function ProfileTab() {
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    language: user?.language || 'pt-BR',
    timezone: user?.timezone || 'America/Sao_Paulo',
    photo: user?.avatarUrl || '',
  });
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Atualizar campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload de avatar
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024) {
        setImageError('O arquivo deve ter no máximo 300KB');
        toast.error('O arquivo deve ter no máximo 300KB', { autoClose: 5000 });
        return;
      } else {
        setImageError(null);
      }
      if (!file.type.startsWith('image/')) {
        setImageError('Por favor, selecione apenas arquivos de imagem');
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      } else {
        setImageError(null);
      }
      setIsLoadingAvatar(true);
      try {
        // Preview imediato
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPreviewUrl(base64String);
          setFormData((prev) => ({ ...prev, photo: base64String }));
        };
        reader.readAsDataURL(file);
        // Upload para API
        const updatedUser = await userService.updateAvatar(file);
        useAuthStore.getState().updateUser(updatedUser);
        if (updatedUser.avatarUrl) {
          setPreviewUrl(updatedUser.avatarUrl);
          setFormData((prev) => ({ ...prev, photo: updatedUser.avatarUrl }));
        }
        toast.success('Avatar atualizado com sucesso!');
      } catch (error) {
        toast.error('Erro ao atualizar avatar. Tente novamente.');
        setPreviewUrl(user?.avatarUrl || '');
        setFormData((prev) => ({ ...prev, photo: user?.avatarUrl || '' }));
      } finally {
        setIsLoadingAvatar(false);
      }
    }
  };

  // Remover avatar
  const handleRemovePhoto = async () => {
    setIsLoadingAvatar(true);
    try {
      await userService.removeAvatar();
      setPreviewUrl('');
      setFormData((prev) => ({ ...prev, photo: '' }));
      if (user) {
        useAuthStore.getState().updateUser({ ...user, avatarUrl: '' });
      }
      toast.success('Avatar removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover avatar. Tente novamente.');
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  // Atualizar dados do usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    if (!user?.id) {
      toast.error('Usuário não identificado');
      return;
    }
    setIsLoading(true);
    try {
      const updatedUser = await userService.updateUser(user.id, {
        name: formData.name.trim(),
        language: formData.language,
        timezone: formData.timezone,
      });
      useAuthStore.getState().updateUser(updatedUser);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar conta
  const handleDeleteAccount = async () => {

    console.log(  )

    if (!deletePassword) {
      toast.error('Informe sua senha para deletar a conta.');
      return;
    }
    setIsDeleting(true);
    await userService.deleteAccount(deletePassword);
    try {
      toast.success('Conta deletada com sucesso!');
      // Redirecionar para login ou página inicial
      window.location.href = '/login';
    } catch (error) {
      toast.error('Erro ao deletar conta. Verifique sua senha.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Preview */}
        <div className="relative w-24 h-24 mb-2">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl text-gray-400 border-2 border-gray-200 shadow-sm">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
            {/* fileName is no longer used here, so it's removed */}
            <p className="text-xs text-gray-500 mt-1">
              Imagem carregada
            </p>
          </div>
        )}

        {/* Botões de upload e remoção */}
        <div className="flex gap-3 w-full max-w-xs">
          {/* Botão de upload */}
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={isLoadingAvatar}
              className="hidden"
            />
            <div className="w-full bg-gradient-to-r from-[#7f00ff] to-[#7f00ff]/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium text-center cursor-pointer hover:from-[#7f00ff]/90 hover:to-[#7f00ff]/80 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isLoadingAvatar ? 'Carregando...' : 'Escolher'}
            </div>
          </label>

          {/* Botão de remoção */}
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isLoadingAvatar}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isLoadingAvatar ? 'Removendo...' : 'Remover'}
            </button>
          )}
        </div>

        {/* Mensagem de erro */}
        {imageError && (
          <div className="w-full max-w-xs bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{imageError}</p>
            </div>
          </div>
        )}
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
        <label className="block mb-2 font-medium text-gray-700">Linguagem</label>
        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7f00ff]/20 focus:border-[#7f00ff] transition-all duration-200 bg-white shadow-sm cursor-pointer"
          disabled={isLoading}
        >
          {LANGUAGE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-2 font-medium text-gray-700">Timezone</label>
        <select
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7f00ff]/20 focus:border-[#7f00ff] transition-all duration-200 bg-white shadow-sm cursor-pointer"
          disabled={isLoading}
        >
          {TIMEZONE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-between items-center pt-4">
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Deletar conta
        </button>
      </div>
      {/* Modal de confirmação para deletar conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Deletar conta</h2>
                <p className="text-sm text-gray-600">Esta ação é irreversível</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">⚠️ Atenção</p>
              <p className="text-sm text-red-700">
                Ao deletar sua conta, todos os seus dados serão permanentemente removidos, incluindo:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Perfil e configurações</li>
                <li>• Dados de clientes e projetos</li>
                <li>• Histórico de atividades</li>
                <li>• Arquivos e documentos</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite sua senha para confirmar:
              </label>
              <input
                type="password"
                placeholder="Sua senha atual"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deletando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Confirmar exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 