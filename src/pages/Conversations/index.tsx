import React, { useEffect, useState } from "react";
import { MessageCircle, Wifi, WifiOff, QrCode } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useWhatsAppInstanceStore } from "../../store/whatsAppInstanceStore";
import { WhatsAppInstanceOutput } from "../../types/whatsappInstance";
import { useToast } from "../../hooks/useToast";
import { PERMISSIONS } from "../../config/permissions";

const ACTIVE_INSTANCE_KEY = "zenaix_active_whatsapp_instance";

export function Conversations() {
  const [activeInstance, setActiveInstance] = useState<WhatsAppInstanceOutput | null>(null);

  const { token, user, hasPermission } = useAuthStore((state) => ({
    token: state.token,
    user: state.user,
    hasPermission: state.hasPermission,
  }));

  const { instances, isLoading, fetchAllInstances } = useWhatsAppInstanceStore();
  const { showToast } = useToast();

  // Buscar instâncias se necessário
  useEffect(() => {
    if (token && user?.organization_id && instances.length === 0 && !isLoading) {
      fetchAllInstances(token, user.organization_id);
    }
  }, [token, user?.organization_id, instances.length, isLoading]);

  // Definir instância ativa
  useEffect(() => {
    if (instances.length > 0) {
      // Verificar se há uma instância ativa salva no localStorage
      const savedInstanceId = localStorage.getItem(ACTIVE_INSTANCE_KEY);
      
      if (savedInstanceId) {
        const savedInstance = instances.find(instance => instance.id === savedInstanceId);
        if (savedInstance) {
          setActiveInstance(savedInstance);
          return;
        }
      }

      // Se não há instância salva, usar a primeira conectada ou a primeira disponível
      const connectedInstance = instances.find(instance => instance.status === "CONNECTED");
      if (connectedInstance) {
        setActiveInstance(connectedInstance);
        localStorage.setItem(ACTIVE_INSTANCE_KEY, connectedInstance.id);
      } else if (instances.length > 0) {
        setActiveInstance(instances[0]);
        localStorage.setItem(ACTIVE_INSTANCE_KEY, instances[0].id);
      }
    }
  }, [instances]);

  const handleInstanceSelect = (instance: WhatsAppInstanceOutput) => {
    setActiveInstance(instance);
    localStorage.setItem(ACTIVE_INSTANCE_KEY, instance.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'DISCONNECTED':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'QR_PENDING':
        return <QrCode className="w-4 h-4 text-yellow-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'QR_PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'Conectado';
      case 'DISCONNECTED':
        return 'Desconectado';
      case 'QR_PENDING':
        return 'QR Pendente';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading && instances.length === 0) {
    return (
      <div className="p-6 h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Conversas
          </h1>
        </div>
        <div className="text-center py-12">Carregando instâncias...</div>
      </div>
    );
  }

  if (!hasPermission(PERMISSIONS.WHATSAPP_READ)) {
    return (
      <div className="p-6 h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Conversas
          </h1>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Você não tem permissão para acessar as conversas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-[95vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Conversas
        </h1>
      </div>

      {instances.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhuma instância WhatsApp encontrada
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Crie uma instância em Conexões para começar a conversar
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow bg-white dark:bg-dark-800 rounded-lg shadow">
          {/* Barra de navegação das instâncias */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-t-lg overflow-x-auto">
            {instances.map((instance) => (
              <div
                onClick={() => handleInstanceSelect(instance)}
                key={instance.id}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[150px] max-w-[200px] ${
                  activeInstance && activeInstance.id === instance.id
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(instance.status)}
                  <span className="truncate flex-grow text-left">
                    {instance.name}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(instance.status)}`}>
                  {getStatusText(instance.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Área de conteúdo */}
          <div className="flex-grow p-6">
            {activeInstance ? (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {activeInstance.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(activeInstance.status)}
                      <span>{getStatusText(activeInstance.status)}</span>
                    </div>
                    {activeInstance.phone_number && (
                      <span>📱 {activeInstance.phone_number}</span>
                    )}
                  </div>
                </div>

                {/* Área do chat */}
                <div className="flex-grow bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  {activeInstance.status === "CONNECTED" ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-grow bg-white dark:bg-dark-600 rounded-lg p-4 mb-4">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Chat em desenvolvimento</p>
                          <p className="text-sm">Em breve você poderá conversar aqui</p>
                        </div>
                      </div>
                      
                      {/* Área de input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Digite sua mensagem..."
                          className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-dark-600 dark:text-white"
                          disabled
                        />
                        <button
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                          disabled
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">
                          {activeInstance.status === "QR_PENDING" 
                            ? "QR Code Pendente" 
                            : "Instância Desconectada"
                          }
                        </h3>
                        <p className="text-sm">
                          {activeInstance.status === "QR_PENDING"
                            ? "Conecte sua instância em Conexões para começar a conversar"
                            : "Reconecte sua instância em Conexões para continuar"
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Selecione uma instância para visualizar as conversas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 