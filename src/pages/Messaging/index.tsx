import React, { useState, useEffect } from "react";
import { MessageComposer } from "./components/MessageComposer";
import { MessageHistory } from "./components/MessageHistory";
import { useMessagingStore } from "./store/messagingStore";
import { useToast } from "../../hooks/useToast";
import { generateId } from "../../utils/generateId";
import { useContactsStore } from "../../store/contactsStore";
import { useTagStore } from "../../store/tagStore";
import { useAuthStore } from "../../store/authStore";
import {
  Send,
  History,
  User,
  Zap,
  Bug,
  RefreshCw,
  AlertCircle,
  X,
  SmartphoneNfc,
  QrCode,
  ArrowRight,
  Phone,
  Trash2,
} from "lucide-react";
import { ProfileModal } from "../../components/ProfileModal";
import { Contact, MessageContent } from "./types";
import { useThemeStore } from "../../store/themeStore";
import { useWhatsAppConnectionStore } from "../../store/whatsAppConnectionStore";

// Estilos personalizados para o carrossel
import "./carousel.css";

// Webhook fixo para disparo
const DISPARO_WEBHOOK =
  "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/disparo";

export function Messaging() {
  const {
    batches,
    addBatch,
    updateBatchProgress,
    completeBatch,
    cleanupOldBatches,
    clearAllBatches,
  } = useMessagingStore();
  const { contacts } = useContactsStore();
  const { tags, addTag } = useTagStore();
  const { isConnected: whatsAppIsConnected } = useWhatsAppConnectionStore();
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [showWhatsAppConnectModal, setShowWhatsAppConnectModal] =
    useState(false);
  const [showConfirmClearHistory, setShowConfirmClearHistory] = useState(false);
  const { showToast } = useToast();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // Substituir o hook antigo pelo Zustand principal
  const user = useAuthStore((state) => state.user);
  const userName = user?.name;
  const userPhone = user?.phoneNumber;

  useEffect(() => {
    // Inicialização básica da página
    console.log("Inicializando página de disparo");

    // Limpar dados antigos para evitar exceder cota de armazenamento
    try {
      cleanupOldBatches();
    } catch (error) {
      console.error("Erro ao limpar dados antigos:", error);
      // Se houver falha de limpeza por cota excedida, tenta limpar tudo
      try {
        clearAllBatches();
      } catch (storageError) {
        console.error(
          "Erro crítico de armazenamento, não foi possível limpar:",
          storageError
        );
      }
    }

    // Verifica se o WhatsApp está conectado ao carregar a página
    // Primeiro verificamos o estado persistente
    if (userName && userPhone) {
      if (!whatsAppIsConnected) {
        // Se não estiver conectado no estado persistente, verificamos com o servidor
        checkWhatsAppConnectionWithServer();
      }
    }
  }, [
    userName,
    userPhone,
    whatsAppIsConnected,
    showToast,
    cleanupOldBatches,
    clearAllBatches,
  ]);

  // Handler para limpar o histórico
  const handleClearHistory = () => {
    setShowConfirmClearHistory(true);
  };

  // Confirmação para limpar o histórico
  const confirmClearHistory = () => {
    try {
      clearAllBatches();
      showToast("Histórico de disparos limpo com sucesso", "success");
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      showToast("Erro ao limpar histórico", "error");
    } finally {
      setShowConfirmClearHistory(false);
    }
  };

  // Função que verifica a conexão com o servidor apenas se necessário
  const checkWhatsAppConnectionWithServer = async () => {
    try {
      const response = await fetch(
        "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/check-whatsapp-connection"
      );
      const data = await response.json();

      if (data.resposta === "whatsapp não conectado corretamente") {
        // Se o WhatsApp não estiver conectado, exibe o modal
        setShowWhatsAppConnectModal(true);
        showToast("Seu WhatsApp não está conectado", "warning");
      }
    } catch (error) {
      console.error("Erro ao verificar conexão do WhatsApp:", error);
    }
  };

  // Autoplay para o carrossel
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showWhatsAppConnectModal) {
      interval = setInterval(() => {
        changeSlide("next");
      }, 5000); // Muda slides a cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWhatsAppConnectModal, currentSlide]);

  const handleCreateTestTags = () => {
    const tagNames = ["Cliente", "Lead", "VIP", "Inativo", "Prospecto"];

    tagNames.forEach((name) => {
      addTag({
        name,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      });
    });

    showToast("Tags de teste criadas com sucesso", "success");
  };

  const handleReloadContacts = () => {
    showToast("Disparo em massa pronto para uso", "info");
  };

  const sendMessages = async (
    context: string,
    messages: MessageContent[],
    contactIds: string[],
    manualContacts: Contact[],
    type: "ai" | "standard",
    delaySeconds: number
  ) => {
    // Validações básicas
    if (messages.length === 0 && type === "standard") {
      showToast("Adicione pelo menos uma mensagem para enviar", "error");
      return;
    }

    if (contactIds.length === 0) {
      showToast("Selecione pelo menos um destinatário", "error");
      return;
    }

    // Verificar tamanho das mensagens de mídia
    const MAX_CONTENT_SIZE = 15 * 1024 * 1024; // ~10MB após codificação base64
    const largeMediaMessages = messages.filter(
      (msg) =>
        msg.type !== "text" &&
        msg.content &&
        msg.content.length > MAX_CONTENT_SIZE
    );

    if (largeMediaMessages.length > 0) {
      showToast(
        `${largeMediaMessages.length} arquivo(s) muito grande(s). O tamanho máximo é de 10MB por arquivo.`,
        "error"
      );
      return;
    }

    if (!whatsAppIsConnected) {
      // Verificar diretamente com o servidor antes de prosseguir
      try {
        const checkResponse = await fetch(
          "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/check-whatsapp-connection"
        );
        const checkData = await checkResponse.json();

        if (checkData.resposta === "whatsapp não conectado corretamente") {
          setShowWhatsAppConnectModal(true);
          showToast(
            "Seu WhatsApp não está conectado. Configure a conexão para continuar.",
            "error"
          );
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar conexão do WhatsApp:", error);
        // Continuar mesmo com erro na verificação, o disparo vai detectar de qualquer forma
      }
    }

    // Limpar lotes antigos para evitar problemas de armazenamento
    try {
      // Silenciosamente limpa lotes antigos sem mostrar notificação ao usuário
      cleanupOldBatches();
    } catch (e) {
      console.warn("Erro ao limpar lotes antigos:", e);
      // Não mostramos notificação de erro ao usuário
    }

    // Preparar o envio
    const batchId = generateId();
    const selectedContacts = manualContacts.filter((c) =>
      contactIds.includes(c.id)
    );

    // Contadores para tracking de mensagens enviadas
    let sentCount = 0;
    let failedCount = 0;

    // Iniciar o envio (independente de armazenamento)
    setIsSending(true);
    setSendingProgress(10); // Progresso inicial

    try {
      // Tenta adicionar o lote ao histórico - se falhar, continuamos mesmo assim
      try {
        addBatch(batchId, context, messages, selectedContacts);
        // Se conseguir adicionar, tenta atualizar o progresso
        try {
          updateBatchProgress(batchId, 10, "in_progress", 0, 0);
        } catch (e) {
          // Ignorar erros de atualização de progresso
        }
      } catch (storageError) {
        console.warn(
          "Aviso: Histórico desativado devido a limites de armazenamento",
          storageError
        );
      }

      // Preparar mensagens no formato correto (verifique por tamanhos excessivos)
      const formattedMessages = messages
        .map((msg) => {
          // Para todos os tipos de mensagem, enviar o objeto completo
          return {
            type: msg.type,
            content: msg.content,
            filename: msg.type !== "text" ? msg.filename : undefined,
          };
        })
        .filter(Boolean); // Remove null ou undefined

      // Preparar payload com todos os contatos
      const payload = {
        messages: formattedMessages,
        contacts: selectedContacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          tagIds: contact.tagIds || [],
        })),
        context: context,
        delaySeconds: delaySeconds,
        type: type,
        timestamp: new Date().toISOString(),
        sender: {
          name: userName || "",
          phone: userPhone || "",
        },
        processingDelay: 500, // Adicionar um delay de 500ms entre o processamento de cada mensagem
      };

      setSendingProgress(30); // Progresso ao começar o envio
      try {
        updateBatchProgress(batchId, 30, "in_progress", 0, 0);
      } catch (e) {
        // Ignorar erros de atualização de progresso
      }

      console.log(
        "Enviando payload para o webhook:",
        JSON.stringify({
          messageCount: formattedMessages.length,
          messageTypes: formattedMessages.map((m) => m.type),
        })
      );

      // Enviar para o webhook em uma única chamada
      const response = await fetch(DISPARO_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setSendingProgress(70); // Progresso após enviar
      try {
        updateBatchProgress(batchId, 70, "in_progress", 0, 0);
      } catch (e) {
        // Ignorar erros de atualização de progresso
      }

      // Processar a resposta do webhook
      try {
        const responseData = await response.json();

        if (responseData && responseData.resposta === "sucesso") {
          sentCount = selectedContacts.length;
          console.log(
            `Mensagens enviadas com sucesso para ${selectedContacts.length} contato(s)`
          );
          showToast(
            `Disparo realizado com sucesso para ${selectedContacts.length} contato(s)`,
            "success"
          );
        } else if (
          responseData &&
          responseData.resposta === "whatsapp não conectado corretamente"
        ) {
          failedCount = selectedContacts.length;
          console.error(
            `Falha ao enviar mensagens: WhatsApp não conectado corretamente`
          );

          showToast(
            "WhatsApp não está conectado corretamente. Verifique sua conexão do WhatsApp.",
            "error"
          );
          setShowWhatsAppConnectModal(true);
        } else if (
          responseData &&
          responseData.message === "There was a problem executing the workflow"
        ) {
          failedCount = selectedContacts.length;
          console.error(`Falha ao executar workflow no N8N:`, responseData);

          showToast(
            "Erro no processamento do disparo: problema na execução do fluxo de trabalho. Verifique os tipos de mídia e tente novamente.",
            "error"
          );
        } else if (
          responseData &&
          (responseData.message?.includes("file too large") ||
            responseData.message?.includes("tamanho excedido") ||
            responseData.message?.includes("size limit"))
        ) {
          failedCount = selectedContacts.length;
          console.error(`Erro de tamanho de arquivo no webhook:`, responseData);

          showToast(
            "Alguns arquivos são muito grandes para processamento. O limite é de 10MB por arquivo. Reduza o tamanho das mídias.",
            "error"
          );
        } else if (
          responseData &&
          responseData.message?.includes("Invalid media")
        ) {
          failedCount = selectedContacts.length;
          console.error(`Erro de formato de mídia no webhook:`, responseData);

          showToast(
            "Formato de mídia inválido. Verifique se os arquivos estão em formatos suportados pelo WhatsApp.",
            "error"
          );
        } else {
          failedCount = selectedContacts.length;
          console.error(
            `Falha ao enviar mensagens:`,
            `Resposta inesperada:`,
            responseData
          );

          showToast(
            "Falha no envio das mensagens. Verifique os tipos de arquivo e tente novamente.",
            "error"
          );
        }
      } catch (parseError) {
        console.error("Erro ao processar resposta JSON:", parseError);

        if (response.ok) {
          sentCount = selectedContacts.length;
          console.log(
            `Mensagens possivelmente enviadas com sucesso, mas resposta não é JSON válido`
          );
        } else {
          failedCount = selectedContacts.length;
          const errorText = await response
            .text()
            .catch(() => "No response text");
          console.error(
            `Falha ao enviar mensagens:`,
            `Status: ${response.status} ${response.statusText}`,
            `URL: ${DISPARO_WEBHOOK}`,
            `Resposta: ${errorText}`
          );

          // Melhor feedback para o usuário
          showToast(
            `Erro no servidor (${response.status}). Tente novamente mais tarde.`,
            "error"
          );
        }
      }

      // Atualização final do progresso
      setSendingProgress(100);

      // Feedback para o usuário
      if (sentCount > 0 && failedCount === 0) {
        showToast(
          `Disparo concluído com sucesso: ${sentCount} contato(s)`,
          "success"
        );
      } else if (sentCount > 0 && failedCount > 0) {
        showToast(
          `Disparo parcial: ${sentCount} enviado(s), ${failedCount} falha(s)`,
          "warning"
        );
      } else {
        showToast(
          `Falha no disparo: ${failedCount} mensagem(ns) não enviada(s)`,
          "error"
        );
      }
    } catch (error) {
      failedCount = selectedContacts.length;
      console.error(
        `Erro ao enviar mensagens:`,
        error instanceof Error ? error.message : "Erro desconhecido",
        "\nURL do webhook:",
        DISPARO_WEBHOOK,
        "\nDetalhes do payload:",
        JSON.stringify({
          contactCount: selectedContacts.length,
          messageTypes: messages.map((m) => m.type).join(", "),
          type: type,
        })
      );

      // Feedback claro para o usuário
      showToast(
        "Erro ao enviar mensagens. Verifique sua conexão com a internet.",
        "error"
      );
    } finally {
      // Completar o lote independentemente do resultado
      try {
        completeBatch(batchId, sentCount, failedCount);
      } catch (e) {
        // Ignorar erros de armazenamento aqui
      }

      setIsSending(false);
      setSendingProgress(0);
    }
  };

  // Função para controlar o carrossel
  const changeSlide = (direction = "next") => {
    const carousel = document.getElementById("whatsapp-connect-carousel");
    if (!carousel) return;

    if (direction === "next") {
      if (currentSlide < 3) {
        setCurrentSlide(currentSlide + 1);
        carousel.scrollTo({
          left: carousel.offsetWidth * (currentSlide + 1),
          behavior: "smooth",
        });
      } else {
        setCurrentSlide(0);
        carousel.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      }
    } else {
      if (currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
        carousel.scrollTo({
          left: carousel.offsetWidth * (currentSlide - 1),
          behavior: "smooth",
        });
      } else {
        setCurrentSlide(3);
        carousel.scrollTo({
          left: carousel.offsetWidth * 3,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-dark-1000" : "bg-transparent"
      } p-6 relative`}
    >
      {/* Modal de confirmação para limpar histórico */}
      {showConfirmClearHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Limpar histórico
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-5">
              Tem certeza que deseja limpar todo o histórico de disparos? Esta
              ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmClearHistory(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Limpar histórico
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${
          showWhatsAppConnectModal ? "blur-sm" : ""
        }`}
      >
        {/* Page Header - Redesenhado com mais destaque */}
        <div className="mb-8 relative">
          <div>
            <div className="flex items-center gap-4">
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                >
                  Disparo em massa
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0 bg-transparent">
              {!userName || !userPhone ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-[#7f00ff]/10 transition-all hover:shadow-lg hover:shadow-[#7f00ff]/20"
                >
                  <User className="w-4 h-4 mr-2" />
                  Configurar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                    title="Limpar histórico de disparos"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Limpar histórico
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notificação de configuração quando necessário */}
          {(!userName || !userPhone) && (
            <div
              className={`mb-6 ${
                isDark
                  ? "bg-dark-750 border-yellow-600"
                  : "bg-yellow-50 border-yellow-500"
              } border-l-4 rounded-lg p-4 shadow-md`}
            >
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3
                    className={`text-sm font-medium ${
                      isDark ? "text-yellow-400" : "text-yellow-800"
                    }`}
                  >
                    Configuração Necessária
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      isDark ? "text-yellow-300" : "text-yellow-700"
                    }`}
                  >
                    Para utilizar o disparo em massa, você precisa configurar
                    seu nome e número de telefone no perfil.
                  </p>
                  <div className="mt-3"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Layout Melhorado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Left Column - Main Composer */}
          <div className="lg:col-span-8 space-y-6">
            <div
              className={`${
                isDark
                  ? "bg-dark-800 border-dark-700"
                  : "bg-gray-50 border-gray-200"
              } rounded-xl shadow-xl border overflow-hidden`}
            >
              <div
                className={`p-4 border-b ${
                  isDark ? "border-dark-700" : "border-gray-200"
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#7f00ff]" />
                  <h2
                    className={`font-medium ${
                      isDark ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Disparo em massa
                  </h2>
                </div>
                {userName && userPhone && (
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      isDark
                        ? "bg-dark-700/50 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    } py-1 px-2 rounded`}
                  ></div>
                )}
              </div>
              <div className={`p-6 ${isDark ? "bg-dark-800" : "bg-gray-50"}`}>
                <div className="flex justify-between items-center mb-8">
                  <h1
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Disparo em Massa
                  </h1>
                  <div className="flex items-center gap-4">
                    {/* Indicador de Status do WhatsApp */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        whatsAppIsConnected
                          ? isDark
                            ? "bg-green-900/20 text-green-400"
                            : "bg-green-100 text-green-700"
                          : isDark
                          ? "bg-red-900/20 text-red-400"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          whatsAppIsConnected ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="text-sm font-medium">
                        {whatsAppIsConnected
                          ? "WhatsApp Conectado"
                          : "WhatsApp Desconectado"}
                      </span>
                      {!whatsAppIsConnected && (
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className={`ml-2 text-xs py-1 px-2 rounded ${
                            isDark
                              ? "bg-purple-900/30 text-purple-400 hover:bg-purple-900/40"
                              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                        >
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <MessageComposer
                  onSend={sendMessages}
                  isSending={isSending}
                  progress={sendingProgress}
                  contacts={contacts}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Batch History */}
          <div className="lg:col-span-4">
            <div
              className={`${
                isDark
                  ? "bg-dark-800 border-dark-700"
                  : "bg-gray-50 border-gray-200"
              } rounded-xl shadow-xl border overflow-hidden sticky top-6`}
            >
              <div
                className={`p-4 border-b ${
                  isDark ? "border-dark-700" : "border-gray-200"
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#7f00ff]" />
                  <h2
                    className={`font-medium ${
                      isDark ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Histórico
                  </h2>
                </div>
                {batches && batches.length > 0 && (
                  <div className="bg-[#7f00ff]/20 text-[#7f00ff] text-xs font-medium px-2 py-1 rounded-full">
                    {batches.length} registro{batches.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div
                className={`max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin ${
                  isDark ? "bg-dark-800" : "bg-gray-50"
                }`}
              >
                <MessageHistory batches={batches} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de conexão do WhatsApp */}
      {showWhatsAppConnectModal && (
        <div
          className={`fixed inset-0 ${
            isDark ? "bg-black/75" : "bg-gray-800/50"
          } backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 p-4`}
        >
          <div
            className={`${
              isDark ? "bg-dark-800" : "bg-white"
            } rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300`}
          >
            <div
              className={`p-4 border-b ${
                isDark ? "border-dark-700" : "border-gray-200"
              } flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#7f00ff]" />
                <h2
                  className={`font-medium ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Conectar WhatsApp
                </h2>
              </div>
              <button
                onClick={() => setShowWhatsAppConnectModal(false)}
                className={`p-1 rounded-full ${
                  isDark ? "hover:bg-dark-700" : "hover:bg-gray-100"
                } transition-colors focus:outline-none`}
              >
                <X
                  className={`w-5 h-5 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </button>
            </div>

            <div className={`p-6 ${isDark ? "bg-dark-800" : "bg-white"}`}>
              <div className="mb-6 text-center">
                <h3
                  className={`text-xl font-semibold ${
                    isDark ? "text-white" : "text-gray-800"
                  } mb-2`}
                >
                  Seu WhatsApp não está conectado
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Siga os passos abaixo para conectar seu WhatsApp e começar a
                  enviar mensagens:
                </p>
              </div>

              {/* Carrossel de imagens demonstrativas */}
              <div
                className={`relative mb-8 ${
                  isDark
                    ? "bg-dark-750 border-dark-600"
                    : "bg-gray-50 border-gray-200"
                } p-4 rounded-xl border overflow-hidden`}
              >
                {/* Indicadores de slide */}
                <div className="flex justify-center mb-4 gap-2">
                  {[0, 1, 2, 3].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Atualizar o estado do slide atual
                        setCurrentSlide(index);
                        // Lógica para navegar entre os slides
                        const carousel = document.getElementById(
                          "whatsapp-connect-carousel"
                        );
                        if (carousel) {
                          carousel.scrollTo({
                            left: index * carousel.offsetWidth,
                            behavior: "smooth",
                          });
                        }
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-colors slide-indicator ${
                        index === currentSlide
                          ? "bg-[#7f00ff] active"
                          : isDark
                          ? "bg-gray-600"
                          : "bg-gray-300"
                      }`}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Container do carrossel */}
                <div
                  id="whatsapp-connect-carousel"
                  className="flex snap-x snap-mandatory overflow-x-auto hide-scrollbar"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  onScroll={(e) => {
                    // Lógica para atualizar o estado quando o usuário rola
                    const target = e.currentTarget;
                    const scrollPos = target.scrollLeft;
                    const slideWidth = target.offsetWidth;
                    const activeIndex = Math.round(scrollPos / slideWidth);

                    // Atualizar o estado currentSlide apenas se for diferente
                    if (
                      activeIndex !== currentSlide &&
                      activeIndex >= 0 &&
                      activeIndex <= 3
                    ) {
                      setCurrentSlide(activeIndex);
                    }
                  }}
                >
                  {/* Slide 1 */}
                  <div
                    className={`snap-center min-w-full flex flex-col items-center p-2 ${
                      currentSlide === 0 ? "slide-active" : ""
                    }`}
                  >
                    <img
                      src="https://zenaix.com.br/wp-content/uploads/2025/03/step1.png"
                      alt="Passo 1: Clique em editar perfil"
                      className="max-w-full h-auto rounded-lg shadow-lg mb-4 max-h-96 object-contain"
                    />
                    <h4
                      className={`font-medium text-lg mt-2 ${
                        isDark ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Passo 1
                    </h4>
                    <p
                      className={`text-sm text-center ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Clique em editar perfil
                    </p>
                  </div>

                  {/* Slide 2 */}
                  <div
                    className={`snap-center min-w-full flex flex-col items-center p-2 ${
                      currentSlide === 1 ? "slide-active" : ""
                    }`}
                  >
                    <img
                      src="https://zenaix.com.br/wp-content/uploads/2025/03/step2.png"
                      alt="Passo 2: Preencha o nome e número e clique em conectar whatsapp"
                      className="max-w-full h-auto rounded-lg shadow-lg mb-4 max-h-96 object-contain"
                    />
                    <h4
                      className={`font-medium text-lg mt-2 ${
                        isDark ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Passo 2
                    </h4>
                    <p
                      className={`text-sm text-center ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Preencha o nome e número e clique em conectar whatsapp
                    </p>
                  </div>

                  {/* Slide 3 */}
                  <div
                    className={`snap-center min-w-full flex flex-col items-center p-2 ${
                      currentSlide === 2 ? "slide-active" : ""
                    }`}
                  >
                    <img
                      src="https://zenaix.com.br/wp-content/uploads/2025/03/step3.png"
                      alt="Passo 3: Faça a leitura do QRCODE com o número que quer efetuar o disparo"
                      className="max-w-full h-auto rounded-lg shadow-lg mb-4 max-h-96 object-contain"
                    />
                    <h4
                      className={`font-medium text-lg mt-2 ${
                        isDark ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Passo 3
                    </h4>
                    <p
                      className={`text-sm text-center ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Faça a leitura do QRCODE com o número que quer efetuar o
                      disparo
                    </p>
                  </div>

                  {/* Slide 4 */}
                  <div
                    className={`snap-center min-w-full flex flex-col items-center p-2 ${
                      currentSlide === 3 ? "slide-active" : ""
                    }`}
                  >
                    <img
                      src="https://zenaix.com.br/wp-content/uploads/2025/03/step4.png"
                      alt="Passo 4: Após feito o passo a passo, deve aparecer dessa forma"
                      className="max-w-full h-auto rounded-lg shadow-lg mb-4 max-h-96 object-contain"
                    />
                    <h4
                      className={`font-medium text-lg mt-2 ${
                        isDark ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Passo 4
                    </h4>
                    <p
                      className={`text-sm text-center ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Após feito o passo a passo, deve aparecer dessa forma
                    </p>
                  </div>
                </div>

                {/* Botões de navegação */}
                <button
                  onClick={() => changeSlide("prev")}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 ${
                    isDark
                      ? "bg-dark-800/80 hover:bg-[#7f00ff]/80"
                      : "bg-white/80 hover:bg-[#7f00ff]/60"
                  } text-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110`}
                  aria-label="Slide anterior"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => changeSlide("next")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                    isDark
                      ? "bg-dark-800/80 hover:bg-[#7f00ff]/80"
                      : "bg-white/80 hover:bg-[#7f00ff]/60"
                  } text-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110`}
                  aria-label="Próximo slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-end">
                <button
                  onClick={() => setShowWhatsAppConnectModal(false)}
                  className={`px-4 py-2 ${
                    isDark
                      ? "bg-dark-700 text-gray-300 hover:bg-dark-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } rounded-lg transition-colors`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            // Show a success message when closing the modal
            if (whatsAppIsConnected) {
              showToast("Perfil configurado com sucesso!", "success");
              setShowWhatsAppConnectModal(false);
            }
          }}
        />
      )}
    </div>
  );
}
