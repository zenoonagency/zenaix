import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Modal } from "../../components/Modal";
import { InputCreateEmbedDTO, InputUpdateEmbedDTO } from "../../types/embed";
import { embedService } from "../../services/embed/embed.service";
import { useAuthStore } from "../../store/authStore";
import { PERMISSIONS } from "../../config/permissions";
import { useEmbedPagesStore } from "../../store/embedPagesStore";
import { EmbedOutput } from "../../types/embed";
import { useToast } from "../../hooks/useToast";
import { ModalCanAcess } from "../../components/ModalCanAcess";

export function EmbedPages() {
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activePage, setActivePage] = useState<EmbedOutput | null>(null);
  const [formData, setFormData] = useState({ name: "", url: "" });

  const { token, organizationId, hasPermission } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
    hasPermission: state.hasPermission,
  }));

  const canAccessEmbed = hasPermission("embed:read");

  const { pages, isLoading } = useEmbedPagesStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (token && organizationId) {
      useEmbedPagesStore.getState().fetchAllEmbedPages(token, organizationId);
    }
  }, [token, organizationId]);

  useEffect(() => {
    if (!activePage && pages.length > 0) {
      setActivePage(pages[0]);
    }
  }, [pages, activePage]);

  const handleCreatePage = async () => {
    if (!hasPermission(PERMISSIONS.EMBED_CREATE) || !token || !organizationId) {
      showToast("Você não tem permissão para esta ação.", "error");
      return;
    }

    setIsActionLoading(true);
    try {
      const input: InputCreateEmbedDTO = {
        name: formData.name,
        url: formData.url,
      };
      const newPage = await embedService.create(token, organizationId, input);
      setActivePage(newPage);
      showToast("Página embed criada com sucesso!", "success");
      setFormData({ name: "", url: "" });
      setShowCreateModal(false);
    } catch (error: any) {
      showToast(
        "error",
        error.message || "Ocorreu uma falha ao criar a página."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditPage = async () => {
    if (!hasPermission(PERMISSIONS.EMBED_UPDATE) || !token || !activePage) {
      showToast(
        "Você não tem permissão ou nenhuma página está selecionada.",
        "error"
      );
      return;
    }

    setIsActionLoading(true);
    try {
      const input: InputUpdateEmbedDTO = {
        name: formData.name,
        url: formData.url,
      };

      const updatedPageData = await embedService.update(
        token,
        organizationId,
        activePage.id,
        input
      );
      setActivePage(updatedPageData);
      showToast("Página embed atualizada com sucesso!", "success");
      setFormData({ name: "", url: "" });
      setShowEditModal(false);
    } catch (error: any) {
      showToast(
        "error",
        error.message || "Ocorreu uma falha ao atualizar a página."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePage = async () => {
    if (!hasPermission(PERMISSIONS.EMBED_DELETE) || !token || !activePage) {
      showToast(
        "Você não tem permissão ou nenhuma página está selecionada.",
        "error"
      );
      return;
    }

    setIsActionLoading(true);
    try {
      await embedService.delete(token, organizationId, activePage.id);
      const pageIdToDelete = activePage.id;

      const remainingPages = pages.filter((p) => p.id !== pageIdToDelete);
      setActivePage(remainingPages.length > 0 ? remainingPages[0] : null);

      showToast("Página embed excluída com sucesso!", "success");
      setShowDeleteModal(false);
    } catch (error: any) {
      showToast(
        "error",
        error.message || "Ocorreu uma falha ao excluir a página."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const openEditModal = (page: EmbedOutput) => {
    setFormData({ name: page.name, url: page.url });
    setActivePage(page);
    setShowEditModal(true);
  };

  if (!canAccessEmbed) {
    return <ModalCanAcess title="Páginas Embed" />;
  }

  return (
    <div className="p-6 h-[95vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <ExternalLink className="w-6 h-6 text-[#7f00ff]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
            Páginas Embed
          </h1>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", url: "" });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          style={{
            display: hasPermission(PERMISSIONS.EMBED_CREATE) ? "flex" : "none",
          }}
        >
          <Plus size={20} />
          Nova Página
        </button>
      </div>

      {isLoading && pages.length === 0 ? (
        <div className="text-center py-12">Carregando páginas...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhuma página embed criada ainda
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            style={{
              display: hasPermission(PERMISSIONS.EMBED_CREATE)
                ? "inline-flex"
                : "none",
            }}
          >
            <Plus size={20} />
            Criar Primeira Página
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-grow bg-white dark:bg-dark-800 rounded-lg shadow">
          {/* Barra de navegação das páginas */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-t-lg overflow-x-auto">
            {pages.map((page) => (
              <div
                onClick={() => setActivePage(page)}
                key={page.id}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[150px] max-w-[200px] ${
                  activePage && activePage.id === page.id
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600"
                }`}
              >
                <span className="truncate flex-grow text-left">
                  {page.name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(page);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    style={{
                      display: hasPermission(PERMISSIONS.EMBED_UPDATE)
                        ? "block"
                        : "none",
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePage(page);
                      setShowDeleteModal(true);
                    }}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    style={{
                      display: hasPermission(PERMISSIONS.EMBED_DELETE)
                        ? "block"
                        : "none",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-grow relative">
            {activePage ? (
              <iframe
                key={activePage.id}
                src={activePage.url}
                className="w-full h-full border-0"
                title={`Preview de ${activePage.name}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Selecione uma página para visualizar.
              </div>
            )}
          </div>
        </div>
      )}

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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
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
              disabled={isActionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:bg-purple-400"
            >
              {isActionLoading ? "Criando..." : "Criar Página"}
            </button>{" "}
          </div>
        </div>
      </Modal>

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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
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
              disabled={isActionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:bg-purple-400"
            >
              {isActionLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Página Embed"
      >
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400">
            Tem certeza que deseja excluir a página "{activePage?.name}"? Esta
            ação não pode ser desfeita.
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
              disabled={isActionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-red-400"
            >
              {isActionLoading ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
