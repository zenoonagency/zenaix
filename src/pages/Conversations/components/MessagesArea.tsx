import React from "react";
import { Paperclip, Video } from "lucide-react";
import { WhatsAppAudioPlayer } from "../../../components/WhatsAppAudioPlayer";
import { PDFViewer } from "../../../components/PDFViewer";
import { Modal } from "../../../components/Modal";
import { FileText, FileImage } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { useAuthStore } from "../../../store/authStore";

function AckIcon({ ack }: { ack: number }) {
  // 0: enviado, 1: enviado, 2: entregue, 3: lida
  if (ack === 0 || ack === 1) {
    return (
      <svg
        width="12"
        height="12"
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
        width="12"
        height="12"
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
        width="12"
        height="12"
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

function PdfThumbnail({ url }: { url: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let isMounted = true;
    async function renderThumb() {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        if (isMounted) setThumb(canvas.toDataURL());
      } catch {
        if (isMounted) setThumb(null);
      }
    }
    renderThumb();
    return () => {
      isMounted = false;
    };
  }, [url]);
  if (!thumb)
    return (
      <div
        className="w-full flex justify-center items-center bg-gray-200 rounded-t-lg"
        style={{ height: 80 }}
      />
    );
  return (
    <img
      src={thumb}
      alt="Miniatura PDF"
      className="w-full rounded-t-lg object-cover object-top"
      style={{ height: 80 }}
    />
  );
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
  const { user } = useAuthStore();
  const [openDocUrl, setOpenDocUrl] = React.useState<string | null>(null);
  const [openDocName, setOpenDocName] = React.useState<string | null>(null);
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-auto relative"
      onScroll={handleScroll}
    >
      <div className="relative z-10 flex flex-col p-6 min-h-full bg-white/85 dark:bg-dark-900/85 justify-end">
        <div
          style={{
            backgroundImage: 'url("/assets/images/zenaix-logo-bg.png")',
            backgroundRepeat: "repeat",
            backgroundPosition: "center",
            backgroundSize: "180px",
            opacity: 0.1,
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
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
                      className={`rounded-lg p-2 px-3 max-w-xs lg:max-sm: ${
                        item.message.direction === "OUTGOING"
                          ? "bg-[#7f00ff] text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      }`}
                      style={{ position: "relative" }}
                    >
                      {item.message.body && (
                        <div className="text-sm whitespace-pre-wrap break-words word-wrap">
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
                                  ? "w-20 h-20 object-cover object-top"
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
                                if (item.message.direction === "OUTGOING") {
                                  // Para mensagens de saída, usar avatar do usuário logado
                                  return user?.avatar_url || null;
                                } else {
                                  // Para mensagens de entrada, usar avatar do contato
                                  const contato = instanceContacts.find(
                                    (c) =>
                                      c.id === item.message.whatsapp_contact_id
                                  );
                                  return contato?.avatar_url || null;
                                }
                              })()}
                              contactName={(() => {
                                if (item.message.direction === "OUTGOING") {
                                  // Para mensagens de saída, usar nome do usuário logado
                                  return user?.name || "";
                                } else {
                                  // Para mensagens de entrada, usar nome do contato
                                  const contato = instanceContacts.find(
                                    (c) =>
                                      c.id === item.message.whatsapp_contact_id
                                  );
                                  return contato?.name || "";
                                }
                              })()}
                              messageTime={item.message.timestamp}
                              ack={item.message.ack}
                              waMessageId={item.message.wa_message_id}
                              instanceId={activeInstanceId}
                              contactId={item.message.whatsapp_contact_id}
                            />
                          ) : item.message.media_type?.startsWith(
                              "application/pdf"
                            ) ? (
                            <div className="w-full">
                              <PdfThumbnail url={item.message.media_url} />
                              <div className="flex items-center gap-2 mt-2 py-3">
                                <FileText className="w-8 h-8 text-black" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-black">
                                    {item.message.file_name || "Arquivo"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {item.message.file_size_bytes
                                      ? `${(
                                          item.message.file_size_bytes / 1024
                                        ).toFixed(0)} KB`
                                      : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-1 w-full">
                                <button
                                  className="flex-1 px-3 py-2 rounded bg-[#bf80ff40] text-white text-xs font-semibold hover:bg-[#c080ff8f] transition"
                                  onClick={() => {
                                    setOpenDocUrl(item.message.media_url);
                                    setOpenDocName(
                                      item.message.file_name || "documento.pdf"
                                    );
                                  }}
                                >
                                  Abrir
                                </button>
                                <a
                                  className="flex-1 px-3 py-2 rounded bg-[#bf80ff40] dark:bg-gray-700 text-xs font-semibold text-white dark:text-gray-100 text-center hover:bg-[#bf80ff40] dark:hover:bg-gray-600 transition"
                                  href={item.message.media_url}
                                  download={
                                    item.message.file_name || "documento.pdf"
                                  }
                                >
                                  Salvar como...
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="w-8 h-8 text-black" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-black">
                                  {item.message.file_name || "Arquivo"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.message.file_size_bytes
                                    ? `${(
                                        item.message.file_size_bytes / 1024
                                      ).toFixed(0)} KB`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Exibir horário + ACK para todas OUTGOING, exceto áudio (que já tem no componente) */}
                      {item.message.direction === "OUTGOING" &&
                        !item.message.media_type?.startsWith("audio/") && (
                          <div
                            className="text-[11px] flex items-center justify-end mt-1"
                            style={{
                              color: "#cfcfff",
                            }}
                          >
                            {new Date(
                              item.message.timestamp
                            ).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
      {/* Modal para visualização de PDF */}
      <Modal
        isOpen={!!openDocUrl}
        onClose={() => setOpenDocUrl(null)}
        title={openDocName || "Documento"}
        size="large"
      >
        {openDocUrl && openDocName?.toLowerCase().endsWith(".pdf") ? (
          <PDFViewer
            fileUrl={openDocUrl}
            fileName={openDocName}
            height="80vh"
          />
        ) : (
          <div className="p-8 text-center">
            Visualização não suportada para este tipo de arquivo.
          </div>
        )}
      </Modal>
    </div>
  );
}
