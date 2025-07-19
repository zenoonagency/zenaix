import { create } from "zustand";
import { persist } from "zustand/middleware";
import { KanbanState, Board, Card, List } from "../types";
import { generateId } from "../utils/generateId";
import {
  kanbanService,
  Board as SupaBoard,
  List as SupaList,
  Card as SupaCard,
} from "../services/kanbanService";

interface ExtendedBoard extends Board {
  lists?: (List & { cards?: Card[] })[];
  completedListId?: string;
}

// Função para throttle (limitar a frequência de chamadas)
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Função para debounce (atrasar a chamada até que a atividade pare)
const debounce = (func: Function, delay: number) => {
  let debounceTimer: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
};

export const useKanbanStore = create<
  KanbanState & {
    setCompletedList: (boardId: string, listId: string) => void;
    getCompletedListId: (boardId: string) => string | undefined;
  }
>()(
  persist(
    (set, get) => {
      // Helper para armazenar configurações locais que não estão no Supabase
      const localSettings = {
        completedLists: {} as Record<string, string>,
      };

      // Helper para converter objetos do Supabase para o formato do aplicativo
      const mappers = {
        boardToExtendedBoard: (
          board: SupaBoard & { lists?: (SupaList & { cards?: SupaCard[] })[] }
        ): ExtendedBoard => {
          // Preserve o que estiver no estado atual se o board já existir
          const currentBoard = get().boards.find((b) => b.id === board.id);

          return {
            ...currentBoard,
            id: board.id,
            title: board.title,
            description: board.description,
            user_id: board.user_id,
            lists: board.lists?.map((list) => ({
              ...list,
              cards: list.cards || [],
            })),
            createdAt: board.created_at,
            updatedAt: board.updated_at,
          };
        },
      };

      // Versões throttled e debounced das funções de serviço
      const throttledFetch = throttle(async () => {
        try {
          if (get().isLoading) return;

          set({ isLoading: true, error: null });

          const boards = await kanbanService.getBoards();
          set({
            boards: boards.map(mappers.boardToExtendedBoard),
            isLoading: false,
          });
        } catch (error) {
          console.error("[KanbanStore] Erro throttled fetch:", error);
          set({ isLoading: false, error: error as Error });
        }
      }, 2000); // No máximo uma chamada a cada 2 segundos

      const debouncedFetchBoard = debounce(async (id: string) => {
        try {
          if (!id || get().isLoading) return;

          const boardDetails = await kanbanService.getBoardDetails(id);

          set((state) => ({
            boards: state.boards.map((board) =>
              board.id === id
                ? mappers.boardToExtendedBoard(boardDetails)
                : board
            ),
          }));
        } catch (error) {
          console.error(
            `[KanbanStore] Erro ao carregar detalhes do board ${id}:`,
            error
          );
        }
      }, 500); // Espera 500ms de inatividade antes de executar

      return {
        boards: [] as ExtendedBoard[],
        activeBoard: null,
        isLoading: false,
        error: null,

        // Carregar todos os quadros
        fetchBoards: async () => {
          try {
            // Impede várias chamadas simultâneas
            if (get().isLoading) return;

            set({ isLoading: true, error: null });

            const boards = await kanbanService.getBoards();
            set({
              boards: boards.map(mappers.boardToExtendedBoard),
              isLoading: false,
            });
          } catch (error) {
            console.error("[KanbanStore] Erro ao carregar quadros:", error);
            set({ isLoading: false, error: error as Error });
          }
        },

        // Carregar detalhes de um quadro específico
        fetchBoardDetails: async (id) => {
          try {
            // Evitar chamadas desnecessárias
            if (!id || get().isLoading) return {} as ExtendedBoard;

            set({ isLoading: true, error: null });

            const boardDetails = await kanbanService.getBoardDetails(id);

            // Uso do mapper para garantir consistência
            const mappedBoard = mappers.boardToExtendedBoard(boardDetails);

            // Atualizar apenas o quadro específico sem substituir toda a lista
            set((state) => ({
              boards: state.boards.map((board) =>
                board.id === id ? mappedBoard : board
              ),
              isLoading: false,
            }));

            return mappedBoard;
          } catch (error) {
            console.error(
              "[KanbanStore] Erro ao carregar detalhes do quadro:",
              error
            );
            set({ isLoading: false, error: error as Error });
            return {} as ExtendedBoard;
          }
        },

        // Definir quadro ativo
        setActiveBoard: (id) => {
          set({ activeBoard: id });

          // Se um quadro for ativado, busca seus detalhes em segundo plano
          if (id) {
            debouncedFetchBoard(id);
          }
        },

        // Adicionar novo quadro
        addBoard: async (title, description) => {
          try {
            const newBoard = await kanbanService.createBoard(
              title,
              description
            );

            // Usar o mapper para garantir consistência
            const mappedBoard = mappers.boardToExtendedBoard(newBoard);

            set((state) => ({
              boards: [...state.boards, mappedBoard],
            }));

            return newBoard;
          } catch (error) {
            console.error("[KanbanStore] Erro ao criar quadro:", error);
            throw error;
          }
        },

        // Atualizar quadro
        updateBoard: async (id, updates) => {
          try {
            const updatedBoard = await kanbanService.updateBoard(id, updates);

            // Otimização: atualizar apenas os campos necessários
            set((state) => ({
              boards: state.boards.map((board) =>
                board.id === id
                  ? { ...board, ...mappers.boardToExtendedBoard(updatedBoard) }
                  : board
              ),
            }));

            return updatedBoard;
          } catch (error) {
            console.error("[KanbanStore] Erro ao atualizar quadro:", error);
            throw error;
          }
        },

        // Excluir quadro
        deleteBoard: async (id) => {
          try {
            await kanbanService.deleteBoard(id);

            set((state) => ({
              boards: state.boards.filter((board) => board.id !== id),
              activeBoard: state.activeBoard === id ? null : state.activeBoard,
            }));

            return true;
          } catch (error) {
            console.error("[KanbanStore] Erro ao excluir quadro:", error);
            throw error;
          }
        },

        // Funções de lista removidas - agora usando listStore e listService

        // Adicionar cartão
        addCard: async (listId, title, description) => {
          try {
            // Obter o número de cartões existentes para definir a posição
            let listPosition = 0;
            let foundBoard = null;

            // Encontrar a lista e seu quadro pai
            for (const board of get().boards) {
              const list = board.lists?.find((l) => l.id === listId);
              if (list) {
                listPosition = list.cards?.length || 0;
                foundBoard = board;
                break;
              }
            }

            if (!foundBoard) {
              throw new Error(`Lista ${listId} não encontrada`);
            }

            const newCard = await kanbanService.createCard(
              listId,
              title,
              listPosition,
              description
            );

            // Atualização otimizada do estado
            set((state) => ({
              boards: state.boards.map((board) => {
                // Se não for o board correto, retorna sem modificar
                if (board.id !== foundBoard?.id) return board;

                return {
                  ...board,
                  lists: board.lists?.map((list) => {
                    // Se não for a lista correta, retorna sem modificar
                    if (list.id !== listId) return list;

                    return {
                      ...list,
                      cards: [
                        ...(list.cards || []),
                        {
                          ...newCard,
                          // Garantir propriedades específicas do aplicativo
                          id: newCard.id,
                          listId: newCard.list_id,
                          position: newCard.position,
                          createdAt: newCard.created_at,
                          updatedAt: newCard.updated_at,
                        },
                      ],
                    };
                  }),
                };
              }),
            }));

            return newCard;
          } catch (error) {
            console.error("[KanbanStore] Erro ao criar cartão:", error);
            throw error;
          }
        },

        // Atualizar cartão
        updateCard: async (id, updates) => {
          try {
            const updatedCard = await kanbanService.updateCard(id, updates);

            // Atualização otimizada do estado
            set((state) => ({
              boards: state.boards.map((board) => {
                // Pular boards sem listas
                if (!board.lists) return board;

                // Verificar se alguma lista neste board tem o cartão
                let hasCard = false;
                for (const list of board.lists) {
                  if (list.cards?.some((card) => card.id === id)) {
                    hasCard = true;
                    break;
                  }
                }

                // Se não tiver o cartão, retorna sem modificar
                if (!hasCard) return board;

                return {
                  ...board,
                  lists: board.lists.map((list) => {
                    // Pular listas sem cartões
                    if (!list.cards) return list;

                    // Se a lista contém o cartão, atualizá-lo
                    if (list.cards.some((card) => card.id === id)) {
                      return {
                        ...list,
                        cards: list.cards.map((card) =>
                          card.id === id
                            ? {
                                ...card,
                                ...updatedCard,
                                // Garantir propriedades específicas do aplicativo
                                listId: updatedCard.list_id,
                                createdAt: updatedCard.created_at,
                                updatedAt: updatedCard.updated_at,
                              }
                            : card
                        ),
                      };
                    }

                    return list;
                  }),
                };
              }),
            }));

            return updatedCard;
          } catch (error) {
            console.error("[KanbanStore] Erro ao atualizar cartão:", error);
            throw error;
          }
        },

        // Excluir cartão
        deleteCard: async (id) => {
          try {
            await kanbanService.deleteCard(id);

            // Atualização otimizada do estado
            set((state) => ({
              boards: state.boards.map((board) => {
                // Pular boards sem listas
                if (!board.lists) return board;

                return {
                  ...board,
                  lists: board.lists.map((list) => {
                    // Pular listas sem cartões
                    if (!list.cards) return list;

                    // Se a lista contém o cartão, removê-lo
                    if (list.cards.some((card) => card.id === id)) {
                      return {
                        ...list,
                        cards: list.cards.filter((card) => card.id !== id),
                      };
                    }

                    return list;
                  }),
                };
              }),
            }));

            return true;
          } catch (error) {
            console.error("[KanbanStore] Erro ao excluir cartão:", error);
            throw error;
          }
        },

        // Mover cartão
        moveCard: async (cardId, toListId, newPosition) => {
          try {
            const movedCard = await kanbanService.moveCard(
              cardId,
              toListId,
              newPosition
            );

            // Esta operação é mais complexa no estado local
            // Para garantir que não tenha inconsistências, vamos recarregar
            // os detalhes do board atual
            const boardId = get().activeBoard;
            if (boardId) {
              // Recarregar detalhes do quadro atual de forma não bloqueante
              debouncedFetchBoard(boardId);
            }

            return movedCard;
          } catch (error) {
            console.error("[KanbanStore] Erro ao mover cartão:", error);
            throw error;
          }
        },

        // Configuração: lista de concluídos
        setCompletedList: (boardId, listId) => {
          localSettings.completedLists[boardId] = listId;
          localStorage.setItem(
            "kanbanCompletedLists",
            JSON.stringify(localSettings.completedLists)
          );
        },

        getCompletedListId: (boardId) => {
          // Tentar carregar do localStorage se não estiver em memória
          if (!Object.keys(localSettings.completedLists).length) {
            try {
              const saved = localStorage.getItem("kanbanCompletedLists");
              if (saved) {
                localSettings.completedLists = JSON.parse(saved);
              }
            } catch (e) {
              console.error("Erro ao carregar configurações:", e);
            }
          }

          return localSettings.completedLists[boardId];
        },

        duplicateBoard: (id) =>
          set((state) => {
            const board = state.boards.find((b) => b.id === id);
            if (!board) return state;

            const newBoard = {
              ...board,
              id: generateId(),
              title: `${board.title} (Cópia)`,
              lists: board.lists?.map((list) => ({
                ...list,
                id: generateId(),
                cards: list.cards?.map((card) => ({
                  ...card,
                  id: generateId(),
                })),
              })),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            return { boards: [...state.boards, newBoard] };
          }),

        toggleBoardVisibility: (id) =>
          set((state) => ({
            boards: state.boards.map((board) =>
              board.id === id ? { ...board, hidden: !board.hidden } : board
            ),
          })),

        duplicateList: (boardId, listId) =>
          set((state) => {
            const board = state.boards.find((b) => b.id === boardId);
            if (!board) return state;

            const list = board.lists?.find((l) => l.id === listId);
            if (!list) return state;

            const newList = {
              ...list,
              id: generateId(),
              title: `${list.title} (Cópia)`,
              cards: list.cards?.map((card) => ({ ...card, id: generateId() })),
            };

            return {
              boards: state.boards.map((b) =>
                b.id === boardId
                  ? {
                      ...b,
                      lists: [...(b.lists || []), newList],
                      updatedAt: new Date().toISOString(),
                    }
                  : b
              ),
            };
          }),

        duplicateCard: (boardId, listId, cardId) =>
          set((state) => {
            const board = state.boards.find((b) => b.id === boardId);
            if (!board) return state;

            const list = board.lists?.find((l) => l.id === listId);
            if (!list) return state;

            const card = list.cards?.find((c) => c.id === cardId);
            if (!card) return state;

            const newCard = {
              ...card,
              id: generateId(),
              title: `${card.title} (Cópia)`,
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
                      lists: b.lists?.map((l) =>
                        l.id === listId
                          ? { ...l, cards: [...(l.cards || []), newCard] }
                          : l
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : b
              ),
            };
          }),
      };
    },
    {
      name: "kanban-store",
      partialize: (state) => ({
        // Armazenar apenas os dados mínimos para restaurar o estado
        activeBoard: state.activeBoard,
        // Não persistir dados que podem ser recarregados do backend
        boards: [],
      }),
    }
  )
);
