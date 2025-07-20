// src/pages/Clients/components/List.tsx
import React, { useState, useRef, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "./Card";
import { List as ListType } from "../../types/list";
import { Card as CardType } from "../../types/card";
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
import { CardModal } from "./CardModal";
import { useCustomModal } from "../../../components/CustomModal";
import { listService } from "../../../services/list.service";
import { cardService } from "../../../services/card.service";
import { useListStore } from "../../../store/listStore";
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
  list: ListType;
  boardId: string;
  isOver?: boolean;
  activeCard?: CardType | null;
}

export const List = React.memo(
  ({ list, boardId, isOver, activeCard }: ListProps) => {
    const { theme } = useThemeStore();
    const { showToast } = useToast();
    const { customConfirm } = useCustomModal();
    const { updateList, removeList } = useListStore();
    const { addCard } = useCardStore();
    const { token, organization } = useAuthStore();
    const isDark = theme === "dark";
    const [showMenu, setShowMenu] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [color, setColor] = useState(list.color || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreatingCard, setIsCreatingCard] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isCompletedList = false; // getCompletedListId(boardId) === list.id;
    const containerRef = useRef<HTMLDivElement>(null);
    const [showListMenuModal, setShowListMenuModal] = useState(false);
    const { setNodeRef } = useDroppable({
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

        // Atualizar na listStore
        updateList(updatedList);

        showToast("Lista atualizada com sucesso!", "success");
        setIsEditing(false);
      } catch (err: any) {
        showToast(err.message || "Erro ao atualizar lista", "error");
      } finally {
        setIsUpdating(false);
      }
    };

    const handleCreateCard = async (cardData: InputCreateCardDTO) => {
      if (!token || !organization?.id) return;

      setIsCreatingCard(true);
      try {
        console.log("[List] Criando card com dados:", cardData);

        const newCard = await cardService.createCard(
          token,
          organization.id,
          boardId,
          list.id,
          cardData
        );

        console.log("[List] Card criado:", newCard);

        // Atualizar na cardStore
        addCard(newCard);

        setShowCardModal(false);
        showToast("Card criado com sucesso!", "success");

        // Retornar o card criado para o CardModal
        return newCard;
      } catch (err: any) {
        console.error("[List] Erro ao criar card:", err);
        showToast(err.message || "Erro ao criar card", "error");
        throw err; // Re-throw para o CardModal capturar
      } finally {
        setIsCreatingCard(false);
      }
    };
    const handleDelete = async () => {
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

          // Remover da listStore
          removeList(list.id);

          showToast("Lista excluída com sucesso!", "success");
        } catch (err: any) {
          showToast(err.message || "Erro ao excluir lista", "error");
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
      if (card.customFields) {
        height += Object.keys(card.customFields).length * 24;
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
      if (card.isDragging) return null;
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
      <div
        ref={setNodeRef}
        className={`flex-shrink-0 w-80 h-fit shadow-md ${
          isDark ? "bg-dark-700" : "bg-white"
        } rounded-lg flex flex-col ${isOver ? "ring-2 ring-[#7f00ff]" : ""}`}
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
                      {list.title}
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
                />
              </div>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className="p-2 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{
            maxHeight: "calc(65vh - 120px)",
          }}
        >
          {list.cards.map((card) => {
            // Oculta o card original apenas se ele está sendo arrastado e a lista é a de origem
            const isActive = activeCard && activeCard.id === card.id;
            if (isActive && activeCard.listId === list.id) return null;
            return (
              <Card
                key={card.id}
                card={card}
                boardId={boardId}
                listId={list.id}
              />
            );
          })}
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
      </div>
    );
  }
);

List.displayName = "List";
