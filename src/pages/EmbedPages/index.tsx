import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useCustomModal } from '../../components/CustomModal';
import { toast } from 'react-toastify';

interface EmbedPage {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export function EmbedPages() {
  const [pages, setPages] = useState<EmbedPage[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const { customConfirm } = useCustomModal();

  // Funções de gerenciamento
  const handleCreatePage = () => {
    const newPage: EmbedPage = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      url: formData.url,
      createdAt: new Date().toISOString(),
    };
    setPages([...pages, newPage]);
    setFormData({ name: '', url: '' });
    setShowCreateModal(false);
    toast.success('Página embed criada com sucesso!');
  };

  const handleEditPage = () => {
    const updatedPages = [...pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      name: formData.name,
      url: formData.url,
    };
    setPages(updatedPages);
    setShowEditModal(false);
    toast.success('Página embed atualizada com sucesso!');
  };

  const handleDeletePage = () => {
    const updatedPages = pages.filter((_, index) => index !== activePageIndex);
    setPages(updatedPages);
    setShowDeleteModal(false);
    toast.success('Página embed excluída com sucesso!');
  };

  const openEditModal = (page: EmbedPage, index: number) => {
    setFormData({ name: page.name, url: page.url });
    setActivePageIndex(index);
    setShowEditModal(true);
  };

  return (
    <div className="p-6 h-[95vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Páginas Embed
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Nova Página
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhuma página embed criada ainda
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Criar Primeira Página
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-grow bg-white dark:bg-dark-800 rounded-lg shadow">
          {/* Barra de navegação das páginas */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-t-lg overflow-x-auto">
            {pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setActivePageIndex(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[150px] max-w-[200px] ${
                  activePageIndex === index
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                }`}
              >
                <span className="truncate flex-grow text-left">{page.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(page, index);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePageIndex(index);
                      setShowDeleteModal(true);
                    }}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* Área de visualização da página ativa */}
          <div className="flex-grow">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className={`h-full transition-opacity duration-300 ${
                  activePageIndex === index ? 'block' : 'hidden'
                }`}
              >
                <iframe
                  src={page.url}
                  className="w-full h-full"
                  title={`Preview de ${page.name}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Nova Página Embed"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Página
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Página de Vendas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL da Página
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://exemplo.com/pagina"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreatePage}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
            >
              Criar Página
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Página Embed"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Página
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL da Página
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleEditPage}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Página Embed"
      >
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400">
            Tem certeza que deseja excluir esta página embed? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeletePage}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 