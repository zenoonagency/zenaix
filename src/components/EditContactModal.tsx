import React, { useState, useEffect } from 'react';
import { X, User, Phone } from 'lucide-react';
import { WhatsappContact } from '../types/whatsapp';
import { whatsappContactService } from '../services/whatsapp/whatsappContact.service';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: WhatsappContact | null;
  instanceId: string;
  onUpdate: (contact: WhatsappContact) => void;
}

export function EditContactModal({
  isOpen,
  onClose,
  contact,
  instanceId,
  onUpdate
}: EditContactModalProps) {
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        phone: contact.phone
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !user?.organization_id || !contact) {
      showToast('Erro de autenticação', 'error');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const updatedContact = await whatsappContactService.update(
        token,
        user.organization_id,
        instanceId,
        contact.id,
        {
          name: formData.name.trim(),
          phone: formData.phone.trim()
        }
      );
      
      onUpdate(updatedContact);
      showToast('Contato atualizado com sucesso!', 'success');
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      showToast(error.message || 'Erro ao atualizar contato', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Editar Contato
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                placeholder="Nome do contato"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                placeholder="Número de telefone"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-md hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 