// src/pages/Clients/components/List.tsx
import React, { useState, useRef, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  GripVertical,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useToast } from "../../../hooks/useToast";
import { CardModal } from "./CardModal";
import { useCustomModal } from "../../../components/CustomModal";
import { api } from "../../../services/api";
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

interface SortableItemProps {
  id: string;
  title: string;
  position: number;
  isDark: boolean;
}

function SortableItem({ id, title, position, isDark }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : "",
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-md ${
        isDark
          ? "bg-dark-800 hover:bg-dark-600"
          : "bg-[#f8f8f8] hover:bg-dark-50"
      } cursor-move border ${isDark ? "border-gray-600" : "border-gray-200"}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical
        className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      />
      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
        P-{position}
      </span>
      <span className={`flex-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
        {title}
      </span>
    </div>
  );
}

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSort: (newLists: ListType[]) => void;
  lists: ListType[];
}

function SortModal({ isOpen, onClose, onSort, lists }: SortModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [items, setItems] = useState(lists);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newLists = arrayMove(items, oldIndex, newIndex);
        onSort(newLists);
        return newLists;
      });
    }
    setActiveId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className={`${
          isDark ? "bg-dark-600" : "bg-white"
        } rounded-lg w-full max-w-md p-6`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            isDark ? "text-gray-200" : "text-gray-900"
          }`}
        >
          Ordenar Listas
        </h3>
        <div
          className="mb-6 space-y-2"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  position={index + 1}
                  isDark={isDark}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div
                  className={`flex items-center gap-3 p-3 rounded-md ${
                    isDark ? "bg-dark-700" : "bg-white"
                  } shadow-lg border ${
                    isDark ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <GripVertical
                    className={`w-5 h-5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    P-{items.findIndex((item) => item.id === activeId) + 1}
                  </span>
                  <span
                    className={`flex-1 ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {items.find((item) => item.id === activeId)?.title}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${
              isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

export const List = React.memo(
  ({ list, boardId, isOver, activeCard }: ListProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";
    // TODO: Integrar com boardStore se necessário
    const [showMenu, setShowMenu] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [color, setColor] = useState(list.color || "");
    const menuRef = useRef<HTMLDivElement>(null);
    const { modal, customConfirm } = useCustomModal();
    const isCompletedList = false; // getCompletedListId(boardId) === list.id; // This line was removed as per the edit hint
    const { showToast } = useToast();
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
    const handleEdit = () => {
      if (title.trim()) {
        // updateList(boardId, list.id, { // This line was removed as per the edit hint
        //   title: title.trim(),
        //   color: color || undefined,
        // });
        setIsEditing(false);
      }
    };
    const handleSort = (newLists: ListType[]) => {
      // const board = boards.find((b) => b.id === boardId); // This line was removed as per the edit hint
      // if (!board) return;
      // const updatedBoard = { // This line was removed as per the edit hint
      //   ...board,
      //   lists: newLists,
      // };
      // useKanbanStore.setState((state) => ({ // This line was removed as per the edit hint
      //   boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
      // }));
      showToast("Listas reordenadas com sucesso!", "success");
    };
    const handleCreateCard = (cardData: any) => {
      const newCard: Omit<CardType, "id"> = {
        title: cardData.title,
        description: cardData.description || "",
        tags: [],
        tagIds: cardData.tagIds || [],
        value: cardData.value ? parseFloat(cardData.value) : undefined,
        phone: cardData.phone || undefined,
        subtasks: cardData.subtasks || [],
        attachments: cardData.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: cardData.scheduledDate || undefined,
        responsibleId: cardData.responsibleId || undefined,
        priority: cardData.priority || undefined,
      };
      // addCard(boardId, list.id, newCard as CardType); // This line was removed as per the edit hint
      setShowCardModal(false);
      showToast("Card criado com sucesso!", "success");
    };
    const handleDelete = async () => {
      const confirmed = await customConfirm(
        "Excluir lista",
        "Tem certeza que deseja excluir esta lista?"
      );
      if (confirmed) {
        // deleteList(boardId, list.id); // This line was removed as per the edit hint
        showToast("Lista excluída com sucesso!", "success");
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
                  className="px-3 py-1 text-sm bg-[#7f00ff] text-white rounded hover:bg-[#7f00ff]/90"
                >
                  Salvar
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
                  onSort={() => setShowSortModal(true)}
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
            className={`w-full p-2 flex items-center justify-center gap-2 text-sm rounded-lg transition-colors ${
              isDark
                ? "bg-dark-600 text-gray-400 hover:bg-dark-500"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <Plus className="w-4 h-4 ${isDark ? 'bg-dark-600'}" />
            Adicionar Card
          </button>
        </div>

        {showSortModal && (
          <SortModal
            isOpen={showSortModal}
            onClose={() => setShowSortModal(false)}
            onSort={handleSort}
            lists={[]} // This line was changed as per the edit hint
          />
        )}

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
      </div>
    );
  }
);

List.displayName = "List";
