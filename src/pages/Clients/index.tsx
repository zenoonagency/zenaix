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
  Trello,
  Users,
  UserCheck,
  User,
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
import { OutputCardDTO } from "../../types/card";
import { CardModal } from "./components/CardModal";
import { ModalCanAcess } from "../../components/ModalCanAcess";
import { useTeamMembersStore } from "../../store/teamMembersStore";
import { BoardAccessLevel } from "../../types/board";

export function Clients() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { showToast } = useToast();
  const { token, organization, hasPermission } = useAuthStore();

  const canAccess = hasPermission("boards:read");

  const {
    boards,
    activeBoard,
    isLoading: boardStoreLoading,
    activeBoardId,
    selectAndLoadKanbanBoard,
    updateBoard,
  } = useBoardStore();

  const { modal, customConfirm } = useCustomModal();
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
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [isDuplicatingBoard, setIsDuplicatingBoard] = useState(false);
  const [createTab, setCreateTab] = useState<"inicio" | "acesso">("inicio");
  const [isEditMode, setIsEditMode] = useState(false);

  const { members } = useTeamMembersStore();

  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalValue, setGoalValue] = useState("");
  const [accessLevel, setAccessLevel] = useState<BoardAccessLevel>("TEAM_WIDE");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const handleAddBoard = () => {
    setShowCreateModal(true);
    setShowBoardSelector(false);
  };

  const handleCreateNewBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setIsCreatingBoard(true);
    try {
      if (!token || !organization?.id) throw new Error("Sem autenticação");
      const dto: any = {
        name: newBoardTitle.trim(),
        description: "", // omitido
        access_level: accessLevel,
      };
      if (accessLevel === "SELECTED_MEMBERS") {
        dto.member_ids = selectedMemberIds;
      }
      if (goalName.trim() && goalValue) {
        dto.goal = {
          name: goalName.trim(),
          description: goalDescription.trim(),
          value: Number(goalValue),
        };
      }

      if (isEditMode && activeBoardId) {
        const updatedBoard = await boardService.updateBoard(
          token,
          organization.id,
          activeBoardId,
          dto
        );
        // Atualizar o store com o quadro atualizado
        updateBoard(updatedBoard);
        showToast("Quadro atualizado com sucesso!", "success");
      } else {
        await boardService.createBoard(token, organization.id, dto);
        showToast("Quadro criado com sucesso!", "success");
      }

      setNewBoardTitle("");
      setGoalName("");
      setGoalDescription("");
      setGoalValue("");
      setAccessLevel("TEAM_WIDE");
      setSelectedMemberIds([]);
      setIsEditMode(false);
      setShowCreateModal(false);
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar quadro", "error");
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (boardToDelete) {
      setIsDeletingBoard(true);
      try {
        if (!token || !organization?.id) throw new Error("Sem autenticação");

        await boardService.deleteBoard(token, organization.id, boardToDelete);

        showToast("Quadro excluído com sucesso!", "success");
        setShowDeleteModal(false);
        setBoardToDelete(null);
      } catch (err: any) {
        console.error("Erro ao excluir quadro:", err);
        const errorMessage =
          err?.message || err?.error || "Erro ao excluir quadro";
        showToast(errorMessage, "error");
      } finally {
        setIsDeletingBoard(false);
      }
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!currentBoard?.lists) return;

    const card = currentBoard?.lists
      ?.flatMap((list) => list.cards || [])
      ?.find((c) => c.id === cardId);

    if (card) {
      setSelectedCard(card);
      setShowDetailModal(true);
    }
  };

  const currentBoard = activeBoard;

  const allCards =
    currentBoard?.lists?.flatMap((list) => list.cards || []) || [];
  const currentList = currentBoard?.lists?.find((list) =>
    list.cards?.some((card) => card.id === selectedCard?.id)
  );

  const handleAddList = () => {
    if (!activeBoardId || !currentBoard) {
      showToast(
        "Nenhum quadro encontrado. Crie um quadro primeiro!",
        "warning"
      );
      return;
    }
    setShowListSelector(true);
  };

  useEffect(() => {
    if (
      activeBoardId &&
      (!activeBoard?.lists || activeBoard?.lists?.length === 0)
    ) {
      selectAndLoadKanbanBoard(activeBoardId);
    }
  }, [activeBoardId, activeBoard?.lists, selectAndLoadKanbanBoard]);

  if (!canAccess) {
    return <ModalCanAcess title="Gestão de funil" />;
  }

  return (
    <div className="flex flex-col">
      <div className={`p-6 bg-background dark:bg-background`}>
        <div className="flex items-center space-x-4 ">
          <Trello className="w-6 h-6 text-[#7f00ff]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
            Gestão de funil
          </h1>
        </div>
        <div className="flex items-center space-x-2 my-4">
          {boardStoreLoading && boards.length > 0 ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#7f00ff]"></div>
          ) : activeBoard ? (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r inline-block  from-[#7f00ff] to-[#e100ff]   text-transparent bg-clip-text">
                Quadro:
              </h2>{" "}
              <h2 className="text-xl font-bold inline-block text-[#000] bg-clip-text">
                {activeBoard?.name}
              </h2>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400">
                Nenhum quadro selecionado
              </h2>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBoardSelector(true)}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
            >
              <span className="mr-2">Escolher Quadro</span>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddList}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              style={{
                display: hasPermission("boards:update") ? "flex" : "none",
              }}
            >
              <span className="mr-2">Lista de Concluídos</span>
              <CheckSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!activeBoardId || !currentBoard) {
                  showToast(
                    "Nenhum quadro encontrado. Crie um quadro primeiro!",
                    "warning"
                  );
                  return;
                }
                setShowSearchModal(true);
              }}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
            >
              <span className="mr-2">Procurar Cartão</span>
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!activeBoardId || !currentBoard) {
                  showToast(
                    "Nenhum quadro encontrado. Crie um quadro primeiro!",
                    "warning"
                  );
                  return;
                }
                setShowAutomationModal(true);
              }}
              className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              style={{
                display: hasPermission("boards:update") ? "flex" : "none",
              }}
            >
              <span className="mr-2">Criar Automação</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>
          <div className="flex  space-x-2">
            <button
              onClick={handleAddBoard}
              className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
              style={{
                display: hasPermission("boards:create") ? "flex" : "none",
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Quadro
            </button>
            <button
              onClick={() => {
                if (!activeBoardId || boards.length === 0) {
                  showToast(
                    "Nenhum quadro encontrado. Crie um quadro primeiro!",
                    "warning"
                  );
                  return;
                }
                const board = boards.find((b) => b.id === activeBoardId);
                if (board) {
                  setNewBoardTitle(board.name || "");
                  setGoalName(board.goal?.name || "");
                  setGoalDescription(board.goal?.description || "");
                  setGoalValue(board.goal?.value?.toString() || "");
                  setAccessLevel(board.access_level || "TEAM_WIDE");
                  // Extrair IDs dos membros com acesso
                  const memberIds =
                    board.members_with_access?.map((member) => member.id) || [];
                  setSelectedMemberIds(memberIds);
                  setCreateTab("inicio");
                  setShowCreateModal(true);
                  setIsEditMode(true);
                }
              }}
              className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
              style={{
                display: hasPermission("boards:update") ? "flex" : "none",
              }}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </button>
            <button
              onClick={async () => {
                if (!token || !organization?.id) {
                  showToast("Sem autenticação", "error");
                  return;
                }
                if (!activeBoardId || boards.length === 0) {
                  showToast(
                    "Nenhum quadro encontrado. Crie um quadro primeiro!",
                    "warning"
                  );
                  return;
                }
                setIsDuplicatingBoard(true);
                try {
                  await boardService.duplicateBoard(
                    token,
                    organization.id,
                    activeBoardId
                  );
                  showToast("Quadro duplicado com sucesso!", "success");
                } catch (err: any) {
                  showToast(err?.message || "Erro ao duplicar quadro", "error");
                } finally {
                  setIsDuplicatingBoard(false);
                }
              }}
              className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
              disabled={isDuplicatingBoard}
              style={{
                display: hasPermission("boards:update") ? "flex" : "none",
              }}
            >
              <Copy className="w-4 h-4 mr-1" />
              {isDuplicatingBoard ? "Duplicando..." : "Duplicar"}
            </button>
            <button
              onClick={() => {
                if (!activeBoardId || boards.length === 0) {
                  showToast(
                    "Nenhum quadro encontrado. Crie um quadro primeiro!",
                    "warning"
                  );
                  return;
                }
                setBoardToDelete(activeBoardId);
                setShowDeleteModal(true);
              }}
              className="flex items-center px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
              style={{
                display: hasPermission("boards:delete") ? "flex" : "none",
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-background dark:bg-background overflow-hidden">
        <div>{/* Sempre mostra o header de menus */}</div>
        {boardStoreLoading && boards.length > 0 ? (
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
                Nenhum quadro selecionado
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

      {showBoardSelector && (
        <BoardSelector
          boards={boards.map((b: Board) => ({ id: b.id, name: b.name }))}
          activeBoardId={activeBoardId}
          onSelectBoard={selectAndLoadKanbanBoard}
          isOpen={showBoardSelector}
          onClose={() => setShowBoardSelector(false)}
          onCreateBoard={handleAddBoard}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div
            className={`w-full max-w-4xl p-0 rounded-lg shadow-xl ${
              isDark ? "bg-dark-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <h3
                  className={`text-lg font-medium ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {isEditMode ? "Editar Quadro" : "Novo Quadro"}
                </h3>
                <div className="flex space-x-1">
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      createTab === "inicio"
                        ? "bg-[#7f00ff] text-white"
                        : isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setCreateTab("inicio")}
                    disabled={isCreatingBoard}
                  >
                    Início
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      createTab === "acesso"
                        ? "bg-[#7f00ff] text-white"
                        : isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setCreateTab("acesso")}
                    disabled={isCreatingBoard}
                  >
                    Visibilidade
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle("");
                  setGoalName("");
                  setGoalDescription("");
                  setGoalValue("");
                  setAccessLevel("TEAM_WIDE");
                  setSelectedMemberIds([]);
                  setCreateTab("inicio");
                  setIsEditMode(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
                disabled={isCreatingBoard}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {createTab === "inicio" && (
                <div className="space-y-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
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

                  <div
                    className="rounded-lg border p-4"
                    style={{
                      borderColor: isDark ? "#7f00ff55" : "#7f00ff22",
                      background: isDark ? "#1a1a2e" : "#faf7ff",
                    }}
                  >
                    <div className="mb-4 font-semibold text-[#7f00ff]">
                      Meta do quadro (opcional)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Nome da meta
                        </label>
                        <input
                          type="text"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? "bg-dark-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                          placeholder="Ex: Atingir 1.000 usuários ativos"
                          disabled={isCreatingBoard}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Valor da meta
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={goalValue}
                          onChange={(e) => setGoalValue(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? "bg-dark-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                          placeholder="Ex: 1000"
                          disabled={isCreatingBoard}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Descrição da meta
                      </label>
                      <input
                        type="text"
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark
                            ? "bg-dark-700 border-gray-600 text-gray-100"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                        placeholder="Ex: Meta para o primeiro mês de lançamento."
                        disabled={isCreatingBoard}
                      />
                    </div>
                  </div>
                </div>
              )}

              {createTab === "acesso" && (
                <div className="space-y-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Visibilidade
                    </label>
                    <div className="space-y-3">
                      <label
                        className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer ${
                          accessLevel === "TEAM_WIDE"
                            ? isDark
                              ? "bg-dark-700 border border-[#7f00ff]/50"
                              : "bg-purple-50 border border-[#7f00ff]/20"
                            : isDark
                            ? "bg-dark-900 hover:bg-dark-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={accessLevel === "TEAM_WIDE"}
                          onChange={() => setAccessLevel("TEAM_WIDE")}
                          className="sr-only"
                        />
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-full ${
                            accessLevel === "TEAM_WIDE"
                              ? "bg-[#7f00ff] ring-2 ring-[#7f00ff]/20"
                              : isDark
                              ? "bg-dark-600 border border-gray-600"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          {accessLevel === "TEAM_WIDE" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            Visível para todos
                          </span>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Todos os membros da equipe podem ver este quadro
                          </p>
                        </div>
                        <Users
                          className={`w-5 h-5 ${
                            accessLevel === "TEAM_WIDE"
                              ? "text-[#7f00ff]"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        />
                      </label>
                      <label
                        className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer ${
                          accessLevel === "CREATOR_ONLY"
                            ? isDark
                              ? "bg-dark-700 border border-[#7f00ff]/50"
                              : "bg-purple-50 border border-[#7f00ff]/20"
                            : isDark
                            ? "bg-dark-900 hover:bg-dark-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={accessLevel === "CREATOR_ONLY"}
                          onChange={() => setAccessLevel("CREATOR_ONLY")}
                          className="sr-only"
                        />
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-full ${
                            accessLevel === "CREATOR_ONLY"
                              ? "bg-[#7f00ff] ring-2 ring-[#7f00ff]/20"
                              : isDark
                              ? "bg-dark-600 border border-gray-600"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          {accessLevel === "CREATOR_ONLY" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            Apenas eu
                          </span>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Somente você poderá ver este quadro
                          </p>
                        </div>
                        <UserCheck
                          className={`w-5 h-5 ${
                            accessLevel === "CREATOR_ONLY"
                              ? "text-[#7f00ff]"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        />
                      </label>
                      <label
                        className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer ${
                          accessLevel === "SELECTED_MEMBERS"
                            ? isDark
                              ? "bg-dark-700 border border-[#7f00ff]/50"
                              : "bg-purple-50 border border-[#7f00ff]/20"
                            : isDark
                            ? "bg-dark-900 hover:bg-dark-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={accessLevel === "SELECTED_MEMBERS"}
                          onChange={() => setAccessLevel("SELECTED_MEMBERS")}
                          className="sr-only"
                        />
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-full ${
                            accessLevel === "SELECTED_MEMBERS"
                              ? "bg-[#7f00ff] ring-2 ring-[#7f00ff]/20"
                              : isDark
                              ? "bg-dark-600 border border-gray-600"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          {accessLevel === "SELECTED_MEMBERS" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            Membros selecionados
                          </span>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Apenas membros selecionados poderão ver este quadro
                          </p>
                        </div>
                        <Users
                          className={`w-5 h-5 ${
                            accessLevel === "SELECTED_MEMBERS"
                              ? "text-[#7f00ff]"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        />
                      </label>
                    </div>
                  </div>

                  {accessLevel === "SELECTED_MEMBERS" && (
                    <div className="max-h-64 overflow-auto">
                      <label
                        className={`block text-sm font-medium mb-3 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Selecione os membros
                      </label>
                      <div className="space-y-2">
                        {members.length === 0 ? (
                          <p
                            className={`text-sm italic ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Nenhum membro na equipe
                          </p>
                        ) : (
                          members
                            .filter((member) => member.role !== "MASTER")
                            .map((member) => (
                              <label
                                key={member.id}
                                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedMemberIds.includes(member.id)
                                    ? isDark
                                      ? "bg-dark-700 border border-[#7f00ff]/50"
                                      : "bg-purple-50 border border-[#7f00ff]/20"
                                    : isDark
                                    ? "bg-dark-900 hover:bg-dark-700"
                                    : "bg-gray-50 hover:bg-gray-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMemberIds.includes(
                                    member.id
                                  )}
                                  onChange={() =>
                                    setSelectedMemberIds((prev) =>
                                      prev.includes(member.id)
                                        ? prev.filter((id) => id !== member.id)
                                        : [...prev, member.id]
                                    )
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                                    selectedMemberIds.includes(member.id)
                                      ? "border-[#7f00ff] bg-[#7f00ff]"
                                      : isDark
                                      ? "border-gray-600 bg-transparent"
                                      : "border-gray-300 bg-transparent"
                                  }`}
                                >
                                  {selectedMemberIds.includes(member.id) && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#7f00ff]/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#7f00ff]" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span
                                    className={`font-medium ${
                                      isDark ? "text-gray-200" : "text-gray-800"
                                    }`}
                                  >
                                    {member.name}
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    }`}
                                  >
                                    {member.email} • {member.role}
                                  </span>
                                </div>
                              </label>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle("");
                  setGoalName("");
                  setGoalDescription("");
                  setGoalValue("");
                  setAccessLevel("TEAM_WIDE");
                  setSelectedMemberIds([]);
                  setCreateTab("inicio");
                  setIsEditMode(false);
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
                {isCreatingBoard
                  ? isEditMode
                    ? "Salvando..."
                    : "Criando..."
                  : isEditMode
                  ? "Salvar"
                  : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
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

      {/* Substituir o EditCardModal temporário pelo CardModal real */}
      {showEditCardModal && selectedCardForEdit && (
        <CardModal
          isOpen={showEditCardModal}
          onClose={() => {
            setShowEditCardModal(false);
            setSelectedCardForEdit(null);
          }}
          onSave={async (cardData) => {
            // Implementar lógica de atualização do card
            setShowEditCardModal(false);
            setSelectedCardForEdit(null);
            return selectedCardForEdit; // Retornar o card atualizado
          }}
          mode="edit"
          boardId={activeBoardId!}
          listId={currentList?.id || ""}
          initialData={selectedCardForEdit}
        />
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
