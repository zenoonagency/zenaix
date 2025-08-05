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
  Phone,
  User,
  Paperclip,
} from "lucide-react";
import { useTagStore } from "../../../store/tagStore";
import { useThemeStore } from "../../../store/themeStore";
import { OutputCardDTO } from "../../../types/card";
import { CardModal } from "./CardModal";
import { MoveCardModal } from "./MoveCardModal";
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
import { useBoardStore } from "../../../store/boardStore";

interface CardProps {
  card: OutputCardDTO;
  boardId: string;
  listId: string;
  isDragging?: boolean;
  className?: string;
  isLoading?: boolean;
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

const Card = React.memo(
  ({ card, boardId, listId, isDragging, className, isLoading }: CardProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";
    const tagStore = useTagStore();
    const teamStore = useInviteStore();
    const { updateCard, removeCard } = useCardStore();
    const { token, organization, hasPermission } = useAuthStore();
    const { activeBoard, boards } = useBoardStore();
    const tags = tagStore?.tags || [];
    // Estados de modais e loading
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeletingCard, setIsDeletingCard] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showCardMenuModal, setShowCardMenuModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const { showToast } = useToast();
    const { members } = useTeamMembersStore();
    const cardData = useMemo(
      () => ({
        ...card,
        value: card.value || 0,
        assignee_id: card.assignee_id || card.assignee?.id || null,
        tag_ids: card.tag_ids || [],
      }),
      [card]
    );
    // Garantir que cardTags sempre existe, mesmo se vier só tag_ids
    const cardTags = useMemo(() => {
      if (cardData.tags && cardData.tags.length > 0) return cardData.tags;
      if (cardData.tag_ids && cardData.tag_ids.length > 0) {
        return cardData.tag_ids
          .map((id) => tags.find((t) => t.id === id))
          .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);
      }
      return [];
    }, [cardData.tags, cardData.tag_ids, tags]);
    // Busca o board correto pelas props, para garantir listas certas mesmo em overlay
    const currentBoard = useMemo(() => {
      if (activeBoard && activeBoard.id === boardId) return activeBoard;
      return boards.find((b) => b.id === boardId) || activeBoard;
    }, [activeBoard, boards, boardId]);
    const availableLists = useMemo(() => {
      if (!currentBoard) return [];
      return currentBoard.lists.map((l) => ({ id: l.id, title: l.name }));
    }, [currentBoard]);
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
    const [isDuplicatingCard, setIsDuplicatingCard] = useState(false);
    const handleDuplicate = useCallback(
      async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!token || !organization?.id) return;
        setIsDuplicatingCard(true);
        try {
          await cardService.duplicateCard(
            token,
            organization.id,
            boardId,
            listId,
            cardData.id
          );
          showToast("Card duplicado com sucesso!", "success");
        } catch (err: any) {
          showToast(err?.message || "Erro ao duplicar card", "error");
        } finally {
          setIsDuplicatingCard(false);
          setShowCardMenuModal(false);
        }
      },
      [token, organization?.id, boardId, listId, cardData.id, showToast]
    );
    const [moveLoading, setMoveLoading] = useState(false);
    const handleMove = useCallback(
      async (targetListId: string) => {
        if (!token || !organization?.id || !currentBoard) return;
        if (targetListId === listId) return;
        setMoveLoading(true);
        try {
          const dto: InputUpdateCardDTO = { list_id: targetListId };
          const updatedCardData = await cardService.updateCard(
            token,
            organization.id,
            boardId,
            listId,
            cardData.id,
            dto
          );
          updateCard(updatedCardData);
        } catch (err: any) {
          showToast(err?.message || "Erro ao mover card", "error");
        } finally {
          setMoveLoading(false);
          setShowMoveModal(false);
        }
      },
      [
        token,
        organization?.id,
        currentBoard,
        boardId,
        listId,
        cardData.id,
        updateCard,
        showToast,
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
          className={cardClassName + " flex flex-col h-full"}
        >
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/60 dark:bg-dark-800/60 opacity-80 backdrop-blur-sm">
              <span className="animate-spin w-8 h-8 border-4 border-[#7f00ff] border-t-transparent rounded-full"></span>
            </div>
          )}
          <div
            className={`flex-1 flex flex-col p-4 space-y-3 ${
              isLoading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex justify-between">
                  <div
                    className={`font-semibold text-lg leading-tight mb-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "normal",
                    }}
                    title={cardData.title}
                  >
                    {cardData.title}
                  </div>
                  {hasPermission("lists:update") && (
                    <button
                      onClick={openCardMenu}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>

                <div
                  className={`flex justify-between items-center mb-2 gap-2 px-2 py-1 text-xs rounded-lg min-h-[38px] ${
                    PRIORITY_COLORS[
                      cardData.priority as keyof typeof PRIORITY_COLORS
                    ]
                  }`}
                >
                  {cardData.priority && (
                      <span className="flex items-center gap-2">
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
                   
                  )}
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
                </div>

                {/* 2. Número do telefone com underline */}
                {cardData.phone && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                      <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-medium text-teal-700 dark:text-teal-300 underline cursor-pointer">
                        {cardData.phone}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Valor */}
                {cardData.value > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(cardData.value)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Pessoa atribuída */}
                {cardData.assignee_id && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        {members.find((m) => m.id === cardData.assignee_id)
                          ?.name || "Usuário não encontrado"}
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. Subtarefas */}
                {cardData.subtasks && cardData.subtasks.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {
                          cardData.subtasks.filter((task) => task.is_completed)
                            .length
                        }
                        /{cardData.subtasks.length} subtarefas
                      </span>
                    </div>
                  </div>
                )}

                {/* 6. Anexos */}
                {cardData.attachments && cardData.attachments.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {cardData.attachments.length} anexo
                        {cardData.attachments.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* 7. Marcadores/Tags */}
                {cardTags.length > 0 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      {cardTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs rounded-full font-medium"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
          loading={moveLoading}
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
          duplicating={isDuplicatingCard}
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
