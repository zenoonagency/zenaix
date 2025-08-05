import React, { useState, useEffect } from "react";
import {
  X,
  Edit,
  Phone,
  Video,
  Mic,
  Image,
  FileText,
  Link,
  Calendar,
  Shield,
  Users,
  Play,
  Pause,
  Download,
} from "lucide-react";
import { WhatsappContact, WhatsappMessage } from "../types/whatsapp";
import { processWhatsAppMediaUrl } from "../utils/imageUtils";
import { WhatsAppAudioPlayer } from "./WhatsAppAudioPlayer";
import { useAuthStore } from "../store/authStore";

interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: WhatsappContact | null;
  messages: WhatsappMessage[];
  onUpdateContact: (contact: WhatsappContact) => void;
  onViewMedia: (mediaUrl: string) => void;
}

type TabType = "overview" | "media";

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  isOpen,
  onClose,
  contact,
  messages,
  onUpdateContact,
  onViewMedia,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [modalMedia, setModalMedia] = useState<null | {
    url: string;
    type: "image" | "video" | "audio";
    message?: WhatsappMessage;
  }>(null);

  useEffect(() => {
    if (contact) {
      setEditName(contact.name);
      setEditPhone(contact.phone);
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  // Filtrar mensagens com mídia
  const mediaMessages = messages.filter((msg) => msg.media_url);

  const handleSaveEdit = () => {
    if (contact) {
      onUpdateContact({
        ...contact,
        name: editName,
        phone: editPhone,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(contact.name);
    setEditPhone(contact.phone);
    setIsEditing(false);
  };

  const getMediaTypeIcon = (mediaType: string | null) => {
    if (!mediaType) return <FileText className="w-4 h-4" />;

    if (mediaType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (mediaType.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (mediaType.startsWith("audio/")) return <Mic className="w-4 h-4" />;

    return <FileText className="w-4 h-4" />;
  };

  const processWhatsAppImageUrl = (url: string): string => {
    if (!url) return "";
    return processWhatsAppMediaUrl(url, "image/jpeg");
  };

  const handleAudioPlay = (messageId: string, audioUrl: string) => {
    const audio = new Audio(audioUrl);

    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio) {
        const currentAudio = document.querySelector(
          `audio[data-message-id="${playingAudio}"]`
        ) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }

      audio.play();
      setPlayingAudio(messageId);

      audio.addEventListener("ended", () => {
        setPlayingAudio(null);
      });
    }
  };

  const isGif = (mediaType: string | null, mediaUrl: string | null) => {
    return (
      mediaType === "image/gif" || mediaUrl?.toLowerCase().includes(".gif")
    );
  };

  const isVideo = (mediaType: string | null) => {
    return mediaType?.startsWith("video/");
  };

  const isAudio = (mediaType: string | null) => {
    return mediaType?.startsWith("audio/");
  };

  const isImage = (mediaType: string | null) => {
    return mediaType?.startsWith("image/");
  };

  const renderMediaPreview = (message: WhatsappMessage) => {
    const { media_url, media_type } = message;
    if (!media_url) return null;
    const processedUrl = processWhatsAppMediaUrl(media_url, media_type);
    if (isImage(media_type)) {
      if (isGif(media_type, media_url)) {
        return (
          <div className="relative w-full h-24">
            <img
              src={processedUrl}
              alt="GIF"
              className="w-full h-24 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        );
      }
      return (
        <img
          src={processedUrl}
          alt="Imagem"
          className="w-full h-24 object-cover rounded-lg"
        />
      );
    }
    if (isVideo(media_type)) {
      return (
        <div className="relative w-full h-24">
          <video
            src={processedUrl}
            className="w-full h-24 object-cover rounded-lg"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
      );
    }
    if (isAudio(media_type)) {
      return (
        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative">
          <div className="flex items-center gap-2">
            <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
              <Play className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Áudio
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modal-container">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Perfil do contato
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Visão geral
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "media"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Mídia
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === "overview" && (
            <div className="p-8">
              {/* Profile Section */}
              <div className="text-center mb-6 relative">
                <div className="relative inline-block">
                  {contact.avatar_url ? (
                    <img
                      src={processWhatsAppImageUrl(contact.avatar_url)}
                      alt={contact.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mx-auto text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {contact.name?.[0] || contact.phone?.slice(-2) || "?"}
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute top-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome do contato"
                    />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Número de telefone"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {contact.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {contact.phone}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button disabled className=" opacity-45 flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Video className="w-4 h-4" />
                  Vídeo
                </button>
                <button disabled className="flex-1 opacity-45 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Phone className="w-4 h-4" />
                  Voz
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                    Número de telefone
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {contact.phone}
                  </span>
                </div>
              </div>
            </div>
          )}
          {activeTab === "media" && (
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Mídia compartilhada
              </h3>
              {mediaMessages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma mídia compartilhada
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.map((message) => {
                    const { media_url, media_type } = message;
                    if (!media_url) return null;
                    const processedUrl = processWhatsAppMediaUrl(
                      media_url,
                      media_type
                    );
                    let type: "image" | "video" | "audio" = "image";
                    if (isAudio(media_type)) type = "audio";
                    else if (isVideo(media_type)) type = "video";
                    return (
                      <div
                        key={message.id}
                        className="relative cursor-pointer group"
                        onClick={() =>
                          setModalMedia({ url: processedUrl, type, message })
                        }
                      >
                        {renderMediaPreview(message)}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {getMediaTypeIcon(media_type)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modal universal de mídia */}
      {modalMedia && (
        <div
          className="modal-container bg-black/80"
          onClick={() => setModalMedia(null)}
        >
          <div
            className="relative max-w-6xl max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botões de ação - download e fechar */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {(modalMedia.type === "image" || modalMedia.type === "video") && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(modalMedia.url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download =
                        `midia_${Date.now()}` +
                        (modalMedia.type === "image" ? ".jpg" : ".mp4");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      const link = document.createElement("a");
                      link.href = modalMedia.url;
                      link.download =
                        `midia_${Date.now()}` +
                        (modalMedia.type === "image" ? ".jpg" : ".mp4");
                      link.click();
                    }
                  }}
                  className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-dark-800/90 hover:bg-white dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                  title="Baixar mídia"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setModalMedia(null)}
                className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-dark-800/90 hover:bg-white dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Mídia */}
            {modalMedia.type === "image" && (
              <img
                src={modalMedia.url}
                alt="Mídia"
                className="max-w-full max-h-[95vh] object-contain rounded-lg"
              />
            )}
            {modalMedia.type === "video" && (
              <video
                src={modalMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[95vh] object-contain rounded-lg"
              />
            )}
            {modalMedia.type === "audio" && modalMedia.message && (
              <div className="flex justify-center items-center w-full h-60 p-8">
                <div className="w-[400px] max-w-full bg-gray-200 dark:bg-gray-700 rounded-xl p-4 flex items-center gap-3">
                  <WhatsAppAudioPlayer
                    audioUrl={modalMedia.url}
                    avatarUrl={
                      modalMedia.message.direction === "OUTGOING"
                        ? user?.avatar_url
                        : contact.avatar_url
                    }
                    contactName={
                      modalMedia.message.direction === "OUTGOING"
                        ? user?.name || "Você"
                        : contact.name
                    }
                    isOutgoing={modalMedia.message.direction === "OUTGOING"}
                    messageTime={modalMedia.message.timestamp}
                    mediaType={modalMedia.message.media_type}
                    messageType={modalMedia.message.message_type}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
