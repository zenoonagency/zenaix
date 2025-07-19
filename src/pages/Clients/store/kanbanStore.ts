// src/pages/Clients/store/kanbanStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Board, Card, List, BoardConfig, TriggerType } from "../types";
import { generateId } from "../../../utils/generateId";
import { useToastStore } from "../../../components/Notification";

interface ExtendedBoard extends Omit<Board, "config"> {
  completedListId?: string;
  config?: BoardConfig;
}

interface KanbanState {
  boards: ExtendedBoard[];
  activeBoard: string | null;
  setActiveBoard: (boardId: string) => void;
  addBoard: (title: string) => ExtendedBoard;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  duplicateBoard: (boardId: string) => void;
  toggleBoardVisibility: (boardId: string) => void;
  addList: (boardId: string, list: List) => void;
  updateList: (boardId: string, listId: string, updates: Partial<List>) => void;
  deleteList: (boardId: string, listId: string) => void;
  duplicateList: (boardId: string, listId: string) => void;
  addCard: (boardId: string, listId: string, card: Card) => void;
  updateCard: (
    boardId: string,
    listId: string,
    cardId: string,
    updates: Partial<Card>
  ) => void;
  deleteCard: (boardId: string, listId: string, cardId: string) => void;
  duplicateCard: (boardId: string, listId: string, cardId: string) => void;
  moveCard: (
    boardId: string,
    fromListId: string,
    toListId: string,
    cardId: string
  ) => void;
  setCompletedList: (boardId: string, listId: string) => void;
  getCompletedListId: (boardId: string) => string | null;
  addAttachment: (
    boardId: string,
    listId: string,
    cardId: string,
    file: { name: string; url: string; size: number }
  ) => void;
  deleteAttachment: (
    boardId: string,
    listId: string,
    cardId: string,
    attachmentId: string
  ) => void;
  cleanupStorage: () => void;
}

// Função auxiliar para executar webhooks
const executeWebhook = async (url: string, data: any) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Falha ao executar webhook:", await response.text());
    }

    return response.ok;
  } catch (error) {
    console.error("Erro ao executar webhook:", error);
    return false;
  }
};

// Função para verificar e executar automações
const checkAndExecuteAutomations = (
  boardId: string,
  triggerType: TriggerType,
  data: any
) => {
  try {
    // Buscar automações do localStorage
    const savedAutomations = localStorage.getItem(`automations_${boardId}`);
    if (!savedAutomations) return;

    const automations = JSON.parse(savedAutomations);

    // Filtrar automações ativas do tipo especificado
    const relevantAutomations = automations.filter(
      (automation: any) =>
        automation.active && automation.triggerType === triggerType
    );

    if (relevantAutomations.length === 0) return;

    // Para cada automação relevante, verificar condições e executar webhook
    relevantAutomations.forEach((automation: any) => {
      let shouldExecute = false;

      switch (triggerType) {
        case "card_moved":
          shouldExecute =
            data.fromListId === automation.sourceListId &&
            data.toListId === automation.targetListId;
          break;

        case "card_created":
          shouldExecute = data.listId === automation.targetListId;
          break;
      }

      if (shouldExecute) {
        // Executar webhook
        executeWebhook(automation.webhookUrl, {
          automationName: automation.name,
          triggerType,
          boardId,
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    });
  } catch (error) {
    console.error("Erro ao verificar automações:", error);
  }
};

// Função para atualizar schemas antigos para incluir novos campos
const migrateStore = (state: any) => {
  const updatedBoards = state.boards.map((board: ExtendedBoard) => {
    // Garantir que o board tenha a propriedade config
    if (!board.config) {
      return {
        ...board,
        config: {
          visibility: "all",
          allowedUsers: [],
        },
      };
    }
    return board;
  });

  return {
    ...state,
    boards: updatedBoards,
  };
};

// Procesar automações para um cartão
const processAutomations = async (
  boardId: string,
  triggerType: TriggerType,
  data: any
) => {
  try {
    // Buscar automações do localStorage
    const savedAutomations = localStorage.getItem(`automations_${boardId}`);
    if (!savedAutomations) return;

    const automations = JSON.parse(savedAutomations);

    // Filtrar automações ativas do tipo especificado
    const relevantAutomations = automations.filter(
      (automation: any) =>
        automation.active && automation.triggerType === triggerType
    );

    if (relevantAutomations.length === 0) return;

    // Para cada automação relevante, verificar condições e executar webhook
    relevantAutomations.forEach((automation: any) => {
      let shouldExecute = false;

      switch (triggerType) {
        case "card_moved":
          shouldExecute =
            data.fromListId === automation.sourceListId &&
            data.toListId === automation.targetListId;
          break;

        case "card_created":
          shouldExecute = data.listId === automation.targetListId;
          break;
      }

      if (shouldExecute) {
        // Executar webhook
        executeWebhook(automation.webhookUrl, {
          automationName: automation.name,
          triggerType,
          boardId,
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    });
  } catch (error) {
    console.error("Erro ao verificar automações:", error);
  }
};

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoard: null,

      setActiveBoard: (boardId) => set({ activeBoard: boardId }),

      addBoard: (title) => {
        const newBoard: ExtendedBoard = {
          id: generateId(),
          title,
          lists: [
            {
              id: generateId(),
              title: "Pendente",
              cards: [],
            },
            {
              id: generateId(),
              title: "Em Andamento",
              cards: [],
            },
            {
              id: generateId(),
              title: "Concluído",
              cards: [],
            },
          ],
          hidden: false,
          completedListId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          config: {
            visibility: "all",
            allowedUsers: [],
          },
        };

        set((state) => ({
          boards: [...state.boards, newBoard],
        }));

        useToastStore
          .getState()
          .addToast("Quadro criado com sucesso!", "success");
        return newBoard;
      },

      updateBoard: (boardId, updates) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId ? { ...board, ...updates } : board
          ),
        })),

      deleteBoard: (boardId) =>
        set((state) => {
          // Não permitir excluir se for o último quadro
          if (state.boards.length <= 1) {
            useToastStore
              .getState()
              .addToast("É necessário ter pelo menos um quadro.", "warning");
            return state;
          }

          const newBoards = state.boards.filter(
            (board) => board.id !== boardId
          );
          const newActiveBoard =
            state.activeBoard === boardId ? newBoards[0].id : state.activeBoard;

          return {
            boards: newBoards,
            activeBoard: newActiveBoard,
          };
        }),

      toggleBoardVisibility: (boardId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId ? { ...board, hidden: !board.hidden } : board
          ),
        })),

      duplicateBoard: (boardId) =>
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          if (!board) return state;

          const newBoard = {
            ...board,
            id: generateId(),
            title: `${board.title} (Cópia)`,
            lists: board.lists.map((list) => ({
              ...list,
              id: generateId(),
              cards: list.cards.map((card) => ({ ...card, id: generateId() })),
            })),
            config: {
              visibility: board.config?.visibility,
              allowedUsers: board.config?.allowedUsers.slice(),
            },
          };

          return { boards: [...state.boards, newBoard] };
        }),

      addList: (boardId, list) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: [...board.lists, { ...list, id: generateId() }],
                }
              : board
          ),
        })),

      updateList: (boardId, listId, updates) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map((list) =>
                    list.id === listId ? { ...list, ...updates } : list
                  ),
                }
              : board
          ),
        })),

      deleteList: (boardId, listId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.filter((list) => list.id !== listId),
                }
              : board
          ),
        })),

      addCard: (boardId, listId, card) => {
        // Limitar o número de anexos por cartão
        const attachments = card.attachments || [];
        if (attachments.length > 5) {
          useToastStore
            .getState()
            .addToast("Limite máximo de 5 anexos por cartão atingido", "error");
          return;
        }

        // Verificar tamanho total dos anexos
        const totalSize = attachments.reduce((acc, curr) => acc + curr.size, 0);
        if (totalSize > 10 * 1024 * 1024) {
          // 10MB total
          useToastStore
            .getState()
            .addToast("Tamanho total dos anexos excede 10MB", "error");
          return;
        }

        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map((list) =>
                    list.id === listId
                      ? {
                          ...list,
                          cards: [
                            ...list.cards,
                            {
                              ...card,
                              id: uuidv4(),
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              attachments,
                            },
                          ],
                          updatedAt: new Date().toISOString(),
                        }
                      : list
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : board
          ),
        }));
      },

      updateCard: (boardId, listId, cardId, updatedCard) => {
        // Verificar limite de anexos
        const currentCard = get()
          .boards.find((b) => b.id === boardId)
          ?.lists.find((l) => l.id === listId)
          ?.cards.find((c) => c.id === cardId);

        const newAttachments =
          updatedCard.attachments || currentCard?.attachments || [];
        if (newAttachments.length > 5) {
          useToastStore
            .getState()
            .addToast("Limite máximo de 5 anexos por cartão atingido", "error");
          return;
        }

        // Verificar tamanho total dos anexos
        const totalSize = newAttachments.reduce(
          (acc, curr) => acc + curr.size,
          0
        );
        if (totalSize > 10 * 1024 * 1024) {
          // 10MB total
          useToastStore
            .getState()
            .addToast("Tamanho total dos anexos excede 10MB", "error");
          return;
        }

        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map((list) =>
                    list.id === listId
                      ? {
                          ...list,
                          cards: list.cards.map((card) =>
                            card.id === cardId
                              ? {
                                  ...card,
                                  ...updatedCard,
                                  attachments: newAttachments,
                                  updatedAt: new Date().toISOString(),
                                }
                              : card
                          ),
                          updatedAt: new Date().toISOString(),
                        }
                      : list
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : board
          ),
        }));
      },

      deleteCard: (boardId, listId, cardId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map((list) =>
                    list.id === listId
                      ? {
                          ...list,
                          cards: list.cards.filter(
                            (card) => card.id !== cardId
                          ),
                        }
                      : list
                  ),
                }
              : board
          ),
        })),

      moveCard: (boardId, fromListId, toListId, cardId) => {
        if (fromListId === toListId) return;

        set((state) => {
          // Encontrar o cartão na lista de origem
          const board = state.boards.find((b) => b.id === boardId);
          if (!board) return state;

          const fromList = board.lists?.find((l) => l.id === fromListId);
          if (!fromList) return state;

          const cardIndex = fromList.cards?.findIndex((c) => c.id === cardId);
          if (cardIndex === undefined || cardIndex === -1) return state;

          const card = fromList.cards?.[cardIndex];
          if (!card) return state;

          // Remover o cartão da lista de origem e adicioná-lo à lista de destino
          const updatedBoards = state.boards.map((board) => {
            if (board.id === boardId) {
              return {
                ...board,
                lists: board.lists?.map((list) => {
                  if (list.id === fromListId) {
                    return {
                      ...list,
                      cards: list.cards?.filter((c) => c.id !== cardId) || [],
                    };
                  }
                  if (list.id === toListId) {
                    return {
                      ...list,
                      cards: [...(list.cards || []), card],
                    };
                  }
                  return list;
                }),
              };
            }
            return board;
          });

          // Verificar automações para cartão movido
          checkAndExecuteAutomations(boardId, "card_moved", {
            fromListId,
            toListId,
            card,
          });

          return { boards: updatedBoards };
        });
      },

      setCompletedList: (boardId, listId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId ? { ...board, completedListId: listId } : board
          ),
        })),

      getCompletedListId: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        return board?.completedListId || null;
      },

      duplicateList: (boardId, listId) =>
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          if (!board) return state;

          const list = board.lists.find((l) => l.id === listId);
          if (!list) return state;

          const newList = {
            ...list,
            id: generateId(),
            title: `${list.title} (Cópia)`,
            cards: list.cards.map((card) => ({ ...card, id: generateId() })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            boards: state.boards.map((b) =>
              b.id === boardId ? { ...b, lists: [...b.lists, newList] } : b
            ),
          };
        }),

      duplicateCard: (boardId, listId, cardId) =>
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          if (!board) return state;

          const list = board.lists.find((l) => l.id === listId);
          if (!list) return state;

          const card = list.cards.find((c) => c.id === cardId);
          if (!card) return state;

          const newCard = {
            ...card,
            id: generateId(),
            title: card.title,
            subtasks:
              card.subtasks?.map((subtask) => ({
                ...subtask,
                id: generateId(),
              })) || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            boards: state.boards.map((b) =>
              b.id === boardId
                ? {
                    ...b,
                    lists: b.lists.map((l) =>
                      l.id === listId
                        ? { ...l, cards: [...l.cards, newCard] }
                        : l
                    ),
                  }
                : b
            ),
          };
        }),

      addAttachment: (boardId, listId, cardId, file) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map((list) =>
                    list.id === listId
                      ? {
                          ...list,
                          cards: list.cards.map((card) =>
                            card.id === cardId
                              ? {
                                  ...card,
                                  attachments: [
                                    ...(card.attachments || []),
                                    {
                                      id: uuidv4(),
                                      ...file,
                                      createdAt: new Date().toISOString(),
                                    },
                                  ],
                                  updatedAt: new Date().toISOString(),
                                }
                              : card
                          ),
                          updatedAt: new Date().toISOString(),
                        }
                      : list
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : board
          ),
        })),

      deleteAttachment: (boardId, listId, cardId, attachmentId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map((list) =>
                    list.id === listId
                      ? {
                          ...list,
                          cards: list.cards.map((card) =>
                            card.id === cardId
                              ? {
                                  ...card,
                                  attachments: (card.attachments || []).filter(
                                    (attachment) =>
                                      attachment.id !== attachmentId
                                  ),
                                  updatedAt: new Date().toISOString(),
                                }
                              : card
                          ),
                          updatedAt: new Date().toISOString(),
                        }
                      : list
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : board
          ),
        })),

      // Função para limpar dados antigos
      cleanupStorage: () =>
        set((state) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const cleanedBoards = state.boards.map((board) => ({
            ...board,
            lists: board.lists.map((list) => ({
              ...list,
              // Limpar cartões antigos concluídos
              cards: list.cards
                .filter((card) => {
                  if (board.completedListId === list.id) {
                    const cardDate = new Date(card.updatedAt || card.createdAt);
                    return cardDate > thirtyDaysAgo;
                  }
                  return true;
                })
                // Limpar dados desnecessários dos cartões
                .map((card) => ({
                  ...card,
                  // Manter apenas os últimos 10 comentários
                  comments: card.comments?.slice(-10) || [],
                  // Manter apenas os últimos 5 anexos
                  attachments: card.attachments?.slice(-5) || [],
                  // Limpar histórico antigo
                  history: card.history?.slice(-20) || [],
                })),
            })),
          }));

          return { boards: cleanedBoards };
        }),
    }),
    {
      name: "kanban-store",
      onRehydrateStorage: () => (state) => {
        // Não injeta mais board inicial
        return state;
      },
    }
  )
);
