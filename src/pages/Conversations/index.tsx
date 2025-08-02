import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  MoreVertical,
  Wifi,
  WifiOff,
  QrCode,
  MessageCircle,
  Send,
  Mic,
  Paperclip,
  Pin,
  X,
  Download,
  Video,
} from "lucide-react";
import { AudioRecorderModal } from "../../components/AudioRecorderModal";
import { useAuthStore } from "../../store/authStore";
import { useWhatsAppInstanceStore } from "../../store/whatsAppInstanceStore";
import { useWhatsappContactStore } from "../../store/whatsapp/whatsappContactStore";
import { useWhatsappMessageStore } from "../../store/whatsapp/whatsappMessageStore";
import {
  WhatsappContact,
  WhatsappMessage,
  WhatsappMessageDirection,
} from "../../types/whatsapp";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { ContactOptionsMenu } from "../../components/ContactOptionsMenu";
import { EditContactModal } from "../../components/EditContactModal";
import { whatsappMessageService } from "../../services/whatsapp/whatsappMessage.service";
import { whatsappContactService } from "../../services/whatsapp/whatsappContact.service";
import { compressFile } from "../../utils/fileCompression";
import { ContactProfileModal } from "../../components/ContactProfileModal";
import { processWhatsAppMediaUrl } from "../../utils/imageUtils";
import { ModalCanAcess } from "../../components/ModalCanAcess";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { InstanceTabs } from "./components/InstanceTabs";
import { ContactList } from "./components/ContactList";
import { MessagesArea } from "./components/MessagesArea";
import { MessageInputBar } from "./components/MessageInputBar";
import { FileModal } from "./components/FileModal";
import { ImageModal } from "./components/ImageModal";
import { EmptyState } from "./components/EmptyState";

const LOGO_URL = "/assets/images/zenaix-logo-bg.png";

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

function processWhatsAppImageUrl(url: string): string {
  if (!url) return "";
  return processWhatsAppMediaUrl(url, "image/jpeg");
}

function isSticker(message: WhatsappMessage): boolean {
  if (message.message_type === "sticker") {
    return true;
  }

  if (message.message_type === "chat" && message.media_type === "image/webp") {
    return true;
  }

  return false;
}

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

function getCurrentDateFromScroll(
  container: HTMLDivElement,
  groupedMessages: Array<{
    type: "separator" | "message";
    date?: string;
    message?: WhatsappMessage;
    dateKey?: string;
  }>
): string | null {
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

  const canAccess = hasPermission("whatsapp:read");
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [fileCaption, setFileCaption] = useState("");
  const [showFileModal, setShowFileModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAudioModal, setShowAudioModal] = useState(false);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const [showContactProfileModal, setShowContactProfileModal] = useState(false);
  const [isLoadingContactsLocal, setIsLoadingContactsLocal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previousHeightRef = useRef<number>(0);
  const hasInitialScrollRef = useRef<boolean>(false);

  const [instancesFetched, setInstancesFetched] = useState(false);

  const instanceContacts: WhatsappContact[] = activeInstanceId
    ? (contacts[activeInstanceId] || []).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
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
    if (!activeInstanceId) {
      if (lastActiveInstanceId) {
        setActiveInstanceId(lastActiveInstanceId);
      } else if (instances.length > 0) {
        const connected = instances.filter((i) => i.status === "CONNECTED");
        if (connected.length > 0) {
          setActiveInstanceId(connected[0].id);
        } else {
          setActiveInstanceId(instances[0].id);
        }
      }
    }
  }, [lastActiveInstanceId, activeInstanceId, instances]);

  useEffect(() => {
    setInstancesFetched(false);
  }, [token, user?.organization_id]);

  useEffect(() => {
    if (
      token &&
      user?.organization_id &&
      !instancesFetched &&
      !isLoadingInstances
    ) {
      setInstancesFetched(true);
      fetchAllInstances(token, user.organization_id);
    }
  }, [token, user?.organization_id, instancesFetched, isLoadingInstances]);

  useEffect(() => {
    if (token && user?.organization_id && activeInstanceId) {
      const hasContacts =
        contacts[activeInstanceId] && contacts[activeInstanceId].length > 0;

      // Sempre mostrar loading quando não há contatos ou quando a instância muda
      const shouldShowLoading = !hasContacts || !contacts[activeInstanceId];

      if (shouldShowLoading) {
        setIsLoadingContactsLocal(true);
      }

      fetchAllContacts(
        token,
        user.organization_id,
        activeInstanceId,
        shouldShowLoading
      ).finally(() => {
        setIsLoadingContactsLocal(false);
      });
    }
  }, [token, user?.organization_id, activeInstanceId]);

  // Sincronizar estado local de loading com o store
  useEffect(() => {
    if (!isLoadingContacts) {
      setIsLoadingContactsLocal(false);
    }
  }, [isLoadingContacts]);

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

      // Marcar conversa como lida quando abrir
      const markConversationAsRead = async () => {
        try {
          await whatsappContactService.markAsRead(
            token,
            user.organization_id,
            activeInstanceId,
            selectedContactId
          );
          console.log(
            `[Conversations] Conversa marcada como lida: ${selectedContactId}`
          );
        } catch (error) {
          console.error(
            `[Conversations] Erro ao marcar conversa como lida:`,
            error
          );
          // Não mostrar toast de erro para não incomodar o usuário
        }
      };

      // Executar markAsRead após um pequeno delay para garantir que as mensagens foram carregadas
      const timeoutId = setTimeout(markConversationAsRead, 500);
      return () => clearTimeout(timeoutId);
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

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container && contactMessages.length > 0) {
      if (previousHeightRef.current > 0) {
        const heightDifference =
          container.scrollHeight - previousHeightRef.current;
        container.scrollTop = heightDifference;
        previousHeightRef.current = 0;
        return;
      }
      const lastMessage = contactMessages[contactMessages.length - 1];
      const isNewOutgoingMessage =
        lastMessage?.direction === "OUTGOING" &&
        lastMessage.id.startsWith("temp_");

      if (!hasInitialScrollRef.current || isNewOutgoingMessage) {
        container.scrollTop = container.scrollHeight;
        hasInitialScrollRef.current = true;
      }
    }
  }, [contactMessages]);

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

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedContactId) {
      showToast("Selecione um contato para enviar arquivo", "error");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      showToast("Tipo de arquivo não suportado", "error");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Arquivo muito grande. Máximo 10MB.", "error");
      return;
    }

    try {
      const compressionResult = await compressFile(file, {
        maxSizeKB: 10240,
        quality: 0.8,
      });

      if (!compressionResult.success) {
        showToast(
          compressionResult.error || "Erro ao processar arquivo",
          "error"
        );
        return;
      }

      setSelectedFile(compressionResult.file || file);
      setShowFileModal(true);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      showToast("Erro ao processar arquivo", "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendFile = async () => {
    if (
      !selectedFile ||
      !selectedContactId ||
      !activeInstanceId ||
      !token ||
      !user?.organization_id
    ) {
      showToast("Dados insuficientes para enviar arquivo", "error");
      return;
    }

    const contact = instanceContacts.find((c) => c.id === selectedContactId);
    if (!contact) {
      showToast("Contato não encontrado", "error");
      return;
    }

    const tempMessage = {
      id: `temp_${Date.now()}`,
      wa_message_id: "",
      from: `${activeInstance?.phone_number}@c.us`,
      to: `${contact.phone}@c.us`,
      body: fileCaption.trim() || "",
      media_url: URL.createObjectURL(selectedFile),
      media_type: selectedFile.type,
      message_type: selectedFile.type.startsWith("image/")
        ? "image"
        : selectedFile.type.startsWith("video/")
        ? "video"
        : "document",
      timestamp: new Date().toISOString(),
      read: false,
      ack: 0,
      file_name: selectedFile.name,
      file_size_bytes: selectedFile.size,
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
      tempMessage as WhatsappMessage
    );

    setIsSendingFile(true);

    try {
      await whatsappMessageService.sendMedia(
        token,
        user.organization_id,
        activeInstanceId,
        {
          media: selectedFile,
          recipient: contact.phone,
          caption: fileCaption.trim() || undefined,
        }
      );

      showToast("Arquivo enviado com sucesso!", "success");

      // Limpar estados
      setSelectedFile(null);
      setFileCaption("");
      setShowFileModal(false);
    } catch (error: any) {
      console.error("Erro ao enviar arquivo:", error);
      showToast(error.message || "Erro ao enviar arquivo", "error");
    } finally {
      setIsSendingFile(false);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFileCaption("");
    setShowFileModal(false);
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (
      !selectedContactId ||
      !activeInstanceId ||
      !token ||
      !user?.organization_id
    ) {
      showToast("Dados insuficientes para enviar áudio", "error");
      return;
    }

    if (activeInstance?.status !== "CONNECTED") {
      showToast("Instância não está conectada", "error");
      return;
    }

    setIsSendingAudio(true);

    try {
      const contact = instanceContacts.find((c) => c.id === selectedContactId);
      if (!contact) {
        showToast("Contato não encontrado", "error");
        return;
      }

      const audioFile = new File([audioBlob], `audio_${Date.now()}.ogg`, {
        type: "audio/ogg",
      });

      if (audioFile.size === 0) {
        showToast("Arquivo de áudio inválido", "error");
        return;
      }

      // Mensagem temporária ANTES do envio
      const tempMessage = {
        id: `temp_${Date.now()}`,
        wa_message_id: "",
        from: `${activeInstance?.phone_number}@c.us`,
        to: `${contact.phone}@c.us`,
        body: "",
        media_url: URL.createObjectURL(audioBlob),
        media_type: "audio/ogg",
        message_type: "ptt",
        timestamp: new Date().toISOString(),
        read: false,
        ack: 0,
        file_name: audioFile.name,
        file_size_bytes: audioFile.size,
        media_duration_sec: null,
        whatsapp_instance_id: activeInstanceId,
        organization_id: user.organization_id,
        whatsapp_contact_id: selectedContactId,
        created_at: new Date().toISOString(),
        direction: "OUTGOING" as WhatsappMessageDirection,
        status: "sending" as const,
      };
      const messageStore = useWhatsappMessageStore.getState();
      messageStore.addTemporaryMessage(
        activeInstanceId,
        selectedContactId,
        tempMessage
      );

      const compressionResult = await compressFile(audioFile);
      if (!compressionResult.success) {
        showToast(
          compressionResult.error || "Erro ao processar áudio",
          "error"
        );
        return;
      }

      await whatsappMessageService.sendMedia(
        token,
        user.organization_id,
        activeInstanceId,
        {
          media: compressionResult.file!,
          recipient: contact.phone,
        }
      );

      showToast("Áudio enviado com sucesso!", "success");
      setShowAudioModal(false);

      // Remover o bloco duplicado de tempMessage após o envio
    } catch (error: any) {
      console.error("Erro ao enviar áudio:", error);
      showToast(error.message || "Erro ao enviar áudio", "error");
    } finally {
      setIsSendingAudio(false);
    }
  };

  const fileUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return null;
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

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
    setContactToDelete(contactId);
    setShowConfirmationModal(true);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete || !activeInstanceId) return;

    setIsDeletingContact(true);
    try {
      await whatsappContactService.delete(
        token!,
        user!.organization_id,
        activeInstanceId,
        contactToDelete
      );
      deleteContactFromStore(activeInstanceId, contactToDelete);
      setShowConfirmationModal(false);
      setContactToDelete(null);
      showToast("Contato excluído com sucesso!", "success");
      if (selectedContactId === contactToDelete) {
        setSelectedContactId(null);
      }
    } catch (error: any) {
      showToast(error.message || "Erro ao excluir contato", "error");
    } finally {
      setIsDeletingContact(false);
    }
  };

  const handleDeleteContactClick = (contact: WhatsappContact) => {
    setContactToDelete(contact.id);
    setShowConfirmationModal(true);
  };

  const handleInstanceChange = (instanceId: string) => {
    setActiveInstanceId(instanceId);
    setLastActiveInstance(instanceId);
    setSelectedContactId(null);
  };

  if (isLoadingInstances && instances.length === 0) {
    return (
      <div className="p-6 h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <MessageCircle className="w-6 h-6 text-[#7f00ff]" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
              Conversas
            </h1>
          </div>
        </div>
        <div className="text-center py-12">Carregando instâncias...</div>
      </div>
    );
  }

  if (!canAccess) {
    return <ModalCanAcess title="Conversas" />;
  }

  return (
    <div className="p-6 h-[95vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <MessageCircle className="w-6 h-6 text-[#7f00ff]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-transparent bg-clip-text">
            Conversas
          </h1>
        </div>
      </div>

      {instances.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma instância WhatsApp encontrada"
          description="Crie uma instância em Conexões para começar a conversar"
          buttonText="Ir para Conexões"
          onButtonClick={() => navigate("/dashboard/connections")}
        />
      ) : (
        <div className="flex flex-col flex-grow bg-white dark:bg-dark-800 rounded-lg shadow h-full relative">
          <InstanceTabs
            instances={instances}
            activeInstanceId={activeInstanceId}
            handleInstanceChange={handleInstanceChange}
            handleMenuClick={handleMenuClick}
            tabRefs={tabRefs}
            getStatusInfo={getStatusInfo}
          />
          <div className="flex flex-1 min-h-0">
            {activeInstance && activeInstance.status !== "CONNECTED" ? (
              <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <div className="text-2xl mb-2">🔌</div>
                <span className="text-sm text-gray-500 mb-4 text-center">
                  Você precisa conectar a instância para visualizar os contatos.
                </span>
                <button
                  className="px-4 py-2 bg-[#7f00ff] text-white rounded hover:bg-[#6200cc] transition-colors"
                  onClick={() => navigate("/dashboard/connections")}
                >
                  Ir para Conexões
                </button>
              </div>
            ) : isLoadingContacts || isLoadingContactsLocal ? (
              <div className="flex flex-col items-center justify-center w-72 h-full p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7f00ff] mb-2" />
                <span className="text-sm text-gray-500">
                  Carregando contatos...
                </span>
              </div>
            ) : (
              <ContactList
                contacts={instanceContacts}
                selectedContactId={selectedContactId}
                setSelectedContactId={setSelectedContactId}
                handleContactMenuClick={handleContactMenuClick}
                processWhatsAppImageUrl={processWhatsAppImageUrl}
                instanceId={activeInstanceId}
                onCreateContact={(contact) => {
                  if (activeInstanceId) {
                    updateContactInStore(activeInstanceId, contact.id, contact);
                  }
                }}
              />
            )}
            {/* Área de mensagens */}
            <div className="flex-1 relative bg-white dark:bg-dark-900 flex flex-col overflow-auto">
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
                          <button
                            onClick={() => setShowContactProfileModal(true)}
                            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
                          >
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
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <span
                                  className="truncate text-start flex-1"
                                  title={selectedContact.name}
                                >
                                  {selectedContact.name}
                                </span>
                                {selectedContact.is_pinned && (
                                  <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
                                    <Pin className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                )}
                              </div>
                              <div
                                className="text-xs text-gray-500 text-start truncate"
                                title={selectedContact.phone}
                              >
                                {selectedContact.phone}
                              </div>
                            </div>
                          </button>
                        </>
                      ) : null;
                    })()}
                  </div>

                  <MessagesArea
                    contactMessages={contactMessages}
                    isLoadingMessages={isLoadingMessages}
                    isLoadingMore={isLoadingMore}
                    activeInstanceId={activeInstanceId}
                    selectedContactId={selectedContactId}
                    groupMessagesByDate={groupMessagesByDate}
                    processWhatsAppMediaUrl={processWhatsAppMediaUrl}
                    isSticker={isSticker}
                    instanceContacts={instanceContacts}
                    setSelectedImage={setSelectedImage}
                    setShowImageModal={setShowImageModal}
                    messagesContainerRef={messagesContainerRef}
                    handleScroll={handleScroll}
                  />
                  <MessageInputBar
                    selectedContactId={selectedContactId}
                    activeInstance={activeInstance}
                    showToast={showToast}
                    isSendingFile={isSendingFile}
                    fileInputRef={fileInputRef}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleKeyPress={handleKeyPress}
                    isSendingMessage={isSendingMessage}
                    handleSendMessage={handleSendMessage}
                    handleFileSelect={handleFileSelect}
                    isLoadingMessages={isLoadingMessages}
                    handleSendAudio={handleSendAudio}
                  />
                </>
              ) : (
                <EmptyState
                  icon={MessageCircle}
                  title="Nenhum contato encontrado"
                  description="Adicione contatos para começar a conversar."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para envio de arquivos */}
      <FileModal
        isOpen={showFileModal}
        selectedFile={selectedFile}
        fileUrl={fileUrl}
        fileCaption={fileCaption}
        setFileCaption={setFileCaption}
        isSendingFile={isSendingFile}
        handleCancelFile={handleCancelFile}
        handleSendFile={handleSendFile}
      />

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
              onDeleteClick={handleDeleteContactClick}
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
      {/* Modal de gravação de áudio */}
      <AudioRecorderModal
        isOpen={
          showAudioModal &&
          selectedContactId &&
          activeInstance?.status === "CONNECTED"
        }
        onClose={() => setShowAudioModal(false)}
        onSend={handleSendAudio}
        isSending={isSendingAudio}
      />
      {/* Modal de perfil do contato */}
      <ContactProfileModal
        isOpen={showContactProfileModal}
        onClose={() => setShowContactProfileModal(false)}
        contact={(() => {
          return (
            instanceContacts.find((c) => c.id === selectedContactId) || null
          );
        })()}
        messages={contactMessages}
        onUpdateContact={(updatedContact) => {
          if (activeInstanceId) {
            updateContactInStore(
              activeInstanceId,
              updatedContact.id,
              updatedContact
            );
          }
        }}
        onViewMedia={(mediaUrl) => {
          setSelectedImage(mediaUrl);
          setShowImageModal(true);
          setShowContactProfileModal(false);
        }}
      />
      <ImageModal
        isOpen={showImageModal && !!selectedImage}
        selectedImage={selectedImage}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
        }}
      />
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmDeleteContact}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o contato "${
          instanceContacts.find((c) => c.id === contactToDelete)?.name ||
          contactToDelete?.slice(-2) ||
          "este contato"
        }"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeletingContact}
      />
    </div>
  );
}
