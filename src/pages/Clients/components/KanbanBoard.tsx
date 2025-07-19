// src/pages/Clients/components/KanbanBoard.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { List as ListComponent } from "./List";
import { Card as CardType } from "../types";
import { Card } from "./Card";
import { Plus } from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useToast } from "../../../hooks/useToast";
import { boardService } from "../../../services/board.service";
import { useAuthStore } from "../../../store/authStore";

const PREDEFINED_COLORS = [
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

export function KanbanBoard() {
  const { theme } = useThemeStore();
  const { showToast } = useToast();
  const isDark = theme === "dark";
  const { token, organization } = useAuthStore();
  const [boards, setBoards] = useState<any[]>([]);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [overListId, setOverListId] = useState<string | null>(null);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListColor, setNewListColor] = useState("");

  useEffect(() => {
    async function fetchBoards() {
      if (!token || !organization?.id) return;
      try {
        const boardsData = await boardService.getBoards(token, organization.id);
        setBoards(boardsData);
        if (boardsData.length > 0 && !activeBoard) {
          setActiveBoard(boardsData[0].id);
        }
      } catch (error: any) {
        showToast(error.message || "Erro ao carregar quadros", "error");
      }
    }
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, organization?.id]);

  const board = useMemo(
    () => boards.find((b) => b.id === activeBoard),
    [boards, activeBoard]
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: any) => {
      if (event.active.data.current?.type === "card") {
        const { cardId, listId } = event.active.data.current;
        if (!board) return;
        const list = board.lists?.find((l: any) => l.id === listId);
        const card = list?.cards?.find((c: any) => c.id === cardId);
        if (card) {
          setActiveCard(card);
          setActiveListId(listId);
        }
      }
    },
    [board]
  );

  const handleDragOver = useCallback(
    (event: any) => {
      if (event.over && event.active.data.current?.type === "card") {
        const overId = event.over.id;
        if (overId !== overListId) {
          setOverListId(overId);
        }
      }
    },
    [overListId]
  );

  // Não manipula mais a store, apenas mantém o board local
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null);
    setActiveListId(null);
    setOverListId(null);
  }, []);

  const handleAddList = useCallback(() => {
    setShowCreateListModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateListModal(false);
    setNewListTitle("");
    setNewListColor("");
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setNewListColor(color);
  }, []);

  const handleListTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewListTitle(e.target.value);
    },
    []
  );

  // Não cria lista aqui, pois não deve manipular a store nem a API
  // Apenas exibe o modal

  if (!board) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col min-h-[calc(100vh-10vh)] bg-background dark:bg-background">
        <div className="flex gap-4 p-4 overflow-x-auto min-w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent [&::-webkit-scrollbar]:h-2">
          <div className="flex gap-4">
            {board?.lists?.map((list: any) => (
              <ListComponent
                key={list.id}
                list={list}
                boardId={board.id}
                isOver={list.id === overListId}
                activeCard={activeCard}
              />
            ))}
            <button
              onClick={handleAddList}
              className={`h-12 px-4 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed ${
                isDark
                  ? "border-gray-600 hover:border-gray-500 text-gray-300"
                  : "border-gray-300 hover:border-gray-400 text-gray-600"
              } transition-colors`}
            >
              <Plus size={20} />
              <span>Nova Lista</span>
            </button>
          </div>
        </div>
        {showCreateListModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div
              className={`bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4">Criar Nova Lista</h2>
              <input
                type="text"
                value={newListTitle}
                onChange={handleListTitleChange}
                placeholder="Nome da lista"
                className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                autoFocus
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newListColor === color
                        ? "ring-2 ring-[#7f00ff] ring-offset-2 ring-offset-dark-800"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-dark-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {activeCard && (
        <DragOverlay dropAnimation={null}>
          <Card
            card={activeCard}
            boardId={board.id}
            listId={activeListId || ""}
            isDragging
            className="kanban-card--drag-overlay"
          />
        </DragOverlay>
      )}
    </DndContext>
  );
}
