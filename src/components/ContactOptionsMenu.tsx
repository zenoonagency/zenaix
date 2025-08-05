import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2, X, Pin } from "lucide-react";
import { WhatsappContact } from "../types/whatsapp";
import { whatsappContactService } from "../services/whatsapp/whatsappContact.service";
import { whatsappMessageService } from "../services/whatsapp/whatsappMessage.service";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../store/authStore";
import { useWhatsappContactStore } from "../store/whatsapp/whatsappContactStore";

interface ContactOptionsMenuProps {
  contact: WhatsappContact;
  instanceId: string;
  onEdit: (contact: WhatsappContact) => void;
  onDelete: (contactId: string) => void;
  onDeleteClick: (contact: WhatsappContact) => void;
  isOpen: boolean;
  onToggle: () => void;
  position: { top: number; left: number };
}

export function ContactOptionsMenu({
  contact,
  instanceId,
  onEdit,
  onDelete,
  onDeleteClick,
  isOpen,
  onToggle,
  position,
}: ContactOptionsMenuProps) {
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const { updateContactInStore } = useWhatsappContactStore();
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleEdit = () => {
    onEdit(contact);
    onToggle();
  };

  const handlePinContact = async () => {
    if (!token || !user?.organization_id) {
      showToast("Erro de autenticação", "error");
      return;
    }

    setIsLoading(true);
    try {
      await whatsappMessageService.pinConversation(
        token,
        user.organization_id,
        instanceId,
        contact.id,
        {
          contact: contact.phone,
          pin: !contact.is_pinned,
        }
      );

      updateContactInStore(instanceId, contact.id, {
        is_pinned: !contact.is_pinned,
      });


      onToggle();
    } catch (error: any) {
      console.error("Erro ao fixar/desafixar contato:", error);
      showToast(error.message || "Erro ao fixar/desafixar contato", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    onDeleteClick(contact);
    onToggle();
  };

  if (!isOpen || !contact) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        onClick={handlePinContact}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        disabled={isLoading}
      >
        <Pin className="w-4 h-4" />
        {isLoading
          ? "Processando..."
          : contact.is_pinned
          ? "Desfixar contato"
          : "Fixar contato"}
      </button>

      <button
        onClick={handleEdit}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        disabled={isLoading}
      >
        <Edit2 className="w-4 h-4" />
        Editar
      </button>

      <button
        onClick={handleDeleteClick}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        disabled={isLoading}
      >
        <Trash2 className="w-4 h-4" />
        Excluir
      </button>
    </div>
  );
}
