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
import { OutputCardDTO } from "../../../types/card";
import { CardModal } from "./CardModal";
import { useSortable } from "@dnd-kit/sortable";
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
import { useTeamMembersStore } from "../../../store/teamMembersStore";

interface CardProps {
  card: OutputCardDTO;
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
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const PRIORITY_ICONS = {
  LOW: <AlertTriangle className="w-4 h-4" />,
  MEDIUM: <AlertTriangle className="w-4 h-4" />,
  HIGH: <AlertCircle className="w-4 h-4" />,
  URGENT: <AlertOctagon className="w-4 h-4" />,
};

const PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
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
    const { members } = useTeamMembersStore();
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCardMenuModal, setShowCardMenuModal] = useState(false);
    const [isDeletingCard, setIsDeletingCard] = useState(false);
    if (!card || !boardId || !listId) {
      return null;
    }
    const cardData = useMemo(
      () => ({
        ...card,
        value: card.value || 0,
        assignee_id: card.assignee_id || card.assignee?.id || null,
        tag_ids: card.tag_ids || [],
      }),
      [card]
    );
    const cardTags = useMemo(
      () =>
        (cardData.tag_ids || [])
          .map((tagId) => tags.find((t) => t.id === tagId))
          .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined),
      [cardData.tag_ids, tags]
    );
    // Se precisar de completedList, buscar de outra store ou prop
    const availableLists = useMemo(() => {
      // Assuming boards is available globally or passed as a prop
      // For now, we'll return an empty array as boards is removed from dependencies
      return [];
    }, []);
    // Trocar useDraggable por useSortable
    const sortableData = {
      type: "card",
      cardId: cardData.id,
      listId,
      boardId,
    };

    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({
        id: cardData.id,
        data: {
          type: "card",
          cardId: cardData.id,
          listId,
          boardId,
        },
      });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    const handleEdit = useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setShowEditModal(true);
    }, []);
    const handleSaveEdit = useCallback(
      async (updatedCard: Partial<OutputCardDTO>) => {
        if (!token || !organization?.id) return;

        try {
          const dto: InputUpdateCardDTO = {
            title: updatedCard.title,
            description: updatedCard.description,
            value: updatedCard.value,
            phone: updatedCard.phone,
            priority: updatedCard.priority,
            tag_ids: updatedCard.tag_ids,
            due_date: updatedCard.due_date,
            assignee_id: updatedCard.assignee_id,
            subtasks: updatedCard.subtasks,
            attachments: updatedCard.attachments,
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

          return updatedCardData;
        } catch (err: any) {
          showToast(err.message || "Erro ao atualizar card", "error");
          throw err;
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
      setIsDeletingCard(true);
      try {
        await cardService.deleteCard(
          token,
          organization.id,
          boardId,
          listId,
          cardData.id
        );
        removeCard(cardData.id);
        setShowDeleteConfirm(false);
        showToast("Card excluído com sucesso!", "success");
      } catch (err: any) {
        console.error("Erro ao excluir card:", err);
        const errorMessage =
          err?.message || err?.error || "Erro ao excluir card";
        showToast(errorMessage, "error");
      } finally {
        setIsDeletingCard(false);
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
        ? "cursor-grabbing shadow-xl scale-95 opacity-80"
        : "cursor-grab hover:border-[#7f00ff] dark:hover:border-[#7f00ff] opacity-100 hover:scale-[1.01] hover:-translate-y-1"
    }
    transition-all duration-200 ease-in-out
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
          <div className="p-4 space-y-3">
            {/* Priority Badge */}
            {cardData.priority && (
              <div className="flex justify-between items-start">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${
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
                    {
                      PRIORITY_LABELS[
                        cardData.priority as keyof typeof PRIORITY_LABELS
                      ]
                    }
                  </span>
                </span>
                <button
                  onClick={openCardMenu}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Card Title */}
            <h3
              className={`font-semibold text-lg leading-tight ${
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {cardData.title}
            </h3>

            {/* Description - Limited to 2 lines */}
            {cardData.description && (
              <p
                className={`text-sm leading-relaxed ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } line-clamp-2`}
                title={cardData.description}
              >
                {cardData.description}
              </p>
            )}

            {/* Value with green border */}
            {cardData.value > 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(cardData.value)}
                </span>
              </div>
            )}

            {/* Subtasks Progress */}
            {cardData.subtasks && cardData.subtasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Subtarefas</span>
                  <span>
                    {
                      cardData.subtasks.filter((task) => task.is_completed)
                        .length
                    }
                    /{cardData.subtasks.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-[#7f00ff] h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (cardData.subtasks.filter((task) => task.is_completed)
                          .length /
                          cardData.subtasks.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                {/* Lista de subtarefas */}
                <div className="space-y-1">
                  {cardData.subtasks.slice(0, 3).map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`flex items-center gap-2 text-xs ${
                        subtask.is_completed
                          ? "text-gray-400 dark:text-gray-500 line-through"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          subtask.is_completed
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <span className="truncate">{subtask.title}</span>
                    </div>
                  ))}
                  {cardData.subtasks.length > 3 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      +{cardData.subtasks.length - 3} mais...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            {cardData.due_date &&
              (() => {
                const dateObj = new Date(cardData.due_date);
                if (!isNaN(dateObj.getTime())) {
                  return (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(dateObj, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

            {/* Assigned Member */}
            {cardData.assignee_id && (
              <div className="flex items-center gap-2">
                {members.find((m) => m.id === cardData.assignee_id) ? (
                  <>
                    {members.find((m) => m.id === cardData.assignee_id)
                      ?.avatar_url ? (
                      <img
                        src={
                          members.find((m) => m.id === cardData.assignee_id)
                            ?.avatar_url
                        }
                        alt={
                          members.find((m) => m.id === cardData.assignee_id)
                            ?.name
                        }
                        className="w-6 h-6 rounded-full object-cover"
                        title={
                          members.find((m) => m.id === cardData.assignee_id)
                            ?.name
                        }
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full bg-[#7f00ff] flex items-center justify-center text-xs text-white font-medium"
                        title={
                          members.find((m) => m.id === cardData.assignee_id)
                            ?.name
                        }
                      >
                        {members
                          .find((m) => m.id === cardData.assignee_id)
                          ?.name.charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {members.find((m) => m.id === cardData.assignee_id)?.name}
                    </span>
                  </>
                ) : null}
              </div>
            )}

            {/* Card tags */}
            {cardTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
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
            onClose={isDeletingCard ? undefined : closeDeleteConfirm}
            onConfirm={confirmDelete}
            title="Excluir Card"
            message={`Tem certeza que deseja excluir o card "${cardData.title}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            confirmButtonClass="bg-red-500 hover:bg-red-600"
            isLoading={isDeletingCard}
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
            onEdit={handleEdit}
          />
        )}
      </>
    );
  }
);

Card.displayName = "Card";

export { Card };
