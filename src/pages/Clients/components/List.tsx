import React, { useState, useRef, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "./Card";
import { BoardList, BoardCard } from "../../../types/board";
import { Plus, MoreVertical } from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useToast } from "../../../hooks/useToast";
import { useCustomModal } from "../../../components/CustomModal";
import { listService } from "../../../services/list.service";
import { cardService } from "../../../services/card.service";
import { useBoardStore } from "../../../store/boardStore";
import { useCardStore } from "../../../store/cardStore";
import { useAuthStore } from "../../../store/authStore";
import { InputUpdateListDTO } from "../../../types/list";
import { InputCreateCardDTO } from "../../../types/card";
import "../../../styles/scrollbar.css";
import { ListMenuModal } from "./ListMenuModal";
import { CardModal } from "./CardModal";
import { ConfirmationModal } from "../../../components/ConfirmationModal";

interface ListProps {
  list: BoardList;
  boardId: string;
  isOver?: boolean;
  activeCard?: BoardCard | null;
  loadingCardIds?: string[];
}

export const List = React.memo(
  ({ list, boardId, isOver, activeCard, loadingCardIds = [] }: ListProps) => {
    const { theme } = useThemeStore();
    const { showToast } = useToast();
    const { customConfirm, modal } = useCustomModal();
    const { addCard } = useCardStore();
    const { token, organization, hasPermission } = useAuthStore();
    const isDark = theme === "dark";
    const [showMenu, setShowMenu] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.name);
    const [color, setColor] = useState(list.color || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDuplicatingList, setIsDuplicatingList] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreatingCard, setIsCreatingCard] = useState(false);
    const [temporaryCard, setTemporaryCard] = useState<BoardCard | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const isCompletedList =
      list.name.toLowerCase().includes("concluído") ||
      list.name.toLowerCase().includes("concluido");
    const containerRef = useRef<HTMLDivElement>(null);
    const [showListMenuModal, setShowListMenuModal] = useState(false);
    const { setNodeRef, isOver: isDroppableOver } = useDroppable({
      id: list.id,
      data: {
        type: "list",
        listId: list.id,
        boardId,
      },
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    React.useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
    const handleEdit = async () => {
      if (!title.trim() || !token || !organization?.id) return;

      setIsUpdating(true);
      try {
        const dto: InputUpdateListDTO = {
          name: title.trim(),
          color: color || undefined,
        };

        const updatedList = await listService.updateList(
          token,
          organization.id,
          boardId,
          list.id,
          dto
        );

        showToast("Lista atualizada com sucesso!", "success");
        setIsEditing(false);
      } catch (err: any) {
        console.error("Erro ao atualizar lista:", err);
        const errorMessage =
          err?.message || err?.error || "Erro ao atualizar lista";
        showToast(errorMessage, "error");
      } finally {
        setIsUpdating(false);
      }
    };

    const handleCreateCard = async (cardData: InputCreateCardDTO) => {
      if (!token || !organization?.id) return;

      setIsCreatingCard(true);
      try {
        const newCard = await cardService.createCard(
          token,
          organization.id,
          boardId,
          list.id,
          cardData
        );

        // Atualizar na cardStore
        addCard(newCard);

        // Retornar o card criado para o CardModal
        return newCard;
      } catch (err: any) {
        console.error("[List] Erro ao criar card:", err);
        const errorMessage = err?.message || err?.error || "Erro ao criar card";
        showToast(errorMessage, "error");
        throw err; // Re-throw para o CardModal capturar
      } finally {
        setIsCreatingCard(false);
      }
    };
    const handleDelete = async () => {
      if (isCompletedList) {
        showToast("A lista 'Concluído' não pode ser excluída", "warning");
        return;
      }
      setIsDeleting(true);
      try {
        await listService.deleteList(token, organization.id, boardId, list.id);
        showToast("Lista excluída com sucesso!", "success");
        setShowListMenuModal(false);
        setShowDeleteConfirm(false);
      } catch (err: any) {
        showToast(err?.message || "Erro ao excluir lista", "error");
      } finally {
        setIsDeleting(false);
      }
    };
    const handleMoveCardToList = async (cardData: InputCreateCardDTO) => {
      if (!token || !organization?.id) return;
      // Cria um card temporário
      const tempId = `temp-${Date.now()}`;
      const tempCard: BoardCard = {
        id: tempId,
        ...cardData,
        list_id: list.id,
        position: (list.cards.length + 1) * 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: (cardData.subtasks || []).map((sub: any, idx: number) => ({
          id: `temp-subtask-${idx}`,
          title: sub.title,
          is_completed: false,
          card_id: tempId,
          description: sub.description || "",
        })),
      };
      setTemporaryCard(tempCard);
      try {
        const newCard = await cardService.createCard(
          token,
          organization.id,
          boardId,
          list.id,
          cardData
        );
        addCard(newCard);
      } catch (err) {
        showToast("Erro ao criar card ao mover", "error");
      } finally {
        setTemporaryCard(null);
      }
    };
    const cardData = useMemo(() => list.cards, [list.cards]);
    const getCardHeight = (index: number) => {
      const card = cardData[index];
      let height = 100;
      if (card.subtasks?.length) {
        height += card.subtasks.length * 24;
      }
      return height;
    };
    const renderCard = ({
      index,
      style,
    }: {
      index: number;
      style: React.CSSProperties;
    }) => {
      const card = cardData[index];
      return (
        <div style={style}>
          <Card key={card.id} card={card} boardId={boardId} listId={list.id} />
        </div>
      );
    };
    const predefinedColors = [
      "#FF4136",
      "#FF851B",
      "#FFDC00",
      "#2ECC40",
      "#00B5AD",
      "#39CCCC",
      "#0074D9",
      "#7F00FF",
      "#B10DC9",
      "#F012BE",
      "#FF4081",
      "#85144b",
    ];
    return (
      <>
        <div
          ref={setNodeRef}
          className={`flex-shrink-0 w-80 shadow-md kanban-list ${
            isDark ? "bg-dark-700" : "bg-white"
          } rounded-lg flex flex-col transition-all duration-200 ${
            isOver || isDroppableOver ? "ring-2 ring-[#7f00ff]" : ""
          }`}
        >
          <div className="p-2 flex items-center justify-between shrink-0">
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                  className={`w-full px-2 py-1 bg-transparent border-b-2 border-[#7f00ff] outline-none ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                  placeholder="Nome da lista"
                  autoFocus
                />
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map((presetColor) => (
                      <button
                        key={presetColor}
                        onClick={() => setColor(presetColor)}
                        className={`w-6 h-6 rounded-full transition-all ${
                          color === presetColor
                            ? "ring-2 ring-white ring-offset-2 ring-offset-dark-700"
                            : ""
                        }`}
                        style={{ backgroundColor: presetColor }}
                      />
                    ))}
                    {color && (
                      <button
                        onClick={() => setColor("")}
                        className="text-xs text-gray-400 hover:text-gray-300 ml-2 flex items-center"
                      >
                        Remover cor
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={isUpdating}
                    className="px-3 py-1 text-sm bg-[#7f00ff] text-white rounded hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="flex items-center gap-1">
                    <div className="relative flex items-center">
                      {list.color && (
                        <div
                          className="absolute -left-2 w-1 h-[40px] rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                      )}
                      <h3
                        className={`font-medium pl-2 ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {list.name}
                      </h3>
                    </div>
                    {isCompletedList && (
                      <span className="text-[11px] leading-none text-emerald-500 font-medium">
                        CONCLUÍDO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 pl-2">
                    <span className="text-sm text-gray-500">
                      {list.cards.length} cards
                    </span>
                    <span className="text-sm text-green-500">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(
                        list.cards.reduce(
                          (sum, card) => sum + (card.value || 0),
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowListMenuModal(true)}
                    className="p-1 hover:bg-gray-700/50 rounded-full"
                    style={{
                      display:
                        hasPermission("lists:update") ||
                        hasPermission("lists:delete") ||
                        hasPermission("lists:create")
                          ? "block"
                          : "none",
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  <ListMenuModal
                    isOpen={showListMenuModal}
                    onClose={() => setShowListMenuModal(false)}
                    onEdit={() => setIsEditing(true)}
                    onDuplicate={async () => {
                      if (!token || !organization?.id) {
                        showToast("Sem autenticação", "error");
                        return;
                      }
                      setIsDuplicatingList(true);
                      try {
                        await listService.duplicateList(
                          token,
                          organization.id,
                          boardId,
                          list.id
                        );
                        showToast("Lista duplicada com sucesso!", "success");
                      } catch (err: any) {
                        showToast(
                          err?.message || "Erro ao duplicar lista",
                          "error"
                        );
                      } finally {
                        setIsDuplicatingList(false);
                        setShowListMenuModal(false);
                      }
                    }}
                    onDelete={() => setShowDeleteConfirm(true)}
                    canDelete={!isCompletedList}
                    duplicating={isDuplicatingList}
                    deleting={isDeleting}
                  />
                  {showDeleteConfirm && (
                    <ConfirmationModal
                      isOpen={showDeleteConfirm}
                      onClose={() => setShowDeleteConfirm(false)}
                      onConfirm={handleDelete}
                      title="Excluir Lista"
                      message="Tem certeza que deseja excluir esta lista?"
                      confirmText="Excluir"
                      cancelText="Cancelar"
                      isLoading={isDeleting}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className="py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-200 kanban-cards-area"
            style={{
              minHeight: list.cards.length === 0 ? "100px" : "auto",
            }}
          >
            <SortableContext
              items={
                list.cards
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((card) => card.id)
                // Não inclui o temporário aqui, pois ele não tem id real
              }
              strategy={verticalListSortingStrategy}
            >
              {temporaryCard && (
                <Card
                  key={temporaryCard.id}
                  card={temporaryCard}
                  boardId={boardId}
                  listId={list.id}
                  isLoading
                />
              )}
              {list.cards
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((card) => {
                  // const isActive = activeCard && activeCard.id === card.id;
                  // if (isActive) return null;
                  return (
                    <Card
                      key={card.id}
                      card={card}
                      boardId={boardId}
                      listId={list.id}
                      isLoading={loadingCardIds.includes(card.id)}
                    />
                  );
                })}
            </SortableContext>
          </div>

          <div className="p-2 shrink-0">
            <button
              onClick={() => setShowCardModal(true)}
              disabled={isCreatingCard}
              className={`w-full p-2 flex items-center justify-center gap-2 text-sm rounded-lg transition-colors ${
                isDark
                  ? "bg-dark-600 text-gray-400 hover:bg-dark-500"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              } ${isCreatingCard ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                display: hasPermission("lists:create") ? "flex" : "none",
              }}
            >
              <Plus className="w-4 h-4 ${isDark ? 'bg-dark-600'}" />
              {isCreatingCard ? "Criando..." : "Adicionar Card"}
            </button>
          </div>
        </div>
        {showCardModal && (
          <CardModal
            isOpen={showCardModal}
            onClose={() => setShowCardModal(false)}
            onSave={handleCreateCard}
            mode="add"
            boardId={boardId}
            listId={list.id}
          />
        )}
        {modal}
      </>
    );
  }
);

List.displayName = "List";
