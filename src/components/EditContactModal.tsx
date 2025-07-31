import React, { useState, useEffect } from "react";
import { X, User, Phone } from "lucide-react";
import { WhatsappContact } from "../types/whatsapp";
import { whatsappContactService } from "../services/whatsapp/whatsappContact.service";
import { useToast } from "../hooks/useToast";
import { useAuthStore } from "../store/authStore";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: WhatsappContact | null;
  instanceId: string;
  onUpdate: (contact: WhatsappContact) => void;
  onCreate?: (contact: WhatsappContact) => void;
}

export function EditContactModal({
  isOpen,
  onClose,
  contact,
  instanceId,
  onUpdate,
  onCreate,
}: EditContactModalProps) {
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        phone: contact.phone,
      });
    } else {
      setFormData({ name: "", phone: "" });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.organization_id) {
      showToast("Erro de autenticação", "error");
      return;
    }
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast("Preencha todos os campos", "error");
      return;
    }
    setIsLoading(true);
    try {
      if (contact) {
        // Atualizar contato existente
        const updatedContact = await whatsappContactService.update(
          token,
          user.organization_id,
          instanceId,
          contact.id,
          {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
          }
        );
        onUpdate(updatedContact);
        showToast("Contato atualizado com sucesso!", "success");
      } else {
        // Criar novo contato
        const newContact = await whatsappContactService.create(
          token,
          user.organization_id,
          instanceId,
          {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
          }
        );
        if (onCreate) onCreate(newContact);
        showToast("Contato criado com sucesso!", "success");
      }
      onClose();
    } catch (error: any) {
      showToast(error.message || "Erro ao salvar contato", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {contact ? "Editar Contato" : "Novo Contato"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-dark-700 dark:text-white"
                placeholder="Nome do contato"
                disabled={isLoading}
              />
              <User className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefone
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  // Permitir apenas números
                  let value = e.target.value.replace(/\D/g, "");
                  // Limitar a 14 dígitos (ex: 5511999999999)
                  if (value.length > 14) value = value.slice(0, 14);
                  setFormData({ ...formData, phone: value });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-dark-700 dark:text-white"
                placeholder="Ex: 5511999999999"
                disabled={isLoading}
              />
              <Phone className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Formato: DDI + DDD + número. Ex: 5511999999999
            </span>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {contact ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
