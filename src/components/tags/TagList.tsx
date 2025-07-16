import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useTagStore } from "../../store/tagStore";
import { useAuthStore } from "../../store/authStore";
import { tagService } from "../../services/tag/tag.service";
import {
  InputCreateTagDTO,
  InputUpdateTagDTO,
  OutputTagDTO,
} from "../../types/tag";
import { TagModal } from "./TagModal";

type Tag = OutputTagDTO;

export function TagList() {
  const { tags, fetchAllTags } = useTagStore();
  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
  }));

  const isLoading = useTagStore((state) => state.isLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  useEffect(() => {
    if (token && organizationId) {
      fetchAllTags(token, organizationId);
    }
  }, [token, organizationId, fetchAllTags]);

  const handleSave = async (tagData: { name: string; color: string }) => {
    if (!token || !organizationId) {
      toast.error("Autenticação inválida.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTag) {
        const dto: InputUpdateTagDTO = tagData;
        const updatedTag = await tagService.update(
          token,
          organizationId,
          editingTag.id,
          dto
        );
        toast.success("Marcador atualizado com sucesso!");
      } else {
        const dto: InputCreateTagDTO = tagData;
        const newTag = await tagService.create(token, organizationId, dto);
        toast.success("Marcador criado com sucesso!");
      }
      setShowModal(false);
      setEditingTag(null);
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao salvar o marcador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!token || !organizationId) {
      toast.error("Autenticação inválida.");
      return;
    }

    setDeletingTagId(tagId);
    try {
      await tagService.delete(token, organizationId, tagId);
      toast.success("Marcador apagado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Falha ao apagar o marcador.");
    } finally {
      setDeletingTagId(null);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setShowModal(true);
  };

  // 5. Renderização do Componente
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setEditingTag(null);
            setShowModal(true);
          }}
          className="text-[#7f00ff] hover:text-[#7f00ff]/80 flex items-center text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-gray-500">A carregar marcadores...</p>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {tag.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(tag)}
                  className="text-gray-400 hover:text-[#7f00ff]"
                  disabled={deletingTagId === tag.id}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="text-gray-400 hover:text-red-500"
                  disabled={deletingTagId === tag.id}
                >
                  {deletingTagId === tag.id ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TagModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingTag(null);
          }}
          onSave={handleSave}
          tag={editingTag || undefined}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
