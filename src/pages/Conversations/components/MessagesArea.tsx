import React from "react";
import { Paperclip, Video } from "lucide-react";
import { WhatsAppAudioPlayer } from "../../../components/WhatsAppAudioPlayer";

function AckIcon({ ack }: { ack: number }) {
  // 0: enviado, 1: enviado, 2: entregue, 3: lida
  if (ack === 0 || ack === 1) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="ml-1"
        style={{ display: "inline" }}
      >
        <polyline
          points="3,8 7,12 13,4"
          fill="none"
          stroke="#bbb"
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (ack === 2) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="ml-1"
        style={{ display: "inline" }}
      >
        <polyline
          points="1,9 5,13 13,3"
          fill="none"
          stroke="#bbb"
          strokeWidth="2"
        />
        <polyline
          points="7,9 11,13 15,5"
          fill="none"
          stroke="#bbb"
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (ack === 3) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="ml-1"
        style={{ display: "inline" }}
      >
        <polyline
          points="1,9 5,13 13,3"
          fill="none"
          stroke="#4f8cff"
          strokeWidth="2"
        />
        <polyline
          points="7,9 11,13 15,5"
          fill="none"
          stroke="#4f8cff"
          strokeWidth="2"
        />
      </svg>
    );
  }
  return null;
}

export function MessagesArea({
  contactMessages,
  isLoadingMessages,
  isLoadingMore,
  activeInstanceId,
  selectedContactId,
  groupMessagesByDate,
  processWhatsAppMediaUrl,
  isSticker,
  instanceContacts,
  setSelectedImage,
  setShowImageModal,
  messagesContainerRef,
  handleScroll,
}) {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto relative"
      style={{
        backgroundRepeat: "repeat",
        backgroundSize: "200px",
        backgroundAttachment: "local",
      }}
      onScroll={handleScroll}
    >
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
            {isLoadingMore[activeInstanceId]?.[selectedContactId] && (
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                  Carregando mais mensagens...
                </div>
              </div>
            )}
            {groupMessagesByDate(contactMessages).map((item, index) => (
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
                      className={`rounded-2xl px-4 py-2 max-w-xs lg:max-sm: ${
                        item.message.direction === "OUTGOING"
                          ? "bg-[#7f00ff] text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      }`}
                      style={{ position: "relative" }}
                    >
                      {item.message.body && (
                        <div className="text-sm whitespace-pre-wrap">
                          {item.message.body}
                        </div>
                      )}
                      {item.message.media_url && (
                        <div className="mt-2">
                          {item.message.media_type?.startsWith("image/") ? (
                            <img
                              src={processWhatsAppMediaUrl(
                                item.message.media_url,
                                item.message.media_type
                              )}
                              alt="Mídia da mensagem"
                              className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
                                isSticker(item.message)
                                  ? "w-20 h-20 object-contain"
                                  : "max-w-full h-auto"
                              }`}
                              onClick={() => {
                                setSelectedImage(item.message.media_url);
                                setShowImageModal(true);
                              }}
                            />
                          ) : item.message.media_type?.startsWith("video/") ? (
                            <div className="relative">
                              <video
                                src={processWhatsAppMediaUrl(
                                  item.message.media_url,
                                  item.message.media_type
                                )}
                                controls
                                className="max-w-full h-auto rounded-lg"
                                preload="metadata"
                              />
                              <div className="hidden absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">
                                    Vídeo não disponível
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : item.message.media_type?.startsWith("audio/") ? (
                            <WhatsAppAudioPlayer
                              audioUrl={processWhatsAppMediaUrl(
                                item.message.media_url,
                                item.message.media_type
                              )}
                              isOutgoing={item.message.direction === "OUTGOING"}
                              messageType={item.message.message_type}
                              mediaType={item.message.media_type}
                              avatarUrl={(() => {
                                const contato = instanceContacts.find(
                                  (c) =>
                                    c.id === item.message.whatsapp_contact_id
                                );
                                return contato?.avatar_url || null;
                              })()}
                              contactName={(() => {
                                const contato = instanceContacts.find(
                                  (c) =>
                                    c.id === item.message.whatsapp_contact_id
                                );
                                return contato?.name || "";
                              })()}
                              messageTime={item.message.timestamp}
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm">
                                {item.message.file_name || "Arquivo"}
                              </span>
                              <a
                                href={item.message.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs underline ${
                                  item.message.direction === "OUTGOING"
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
                      {/* Exibir horário + ACK para todas OUTGOING, inclusive áudio */}
                      {item.message.direction === "OUTGOING" && (
                        <div
                          className="text-[11px] flex items-center justify-end mt-1"
                          style={{
                            color: "#cfcfff",
                          }}
                        >
                          {new Date(item.message.timestamp).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                          <AckIcon ack={item.message.ack} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
