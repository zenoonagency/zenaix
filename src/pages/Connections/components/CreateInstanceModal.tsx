import React, { useState } from 'react';
import { X, MessageCircle, Users, UserCheck, Check } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { whatsappInstanceService } from '../../../services/whatsappInstance.service';
import { InputCreateWhatsAppInstanceDTO } from '../../../types/whatsappInstance';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useTeamMembersStore } from '../../../store/teamMembersStore';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateInstanceModal({ isOpen, onClose, onSuccess }: CreateInstanceModalProps) {
  const { theme } = useThemeStore();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const { members } = useTeamMembersStore();
  const isDark = theme === 'dark';
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InputCreateWhatsAppInstanceDTO>({
    name: '',
    access_level: 'TEAM_WIDE',
    member_ids: []
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !user?.organization_id) {
      showToast('Erro de autenticação', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Nome da instância é obrigatório', 'error');
      return;
    }

    if (formData.access_level === 'SELECTED_MEMBERS' && selectedMembers.length === 0) {
      showToast('Selecione pelo menos um membro', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const dataToSend = {
        ...formData,
        member_ids: formData.access_level === 'SELECTED_MEMBERS' ? selectedMembers : []
      };
      await whatsappInstanceService.create(token, user.organization_id, dataToSend);
      showToast('Instância criada com sucesso!', 'success');
      onSuccess();
      onClose();
      setFormData({ name: '', access_level: 'TEAM_WIDE', member_ids: [] });
      setSelectedMembers([]);
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      
      const errorMessage = error?.message || 'Erro ao criar instância';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof InputCreateWhatsAppInstanceDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'access_level' && value !== 'SELECTED_MEMBERS') {
      setSelectedMembers([]);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 !mt-0">
      <div className={`w-full max-w-md p-6 rounded-xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7f00ff]/10 rounded-lg">
              <MessageCircle className="w-5 h-5 text-[#7f00ff]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Nova Instância WhatsApp
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Instância
            </label>
            <Input
              type="text"
              placeholder="Ex: WhatsApp Vendas"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nível de Acesso
            </label>
            <Select
              value={formData.access_level}
              onChange={(e) => handleInputChange('access_level', e.target.value)}
            >
              <option value="TEAM_WIDE">Todos os membros</option>
              <option value="SELECTED_MEMBERS">Membros selecionados</option>
              <option value="CREATOR_ONLY">Apenas criador</option>
            </Select>
          </div>

          {formData.access_level === 'SELECTED_MEMBERS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecionar Membros ({selectedMembers.length} selecionado{selectedMembers.length !== 1 ? 's' : ''})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {members.filter(member => member.role !== 'MASTER').length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhum membro encontrado
                  </p>
                ) : (
                  members
                    .filter(member => member.role !== 'MASTER')
                    .map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleMemberToggle(member.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedMembers.includes(member.id)
                            ? 'bg-[#7f00ff]/10 border border-[#7f00ff]/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedMembers.includes(member.id)
                            ? 'bg-[#7f00ff] border-[#7f00ff]'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedMembers.includes(member.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Próximos passos
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Após a criação, você receberá um QR Code para conectar o WhatsApp
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando...' : 'Criar Instância'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 