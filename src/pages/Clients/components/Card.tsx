import React, { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tag as TagIcon,
  DollarSign,
  Calendar,
  CheckSquare,
  MoreVertical,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
} from "lucide-react";
import { useTagStore } from "../../../store/tagStore";
import { useThemeStore } from "../../../store/themeStore";
import { Card as CardType } from "../../types/card";
import { CardModal } from "./CardModal";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { useToast } from "../../../hooks/useToast";
import { CardDetailModal } from "./CardDetailModal";
import { CardMenuModal } from "./CardMenuModal";
import { useInviteStore } from "../../../store/inviteStore";
import { useCardStore } from "../../../store/cardStore";
import { cardService } from "../../../services/card.service";
import { useAuthStore } from "../../../store/authStore";
import { InputUpdateCardDTO } from "../../../types/card";

interface CardProps {
  card: CardType;
  boardId: string;
  listId: string;
  isDragging?: boolean;
  className?: string;
}

interface TeamMember {
  id: string;
  name: string;
}

interface MoveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetListId: string) => void;
  lists: { id: string; title: string }[];
  currentListId: string;
}

// Constantes movidas para fora do componente para evitar recriações
const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const PRIORITY_ICONS = {
  low: <AlertTriangle className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  high: <AlertCircle className="w-4 h-4" />,
  urgent: <AlertOctagon className="w-4 h-4" />,
};

// Componente MoveCardModal memoizado para evitar re-renders desnecessários
const MoveCardModal = React.memo(
  ({ isOpen, onClose, onMove, lists, currentListId }: MoveCardModalProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
            isDark ? "bg-[#1e1f25] text-gray-100" : "bg-white text-gray-900"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Mover para Lista</h3>
          <div className="space-y-2">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => {
                  onMove(list.id);
                  onClose();
                }}
                disabled={list.id === currentListId}
                className={`
                w-full px-4 py-2 rounded-lg text-left transition-colors
                ${
                  list.id === currentListId
                    ? "bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200"
                }
              `}
              >
                {list.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

MoveCardModal.displayName = "MoveCardModal";

const Card = React.memo(
  ({ card, boardId, listId, isDragging, className }: CardProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";
    const tagStore = useTagStore();
    const teamStore = useInviteStore();
    const { updateCard, removeCard } = useCardStore();
    const { token, organization } = useAuthStore();
    const tags = tagStore?.tags || [];
    const members = teamStore?.members || [];
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCardMenuModal, setShowCardMenuModal] = useState(false);
    if (!card || !boardId || !listId) {
      return null;
    }
    const cardData = useMemo(
      () => ({
        ...card,
        value: card.value || 0,
        assignedTo: card.assignedTo || [],
        tagIds: card.tagIds || [],
      }),
      [card]
    );
    const cardTags = useMemo(
      () =>
        (cardData.tagIds || [])
          .map((tagId) => tags.find((t) => t.id === tagId))
          .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined),
      [cardData.tagIds, tags]
    );
    // Se precisar de completedList, buscar de outra store ou prop
    const availableLists = useMemo(() => {
      // Assuming boards is available globally or passed as a prop
      // For now, we'll return an empty array as boards is removed from dependencies
      return [];
    }, []);
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: cardData.id,
      data: {
        type: "card",
        cardId: cardData.id,
        listId,
        boardId,
      },
    });
    const style = transform
      ? {
          transform: CSS.Transform.toString(transform),
        }
      : undefined;
    const handleEdit = useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setShowEditModal(true);
    }, []);
    const handleSaveEdit = useCallback(
      async (updatedCard: Partial<CardType>) => {
        if (!token || !organization?.id) return;

        try {
          const dto: InputUpdateCardDTO = {
            title: updatedCard.title,
            description: updatedCard.description,
            value: updatedCard.value,
            phone: updatedCard.phone,
            priority: updatedCard.priority,
            tagIds: updatedCard.tagIds,
            dueDate: updatedCard.dueDate,
            responsibleId: updatedCard.responsibleId,
            customFields: updatedCard.customFields,
            subtasks: updatedCard.subtasks,
          };

          const updatedCardData = await cardService.updateCard(
            token,
            organization.id,
            boardId,
            listId,
            cardData.id,
            dto
          );

          // Atualizar na cardStore
          updateCard(updatedCardData);

          setShowEditModal(false);
          showToast("Card atualizado com sucesso!", "success");
        } catch (err: any) {
          showToast(err.message || "Erro ao atualizar card", "error");
        }
      },
      [
        token,
        organization?.id,
        boardId,
        listId,
        cardData.id,
        updateCard,
        showToast,
      ]
    );
    const handleDelete = useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setShowDeleteConfirm(true);
    }, []);
    const confirmDelete = useCallback(async () => {
      if (!token || !organization?.id) return;

      try {
        await cardService.deleteCard(
          token,
          organization.id,
          boardId,
          listId,
          cardData.id
        );

        // Remover da cardStore
        removeCard(cardData.id);

        setShowDeleteConfirm(false);
        showToast("Card excluído com sucesso!", "success");
      } catch (err: any) {
        showToast(err.message || "Erro ao excluir card", "error");
      }
    }, [
      token,
      organization?.id,
      boardId,
      listId,
      cardData.id,
      removeCard,
      showToast,
    ]);
    const handleDuplicate = useCallback(
      (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        // duplicateCard(boardId, listId, cardData.id); // Removed as per edit hint
        showToast("Card duplicado com sucesso!", "success");
      },
      [
        /* duplicateCard, boardId, listId, cardData.id, showToast */
      ]
    );
    const handleMove = useCallback(
      (targetListId: string) => {
        // moveCard(boardId, listId, targetListId, cardData.id); // Removed as per edit hint
        setShowMoveModal(false);
      },
      [
        /* moveCard, boardId, listId, cardData.id */
      ]
    );
    const openCardMenu = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowCardMenuModal(true);
    }, []);
    const openDetailModal = useCallback(() => {
      setShowDetailModal(true);
    }, []);
    const closeDetailModal = useCallback(() => {
      setShowDetailModal(false);
    }, []);
    const closeMoveModal = useCallback(() => {
      setShowMoveModal(false);
    }, []);
    const closeMenuModal = useCallback(() => {
      setShowCardMenuModal(false);
    }, []);
    const closeDeleteConfirm = useCallback(() => {
      setShowDeleteConfirm(false);
    }, []);
    const closeEditModal = useCallback(() => {
      setShowEditModal(false);
    }, []);
    const openMoveModal = useCallback(() => {
      setShowMoveModal(true);
      setShowCardMenuModal(false);
    }, []);
    const cardClassName = useMemo(
      () => `
    relative group bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
    ${
      isDragging
        ? "cursor-grabbing opacity-50"
        : "cursor-grab hover:border-[#7f00ff] dark:hover:border-[#7f00ff] opacity-100"
    }
    ${className || ""}
  `,
      [isDragging, className]
    );

    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          onClick={openDetailModal}
          className={cardClassName}
        >
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {/* isCompletedList && ( // Removed as per edit hint
                  <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) */}
                <h3
                  className={`font-medium ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {cardData.title}
                </h3>
              </div>
              <div className="relative">
                <button
                  onClick={openCardMenu}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Card tags */}
            {cardTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cardTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 text-xs rounded-full"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Card metadata */}
            <div className="space-y-2">
              {/* Deadline if exists */}
              {cardData.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(cardData.dueDate), "dd MMM yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              {/* Value if exists */}
              {cardData.value > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(cardData.value)}
                  </span>
                </div>
              )}

              {/* Priority if exists */}
              {cardData.priority && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                      PRIORITY_COLORS[
                        cardData.priority as keyof typeof PRIORITY_COLORS
                      ]
                    }`}
                  >
                    {
                      PRIORITY_ICONS[
                        cardData.priority as keyof typeof PRIORITY_ICONS
                      ]
                    }
                    <span>
                      {cardData.priority.charAt(0).toUpperCase() +
                        cardData.priority.slice(1)}
                    </span>
                  </span>
                </div>
              )}

              {/* Assigned team members if any */}
              {cardData.assignedTo && cardData.assignedTo.length > 0 && (
                <div className="flex -space-x-1 overflow-hidden">
                  {cardData.assignedTo.slice(0, 3).map((userId) => {
                    const member = members.find((m) => m.id === userId);
                    return member ? (
                      <div
                        key={member.id}
                        className="w-6 h-6 rounded-full bg-[#7f00ff] flex items-center justify-center text-xs text-white"
                        title={member.name}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ) : null;
                  })}
                  {cardData.assignedTo.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs">
                      +{cardData.assignedTo.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Move card modal */}
        <MoveCardModal
          isOpen={showMoveModal}
          onClose={closeMoveModal}
          onMove={handleMove}
          lists={availableLists}
          currentListId={listId}
        />

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={closeDeleteConfirm}
            onConfirm={confirmDelete}
            title="Excluir Card"
            message={`Tem certeza que deseja excluir o card "${cardData.title}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            confirmButtonStyle="danger"
          />
        )}

        {/* Card menu modal */}
        <CardMenuModal
          isOpen={showCardMenuModal}
          onClose={closeMenuModal}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onMove={openMoveModal}
          onDelete={handleDelete}
        />

        {/* Card edit modal */}
        {showEditModal && (
          <CardModal
            isOpen={showEditModal}
            onClose={closeEditModal}
            onSave={handleSaveEdit}
            initialData={cardData}
            boardId={boardId}
            listId={listId}
            mode="edit"
          />
        )}

        {/* Card detail modal */}
        {showDetailModal && (
          <CardDetailModal
            isOpen={showDetailModal}
            onClose={closeDetailModal}
            card={cardData}
            boardId={boardId}
            listId={listId}
          />
        )}
      </>
    );
  }
);

Card.displayName = "Card";

export { Card };
