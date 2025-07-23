import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { List as ListComponent } from "./List";
import { Card } from "./Card";
import {
  Plus,
  Loader2,
  GripVertical,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useThemeStore } from "../../../store/themeStore";
import { useToast } from "../../../hooks/useToast";
import { boardService } from "../../../services/board.service";
import { listService } from "../../../services/list.service";
import { cardService } from "../../../services/card.service";
import { useAuthStore } from "../../../store/authStore";
import { useBoardStore } from "../../../store/boardStore";
import { useCardStore } from "../../../store/cardStore";
import { InputCreateBoardDTO } from "../../../types/board";
import { InputCreateListDTO, InputUpdateListDTO } from "../../../types/list";
import { OutputCardDTO, InputUpdateCardDTO } from "../../../types/card";

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
  onSort: (newLists: any[]) => void;
  lists: any[];
}

function SortModal({ isOpen, onClose, onSort, lists }: SortModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [items, setItems] = useState(lists);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  // Novo: guardar os positions originais para comparar depois
  const [originalPositions, setOriginalPositions] = useState<{
    [id: string]: number;
  }>({});
  // Novo: guardar ids das listas alteradas
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  // Novo: loading ao salvar
  const [isSaving, setIsSaving] = useState(false);

  // Reset items e positions quando modal abre
  useEffect(() => {
    if (isOpen) {
      setItems(lists);
      setHasChanges(false);
      setOriginalPositions(
        lists.reduce((acc, l) => {
          acc[l.id] = l.position;
          return acc;
        }, {} as { [id: string]: number })
      );
      setChangedIds(new Set());
      setIsSaving(false);
    }
  }, [isOpen, lists]);

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
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);
        const newLists = arrayMove(prevItems, oldIndex, newIndex);
        // Corrigido: novo position float para a lista movida
        let newPosition: number;
        if (newIndex === 0) {
          // No topo: menor que o próximo
          const next = newLists[1];
          newPosition = next ? next.position - 1 : 0;
        } else if (newIndex === newLists.length - 1) {
          // No final: +1 do anterior
          const prev = newLists[newIndex - 1];
          newPosition = prev ? prev.position + 1 : 1;
        } else {
          // No meio: média dos vizinhos
          const prev = newLists[newIndex - 1];
          const next = newLists[newIndex + 1];
          newPosition = (prev.position + next.position) / 2;
        }
        // Atualizar só a lista movida
        const updatedLists = newLists.map((list, idx) => {
          if (idx === newIndex) {
            return { ...list, position: newPosition };
          }
          return list;
        });
        // Marcar como alterada se mudou o position
        const movedId = newLists[newIndex].id;
        const origPos = originalPositions[movedId];
        const changed = origPos !== newPosition;
        setChangedIds((prev) => {
          const newSet = new Set(prev);
          if (changed) newSet.add(movedId);
          else newSet.delete(movedId);
          return newSet;
        });
        setHasChanges(true);
        return updatedLists;
      });
    }
    setActiveId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`${
          isDark ? "bg-dark-600" : "bg-white"
        } rounded-lg w-full max-w-md p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            isDark ? "text-gray-200" : "text-gray-900"
          }`}
        >
          Ordenar Listas
        </h3>
        <div className="mb-6 space-y-2">
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
                  title={item.name || item.title}
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
                    {items.find((item) => item.id === activeId)?.name ||
                      items.find((item) => item.id === activeId)?.title}
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
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (hasChanges && changedIds.size > 0) {
                setIsSaving(true);
                try {
                  const changedLists = items.filter((item) =>
                    changedIds.has(item.id)
                  );
                  await onSort(changedLists); // onSort agora deve ser async
                  setIsSaving(false);
                  onClose();
                } catch (err) {
                  setIsSaving(false);
                  // O toast de erro deve ser disparado pelo onSort
                }
              } else {
                onClose();
              }
            }}
            disabled={!hasChanges || changedIds.size === 0 || isSaving}
            className={`px-4 py-2 rounded-md ${
              hasChanges && changedIds.size > 0 && !isSaving
                ? "bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" /> Salvando...
              </span>
            ) : (
              "Concluir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { theme } = useThemeStore();
  const { showToast } = useToast();
  const isDark = theme === "dark";
  const {
    boards,
    activeBoardId,
    activeBoard,
    setActiveBoardId,
    setActiveBoard,
  } = useBoardStore();
  const { token, organization } = useAuthStore();
  const [activeCard, setActiveCard] = useState<OutputCardDTO | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [overListId, setOverListId] = useState<string | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListColor, setNewListColor] = useState("");
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  // Novo: cards em loading
  const [loadingCardIds, setLoadingCardIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Usar o activeBoard que já vem com listas e cards
  const board = activeBoard;

  // Sempre buscar o nome mais atualizado do board
  const boardName =
    boards.find((b) => b.id === activeBoardId)?.name ||
    board?.name ||
    "Quadro não encontrado";

  // Carregar o board completo quando o activeBoardId mudar
  useEffect(() => {
    if (
      activeBoardId &&
      (!activeBoard?.lists || activeBoard.lists.length === 0)
    ) {
      // Removido selectAndLoadBoard - será feito em outro lugar
    }
  }, [activeBoardId, activeBoard?.lists]);

  useEffect(() => {
    if (board && board.id !== activeBoardId) {
      setActiveBoardId(board.id);
    }
  }, [board?.id, activeBoardId]);

  // Listener para tecla ESC para cancelar drag
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDraggingCard) {
        setActiveCard(null);
        setActiveListId(null);
        setOverListId(null);
        setIsDraggingCard(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (isDraggingCard && !event.target) {
        setActiveCard(null);
        setActiveListId(null);
        setOverListId(null);
        setIsDraggingCard(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDraggingCard]);

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
          setIsDraggingCard(true);
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
      } else if (!event.over && overListId) {
        setOverListId(null);
      }
    },
    [overListId]
  );

  // Manipular drag & drop de cards
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // Verificar se é um card verificando se o ID está em alguma lista
      const isCard = board?.lists?.some((list) =>
        list.cards?.some((card) => card.id === active.id)
      );

      if (active && over && isCard) {
        // Encontrar o card e sua lista de origem
        let cardId = active.id as string;
        let fromListId = "";
        let movedCard: any = null;

        for (const list of board?.lists || []) {
          const card = list.cards?.find((c) => c.id === cardId);
          if (card) {
            fromListId = list.id;
            movedCard = card;
            break;
          }
        }

        const toListId = over.data.current?.listId || over.id;

        // Se for a mesma lista, reordenar
        if (fromListId === toListId) {
          const list = board?.lists?.find((l: any) => l.id === fromListId);
          if (list) {
            const oldIndex = list.cards.findIndex(
              (c: any) => c.id === active.id
            );
            const newIndex = list.cards.findIndex((c: any) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              // Calcular nova posição baseada na posição do card de destino
              const targetCard = list.cards[newIndex];
              let newPosition: number;

              if (newIndex === 0) {
                // Movendo para o primeiro lugar
                const firstCardPosition = list.cards[1]?.position || 2;
                newPosition = firstCardPosition - 1; // Ex: 2 -> 1
              } else if (newIndex === list.cards.length - 1) {
                // Movendo para o último lugar
                const lastCardPosition =
                  list.cards[newIndex - 1]?.position || newIndex;
                newPosition = lastCardPosition + 1; // Ex: 4 -> 5
              } else {
                // Movendo para o meio
                const prevCardPosition =
                  list.cards[newIndex - 1]?.position || newIndex;
                const nextCardPosition =
                  list.cards[newIndex + 1]?.position || newIndex + 2;
                newPosition =
                  prevCardPosition + (nextCardPosition - prevCardPosition) / 2; // Ex: entre 2 e 4 = 3
              }

              // Atualizar posição do card movido (active.id)
              const movedCard = list.cards[oldIndex];
              movedCard.position = newPosition;

              // Reordenar cards por posição
              list.cards.sort(
                (a: any, b: any) => (a.position || 0) - (b.position || 0)
              );

              // Atualizar estado local
              setActiveBoard({ ...board });

              // Atualizar no backend
              try {
                await cardService.updateCard(
                  token,
                  organization.id,
                  board.id,
                  fromListId,
                  active.id as string,
                  { position: newPosition }
                );
                showToast("Card reordenado com sucesso!", "success");
              } catch (err: any) {
                showToast(err.message || "Erro ao reordenar card", "error");
              }
            }
          }
        } else {
          // Se o card foi movido para uma lista diferente
          try {
            // Atualização otimista
            const updatedBoard = { ...board };
            const fromList = updatedBoard.lists?.find(
              (l: any) => l.id === fromListId
            );
            const toList = updatedBoard.lists?.find(
              (l: any) => l.id === toListId
            );

            // Calcular nova posição na lista de destino
            let newPosition: number;

            if (toList && toList.cards.length === 0) {
              // Se a lista estiver vazia, posição 1
              newPosition = 1;
            } else if (toList) {
              // Se já tiver cards, pegar a próxima posição
              const maxPosition = Math.max(
                ...toList.cards.map((c: any) => c.position || 0)
              );
              newPosition = maxPosition + 1;
            } else {
              // Fallback
              newPosition = 1;
            }

            if (fromList && toList) {
              // Remover o card da lista de origem
              const cardIndex = fromList.cards?.findIndex(
                (c: any) => c.id === cardId
              );
              if (cardIndex !== -1) {
                const [movedCard] = fromList.cards.splice(cardIndex, 1);

                // Adicionar o card na lista de destino
                movedCard.list_id = toListId;
                movedCard.position = newPosition;
                // Marcar como loading
                setLoadingCardIds((prev) => [...prev, movedCard.id]);
                toList.cards.push(movedCard);

                // Reordenar cards por posição
                toList.cards.sort(
                  (a: any, b: any) => (a.position || 0) - (b.position || 0)
                );

                // Atualizar o estado local imediatamente
                setActiveBoard(updatedBoard);
              }
            }

            // Atualizar no backend
            const dto: InputUpdateCardDTO = {
              list_id: toListId,
              position: newPosition,
            };

            await cardService.updateCard(
              token,
              organization.id,
              activeBoardId,
              fromListId,
              cardId,
              dto
            );

            // Remover loading do card
            setLoadingCardIds((prev) => prev.filter((id) => id !== cardId));
            showToast("Card movido com sucesso!", "success");
          } catch (err: any) {
            // Reverter card para lista original
            const updatedBoard = { ...board };
            const toList = updatedBoard.lists?.find(
              (l: any) => l.id === toListId
            );
            const fromList = updatedBoard.lists?.find(
              (l: any) => l.id === fromListId
            );
            if (toList && fromList && movedCard) {
              // Remover da lista de destino
              toList.cards = toList.cards.filter((c: any) => c.id !== cardId);
              // Adicionar de volta na lista de origem
              fromList.cards.push(movedCard);
              fromList.cards.sort(
                (a: any, b: any) => (a.position || 0) - (b.position || 0)
              );
              setActiveBoard(updatedBoard);
            }
            setLoadingCardIds((prev) => prev.filter((id) => id !== cardId));
            showToast(err.message || "Erro ao mover card", "error");
          }
        }
      }

      // Sempre limpar o estado, independente do resultado
      setActiveCard(null);
      setActiveListId(null);
      setOverListId(null);
      setIsDraggingCard(false);
    },
    [activeBoardId, board, token, organization?.id, showToast, setActiveBoard]
  );

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

  // Função para criar nova lista via service
  const handleCreateList = async () => {
    if (!newListTitle.trim() || !activeBoardId) return;

    setIsCreatingList(true);
    try {
      if (!token || !organization?.id) throw new Error("Sem autenticação");

      const dto: InputCreateListDTO = {
        name: newListTitle.trim(),
        color: newListColor || "#7F00FF",
      };

      const newList = await listService.createList(
        token,
        organization.id,
        activeBoardId,
        dto
      );

      handleCloseModal();
      showToast("Lista criada com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao criar lista", "error");
    } finally {
      setIsCreatingList(false);
    }
  };

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

  const handleSortLists = async (newLists: any[]) => {
    if (!activeBoardId || !token || !organization?.id) return;

    try {
      // Encontrar todas as listas que mudaram de posição
      const movedLists = newLists.filter((newList) => {
        const originalList = board?.lists?.find((l) => l.id === newList.id);
        return newList.position !== originalList?.position;
      });

      // Atualizar todas as listas em paralelo
      await Promise.all(
        movedLists.map(async (list) => {
          const dto: InputUpdateListDTO = {
            position: list.position,
          };
          await listService.updateList(
            token,
            organization.id,
            activeBoardId,
            list.id,
            dto
          );
        })
      );

      showToast("Listas reordenadas com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao reordenar listas", "error");
      throw err; // importante: lançar para o modal não fechar
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
      <div className="flex flex-col h-full bg-background dark:bg-background overflow-hidden kanban-board-container">
        {isDraggingCard && (
          <div className="fixed top-4 right-4 z-50 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            Movendo card...
          </div>
        )}
        {!boards.length || !board ? (
          <Spinner />
        ) : (
          <>
            <div className="flex items-center gap-4 p-4">
              <button
                onClick={handleAddList}
                className="flex-shrink-0 w-80 h-fit p-3 flex items-center justify-center gap-2 text-base bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Lista
              </button>
              {board?.lists?.length > 1 && (
                <button
                  onClick={() => setShowSortModal(true)}
                  className="flex-shrink-0 px-4 py-3 flex items-center justify-center gap-2 text-base bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
                >
                  <GripVertical className="w-5 h-5" />
                  Ordenar Listas
                </button>
              )}
            </div>
            <div className="flex-1 overflow-x-auto kanban-horizontal-scroll px-4 py-6 kanban-scroll-container">
              <div className="flex gap-4 min-w-max">
                {board?.lists
                  ?.sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((list: any) => (
                    <ListComponent
                      key={list.id}
                      list={{
                        id: list.id,
                        name: list.name,
                        cards: list.cards || [],
                        color: list.color,
                        position: list.position,
                        board_id: list.board_id,
                        created_at: list.created_at,
                        updated_at: list.updated_at,
                        is_deletable: list.is_deletable,
                      }}
                      boardId={board.id}
                      isOver={list.id === overListId}
                      activeCard={activeCard}
                    />
                  ))}
                {/* Botão '+' só aparece se houver pelo menos uma lista */}
                {board?.lists?.length > 0 && (
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
                      onClick={handleCreateList}
                      className="px-4 py-2 rounded bg-[#7f00ff] text-white hover:bg-[#7f00ff]/90"
                      disabled={isCreatingList || !newListTitle.trim()}
                    >
                      {isCreatingList ? "Criando..." : "Criar"}
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
            isLoading={loadingCardIds.includes(activeCard.id)}
            className="w-80 shadow-2xl opacity-95 z-50 bg-white dark:bg-dark-800"
          />
        </DragOverlay>
      )}

      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        onSort={handleSortLists}
        lists={board?.lists || []}
      />
      {/* BoardSelector removido - já existe no header principal */}
    </DndContext>
  );
}
