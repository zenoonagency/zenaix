import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  MoreVertical,
  Wifi,
  WifiOff,
  QrCode,
  MessageCircle,
  WifiIcon, // Este ícone não foi usado no seu JSX, mas mantive o import.
  Send,
  Mic,
  Paperclip,
  Pin,
  X,
  Download,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useWhatsAppInstanceStore } from "../../store/whatsAppInstanceStore";
import { useWhatsappContactStore } from "../../store/whatsapp/whatsappContactStore";
import { useWhatsappMessageStore } from "../../store/whatsapp/whatsappMessageStore";
import { WhatsAppInstanceOutput } from "../../types/whatsappInstance";
import { WhatsappContact, WhatsappMessage } from "../../types/whatsapp";
import { useToast } from "../../hooks/useToast";
import { PERMISSIONS } from "../../config/permissions";
import { useNavigate } from "react-router-dom";
import { ContactOptionsMenu } from "../../components/ContactOptionsMenu";
import { EditContactModal } from "../../components/EditContactModal";
// Importar CSS para hide-scrollbar
import "../Messaging/carousel.css";

const LOGO_URL = "/assets/images/zenaix-logo-bg.png";

// As funções auxiliares (InstanceInfoPopover, getStatusInfo, etc.) continuam as mesmas.
// Você pode mantê-las como estão no seu arquivo original.
// ... (cole suas funções auxiliares aqui se elas estiverem no mesmo arquivo)

// Função para obter o ícone e cor do status
function getStatusInfo(status: string) {
  switch (status) {
    case "CONNECTED":
      return {
        icon: Wifi,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      };
    case "QR_PENDING":
      return {
        icon: QrCode,
        color: "text-yellow-500",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      };
    default:
      return {
        icon: WifiOff,
        color: "text-red-500",
        bgColor: "bg-red-100 dark:bg-red-900/30",
      };
  }
}

// Função para processar URLs de imagens do WhatsApp
function processWhatsAppImageUrl(url: string): string {
  if (!url) return "";
  if (url.includes("pps.whatsapp.net")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      url
    )}&w=100&h=100&fit=cover&output=webp`;
  }
  return url;
}

// Função para detectar se uma mensagem é uma figurinha (sticker)
function isSticker(message: WhatsappMessage): boolean {
  // Verificação direta para stickers
  if (message.message_type === "sticker") {
    return true;
  }

  // Verificação de segurança para casos específicos
  if (message.message_type === "chat" && message.media_type === "image/webp") {
    return true;
  }

  return false;
}

// Função para formatar a data do separador
function formatDateSeparator(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date);

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const yesterdayDate = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );
  const messageDateOnly = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  if (messageDateOnly.getTime() === todayDate.getTime()) return "Hoje";
  if (messageDateOnly.getTime() === yesterdayDate.getTime()) return "Ontem";
  return messageDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Função para agrupar mensagens por data
function groupMessagesByDate(messages: WhatsappMessage[]): Array<{
  type: "separator" | "message";
  date?: string;
  message?: WhatsappMessage;
  dateKey?: string;
}> {
  if (!messages.length) return [];

  const sortedMessages = messages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const grouped: Array<{
    type: "separator" | "message";
    date?: string;
    message?: WhatsappMessage;
    dateKey?: string;
  }> = [];

  let currentDate = "";

  sortedMessages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const dateKey = messageDate.toDateString();

    if (dateKey !== currentDate) {
      currentDate = dateKey;
      grouped.push({
        type: "separator",
        date: formatDateSeparator(messageDate),
        dateKey,
      });
    }

    grouped.push({
      type: "message",
      message,
      dateKey,
    });
  });

  return grouped;
}

// Função para obter a data atual baseada no scroll (você pode mantê-la como está)
function getCurrentDateFromScroll(
  container: HTMLDivElement,
  groupedMessages: Array<{
    type: "separator" | "message";
    date?: string;
    message?: WhatsappMessage;
    dateKey?: string;
  }>
): string | null {
  // Sua implementação atual desta função está boa
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top;

  let currentDate: string | null = null;
  let firstVisibleSeparator: { date: string | undefined; top: number } | null =
    null;

  groupedMessages.forEach((item, index) => {
    if (item.type === "separator") {
      const separatorElement = container.querySelector(
        `[data-separator-index="${index}"]`
      );
      if (separatorElement) {
        const elementRect = separatorElement.getBoundingClientRect();
        if (elementRect.top >= containerTop) {
          if (
            !firstVisibleSeparator ||
            elementRect.top < firstVisibleSeparator.top
          ) {
            firstVisibleSeparator = { date: item.date, top: elementRect.top };
          }
        }
      }
    }
  });

  // Se não houver separador visível, pegue o último que passou
  if (!firstVisibleSeparator) {
    for (let i = groupedMessages.length - 1; i >= 0; i--) {
      const item = groupedMessages[i];
      if (item.type === "separator") {
        return item.date || null;
      }
    }
  }

  return firstVisibleSeparator?.date || null;
}

export function Conversations() {
  const { user, token, hasPermission } = useAuthStore();
  const {
    instances,
    isLoading: isLoadingInstances,
    fetchAllInstances,
    lastActiveInstanceId,
    setLastActiveInstance,
  } = useWhatsAppInstanceStore();
  const {
    contacts,
    isLoading: isLoadingContacts,
    fetchAllContacts,
    updateContactInStore,
    deleteContactFromStore,
  } = useWhatsappContactStore();
  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    fetchAllMessages,
    fetchMoreMessages,
  } = useWhatsappMessageStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(
    lastActiveInstanceId
  );
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [showInstanceMenu, setShowInstanceMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showContactMenu, setShowContactMenu] = useState<string | null>(null);
  const [contactMenuPosition, setContactMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [editingContact, setEditingContact] = useState<WhatsappContact | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [fixedDate, setFixedDate] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Refs para controle de Scroll ---
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previousHeightRef = useRef<number>(0);
  const hasInitialScrollRef = useRef<boolean>(false);

  const instanceContacts: WhatsappContact[] = activeInstanceId
    ? (contacts[activeInstanceId] || []).sort((a, b) => {
        // Contatos fixados (pinned) ficam no topo
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        // Se ambos são fixados ou ambos não são fixados, mantém a ordem original
        return 0;
      })
    : [];
  const contactMessages =
    activeInstanceId && selectedContactId
      ? messages[activeInstanceId]?.[selectedContactId] || []
      : [];
  const activeInstance =
    instances.find((i) => i.id === activeInstanceId) || null;

  useEffect(() => {
    if (lastActiveInstanceId && !activeInstanceId) {
      setActiveInstanceId(lastActiveInstanceId);
    }
  }, [lastActiveInstanceId, activeInstanceId]);

  const handleInstanceChange = (instanceId: string) => {
    setActiveInstanceId(instanceId);
    setLastActiveInstance(instanceId);
    setSelectedContactId(null);
  };

  useEffect(() => {
    if (
      token &&
      user?.organization_id &&
      instances.length === 0 &&
      !isLoadingInstances
    ) {
      fetchAllInstances(token, user.organization_id);
    }
  }, [token, user?.organization_id, instances.length, isLoadingInstances]);

  useEffect(() => {
    if (token && user?.organization_id && activeInstanceId) {
      const hasContacts =
        contacts[activeInstanceId] && contacts[activeInstanceId].length > 0;
      fetchAllContacts(
        token,
        user.organization_id,
        activeInstanceId,
        !hasContacts
      );
    }
  }, [token, user?.organization_id, activeInstanceId]);

  useEffect(() => {
    if (
      token &&
      user?.organization_id &&
      activeInstanceId &&
      selectedContactId
    ) {
      fetchAllMessages(
        token,
        user.organization_id,
        activeInstanceId,
        selectedContactId
      );
    }
  }, [
    token,
    user?.organization_id,
    activeInstanceId,
    selectedContactId,
    fetchAllMessages,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showInstanceMenu &&
        !(event.target as Element).closest(".conversations-tab-dropdown")
      ) {
        setShowInstanceMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInstanceMenu]);

  // Fechar modal de imagem com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showImageModal) {
        setShowImageModal(false);
        setSelectedImage(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showImageModal]);

  // ==================================================================
  // ========= INÍCIO DA LÓGICA DE SCROLL REFINADA =====================
  // ==================================================================

  // EFEITO 1: Resetar o estado do scroll ao trocar de contato.
  // Este é o passo mais crucial para garantir que cada conversa comece do zero.
  useEffect(() => {
    previousHeightRef.current = 0;
    hasInitialScrollRef.current = false;
    setFixedDate(null);
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [selectedContactId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;

    const grouped = groupMessagesByDate(contactMessages);
    const currentDate = getCurrentDateFromScroll(target, grouped);
    if (currentDate) setFixedDate(currentDate);

    if (
      scrollTop <= 100 &&
      activeInstanceId &&
      selectedContactId &&
      hasMoreMessages[activeInstanceId]?.[selectedContactId] &&
      !isLoadingMore[activeInstanceId]?.[selectedContactId]
    ) {
      previousHeightRef.current = target.scrollHeight;
      fetchMoreMessages(
        token!,
        user!.organization_id,
        activeInstanceId,
        selectedContactId
      );
    }
  };

  // EFEITO 2: Gerencia o scroll APÓS a renderização.
  // TROCAMOS useEffect por useLayoutEffect para garantir que o scroll aconteça no momento certo.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container && contactMessages.length > 0) {
      // CASO A: Mantém a posição do scroll ao carregar mensagens antigas.
      // Se `previousHeightRef` tem um valor, significa que acabamos de carregar mensagens no topo.
      if (previousHeightRef.current > 0) {
        const heightDifference =
          container.scrollHeight - previousHeightRef.current;
        container.scrollTop = heightDifference;
        previousHeightRef.current = 0; // Reseta para o próximo ciclo.
        return; // Impede que o código abaixo execute.
      }

      // CASO B: Rola para o final.
      // Isso acontece no primeiro carregamento de um contato (`hasInitialScrollRef` é false)
      // ou quando a última mensagem é uma nova mensagem de saída.
      const lastMessage = contactMessages[contactMessages.length - 1];
      const isNewOutgoingMessage =
        lastMessage?.direction === "OUTGOING" &&
        lastMessage.id.startsWith("temp_");

      // Se for o scroll inicial OU uma nova mensagem foi enviada, role para o final.
      if (!hasInitialScrollRef.current || isNewOutgoingMessage) {
        container.scrollTop = container.scrollHeight;
        hasInitialScrollRef.current = true; // Marca que o scroll inicial já foi feito.
      }
    }
  }, [contactMessages]);

  // ==================================================================
  // ========= FIM DA LÓGICA DE SCROLL REFINADA ========================
  // ==================================================================

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !selectedContactId ||
      !activeInstanceId ||
      !token ||
      !user?.organization_id
    )
      return;

    const selectedContact = instanceContacts.find(
      (c) => c.id === selectedContactId
    );
    if (!selectedContact) {
      showToast("Contato não encontrado", "error");
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage("");

    const tempMessage: WhatsappMessage = {
      id: `temp_${Date.now()}`,
      wa_message_id: "",
      from: `${activeInstance?.phone_number}@c.us`,
      to: `${selectedContact.phone}@c.us`,
      body: messageText,
      media_url: null,
      media_type: null,
      message_type: null,
      timestamp: new Date().toISOString(),
      read: false,
      ack: 0,
      file_name: null,
      file_size_bytes: null,
      media_duration_sec: null,
      whatsapp_instance_id: activeInstanceId,
      organization_id: user.organization_id,
      whatsapp_contact_id: selectedContactId,
      created_at: new Date().toISOString(),
      direction: "OUTGOING",
      status: "sending",
    };

    const messageStore = useWhatsappMessageStore.getState();
    messageStore.addTemporaryMessage(
      activeInstanceId,
      selectedContactId,
      tempMessage
    );

    // Rolar para o final ao enviar
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    }, 100);

    setIsSendingMessage(true);
    try {
      const { whatsappMessageService } = await import(
        "../../services/whatsapp/whatsappMessage.service"
      );
      await whatsappMessageService.send(
        token,
        user.organization_id,
        activeInstanceId,
        {
          phone: selectedContact.phone,
          message: messageText,
        }
      );
    } catch (error: any) {
      showToast(error.message || "Erro ao enviar mensagem", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        left: Math.min(rect.left, window.innerWidth - 250),
      });
    }
    setShowInstanceMenu(instanceId);
  };

  const handleContactMenuClick = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContactMenuPosition({ top: rect.bottom + 5, left: rect.left });
    setShowContactMenu(showContactMenu === contactId ? null : contactId);
  };

  const handleEditContact = (contact: WhatsappContact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleUpdateContact = (updatedContact: WhatsappContact) => {
    if (activeInstanceId) {
      updateContactInStore(activeInstanceId, updatedContact.id, updatedContact);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    if (activeInstanceId) {
      deleteContactFromStore(activeInstanceId, contactId);
      if (selectedContactId === contactId) {
        setSelectedContactId(null);
      }
    }
  };

  if (isLoadingInstances && instances.length === 0) {
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
          <button
            onClick={() => navigate("/conexoes")}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Ir para Conexões
          </button>
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
                          onClick={() => handleInstanceChange(instance.id)}
                          className={`conversations-tab flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium border-b-2 transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                            activeInstanceId === instance.id
                              ? "active border-[#7f00ff] text-[#7f00ff] bg-white dark:bg-dark-900"
                              : "border-transparent text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-200 dark:hover:bg-dark-600"
                          }`}
                          style={{ minWidth: 160, maxWidth: 220 }}
                        >
                          <span className="truncate text-sm font-medium flex-1">
                            {instance.name}
                          </span>
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full ${statusInfo.bgColor} flex-shrink-0`}
                          >
                            <StatusIcon
                              className={`w-3 h-3 ${statusInfo.color}`}
                            />
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
                  <div className="p-4 text-center text-gray-500">
                    Carregando contatos...
                  </div>
                ) : instanceContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    Nenhum contato encontrado
                  </div>
                ) : (
                  instanceContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`relative flex items-center gap-3 px-4 py-3 border-b hover:bg-[#f5f5ff] dark:hover:bg-[#23233a] ${
                        selectedContactId === contact.id
                          ? "bg-[#f5f5ff] dark:bg-[#23233a]"
                          : ""
                      }`}
                    >
                      <button
                        className="flex items-center gap-3 flex-1"
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        {contact.avatar_url ? (
                          <img
                            src={processWhatsAppImageUrl(contact.avatar_url)}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback para inicial se a imagem falhar
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback =
                                target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.classList.remove("hidden");
                              }
                            }}
                            onLoad={(e) => {
                              // Se a imagem carregar com sucesso, esconder o fallback
                              const target = e.target as HTMLImageElement;
                              const fallback =
                                target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.classList.add("hidden");
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg uppercase ${
                            contact.avatar_url ? "hidden" : ""
                          }`}
                        >
                          {contact.name?.[0] || contact.phone?.slice(-2) || "?"}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {contact.name}
                            {contact.is_pinned && (
                              <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Pin className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contact.phone}
                          </div>
                        </div>
                      </button>

                      {/* Botão de menu */}
                      <button
                        onClick={(e) => handleContactMenuClick(e, contact.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        title="Opções"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
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
                      const selectedContact = instanceContacts.find(
                        (c) => c.id === selectedContactId
                      );
                      return selectedContact ? (
                        <>
                          {selectedContact.avatar_url ? (
                            <img
                              src={processWhatsAppImageUrl(
                                selectedContact.avatar_url
                              )}
                              alt={selectedContact.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const fallback =
                                  target.nextElementSibling as HTMLElement;
                                if (fallback)
                                  fallback.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg uppercase ${
                              selectedContact.avatar_url ? "hidden" : ""
                            }`}
                          >
                            {selectedContact.name?.[0] ||
                              selectedContact.phone?.slice(-2) ||
                              "?"}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {selectedContact.name}
                              {selectedContact.is_pinned && (
                                <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                  <Pin className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedContact.phone}
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>

                  {/* Área de mensagens */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto relative"
                    style={{
                      backgroundImage: `url(${LOGO_URL})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "200px",
                      backgroundAttachment: "local",
                    }}
                    onScroll={handleScroll}
                  >
                    {/* Mensagens */}
                    <div className="relative z-10 flex flex-col p-6 min-h-full bg-white/85 dark:bg-dark-900/85 justify-end">
                      {isLoadingMessages ? (
                        <div className="text-center text-gray-500">
                          Carregando mensagens...
                        </div>
                      ) : contactMessages.length === 0 ? (
                        <div className="text-center text-gray-400">
                          Nenhuma mensagem encontrada
                        </div>
                      ) : (
                        <>
                          {/* Indicador de loading para mais mensagens */}
                          {isLoadingMore[activeInstanceId]?.[
                            selectedContactId
                          ] && (
                            <div className="flex justify-center mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                                Carregando mais mensagens...
                              </div>
                            </div>
                          )}

                          {groupMessagesByDate(contactMessages).map(
                            (item, index) => (
                              <div key={index}>
                                {item.type === "separator" && (
                                  <div
                                    className="flex justify-center my-4"
                                    data-separator-index={index}
                                  >
                                    <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                                      {item.date}
                                    </div>
                                  </div>
                                )}

                                {item.type === "message" && item.message && (
                                  <div
                                    className={`mb-3 flex ${
                                      item.message.direction === "OUTGOING"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <div
                                      className={`rounded-2xl px-4 py-2 max-w-xs lg:max-w-md ${
                                        item.message.direction === "OUTGOING"
                                          ? "bg-[#7f00ff] text-white"
                                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      }`}
                                    >
                                      {item.message.body && (
                                        <div className="text-sm whitespace-pre-wrap">
                                          {item.message.body}
                                        </div>
                                      )}
                                      {item.message.media_url && (
                                        <div className="mt-2">
                                          {item.message.media_type?.startsWith(
                                            "image/"
                                          ) ? (
                                            <img
                                              src={item.message.media_url}
                                              alt="Mídia da mensagem"
                                              className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
                                                isSticker(item.message)
                                                  ? "w-20 h-20 object-contain"
                                                  : "max-w-full h-auto"
                                              }`}
                                              onClick={() => {
                                                setSelectedImage(
                                                  item.message.media_url
                                                );
                                                setShowImageModal(true);
                                              }}
                                            />
                                          ) : item.message.media_type?.startsWith(
                                              "video/"
                                            ) ? (
                                            <video
                                              src={item.message.media_url}
                                              controls
                                              className="max-w-full h-auto rounded-lg"
                                            />
                                          ) : item.message.media_type?.startsWith(
                                              "audio/"
                                            ) ? (
                                            <audio
                                              src={item.message.media_url}
                                              controls
                                              className="w-full"
                                            />
                                          ) : (
                                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                              <Paperclip className="w-4 h-4" />
                                              <span className="text-sm">
                                                {item.message.file_name ||
                                                  "Arquivo"}
                                              </span>
                                              <a
                                                href={item.message.media_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`text-xs underline ${
                                                  item.message.direction ===
                                                  "OUTGOING"
                                                    ? "text-blue-200"
                                                    : "text-blue-600"
                                                }`}
                                              >
                                                Baixar
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div
                                        className={`text-xs mt-1 flex items-center justify-between ${
                                          item.message.direction === "OUTGOING"
                                            ? "text-blue-200"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        <span>
                                          {new Date(
                                            item.message.timestamp
                                          ).toLocaleTimeString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        {item.message.direction ===
                                          "OUTGOING" && (
                                          <span className="ml-2">
                                            {item.message.status ===
                                              "sending" && (
                                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            {/* Priorizar ACK sobre status quando disponível */}
                                            {item.message.ack === 1 && (
                                              <span>✓</span>
                                            )}
                                            {item.message.ack === 2 && (
                                              <span>✓✓</span>
                                            )}
                                            {item.message.ack === 3 && (
                                              <span className="text-blue-400">
                                                ✓✓
                                              </span>
                                            )}
                                            {/* Fallback para status quando ACK não está disponível */}
                                            {!item.message.ack &&
                                              item.message.status ===
                                                "sent" && <span>✓</span>}
                                            {!item.message.ack &&
                                              item.message.status ===
                                                "delivered" && <span>✓✓</span>}
                                            {!item.message.ack &&
                                              item.message.status ===
                                                "read" && (
                                                <span className="text-blue-400">
                                                  ✓✓
                                                </span>
                                              )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </>
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
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Digite uma mensagem..."
                          className="w-full px-4 py-2 bg-white dark:bg-dark-900 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          disabled={isSendingMessage}
                          rows={1}
                          style={{ minHeight: "40px", maxHeight: "120px" }}
                        />
                      </div>

                      {/* Botão de enviar */}
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSendingMessage}
                        className={`p-2 rounded-full transition-colors ${
                          newMessage.trim() && !isSendingMessage
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${LOGO_URL})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "200px",
                      backgroundPosition: "center center",
                      opacity: 0.15,
                    }}
                  ></div>
                  {/* Conteúdo central */}
                  <div className="relative z-10 flex items-center justify-center">
                    {activeInstanceId ? (
                      // Verificar se a instância ativa está conectada
                      (() => {
                        const activeInstance = instances.find(
                          (instance) => instance.id === activeInstanceId
                        );
                        if (
                          activeInstance &&
                          activeInstance.status !== "CONNECTED"
                        ) {
                          return (
                            <div className="text-center bg-white px-8 py-8 rounded-xl shadow-xl border border-gray-300">
                              <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
                              <div className="text-2xl font-bold text-black">
                                Instância não conectada
                              </div>
                              <div className="text-sm text-black mt-2 mb-4">
                                Você ainda não conectou sua instância. Clique
                                aqui para conectar.
                              </div>
                              <button
                                onClick={() => navigate("/conexoes")}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                              >
                                Conectar Instância
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="text-center bg-white px-8 py-8 rounded-xl shadow-xl border border-gray-300">
                            <MessageCircle className="w-16 h-16 text-black mx-auto mb-4" />
                            <div className="text-2xl font-bold text-black">
                              Selecione um contato para ver as mensagens
                            </div>
                            <div className="text-sm text-black mt-2">
                              Escolha um contato da lista ao lado para iniciar
                              uma conversa
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center bg-white px-8 py-8 rounded-xl shadow-xl border border-gray-300">
                        <MessageCircle className="w-16 h-16 text-black mx-auto mb-4" />
                        <div className="text-2xl font-bold text-black">
                          Selecione um contato para ver as mensagens
                        </div>
                        <div className="text-sm text-black mt-2">
                          Escolha um contato da lista ao lado para iniciar uma
                          conversa
                        </div>
                      </div>
                    )}
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
            left: menuPosition.left,
          }}
          onMouseLeave={() => setShowInstanceMenu(null)}
        >
          {(() => {
            const instance = instances.find((i) => i.id === showInstanceMenu);
            if (!instance) return null;

            const statusInfo = getStatusInfo(instance.status);
            const StatusIcon = statusInfo.icon;

            return (
              <>
                <div className="font-semibold text-sm mb-2">
                  {instance.name}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  <span className={`text-xs font-medium ${statusInfo.color}`}>
                    {instance.status === "CONNECTED"
                      ? "Conectado"
                      : instance.status === "QR_PENDING"
                      ? "QR Pendente"
                      : "Desconectado"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Número: {instance.phone_number}
                </div>
                {/* Mostrar QR apenas se não estiver conectado */}
                {instance.status !== "CONNECTED" && instance.qr_code && (
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

      {/* Menu de opções de contato */}
      {showContactMenu &&
        (() => {
          const contact = instanceContacts.find(
            (c) => c.id === showContactMenu
          );
          return contact ? (
            <ContactOptionsMenu
              contact={contact}
              instanceId={activeInstanceId!}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              isOpen={true}
              onToggle={() => setShowContactMenu(null)}
              position={contactMenuPosition}
            />
          ) : null;
        })()}

      {/* Modal de edição de contato */}
      <EditContactModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingContact(null);
        }}
        contact={editingContact}
        instanceId={activeInstanceId!}
        onUpdate={handleUpdateContact}
      />

      {/* Modal de imagem */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        >
          <div className="relative max-w-6xl max-h-[95vh] overflow-hidden">
            {/* Botões de ação - posicionados sobre a imagem */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(selectedImage);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `imagem_${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error("Erro ao baixar imagem:", error);
                    // Fallback para o método anterior
                    const link = document.createElement("a");
                    link.href = selectedImage;
                    link.download = `imagem_${Date.now()}.jpg`;
                    link.click();
                  }
                }}
                className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-dark-800/90 hover:bg-white dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Baixar imagem"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
                className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-dark-800/90 hover:bg-white dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagem */}
            <img
              src={selectedImage}
              alt="Imagem da mensagem"
              className="max-w-full max-h-[95vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
