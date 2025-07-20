// src/pages/Clients/components/List.tsx
import React, { useState, useRef, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "./Card";
import { BoardList, BoardCard } from "../../../types/board";
import {
  Plus,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ArrowUpDown,
  Check,
  CheckCircle2,
} from "lucide-react";
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
import { mutate } from "swr";
import { VariableSizeList as VirtualList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import "../../../styles/scrollbar.css";
import { ListMenuModal } from "./ListMenuModal";

interface ListProps {
  list: BoardList;
  boardId: string;
  isOver?: boolean;
  activeCard?: BoardCard | null;
}

export const List = React.memo(
  ({ list, boardId, isOver, activeCard }: ListProps) => {
    const { theme } = useThemeStore();
    const { showToast } = useToast();
    const { customConfirm, modal } = useCustomModal();
    const { selectAndLoadBoard } = useBoardStore();
    const { addCard } = useCardStore();
    const { token, organization } = useAuthStore();
    const isDark = theme === "dark";
    const [showMenu, setShowMenu] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.name);
    const [color, setColor] = useState(list.color || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreatingCard, setIsCreatingCard] = useState(false);
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

      const confirmed = await customConfirm(
        "Excluir lista",
        "Tem certeza que deseja excluir esta lista?"
      );
      if (confirmed && token && organization?.id) {
        setIsDeleting(true);
        try {
          await listService.deleteList(
            token,
            organization.id,
            boardId,
            list.id
          );

          showToast("Lista excluída com sucesso!", "success");
        } catch (err: any) {
          console.error("Erro ao excluir lista:", err);
          const errorMessage =
            err?.message || err?.error || "Erro ao excluir lista";
          showToast(errorMessage, "error");
          throw err; // Re-throw para o modal não fechar em caso de erro
        } finally {
          setIsDeleting(false);
        }
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
          className={`flex-shrink-0 w-80 h-fit shadow-md ${
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
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  <ListMenuModal
                    isOpen={showListMenuModal}
                    onClose={() => setShowListMenuModal(false)}
                    onEdit={() => setIsEditing(true)}
                    onDuplicate={() => {
                      // duplicateList(boardId, list.id); // This line was removed as per the edit hint
                      showToast("Lista duplicada com sucesso!", "success");
                    }}
                    onDelete={handleDelete}
                    canDelete={!isCompletedList}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            ref={setNodeRef}
            className="p-2 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-[100px] transition-all duration-200 "
            style={{
              maxHeight: "calc(65vh - 120px)",
              minHeight: "200px",
            }}
          >
            <SortableContext
              items={list.cards
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((card) => card.id)}
              strategy={verticalListSortingStrategy}
            >
              {list.cards
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((card) => {
                  const isActive = activeCard && activeCard.id === card.id;
                  if (isActive) return null;
                  return (
                    <Card
                      key={card.id}
                      card={card}
                      boardId={boardId}
                      listId={list.id}
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
            >
              <Plus className="w-4 h-4 ${isDark ? 'bg-dark-600'}" />
              {isCreatingCard ? "Criando..." : "Adicionar Card"}
            </button>
          </div>
        </div>
        {modal}
      </>
    );
  }
);

List.displayName = "List";
