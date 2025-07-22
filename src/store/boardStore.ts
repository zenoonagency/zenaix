import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardService } from "../services/board.service";
import { Board, TopSellersResponse } from "../types/board";
import { useAuthStore } from "./authStore";
import { useToastStore } from "../components/Notification";
import { APIError } from "../services/errors/api.errors";
import { OutputListDTO } from "../types/list";
import { AttachmentDTO, OutputCardDTO, SubtaskDTO } from "../types/card";
import { cleanUserData } from "../utils/dataOwnership";

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  selectedBoard: Board | null;
  lastFetched: number | null;

  activeBoardId: string | null;
  lastUsedBoardId: string | null;
  activeBoard: Board | null;
  setActiveBoardId: (boardId: string | null) => void;
  setLastUsedBoardId: (boardId: string | null) => void;
  setActiveBoard: (board: Board | null) => void;
  selectActiveBoard: (boards: Board[]) => void;
  fetchFullBoard: (boardId: string) => Promise<void>;
  selectAndLoadKanbanBoard: (boardId: string) => Promise<void>;

  boardDashboardActiveId: string | null;
  boardDashboardActive: Board | null;
  lastUsedDashboardBoardId: string | null;
  setBoardDashboardActiveId: (boardId: string | null) => void;
  setBoardDashboardActive: (board: Board | null) => void;
  setLastUsedDashboardBoardId: (boardId: string | null) => void;
  selectDashboardBoard: (boards: Board[]) => void;
  fetchFullDashboardBoard: (boardId: string) => Promise<void>;
  selectAndLoadDashboardBoard: (boardId: string) => Promise<void>;
  topSellers: TopSellersResponse;

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  cleanUserData: () => void;

  setSelectedBoard: (board: Board | null) => void;
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
  fetchTopSellers: (boardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      isLoading: false,
      error: null,
      selectedBoard: null,
      lastFetched: null,
      // --- Kanban (Quadro principal) ---
      activeBoardId: null,
      lastUsedBoardId: null,
      activeBoard: null,
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
      selectAndLoadKanbanBoard: async (boardId: string) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error("Token ou organização não encontrados");
          return;
        }
        try {
          get().setActiveBoardId(boardId);
          get().setLastUsedBoardId(boardId);
          await get().fetchFullBoard(boardId);
          const board =
            get().boards.find((b) => b.id === boardId) || get().activeBoard;
          set({ activeBoardId: boardId, activeBoard: board });
        } catch (error: any) {
          console.error("Erro ao carregar board (Kanban):", error);
          const errorMessage =
            error?.message || error?.error || "Erro ao carregar quadro";
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },

      // --- Dashboard ---
      boardDashboardActiveId: null,
      boardDashboardActive: null,
      lastUsedDashboardBoardId: null,
      setBoardDashboardActiveId: (boardId) => {
        set({ boardDashboardActiveId: boardId });
        const board = get().boards.find((b) => b.id === boardId) || null;
        set({ boardDashboardActive: board });
        if (boardId) {
          get().setLastUsedDashboardBoardId(boardId);
        }
      },
      setBoardDashboardActive: (board) => set({ boardDashboardActive: board }),
      setLastUsedDashboardBoardId: (boardId) =>
        set({ lastUsedDashboardBoardId: boardId }),
      selectDashboardBoard: (boards: Board[]) => {
        const state = get();
        if (boards.length === 0) {
          set({ boardDashboardActiveId: null });
          return;
        }

        // Se já tem um board ativo e ele ainda existe, manter
        if (
          state.boardDashboardActiveId &&
          boards.some((b) => b.id === state.boardDashboardActiveId)
        ) {
          return;
        }

        // Se tem último board usado e ele ainda existe, usar ele
        if (
          state.lastUsedDashboardBoardId &&
          boards.some((b) => b.id === state.lastUsedDashboardBoardId)
        ) {
          set({ boardDashboardActiveId: state.lastUsedDashboardBoardId });
          const board =
            boards.find((b) => b.id === state.lastUsedDashboardBoardId) || null;
          set({ boardDashboardActive: board });
          return;
        }

        // Caso contrário, usar o primeiro board
        set({ boardDashboardActiveId: boards[0].id });
        set({ boardDashboardActive: boards[0] });
      },
      fetchFullDashboardBoard: async (boardId) => {
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
            boardDashboardActive: board,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Erro ao buscar quadro (Dashboard):", error);
          const errorMessage =
            error instanceof APIError
              ? error.message
              : error?.message || error?.error || "Erro ao buscar quadro";
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },
      selectAndLoadDashboardBoard: async (boardId: string) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization.id) {
          console.error("Token ou organização não encontrados");
          return;
        }
        try {
          get().setBoardDashboardActiveId(boardId);
          get().setLastUsedDashboardBoardId(boardId);
          await get().fetchFullDashboardBoard(boardId);
          const board =
            get().boards.find((b) => b.id === boardId) ||
            get().boardDashboardActive;
          set({ boardDashboardActiveId: boardId, boardDashboardActive: board });
        } catch (error: any) {
          console.error("Erro ao carregar board (Dashboard):", error);
          const errorMessage =
            error?.message || error?.error || "Erro ao carregar quadro";
          useToastStore.getState().addToast(errorMessage, "error");
        }
      },
      topSellers: { data: [] },

      setBoards: (boards) => {
        set({ boards });
        get().selectActiveBoard(boards);
        // Atualizar boardDashboardActive se boardDashboardActiveId existir
        const boardId = get().boardDashboardActiveId;
        if (boardId) {
          const board = boards.find((b) => b.id === boardId) || null;
          set({ boardDashboardActive: board });
        }
      },

      addBoard: (board) => {
        set((state) => {
          const boardExists = state.boards.some((b) => b.id === board.id);
          const newBoards = boardExists
            ? state.boards.map((b) => (b.id === board.id ? board : b))
            : [...state.boards, board];

          return {
            boards: newBoards,
            activeBoardId: board.id,
            lastUsedBoardId: board.id,
            activeBoard: board,
          };
        });
      },

      updateBoard: (board) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === board.id ? { ...b, ...board } : b
          ),
          activeBoard:
            state.activeBoard?.id === board.id
              ? { ...state.activeBoard, ...board }
              : state.activeBoard,
        }));
      },

      removeBoard: (boardId) => {
        const stateBefore = get();
        const wasActive = stateBefore.activeBoardId === boardId;

        const newBoards = stateBefore.boards.filter((b) => b.id !== boardId);
        set({ boards: newBoards });

        if (wasActive) {
          if (newBoards.length > 0) {
            const lastUsedIsValid = newBoards.some(
              (b) => b.id === stateBefore.lastUsedBoardId
            );
            const nextBoardIdToLoad = lastUsedIsValid
              ? stateBefore.lastUsedBoardId
              : newBoards[0].id;

            if (nextBoardIdToLoad) {
              get().selectActiveBoard(newBoards); // Use the new selectActiveBoard
            }
          } else {
            set({
              activeBoardId: null,
              lastUsedBoardId: null,
              activeBoard: null,
            });
          }
        }
      },

      addListToActiveBoard: (list) => {
        set((state) => {
          if (
            !state.activeBoard ||
            state.activeBoard.lists.some((l) => l.id === list.id)
          )
            return {};

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
          get().selectDashboardBoard(boards);

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

      fetchTopSellers: async (boardId) => {
        const { token, organization } = useAuthStore.getState();
        if (!token || !organization?.id || !boardId) return;
        try {
          const sellers = await boardService.getTopSellers(
            token,
            organization.id,
            boardId
          );
          set({ topSellers: sellers });
        } catch (error) {
          set({ topSellers: { data: [] } });
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
      cleanUserData: () => {
        const { boards } = get();
        const filtered = cleanUserData(boards);
        set({ boards: filtered });
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
        boardDashboardActiveId: state.boardDashboardActiveId,
        boardDashboardActive: state.boardDashboardActive,
        lastUsedDashboardBoardId: state.lastUsedDashboardBoardId,
      }),
    }
  )
);
