import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  LayoutGrid,
  CheckSquare,
  Search,
  X,
  Zap,
  Settings,
} from "lucide-react";
import { useBoardStore } from "../../store/boardStore";
import { KanbanBoard } from "./components/KanbanBoard";
import { useThemeStore } from "../../store/themeStore";
import { useCustomModal } from "../../components/CustomModal";
import { useToast } from "../../hooks/useToast";
import { BoardSelector } from "./components/BoardSelector";
import { Board } from "../../types/board";
import { SearchCardModal } from "./components/SearchCardModal";
import { CardDetailModal } from "./components/CardDetailModal";
import { AutomationModal } from "./components/AutomationModal";
import { BoardConfigModal } from "./components/BoardConfigModal";
import { boardService } from "../../services/board.service";
import { useAuthStore } from "../../store/authStore";
import { InputCreateBoardDTO } from "../../types/board";
import { OutputCardDTO } from "../../types/card";

export function Clients() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { showToast } = useToast();
  const { token, organization } = useAuthStore();

  // BoardStore (dados do backend)
  const {
    boards,
    activeBoard,
    isLoading: boardStoreLoading,
    fetchAllBoards,
    addBoard,
    updateBoard,
    removeBoard,
    activeBoardId,
    setActiveBoardId,
    selectAndLoadBoard,
  } = useBoardStore();

  const { modal, customConfirm } = useCustomModal();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<OutputCardDTO | null>(null);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [selectedCardForEdit, setSelectedCardForEdit] =
    useState<OutputCardDTO | null>(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showBoardConfigModal, setShowBoardConfigModal] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);

  const handleAddBoard = () => {
    setShowCreateModal(true);
  };

  const handleCreateNewBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setIsCreatingBoard(true);
    try {
      if (!token || !organization?.id) throw new Error("Sem autenticação");
      const dto: InputCreateBoardDTO = {
        name: newBoardTitle.trim(),
        description: "",
        access_level: "TEAM_WIDE",
      };
      const newBoard = await boardService.createBoard(
        token,
        organization.id,
        dto
      );

      // Adicionar à boardStore
      addBoard(newBoard);

      showToast("Quadro criado com sucesso!", "success");
      setNewBoardTitle("");
      setShowCreateModal(false);
    } catch (err: any) {
      showToast(err.message || "Erro ao criar quadro", "error");
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleEditBoard = async () => {
    if (editBoardTitle.trim() && activeBoardId) {
      setIsEditingBoard(true);
      try {
        if (!token || !organization?.id) throw new Error("Sem autenticação");

        // Atualizar no backend
        const updatedBoard = await boardService.updateBoard(
          token,
          organization.id,
          activeBoardId,
          { name: editBoardTitle.trim() }
        );

        // Atualizar na boardStore
        updateBoard(updatedBoard);

        showToast("Quadro atualizado com sucesso!", "success");
        setEditBoardTitle("");
        setShowEditModal(false);
      } catch (err: any) {
        showToast(err.message || "Erro ao atualizar quadro", "error");
      } finally {
        setIsEditingBoard(false);
      }
    }
  };

  const handleDeleteBoard = async () => {
    if (boardToDelete) {
      setIsDeletingBoard(true);
      try {
        if (!token || !organization?.id) throw new Error("Sem autenticação");

        // Deletar no backend
        await boardService.deleteBoard(token, organization.id, boardToDelete);

        // Remover da boardStore
        removeBoard(boardToDelete);

        showToast("Quadro excluído com sucesso!", "success");
        setShowDeleteModal(false);
        setBoardToDelete(null);
      } catch (err: any) {
        showToast(err.message || "Erro ao excluir quadro", "error");
      } finally {
        setIsDeletingBoard(false);
      }
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!currentBoard?.lists) return;

    const card = currentBoard.lists
      .flatMap((list) => list.cards || [])
      .find((c) => c.id === cardId);

    if (card) {
      setSelectedCard(card);
      setShowDetailModal(true);
    }
  };

  const currentBoard = activeBoard; // Usar o board ativo que já vem com listas e cards
  const currentBoardTitle = currentBoard?.name || "Selecione um quadro";

  // Garantir que as listas e cards existam antes de usar
  const allCards =
    currentBoard?.lists?.flatMap((list) => list.cards || []) || [];
  const currentList = currentBoard?.lists?.find((list) =>
    list.cards?.some((card) => card.id === selectedCard?.id)
  );

  const handleAddList = () => {
    if (!activeBoardId || !currentBoard) {
      showToast("Crie um quadro primeiro!", "warning");
      setShowCreateModal(true);
      return;
    }
    setShowListSelector(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className={`p-6 bg-background dark:bg-background`}>
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-6 h-6 text-[#7f00ff]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
            Gestão de funil
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBoardSelector(true)}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              disabled={boards.length === 0}
            >
              <span className="mr-2">Escolher Quadro</span>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddList}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              disabled={!activeBoardId}
            >
              <span className="mr-2">Lista de Concluídos</span>
              <CheckSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              disabled={!activeBoardId}
            >
              <span className="mr-2">Procurar Cartão</span>
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAutomationModal(true)}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              disabled={!activeBoardId}
            >
              <span className="mr-2">Criar Automação</span>
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowBoardConfigModal(true)}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              disabled={!activeBoardId}
            >
              <span className="mr-2">Configurar Quadro</span>
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="flex  space-x-2">
            <button
              onClick={handleAddBoard}
              className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Quadro
            </button>
            <button
              onClick={() => {
                const board = boards.find((b) => b.id === activeBoardId);
                if (board) {
                  setEditBoardTitle(board.name || "");
                  setShowEditModal(true);
                }
              }}
              className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
              disabled={!activeBoardId}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </button>
            <button
              onClick={() => {
                // The duplicateBoard function was removed from useBoardStore,
                // so this button will now just show a toast.
                showToast(
                  "Funcionalidade de duplicar quadro não disponível no momento.",
                  "info"
                );
              }}
              className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
              disabled={!activeBoardId}
            >
              <Copy className="w-4 h-4 mr-1" />
              Duplicar
            </button>
            <button
              onClick={() => {
                setBoardToDelete(activeBoardId);
                setShowDeleteModal(true);
              }}
              className="flex items-center px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
              disabled={!activeBoardId}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-background dark:bg-background">
        <div>{/* Sempre mostra o header de menus */}</div>
        {boardStoreLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f00ff] mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Carregando quadros...
              </p>
            </div>
          </div>
        ) : activeBoardId && currentBoard ? (
          <KanbanBoard />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {boards.length === 0
                  ? "Nenhum quadro criado"
                  : "Nenhum quadro selecionado"}
              </p>
              <button
                onClick={handleAddBoard}
                className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Quadro
              </button>
            </div>
          </div>
        )}
      </div>
      {modal}

      {showBoardSelector && boards.length > 0 && (
        <BoardSelector
          boards={boards.map((b: Board) => ({ id: b.id, name: b.name }))}
          activeBoardId={activeBoardId}
          onSelectBoard={selectAndLoadBoard}
          isOpen={showBoardSelector}
          onClose={() => setShowBoardSelector(false)}
          onCreateBoard={handleAddBoard}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDark ? "bg-dark-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-medium ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Novo Quadro
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
                disabled={isCreatingBoard}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Nome do quadro
                </label>
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? "bg-dark-700 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                  placeholder="Digite o nome do novo quadro"
                  autoFocus
                  disabled={isCreatingBoard}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle("");
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                disabled={isCreatingBoard}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewBoard}
                disabled={!newBoardTitle.trim() || isCreatingBoard}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingBoard ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDark ? "bg-dark-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-medium ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Editar Quadro
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditBoardTitle("");
                }}
                disabled={isEditingBoard}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Nome do quadro
                </label>
                <input
                  type="text"
                  value={editBoardTitle}
                  onChange={(e) => setEditBoardTitle(e.target.value)}
                  disabled={isEditingBoard}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? "bg-dark-700 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-[#7f00ff] disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="Digite o novo nome do quadro"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditBoardTitle("");
                }}
                disabled={isEditingBoard}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditBoard}
                disabled={!editBoardTitle.trim() || isEditingBoard}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditingBoard ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDark ? "bg-dark-800" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-medium mb-4 ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Excluir Quadro
            </h3>

            <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Tem certeza que deseja excluir este quadro? Esta ação não pode ser
              desfeita.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBoardToDelete(null);
                }}
                disabled={isDeletingBoard}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBoard}
                disabled={isDeletingBoard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingBoard ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporariamente removido até implementar corretamente com as novas stores */}
      {showListSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDark ? "bg-dark-800" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-medium mb-4 ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Lista de Concluídos
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Funcionalidade em desenvolvimento. Em breve você poderá selecionar
              uma lista de concluídos.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowListSelector(false)}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {currentBoard && showSearchModal && (
        <SearchCardModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          cards={allCards}
          onCardClick={handleCardClick}
        />
      )}

      {showDetailModal && selectedCard && currentBoard && (
        <CardDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCard(null);
          }}
          card={selectedCard}
          boardId={activeBoardId!}
          listId={currentList?.id || ""}
          onEdit={() => {
            setShowDetailModal(false);
            setSelectedCardForEdit(selectedCard);
            setShowEditCardModal(true);
          }}
        />
      )}

      {/* Temporariamente removido até implementar corretamente com as novas stores */}
      {showEditCardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDark ? "bg-dark-800" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-medium mb-4 ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Editar Cartão
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Funcionalidade em desenvolvimento. Em breve você poderá editar
              cartões.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowEditCardModal(false);
                  setSelectedCardForEdit(null);
                }}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAutomationModal && (
        <AutomationModal
          isOpen={showAutomationModal}
          onClose={() => setShowAutomationModal(false)}
          boardId={activeBoardId || ""}
        />
      )}

      {showBoardConfigModal && activeBoardId && (
        <BoardConfigModal
          isOpen={showBoardConfigModal}
          onClose={() => setShowBoardConfigModal(false)}
          boardId={activeBoardId}
        />
      )}
    </div>
  );
}
