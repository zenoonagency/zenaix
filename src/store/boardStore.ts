import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardService } from "../services/board.service";
import {
  Board,
  InputCreateBoardDTO,
  InputUpdateBoardDTO,
} from "../types/board";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { useListStore } from "./listStore";
import { APIError } from "../services/errors/api.errors";
import { OutputListDTO } from "../types/list";
import { AttachmentDTO, OutputCardDTO, SubtaskDTO } from "../types/card";

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  selectedBoard: Board | null;
  lastFetched: number | null;
  activeBoardId: string | null;
  lastUsedBoardId: string | null;
  activeBoard: Board | null;

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;

  setSelectedBoard: (board: Board | null) => void;
  setActiveBoardId: (boardId: string | null) => void;
  setLastUsedBoardId: (boardId: string | null) => void;
  setActiveBoard: (board: Board | null) => void;
  selectActiveBoard: (boards: Board[]) => void;

  addListToActiveBoard: (list: OutputListDTO) => void;
  updateListInActiveBoard: (list: OutputListDTO) => void;
  removeListFromActiveBoard: (listId: string) => void;
  addCardToActiveBoard: (card: OutputCardDTO) => void;
  updateCardInActiveBoard: (card: OutputCardDTO) => void;
  removeCardFromActiveBoard: (cardId: string, listId: string) => void;
  addSubtaskToCard: (subtask: SubtaskDTO) => void;
  updateSubtaskInCard: (subtask: SubtaskDTO) => void;
  removeSubtaskFromCard: (subtask: { id: string; card_id: string }) => void;
  addAttachmentToCard: (attachment: AttachmentDTO) => void;
  updateAttachmentInCard: (attachment: AttachmentDTO) => void;
  removeAttachmentFromCard: (attachment: {
    id: string;
    card_id: string;
  }) => void;

  fetchAllBoards: (token: string, organizationId: string) => Promise<void>;
  fetchFullBoard: (boardId: string) => Promise<void>;
  selectAndLoadBoard: (boardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      isLoading: false,
      error: null,
      selectedBoard: null,
      lastFetched: null,
      activeBoardId: null,
      lastUsedBoardId: null,
      activeBoard: null,

      setBoards: (boards) => {
        set({ boards });
        // Após definir os boards, selecionar o ativo automaticamente
        get().selectActiveBoard(boards);
      },

      addBoard: (board) => {
        set((state) => ({
          boards: state.boards.some((b) => b.id === board.id)
            ? state.boards
            : [...state.boards, board],
        }));
        // Após adicionar um board, selecioná-lo como ativo
        get().setActiveBoardId(board.id);
        get().setLastUsedBoardId(board.id);
      },

      updateBoard: (board) => {
        set((state) => ({
          boards: state.boards.map((b) => (b.id === board.id ? board : b)),
        }));
      },

      removeBoard: (boardId) => {
        set((state) => {
          const newBoards = state.boards.filter((b) => b.id !== boardId);

          // Se o board removido era o ativo, selecionar outro
          let newActiveBoardId = state.activeBoardId;
          if (state.activeBoardId === boardId) {
            newActiveBoardId = newBoards.length > 0 ? newBoards[0].id : null;
          }

          // Se o board removido era o último usado, limpar
          let newLastUsedBoardId = state.lastUsedBoardId;
          if (state.lastUsedBoardId === boardId) {
            newLastUsedBoardId = newBoards.length > 0 ? newBoards[0].id : null;
          }

          return {
            boards: newBoards,
            activeBoardId: newActiveBoardId,
            lastUsedBoardId: newLastUsedBoardId,
          };
        });
      },

      addListToActiveBoard: (list) => {
        set((state) => {
          if (
            !state.activeBoard ||
            state.activeBoard.lists.some((l) => l.id === list.id)
          )
            return {};

          // CORREÇÃO: Adiciona a propriedade 'cards' em falta ao novo objeto de lista.
          const newListWithCards = { ...list, cards: [] };

          return {
            activeBoard: {
              ...state.activeBoard,
              lists: [...state.activeBoard.lists, newListWithCards],
            },
          };
        });
      },
      updateListInActiveBoard: (updatedList) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) =>
                list.id === updatedList.id ? { ...list, ...updatedList } : list
              ),
            },
          };
        });
      },
      removeListFromActiveBoard: (listId) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.filter(
                (list) => list.id !== listId
              ),
            },
          };
        });
      },
      addCardToActiveBoard: (card) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => {
                if (
                  list.id === card.list_id &&
                  !list.cards.some((c) => c.id === card.id)
                ) {
                  return { ...list, cards: [...list.cards, card] };
                }
                return list;
              }),
            },
          };
        });
      },
      updateCardInActiveBoard: (updatedCard) => {
        set((state) => {
          if (!state.activeBoard) return {};

          const newLists = state.activeBoard.lists.map((list) => {
            // Remove o cartão da sua lista antiga (se ele mudou de lista)
            const filteredCards = list.cards.filter(
              (c) => c.id !== updatedCard.id
            );

            // Adiciona o cartão atualizado à sua nova lista
            if (list.id === updatedCard.list_id) {
              return { ...list, cards: [...filteredCards, updatedCard] };
            }

            return { ...list, cards: filteredCards };
          });

          return {
            activeBoard: {
              ...state.activeBoard,
              lists: newLists,
            },
          };
        });
      },
      removeCardFromActiveBoard: (cardId, listId) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => {
                if (list.id === listId) {
                  return {
                    ...list,
                    cards: list.cards.filter((card) => card.id !== cardId),
                  };
                }
                return list;
              }),
            },
          };
        });
      },

      setSelectedBoard: (board) => set({ selectedBoard: board }),

      setActiveBoardId: (boardId) => {
        set({ activeBoardId: boardId });
        if (boardId) {
          get().setLastUsedBoardId(boardId);
        }
      },

      setLastUsedBoardId: (boardId) => set({ lastUsedBoardId: boardId }),

      setActiveBoard: (board) => set({ activeBoard: board }),

      selectActiveBoard: (boards: Board[]) => {
        const state = get();

        if (boards.length === 0) {
          set({ activeBoardId: null });
          return;
        }

        if (
          state.activeBoardId &&
          boards.some((b) => b.id === state.activeBoardId)
        ) {
          return;
        }

        if (
          state.lastUsedBoardId &&
          boards.some((b) => b.id === state.lastUsedBoardId)
        ) {
          set({ activeBoardId: state.lastUsedBoardId });
          return;
        }

        set({ activeBoardId: boards[0].id });
      },

      fetchAllBoards: async (token: string, organizationId: string) => {
        if (!token || !organizationId) {
          console.error("Token ou organizationId não fornecidos");
          return;
        }

        if (get().isLoading) {
          return;
        }

        if (get().boards.length === 0) {
          set({ isLoading: true });
        }

        try {
          const boards = await boardService.getBoards(token, organizationId);

          set({
            boards,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          });

          get().selectActiveBoard(boards);

          const activeId = get().activeBoardId;
          if (activeId) {
            console.log(`[BoardStore] A revalidar o quadro ativo: ${activeId}`);
            get().fetchFullBoard(activeId);
          }
        } catch (error: any) {
          console.error("Erro ao buscar quadros:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar quadros";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      fetchFullBoard: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error("Token ou organização não encontrados");
          return;
        }

        set({ isLoading: true });
        try {
          const board = await boardService.getBoardById(
            token,
            organization.id,
            boardId
          );

          get().updateBoard(board);
          set({
            selectedBoard: board,
            activeBoard: board,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Erro ao buscar quadro:", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar quadro";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      selectAndLoadBoard: async (boardId: string) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error("Token ou organização não encontrados");
          return;
        }

        try {
          get().setActiveBoardId(boardId);
          get().setLastUsedBoardId(boardId);

          await get().fetchFullBoard(boardId);
        } catch (error: any) {
          console.error("Erro ao carregar board:", error);
          const errorMessage =
            error?.message || error?.error || "Erro ao carregar quadro";
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      addSubtaskToCard: (subtask) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => {
                  if (card.id === subtask.card_id) {
                    // Adiciona a nova subtarefa, prevenindo duplicados
                    const subtaskExists = card.subtasks.some(
                      (s) => s.id === subtask.id
                    );
                    return {
                      ...card,
                      subtasks: subtaskExists
                        ? card.subtasks
                        : [...card.subtasks, subtask],
                    };
                  }
                  return card;
                }),
              })),
            },
          };
        });
      },

      updateSubtaskInCard: (updatedSubtask) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => {
                  if (card.id === updatedSubtask.card_id) {
                    return {
                      ...card,
                      subtasks: card.subtasks.map((subtask) =>
                        subtask.id === updatedSubtask.id
                          ? updatedSubtask
                          : subtask
                      ),
                    };
                  }
                  return card;
                }),
              })),
            },
          };
        });
      },

      removeSubtaskFromCard: (subtaskInfo) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => {
                  if (card.id === subtaskInfo.card_id) {
                    return {
                      ...card,
                      subtasks: card.subtasks.filter(
                        (subtask) => subtask.id !== subtaskInfo.id
                      ),
                    };
                  }
                  return card;
                }),
              })),
            },
          };
        });
      },
      addAttachmentToCard: (attachment) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => {
                  if (card.id === attachment.card_id) {
                    const attachmentExists = card.attachments.some(
                      (a) => a.id === attachment.id
                    );
                    return {
                      ...card,
                      attachments: attachmentExists
                        ? card.attachments
                        : [...card.attachments, attachment],
                    };
                  }
                  return card;
                }),
              })),
            },
          };
        });
      },

      updateAttachmentInCard: (updatedAttachment) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => {
                  if (card.id === updatedAttachment.card_id) {
                    return {
                      ...card,
                      attachments: card.attachments.map((attachment) =>
                        attachment.id === updatedAttachment.id
                          ? updatedAttachment
                          : attachment
                      ),
                    };
                  }
                  return card;
                }),
              })),
            },
          };
        });
      },

      removeAttachmentFromCard: (attachmentInfo) => {
        set((state) => {
          if (!state.activeBoard) return {};
          return {
            activeBoard: {
              ...state.activeBoard,
              lists: state.activeBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => {
                  if (card.id === attachmentInfo.card_id) {
                    return {
                      ...card,
                      attachments: card.attachments.filter(
                        (attachment) => attachment.id !== attachmentInfo.id
                      ),
                    };
                  }
                  return card;
                }),
              })),
            },
          };
        });
      },
    }),
    {
      name: "board-store",
      partialize: (state) => ({
        boards: state.boards,
        lastFetched: state.lastFetched,
        activeBoardId: state.activeBoardId,
        lastUsedBoardId: state.lastUsedBoardId,
        activeBoard: state.activeBoard,
      }),
    }
  )
);
