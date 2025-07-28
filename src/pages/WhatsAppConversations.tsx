import React, { useEffect, useState } from 'react';
import { useWhatsAppInstanceStore } from '../store/whatsAppInstanceStore';
import { useWhatsappContactStore } from '../store/whatsapp/whatsappContactStore';
import { useWhatsappMessageStore } from '../store/whatsapp/whatsappMessageStore';
import { useAuthStore } from '../store/authStore';
import { WhatsAppInstanceOutput } from '../types/whatsappInstance';
import { WhatsappContact } from '../types/whatsapp';
import { Menu, QrCode, Wifi, WifiOff, Send, Mic, Paperclip } from 'lucide-react';

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

export default function WhatsAppConversationsPage() {
  const { token, organization } = useAuthStore();
  const {
    instances,
    isLoading: isLoadingInstances,
    fetchAllInstances,
  } = useWhatsAppInstanceStore();
  const {
    contacts,
    isLoading: isLoadingContacts,
    fetchAllContacts,
  } = useWhatsappContactStore();
  const {
    messages,
    isLoading: isLoadingMessages,
    fetchAllMessages,
  } = useWhatsappMessageStore();

  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showInstanceInfo, setShowInstanceInfo] = useState(false);
  
  // Estados para envio de mensagens
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Buscar instâncias ao montar
  useEffect(() => {
    if (token && organization?.id) {
      fetchAllInstances(token, organization.id);
    }
  }, [token, organization, fetchAllInstances]);

  // Definir primeira instância como ativa
  useEffect(() => {
    if (instances.length > 0 && !activeInstanceId) {
      setActiveInstanceId(instances[0].id);
    }
  }, [instances, activeInstanceId]);

  // Buscar contatos da instância ativa
  useEffect(() => {
    if (token && organization?.id && activeInstanceId) {
      fetchAllContacts(token, organization.id, activeInstanceId);
      setSelectedContactId(null); // Limpa contato ao trocar de instância
    }
  }, [token, organization, activeInstanceId, fetchAllContacts]);

  // Buscar mensagens do contato selecionado
  useEffect(() => {
    if (token && organization?.id && activeInstanceId && selectedContactId) {
      fetchAllMessages(token, organization.id, activeInstanceId, selectedContactId);
    }
  }, [token, organization, activeInstanceId, selectedContactId, fetchAllMessages]);

  // Contatos da instância ativa
  const instanceContacts: WhatsappContact[] = activeInstanceId ? (contacts[activeInstanceId] || []) : [];
  // Mensagens do contato selecionado
  const contactMessages = (activeInstanceId && selectedContactId)
    ? (messages[activeInstanceId]?.[selectedContactId] || [])
    : [];
  const activeInstance = instances.find((i) => i.id === activeInstanceId) || null;

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContactId || !activeInstanceId || !token || !organization?.id) {
      return;
    }

    const selectedContact = instanceContacts.find(c => c.id === selectedContactId);
    if (!selectedContact) {
      return;
    }

    setIsSendingMessage(true);
    try {
      // Importar o serviço dinamicamente para evitar dependência circular
      const { whatsappMessageService } = await import('../services/whatsapp/whatsappMessage.service');
      
      await whatsappMessageService.send(token, organization.id, activeInstanceId, {
        phone: selectedContact.phone,
        message: newMessage.trim()
      });

      // Limpar o campo de mensagem
      setNewMessage('');
      
      // Recarregar mensagens para mostrar a nova mensagem
      await fetchAllMessages(token, organization.id, activeInstanceId, selectedContactId);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Função para enviar mensagem com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Abas das instâncias */}
      <div className="flex border-b bg-white dark:bg-dark-800 px-4 pt-4">
        <div className="flex gap-2">
          {instances.map((instance) => (
            <button
              key={instance.id}
              className={`px-5 py-2 rounded-t-lg font-medium border-b-2 transition-colors duration-150 ${activeInstanceId === instance.id ? 'border-[#7f00ff] text-[#7f00ff] bg-white dark:bg-dark-900' : 'border-transparent text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-dark-700'}`}
              onClick={() => setActiveInstanceId(instance.id)}
            >
              {instance.name}
            </button>
          ))}
        </div>
        {/* Botão hamburguer info instância */}
        {activeInstance && (
          <div className="ml-auto flex items-center">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
              onClick={() => setShowInstanceInfo((v) => !v)}
              title="Informações da instância"
            >
              <Menu className="w-6 h-6" />
            </button>
            {showInstanceInfo && (
              <div className="absolute mt-2 right-8 z-50" onMouseLeave={() => setShowInstanceInfo(false)}>
                <InstanceInfoPopover instance={activeInstance} />
              </div>
            )}
          </div>
        )}
      </div>
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
            <>
              {/* Cabeçalho do contato */}
              <div className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                {(() => {
                  const selectedContact = instanceContacts.find(c => c.id === selectedContactId);
                  return selectedContact ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg uppercase">
                        {selectedContact.name?.[0] || selectedContact.phone?.slice(-2) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{selectedContact.name}</div>
                        <div className="text-xs text-gray-500">{selectedContact.phone}</div>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>

              {/* Área de mensagens */}
              <div className="flex-1 overflow-y-auto relative">
                {/* Background com logo */}
                <div className="absolute inset-0" style={{ backgroundImage: `url(${LOGO_URL})`, backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.12 }}></div>
                {/* Mensagens */}
                <div className="relative z-10 flex flex-col justify-end p-6 h-full">
                {isLoadingMessages ? (
                  <div className="text-center text-gray-500">Carregando mensagens...</div>
                ) : contactMessages.length === 0 ? (
                  <div className="text-center text-gray-400">Nenhuma mensagem encontrada</div>
                                  ) : (
                    contactMessages
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((msg) => (
                    <div key={msg.id} className={`mb-3 flex ${msg.direction === 'OUTGOING' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-4 py-2 max-w-xs lg:max-w-md ${msg.direction === 'OUTGOING' ? 'bg-[#7f00ff] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                        {msg.body ? (
                          <div className="text-sm">{msg.body}</div>
                        ) : (
                          <span className="italic text-xs text-gray-400">[Mídia]</span>
                        )}
                        {msg.media_url && (
                          <div className="mt-2">
                            <a 
                              href={msg.media_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`text-xs underline ${msg.direction === 'OUTGOING' ? 'text-blue-200' : 'text-blue-600'}`}
                            >
                              Ver mídia
                            </a>
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${msg.direction === 'OUTGOING' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                                        ))
                    )}
                  </div>
                </div>

                {/* Barra de envio de mensagens */}
                <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Botão de áudio (desabilitado) */}
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-not-allowed"
                      title="Gravar áudio (em breve)"
                      disabled
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    {/* Botão de anexo (desabilitado) */}
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-not-allowed"
                      title="Anexar arquivo (em breve)"
                      disabled
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Campo de mensagem */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite uma mensagem..."
                        className="w-full px-4 py-2 bg-white dark:bg-dark-900 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={isSendingMessage}
                      />
                    </div>

                    {/* Botão de enviar */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSendingMessage}
                      className={`p-2 rounded-full transition-colors ${
                        newMessage.trim() && !isSendingMessage
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                      title="Enviar mensagem"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              </>
              ) : (
            <div className="flex-1 flex items-center justify-center relative">
              {/* Background com logo */}
              <div className="absolute inset-0" style={{ backgroundImage: `url(${LOGO_URL})`, backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.12 }}></div>
              <div className="relative z-10 flex items-center justify-center">
                <div className="text-2xl font-bold text-gray-400 dark:text-gray-600 text-center">
                  Selecione um contato para ver as mensagens
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 