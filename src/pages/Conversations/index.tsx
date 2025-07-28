import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, Wifi, WifiOff, QrCode, Menu, MoreVertical } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useWhatsAppInstanceStore } from "../../store/whatsAppInstanceStore";
import { useWhatsappContactStore } from '../../store/whatsapp/whatsappContactStore';
import { useWhatsappMessageStore } from '../../store/whatsapp/whatsappMessageStore';
import { WhatsAppInstanceOutput } from "../../types/whatsappInstance";
import { WhatsappContact } from '../../types/whatsapp';
import { useToast } from "../../hooks/useToast";
import { PERMISSIONS } from "../../config/permissions";
// Importar CSS para hide-scrollbar
import "../Messaging/carousel.css";

const LOGO_URL = '/public/assets/images/logo-light.svg';

function InstanceInfoPopover({ instance }: { instance: WhatsAppInstanceOutput }) {
  const statusColor = instance.status === 'CONNECTED' ? 'text-green-600' : instance.status === 'QR_PENDING' ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="rounded-lg shadow-lg bg-white dark:bg-dark-800 p-4 min-w-[220px]">
      <div className="font-bold text-lg mb-2">{instance.name}</div>
      <div className="flex items-center gap-2 mb-1">
        {instance.status === 'CONNECTED' ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        <span className={`text-sm font-medium ${statusColor}`}>{instance.status === 'CONNECTED' ? 'Conectado' : instance.status === 'QR_PENDING' ? 'QR Pendente' : 'Desconectado'}</span>
      </div>
      <div className="text-xs text-gray-500 mb-2">{instance.phone_number}</div>
      {instance.qr_code && (
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">QR disponível</span>
        </div>
      )}
      <div className="text-xs text-gray-400">ID: {instance.id}</div>
    </div>
  );
}

// Função para obter o ícone e cor do status
function getStatusInfo(status: string) {
  switch (status) {
    case 'CONNECTED':
      return { icon: Wifi, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    case 'QR_PENDING':
      return { icon: QrCode, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
    default:
      return { icon: WifiOff, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  }
}

export function Conversations() {
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showInstanceInfo, setShowInstanceInfo] = useState(false);
  const [showInstanceMenu, setShowInstanceMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const tabRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { token, user, hasPermission } = useAuthStore((state) => ({
    token: state.token,
    user: state.user,
    hasPermission: state.hasPermission,
  }));

  const { instances, isLoading, fetchAllInstances } = useWhatsAppInstanceStore();
  const { contacts, isLoading: isLoadingContacts, fetchAllContacts } = useWhatsappContactStore();
  const { messages, isLoading: isLoadingMessages, fetchAllMessages } = useWhatsappMessageStore();
  const { showToast } = useToast();

  // Buscar instâncias se necessário
  useEffect(() => {
    if (token && user?.organization_id && instances.length === 0 && !isLoading) {
      fetchAllInstances(token, user.organization_id);
    }
  }, [token, user?.organization_id, instances.length, isLoading]);

  // Definir instância ativa
  useEffect(() => {
    if (instances.length > 0 && !activeInstanceId) {
      setActiveInstanceId(instances[0].id);
    }
  }, [instances, activeInstanceId]);

  // Buscar contatos da instância ativa
  useEffect(() => {
    if (token && user?.organization_id && activeInstanceId) {
      fetchAllContacts(token, user.organization_id, activeInstanceId);
      setSelectedContactId(null);
    }
  }, [token, user?.organization_id, activeInstanceId, fetchAllContacts]);

  // Buscar mensagens do contato selecionado
  useEffect(() => {
    if (token && user?.organization_id && activeInstanceId && selectedContactId) {
      fetchAllMessages(token, user.organization_id, activeInstanceId, selectedContactId);
    }
  }, [token, user?.organization_id, activeInstanceId, selectedContactId, fetchAllMessages]);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInstanceMenu && !(event.target as Element).closest('.conversations-tab')) {
        setShowInstanceMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInstanceMenu]);

  const handleMenuClick = (e: React.MouseEvent, instanceId: string) => {
    e.stopPropagation();
    
    if (showInstanceMenu === instanceId) {
      setShowInstanceMenu(null);
      return;
    }

    const tabElement = tabRefs.current[instanceId];
    if (tabElement) {
      const rect = tabElement.getBoundingClientRect();
      
      setMenuPosition({
        top: rect.bottom + 5,
        left: Math.min(rect.left, window.innerWidth - 250)
      });
    }
    
    setShowInstanceMenu(instanceId);
  };

  const instanceContacts: WhatsappContact[] = activeInstanceId ? (contacts[activeInstanceId] || []) : [];
  const contactMessages = (activeInstanceId && selectedContactId)
    ? (messages[activeInstanceId]?.[selectedContactId] || [])
    : [];
  const activeInstance = instances.find((i) => i.id === activeInstanceId) || null;

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
        <div className="flex flex-col flex-grow bg-white dark:bg-dark-800 rounded-lg shadow h-full relative">
          {/* Barra de navegação das instâncias - Layout corrigido */}
          <div className="bg-gray-100 dark:bg-dark-700 rounded-t-lg px-2 py-1">
            <div className="flex items-center justify-between">
              {/* Container das abas com scroll horizontal */}
              <div className="flex-1 overflow-x-auto hide-scrollbar conversations-tabs-container">
                <div className="flex gap-1 min-w-max pb-1">
                  {instances.map((instance) => {
                    const statusInfo = getStatusInfo(instance.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div 
                        key={instance.id} 
                        className="relative"
                        ref={(el) => {
                          tabRefs.current[instance.id] = el;
                        }}
                      >
                        <button
                          onClick={() => setActiveInstanceId(instance.id)}
                          className={`conversations-tab flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium border-b-2 transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                            activeInstanceId === instance.id
                              ? "active border-[#7f00ff] text-[#7f00ff] bg-white dark:bg-dark-900"
                              : "border-transparent text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-200 dark:hover:bg-dark-600"
                          }`}
                          style={{ minWidth: 160, maxWidth: 220 }}
                        >
                          <span className="truncate text-sm font-medium flex-1">{instance.name}</span>
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${statusInfo.bgColor} flex-shrink-0`}>
                            <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                          </div>
                        </button>
                        
                        {/* Botão de menu para mais informações */}
                        <button
                          onClick={(e) => handleMenuClick(e, instance.id)}
                          className="conversations-tab-menu absolute -top-1 -right-1 w-6 h-6 bg-gray-200 dark:bg-dark-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-dark-500 transition-colors"
                          title="Mais informações"
                        >
                          <MoreVertical className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Layout principal: esquerda contatos, direita mensagens */}
          <div className="flex flex-1 min-h-0">
            {/* Coluna de contatos */}
            <div className="w-80 border-r bg-white dark:bg-dark-900 flex flex-col">
              <div className="p-4 font-bold text-lg border-b">Contatos</div>
              <div className="flex-1 overflow-y-auto">
                {isLoadingContacts ? (
                  <div className="p-4 text-center text-gray-500">Carregando contatos...</div>
                ) : instanceContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">Nenhum contato encontrado</div>
                ) : (
                  instanceContacts.map((contact) => (
                    <button
                      key={contact.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b hover:bg-[#f5f5ff] dark:hover:bg-[#23233a] ${selectedContactId === contact.id ? 'bg-[#f5f5ff] dark:bg-[#23233a]' : ''}`}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg uppercase">
                        {contact.name?.[0] || contact.phone?.slice(-2) || '?'}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{contact.name}</div>
                        <div className="text-xs text-gray-500">{contact.phone}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            {/* Área de mensagens */}
            <div className="flex-1 relative bg-white dark:bg-dark-900 flex flex-col">
              {selectedContactId ? (
                <div className="flex-1 overflow-y-auto relative" style={{ backgroundImage: `url(${LOGO_URL})`, backgroundRepeat: 'repeat', opacity: 0.12 }}>
                  {/* Mensagens */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-6" style={{ opacity: 1 }}>
                    {isLoadingMessages ? (
                      <div className="text-center text-gray-500">Carregando mensagens...</div>
                    ) : contactMessages.length === 0 ? (
                      <div className="text-center text-gray-400">Nenhuma mensagem encontrada</div>
                    ) : (
                      contactMessages.map((msg) => (
                        <div key={msg.id} className={`mb-2 flex ${msg.direction === 'OUTGOING' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.direction === 'OUTGOING' ? 'bg-[#7f00ff] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                            {msg.body || <span className="italic text-xs text-gray-400">[Mídia]</span>}
                            {msg.media_url && (
                              <div className="mt-1"><a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="underline text-xs">Ver mídia</a></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center relative" style={{ backgroundImage: `url(${LOGO_URL})`, backgroundRepeat: 'repeat', opacity: 0.12 }}>
                  <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity: 1 }}>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-600 text-center">
                      Selecione um contato para ver as mensagens
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de informações - Fora do container principal */}
      {showInstanceMenu && (
        <div 
          className="conversations-tab-dropdown fixed z-[9999] bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-600 p-3 min-w-[200px]"
          style={{
            top: menuPosition.top,
            left: menuPosition.left
          }}
          onMouseLeave={() => setShowInstanceMenu(null)}
        >
          {(() => {
            const instance = instances.find(i => i.id === showInstanceMenu);
            if (!instance) return null;
            
            const statusInfo = getStatusInfo(instance.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <>
                <div className="font-semibold text-sm mb-2">{instance.name}</div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  <span className={`text-xs font-medium ${statusInfo.color}`}>
                    {instance.status === 'CONNECTED' ? 'Conectado' : instance.status === 'QR_PENDING' ? 'QR Pendente' : 'Desconectado'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Número: {instance.phone_number}</div>
                {/* Mostrar QR apenas se não estiver conectado */}
                {instance.status !== 'CONNECTED' && instance.qr_code && (
                  <div className="flex items-center gap-2 mt-1">
                    <QrCode className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">QR disponível</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
} 