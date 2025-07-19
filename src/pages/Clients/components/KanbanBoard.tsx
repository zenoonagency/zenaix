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
import { Card } from "./Card";
import { Plus, Loader2 } from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useToast } from "../../../hooks/useToast";
import { boardService } from "../../../services/board.service";
import { useAuthStore } from "../../../store/authStore";
import { useBoardStore } from "../../../store/boardStore";
import { InputCreateBoardDTO } from "../../../types/board";
import { OutputCardDTO } from "../../../types/card";

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

// Spinner padrão do sistema
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center h-[40vh]">
      <Loader2 className="w-12 h-12 text-[#7f00ff] animate-spin mb-4" />
      <span className="text-gray-500 text-lg">Carregando quadro...</span>
    </div>
  );
}

export function KanbanBoard() {
  const { theme } = useThemeStore();
  const { showToast } = useToast();
  const isDark = theme === "dark";
  const { boards, activeBoardId, setActiveBoardId } = useBoardStore();
  const { token, organization } = useAuthStore();
  const [activeCard, setActiveCard] = useState<OutputCardDTO | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [overListId, setOverListId] = useState<string | null>(null);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListColor, setNewListColor] = useState("");
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Board ativo: se não houver activeBoardId, pega o primeiro board
  const board = boards.length
    ? boards.find((b) => b.id === activeBoardId) || boards[0]
    : null;

  // Sempre que mudar o board, atualiza o activeBoardId na store
  useEffect(() => {
    if (board && board.id !== activeBoardId) {
      setActiveBoardId(board.id);
    }
  }, [board?.id, activeBoardId]);

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

  // Função para criar novo board via service
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    setIsCreatingBoard(true);
    try {
      const { token, organization } = useAuthStore.getState();
      if (!token || !organization?.id) throw new Error("Sem autenticação");
      const dto: InputCreateBoardDTO = {
        name: newBoardName.trim(),
        description: newBoardDescription.trim(),
        access_level: "TEAM_WIDE",
      };
      await boardService.createBoard(token, organization.id, dto);
      showToast("Quadro criado com sucesso!", "success");
      setShowCreateBoardModal(false);
      setNewBoardName("");
      setNewBoardDescription("");
    } catch (err: any) {
      showToast(err.message || "Erro ao criar quadro", "error");
    } finally {
      setIsCreatingBoard(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col min-h-[calc(100vh-10vh)] bg-background dark:bg-background">
        {!boards.length || !board ? (
          <Spinner />
        ) : (
          <>
            {/* Nome do quadro ativo acima do botão Adicionar Lista */}
            {board && (
              <div className="mb-6 mt-8 pl-6">
                <h2
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
                  style={{ textAlign: "left" }}
                >
                  Quadro: {board.name}
                </h2>
              </div>
            )}
            {/* Botão Adicionar Lista */}
            <div className="flex items-center gap-4 p-4">
              <button
                onClick={handleAddList}
                className="flex-shrink-0 w-80 h-fit p-3 flex items-center justify-center gap-2 text-base bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Lista
              </button>
            </div>
            <div className="flex gap-4 p-4 overflow-x-auto min-w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent [&::-webkit-scrollbar]:h-2">
              <div className="flex gap-4">
                {board?.lists?.map((list: any) => (
                  <ListComponent
                    key={list.id}
                    list={{
                      id: list.id,
                      title: list.name || list.title || "",
                      cards: list.cards || [],
                      color: list.color,
                      createdAt: list.created_at || list.createdAt || "",
                      updatedAt: list.updated_at || list.updatedAt || "",
                    }}
                    boardId={board.id}
                    isOver={list.id === overListId}
                    activeCard={activeCard}
                  />
                ))}
                {/* Botão '+' só aparece se houver pelo menos uma lista */}
                {board?.lists && board.lists.length > 0 && (
                  <button
                    onClick={handleAddList}
                    className="flex items-center justify-center w-12 h-24 rounded-lg border-2 border-dashed border-[#7f00ff] text-[#7f00ff] text-3xl hover:bg-[#7f00ff]/10 transition-colors"
                    style={{ alignSelf: "center" }}
                    title="Adicionar Lista"
                  >
                    <Plus className="w-8 h-8" />
                  </button>
                )}
              </div>
            </div>
            {showCreateListModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div
                  className={`bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Criar Nova Lista
                  </h2>
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
            {showCreateBoardModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div
                  className={`bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Criar Novo Quadro
                  </h2>
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Nome do quadro"
                    className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                    autoFocus
                    disabled={isCreatingBoard}
                  />
                  <textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                    rows={3}
                    disabled={isCreatingBoard}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCreateBoardModal(false)}
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-dark-500"
                      disabled={isCreatingBoard}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateBoard}
                      className="px-4 py-2 rounded bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90"
                      disabled={isCreatingBoard || !newBoardName.trim()}
                    >
                      {isCreatingBoard ? "Criando..." : "Criar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {activeCard && (
        <DragOverlay dropAnimation={null}>
          <Card
            card={activeCard}
            boardId={board?.id || ""}
            listId={activeListId || ""}
            isDragging
            className="kanban-card--drag-overlay"
          />
        </DragOverlay>
      )}
      {/* BoardSelector removido - já existe no header principal */}
    </DndContext>
  );
}
