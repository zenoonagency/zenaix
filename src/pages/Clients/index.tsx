// src/pages/Clients/index.tsx
import React, { useState } from 'react';
import { Plus, Edit2, Copy, Trash2, ChevronDown, LayoutGrid, CheckSquare, Search, X, Zap, Settings } from 'lucide-react';
import { useKanbanStore } from './store/kanbanStore';
import { KanbanBoard } from './components/KanbanBoard';
import { useThemeStore } from '../../store/themeStore';
import { BoardList } from './components/BoardList';
import { useCustomModal } from '../../components/CustomModal';
import { api } from '../../services/api';
import { mutate } from 'swr';
import { useToast } from '../../hooks/useToast';
import { BoardSelector } from './components/BoardSelector';
import { CompletedListSelectorModal } from './components/CompletedListSelectorModal';
import { SearchCardModal } from './components/SearchCardModal';
import { CardDetailModal } from './components/CardDetailModal';
import { CardModal } from './components/CardModal';
import { AutomationModal } from './components/AutomationModal';
import { Board, Card } from './types';
import { BoardConfigModal } from './components/BoardConfigModal';

export function Clients() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { 
    boards,
    activeBoard: activeBoardId,
    setActiveBoard,
    addBoard,
    updateBoard,
    deleteBoard,
    duplicateBoard,
    toggleBoardVisibility,
    setCompletedList,
    getCompletedListId
  } = useKanbanStore();
  const { modal, customPrompt, customConfirm } = useCustomModal();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<Card | null>(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showBoardConfigModal, setShowBoardConfigModal] = useState(false);

  const handleAddBoard = () => {
    setShowCreateModal(true);
  };

  const handleCreateNewBoard = () => {
    if (!newBoardTitle.trim()) return;
    
    // Adiciona o novo quadro
    addBoard(newBoardTitle.trim());
    
    // Pega o quadro recém-criado (último da lista)
    const newBoard = boards[boards.length - 1];
    
    setNewBoardTitle('');
    setShowCreateModal(false);
    setActiveBoard(newBoard.id);
    showToast('Quadro criado com sucesso!', 'success');
  };

  const handleEditBoard = () => {
    if (editBoardTitle.trim() && activeBoardId) {
      updateBoard(activeBoardId, { title: editBoardTitle.trim() });
      setEditBoardTitle('');
      setShowEditModal(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (boardToDelete) {
      // Se for o último quadro, a função deleteBoard já mostrará a notificação
      deleteBoard(boardToDelete);
      setShowDeleteModal(false);
      setBoardToDelete(null);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!currentBoard?.lists) return;
    
    const card = currentBoard.lists
      .flatMap(list => list.cards || [])
      .find(c => c.id === cardId);
    
    if (card) {
      setSelectedCard(card);
      setShowDetailModal(true);
    }
  };

  const currentBoard = boards.find(b => b.id === activeBoardId);
  const currentBoardTitle = currentBoard?.title || 'Selecione um quadro';

  // Garantir que as listas e cards existam antes de usar
  const allCards = currentBoard?.lists?.flatMap(list => list.cards || []) || [];
  const currentList = currentBoard?.lists?.find(list => 
    list.cards?.some(card => card.id === selectedCard?.id)
  );

  const handleAddList = () => {
    if (!activeBoardId || !currentBoard) {
      showToast('Crie um quadro primeiro!', 'warning');
      setShowCreateModal(true);
      return;
    }
    setShowListSelector(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className={`p-6 bg-background dark:bg-background`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
  <Zap className="w-6 h-6 text-[#7f00ff]" />
  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
    Gestão de funil
  </h1>
</div>

            {boards.length > 0 && (
              <button
                onClick={() => setShowBoardSelector(true)}
                className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
              >
                <span className="mr-2">Escolher Quadro</span>
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
            {activeBoardId && currentBoard && (
              <>
                <button
                  onClick={handleAddList}
                  className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                >
                  <span className="mr-2">Lista de Concluídos</span>
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                >
                  <span className="mr-2">Procurar Cartão</span>
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAutomationModal(true)}
                  className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                >
                  <span className="mr-2">Criar Automação</span>
                  <Zap className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowBoardConfigModal(true)}
                  className="flex items-center px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f00ff]"
                >
                  <span className="mr-2">Configurar Quadro</span>
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddBoard}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Quadro
            </button>
            {activeBoardId && currentBoard && (
              <>
                <button
                  onClick={() => {
                    const board = boards.find(b => b.id === activeBoardId);
                    if (board) {
                      setEditBoardTitle(board.title);
                      setShowEditModal(true);
                    }
                  }}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => duplicateBoard(activeBoardId)}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicar
                </button>
                <button
                  onClick={() => {
                    setBoardToDelete(activeBoardId);
                    setShowDeleteModal(true);
                  }}
                  className="flex items-center px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-background dark:bg-background">
        {activeBoardId && currentBoard ? (
          <>
            <BoardList />
            <KanbanBoard />
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {boards.length === 0 ? 'Nenhum quadro criado' : 'Nenhum quadro selecionado'}
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
          boards={boards}
          activeBoard={activeBoardId}
          onSelectBoard={setActiveBoard}
          isOpen={showBoardSelector}
          onClose={() => setShowBoardSelector(false)}
          onCreateBoard={handleAddBoard}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Novo Quadro
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome do quadro
                </label>
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark 
                      ? 'bg-dark-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                  placeholder="Digite o nome do novo quadro"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle('');
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewBoard}
                disabled={!newBoardTitle.trim()}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Editar Quadro
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditBoardTitle('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome do quadro
                </label>
                <input
                  type="text"
                  value={editBoardTitle}
                  onChange={(e) => setEditBoardTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark 
                      ? 'bg-dark-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                  placeholder="Digite o novo nome do quadro"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditBoardTitle('');
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditBoard}
                disabled={!editBoardTitle.trim()}
                className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Excluir Quadro
            </h3>
            
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBoardToDelete(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBoard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {activeBoardId && currentBoard && (
        <CompletedListSelectorModal
          lists={currentBoard.lists || []}
          selectedListId={getCompletedListId(activeBoardId)}
          onSelectList={(listId) => {
            setCompletedList(activeBoardId, listId);
            setShowListSelector(false);
            showToast('Lista de concluídos atualizada com sucesso!', 'success');
          }}
          isOpen={showListSelector}
          onClose={() => setShowListSelector(false)}
        />
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
          listId={currentList?.id || ''}
          onEdit={() => {
            setShowDetailModal(false);
            setSelectedCardForEdit(selectedCard);
            setShowEditCardModal(true);
          }}
        />
      )}

      {showEditCardModal && selectedCardForEdit && currentBoard && (
        <CardModal
          isOpen={showEditCardModal}
          onClose={() => {
            setShowEditCardModal(false);
            setSelectedCardForEdit(null);
          }}
          onSave={(updatedCard) => {
            if (!currentBoard?.lists) return;
            
            updateBoard(activeBoardId!, {
              lists: currentBoard.lists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card =>
                  card.id === selectedCardForEdit.id ? updatedCard : card
                )
              }))
            });
            setShowEditCardModal(false);
            setSelectedCardForEdit(null);
            showToast('Cartão atualizado com sucesso!', 'success');
          }}
          mode="edit"
          boardId={activeBoardId!}
          listId={currentList?.id || ''}
          card={selectedCardForEdit}
        />
      )}

      {showAutomationModal && (
        <AutomationModal 
          isOpen={showAutomationModal} 
          onClose={() => setShowAutomationModal(false)} 
          boardId={activeBoardId || ''}
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
