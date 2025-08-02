import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MessageCircle,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  QrCode,
  Smartphone,
  Loader2,
} from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../hooks/useToast";
import { whatsappInstanceService } from "../../services/whatsappInstance.service";
import { WhatsAppInstanceOutput } from "../../types/whatsappInstance";
import { CreateInstanceModal } from "./components/CreateInstanceModal";
import { EditInstanceModal } from "./components/EditInstanceModal";
import { QRCodeRenderer } from "../../components/QRCodeRenderer";
import { useWhatsAppInstanceStore } from "../../store/whatsAppInstanceStore";
import { supabase } from "../../lib/supabaseClient";
import { ModalCanAcess } from "../../components/ModalCanAcess";
import { ConfirmationModal } from "../../components/ConfirmationModal";

export function Connections() {
  const { theme } = useThemeStore();
  const { token, user, hasPermission } = useAuthStore();
  const { showToast } = useToast();
  const isDark = theme === "dark";

  // Verificar se o usuário tem permissão para acessar conexões
  const canAccess = hasPermission("whatsapp:read");

  const { instances, isLoading, fetchAllInstances, lastFetched } =
    useWhatsAppInstanceStore();
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(
    null
  );
  const [connectingInstanceId, setConnectingInstanceId] = useState<
    string | null
  >(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInstance, setEditingInstance] =
    useState<WhatsAppInstanceOutput | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instanceToDelete, setInstanceToDelete] =
    useState<WhatsAppInstanceOutput | null>(null);

  const setSession = useAuthStore((state) => state.setSession);

  const deleteInstance = useCallback(
    async (token: string, organizationId: string, instanceId: string) => {
      await whatsappInstanceService.delete(token, organizationId, instanceId);
      // A store será atualizada via realtime ou refresh manual
    },
    []
  );

  const connectInstance = useCallback(
    async (token: string, organizationId: string, instanceId: string) => {
      await whatsappInstanceService.connect(token, organizationId, instanceId);
      // A store será atualizada via realtime ou refresh manual
    },
    []
  );

  // Fetch inicial se necessário (como outros componentes fazem)
  useEffect(() => {
    if (token && user?.organization_id && !isLoading) {
      fetchAllInstances(token, user.organization_id);
    }
  }, [token, user?.organization_id]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Supabase Auth] Evento:", event, session);
        if (event === "SIGNED_IN") {
          setSession(session);
        } else if (event === "SIGNED_OUT") {
          setSession(null);
        }
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, [setSession]);

  const handleDeleteInstance = async (instanceId: string) => {
    if (!token || !user?.organization_id) return;

    try {
      setDeletingInstanceId(instanceId);
      await deleteInstance(token, user.organization_id, instanceId);
      showToast("Instância excluída com sucesso!", "success");
      setShowDeleteModal(false);
      setInstanceToDelete(null);
    } catch (error) {
      showToast("Erro ao excluir instância", "error");
    } finally {
      setDeletingInstanceId(null);
    }
  };

  const handleShowDeleteModal = (instance: WhatsAppInstanceOutput) => {
    setInstanceToDelete(instance);
    setShowDeleteModal(true);
  };

  const handleConnectInstance = async (instanceId: string) => {
    if (!token || !user?.organization_id) return;

    try {
      setConnectingInstanceId(instanceId);
      await connectInstance(token, user.organization_id, instanceId);
      showToast("Conexão iniciada! Aguarde o QR Code.", "success");
    } catch (error) {
      showToast("Erro ao conectar instância", "error");
    } finally {
      setConnectingInstanceId(null);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    showToast("Telefone copiado!", "success");
  };

  const handleEditInstance = (instance: WhatsAppInstanceOutput) => {
    setEditingInstance(instance);
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "DISCONNECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "QR_PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return <Wifi className="w-4 h-4" />;
      case "DISCONNECTED":
        return <WifiOff className="w-4 h-4" />;
      case "QR_PENDING":
        return <QrCode className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!canAccess) {
    return (
      <ModalCanAcess
        title=" Conexões"
        description=" Gerencie suas integrações e conexões com plataformas externas"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Settings className="w-6 h-6 text-[#7f00ff]" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
              Conexões
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#7f00ff] animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">
              Carregando instâncias...
            </p>
          </div>
        </div>

        <CreateInstanceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Settings className="w-6 h-6 text-[#7f00ff]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
            Conexões
          </h1>
        </div>
        <button
          onClick={() => {
            console.log("Botão Nova Conexão clicado");
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Conexão
        </button>
      </div>

      {/* Exibe mensagem se não houver instâncias */}
      {!isLoading && instances.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <div className="p-4 bg-[#7f00ff]/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-[#7f00ff]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Você ainda não tem uma instância ativa
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Crie sua primeira instância do WhatsApp para começar a gerenciar
              suas conversas e automatizar suas comunicações.
            </p>
            <button
              onClick={() => {
                console.log("Botão Criar Primeira Instância clicado");
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Instância
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className={`bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {instance.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(
                        instance.status
                      )}`}
                    >
                      {getStatusIcon(instance.status)}
                      {instance.status === "CONNECTED" && "Conectado"}
                      {instance.status === "DISCONNECTED" && "Desconectado"}
                      {instance.status === "QR_PENDING" && "QR Pendente"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {instance.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Smartphone className="w-4 h-4" />
                      <span>{instance.phone_number}</span>
                      <button
                        onClick={() => handleCopyPhone(instance.phone_number!)}
                        className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Nível de acesso:</span>
                    <span className="font-medium">
                      {instance.access_level === "TEAM_WIDE"
                        ? "Todos os membros"
                        : instance.access_level === "SELECTED_MEMBERS"
                        ? "Membros selecionados"
                        : "Apenas criador"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Criado em:</span>
                    <span>{formatDate(instance.created_at)}</span>
                  </div>
                </div>

                {(instance.status === "DISCONNECTED" ||
                  instance.status === "QR_PENDING") &&
                  instance.qr_code && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          QR Code para conexão
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <QRCodeRenderer
                          qrCodeString={instance.qr_code}
                          size={128}
                          className="w-32 h-32"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                        Escaneie com o WhatsApp para conectar
                      </p>
                    </div>
                  )}

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                  <button
                    onClick={() => handleEditInstance(instance)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configurar
                  </button>
                  {instance.status === "CONNECTED" ? (
                    <button
                      onClick={() => {
                        // Salvar a instância ativa no localStorage e redirecionar para conversas
                        localStorage.setItem(
                          "zenaix_active_whatsapp_instance",
                          instance.id
                        );
                        window.location.href = "/dashboard/conversations";
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar
                    </button>
                  ) : instance.qr_code ? (
                    <button
                      onClick={() => handleConnectInstance(instance.id)}
                      disabled={connectingInstanceId === instance.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
                    >
                      {connectingInstanceId === instance.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      Gerar Novo QR
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectInstance(instance.id)}
                      disabled={connectingInstanceId === instance.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                    >
                      {connectingInstanceId === instance.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      Conectar
                    </button>
                  )}
                  <button
                    onClick={() => handleShowDeleteModal(instance)}
                    disabled={deletingInstanceId === instance.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingInstanceId === instance.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div
            onClick={() => {
              console.log("Card Adicionar Nova Instância clicado");
              setShowCreateModal(true);
            }}
            className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#7f00ff] dark:hover:border-[#7f00ff] transition-colors cursor-pointer group`}
          >
            <div className="p-3 bg-[#7f00ff]/10 rounded-full mb-4 group-hover:bg-[#7f00ff]/20 transition-colors">
              <Plus className="w-6 h-6 text-[#7f00ff]" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Adicionar Nova Instância
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Crie uma nova instância do WhatsApp para sua organização
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Próximas Integrações
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Plataformas que serão integradas em breve
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Instagram", icon: "📷", status: "Em breve" },
            { name: "Telegram", icon: "📱", status: "Em breve" },
            { name: "Facebook", icon: "📘", status: "Em breve" },
            { name: "LinkedIn", icon: "💼", status: "Em breve" },
          ].map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-60"
            >
              <span className="text-2xl">{platform.icon}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {platform.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {platform.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          if (token && user?.organization_id) {
            fetchAllInstances(token, user.organization_id);
          }
        }}
      />

      <EditInstanceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingInstance(null);
        }}
        onSuccess={() => {
          if (token && user?.organization_id) {
            fetchAllInstances(token, user.organization_id);
          }
        }}
        instance={editingInstance}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setInstanceToDelete(null);
        }}
        onConfirm={() => {
          if (instanceToDelete) {
            handleDeleteInstance(instanceToDelete.id);
          }
        }}
        title="Excluir Instância"
        message={`Tem certeza que deseja excluir a instância "${instanceToDelete?.name}"?

⚠️ ATENÇÃO: Esta ação irá:
• Excluir permanentemente esta instância
• Perder todos os contatos salvos
• Perder todas as mensagens e conversas
• Perder todos os arquivos e mídias

Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir instância"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        isLoading={deletingInstanceId === instanceToDelete?.id}
      />
    </div>
  );
}
