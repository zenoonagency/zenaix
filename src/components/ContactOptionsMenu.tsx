import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { WhatsappContact } from '../types/whatsapp';
import { whatsappContactService } from '../services/whatsapp/whatsappContact.service';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';

interface ContactOptionsMenuProps {
  contact: WhatsappContact;
  instanceId: string;
  onEdit: (contact: WhatsappContact) => void;
  onDelete: (contactId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  position: { top: number; left: number };
}

export function ContactOptionsMenu({
  contact,
  instanceId,
  onEdit,
  onDelete,
  isOpen,
  onToggle,
  position
}: ContactOptionsMenuProps) {
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleEdit = () => {
    onEdit(contact);
    onToggle();
  };

  const handleDelete = async () => {
    if (!token || !user?.organization_id) {
      showToast('Erro de autenticação', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o contato "${contact.name}"?`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await whatsappContactService.delete(token, user.organization_id, instanceId, contact.id);
      onDelete(contact.id);
      showToast('Contato excluído com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
      showToast(error.message || 'Erro ao excluir contato', 'error');
    } finally {
      setIsLoading(false);
      onToggle();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        onClick={handleEdit}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        disabled={isLoading}
      >
        <Edit2 className="w-4 h-4" />
        Editar
      </button>
      
      <button
        onClick={handleDelete}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        disabled={isLoading}
      >
        <Trash2 className="w-4 h-4" />
        {isLoading ? 'Excluindo...' : 'Excluir'}
      </button>
    </div>
  );
} 