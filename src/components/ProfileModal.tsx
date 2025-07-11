import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Input } from "./ui/Input";
import { useAuthStore } from "../store/authStore";
import {
  Camera,
  X,
  QrCode,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  Loader,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useWhatsAppConnectionStore } from "../store/whatsAppConnectionStore";
import { proxyService } from "../services/proxyService";
import { userService } from "../services/user/user.service";
import { LANGUAGE_OPTIONS } from "../contexts/LocalizationContext";
import { TIMEZONE_OPTIONS } from "../utils/timezones";
import { planService } from "../services/plan/plan.service";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Status possíveis da conexão do WhatsApp
type WhatsAppConnectionStatus =
  | "idle"
  | "pending"
  | "connected"
  | "failed"
  | "expired"
  | "exists";

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const user = useAuthStore((state) => state.user);
  const {
    isConnected: whatsAppIsConnected,
    status: persistedStatus,
    phoneNumber: connectedPhoneNumber,
    connect: connectWhatsApp,
    disconnect: disconnectWhatsApp,
    setConnectionStatus: setPersistedConnectionStatus,
  } = useWhatsAppConnectionStore();

  // Padrão: acessar organização e plano via user
  const organization = user?.organization;
  const plan = organization?.plan;
  const token = useAuthStore((state) => state.token);
  // Remover o useEffect que buscava o plano
  // const [planName, setPlanName] = useState<string>("");
  // useEffect(() => { ... });

  // Novo: pegar o nome do plano diretamente
  // Remover exibição do plano do ProfileModal
  // const planName = organization?.plan?.name || "Plano Básico";

  const [formData, setFormData] = useState({
    name: "",
    photo: "",
    phoneNumber: "",
    email: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoadingQrCode, setIsLoadingQrCode] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<WhatsAppConnectionStatus>(persistedStatus || "idle");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [existingConnectionInfo, setExistingConnectionInfo] = useState<{
    name: string;
    phoneNumber: string;
    email: string;
  } | null>(null);
  const [isWaitingForStatus, setIsWaitingForStatus] = useState(false);
  const statusCheckTimeoutRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const [connectionState, setConnectionState] = useState<
    "ativo" | "inativo" | "conectando" | null
  >(null);
  // Adicionar ref para acompanhar o estado atual
  const connectionStateRef = useRef<"ativo" | "inativo" | "conectando" | null>(
    connectionState
  );
  const [imageError, setImageError] = useState<string | null>(null);

  // Atualizar o ref quando o estado muda
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  // Sincronizar o estado local com o estado persistido
  useEffect(() => {
    if (whatsAppIsConnected && persistedStatus === "connected") {
      setConnectionStatus("connected");
    }
  }, [whatsAppIsConnected, persistedStatus]);

  // Sincronizar dados do formulário quando o modal for aberto ou quando o usuário mudar
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || "",
        photo: user.avatarUrl || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      });
      setPreviewUrl(user.avatarUrl || "");
    }
  }, [isOpen, user]);

  // Iniciar polling para verificar se a instância está ativa quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Iniciar o polling quando o modal é aberto
      startConnectionPolling();

      // Parar o polling quando o modal for fechado
      return () => {
        stopConnectionPolling();
      };
    }
  }, [isOpen]);

  // Atualizar o polling quando o nome mudar
  useEffect(() => {
    if (isOpen && formData.name) {
      // Reiniciar o polling com os novos dados
      restartConnectionPolling();
    }
  }, [formData.name, isOpen]);

  // Função para iniciar o polling de verificação de conexão
  const startConnectionPolling = () => {
    // Limpar qualquer intervalo existente
    stopConnectionPolling();

    // Executar a verificação imediatamente
    verifyConnection();

    // Configurar o intervalo para verificar a cada minuto
    pollingIntervalRef.current = window.setInterval(() => {
      verifyConnection();
    }, 300000); // Alterado de 60000 (1 minuto) para 300000 (5 minutos)
  };

  // Função para parar o polling
  const stopConnectionPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Função para reiniciar o polling
  const restartConnectionPolling = () => {
    stopConnectionPolling();
    startConnectionPolling();
  };

  // Função para verificar a conexão
  const verifyConnection = async () => {
    if (!formData.email) return;

    setIsWaitingForStatus(true);

    try {
      // Usar o novo método simplificado do proxyService com email
      const result = await proxyService.checkWhatsAppStatus(formData.email);

      // Verificar e atualizar o estado com base na resposta
      const status = result.resposta?.toLowerCase()?.trim();

      if (status === "ativo") {
        console.log("Definindo estado como ATIVO");
        setConnectionState("ativo");
        connectionStateRef.current = "ativo";
        if (connectionStatus !== "connected") {
          setConnectionStatus("connected");
          connectWhatsApp(formData.email); // Usando email em vez de nome
          toast.success("WhatsApp conectado e ativo!", {
            id: "connection-active",
          });
        }
      } else if (status === "conectando") {
        console.log("Definindo estado como CONECTANDO");
        setConnectionState("conectando");
        connectionStateRef.current = "conectando";
      } else {
        console.log("Definindo estado como INATIVO");
        setConnectionState("inativo");
        connectionStateRef.current = "inativo";

        // Se estava conectado antes, atualize o status
        if (connectionStatus === "connected") {
          setConnectionStatus("idle");
          toast.error("Conexão WhatsApp inativa ou perdida", {
            id: "connection-inactive",
          });
        }
      }

      console.log("Estado da conexão após atualização:", connectionState);
      console.log(
        "Estado da conexão (ref) após atualização:",
        connectionStateRef.current
      );
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setConnectionState("inativo");
      connectionStateRef.current = "inativo";
    } finally {
      setIsWaitingForStatus(false);
    }
  };

  // Limpar o timeout e o intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
      }
      stopConnectionPolling();
    };
  }, []);

  // Configurar um timeout para expiração do QR code após 60 segundos
  useEffect(() => {
    if (qrCodeData && connectionStatus === "pending" && !isWaitingForStatus) {
      // Após 60 segundos, se não recebemos uma resposta, consideramos o QR code expirado
      statusCheckTimeoutRef.current = window.setTimeout(() => {
        if (connectionStatus === "pending") {
          setConnectionStatus("expired");
          setQrCodeData(null);
          toast.error("O QR code expirou. Gere um novo para continuar.");
        }
      }, 60000); // 60 segundos

      return () => {
        if (statusCheckTimeoutRef.current) {
          clearTimeout(statusCheckTimeoutRef.current);
        }
      };
    }
  }, [qrCodeData, connectionStatus, isWaitingForStatus]);

  // Iniciar verificação de status quando o QR code for exibido
  useEffect(() => {
    if (connectionStatus === "pending" && qrCodeData && !isWaitingForStatus) {
      // Verificar o status da conexão uma única vez
      setIsWaitingForStatus(true);
      checkConnectionStatus();
    }
  }, [connectionStatus, qrCodeData]);

  // Função para verificar o status da conexão
  const checkConnectionStatus = async () => {
    if (!formData.email) return;

    try {
      console.log("Enviando requisição para verificar status da conexão...");

      // Usar o serviço de proxy para fazer a requisição
      const response = await proxyService.post("check_connecting", {
        email: formData.email,
      });

      if (!response.ok) {
        console.error(
          "Erro ao verificar status da conexão:",
          response.statusText
        );
        setIsWaitingForStatus(false);
        return;
      }

      // Primeiro tentar obter a resposta como JSON
      let data;
      const contentType = response.headers.get("content-type");
      let rawText = "";

      try {
        rawText = await response.text();
        console.log("Resposta do webhook (texto):", rawText);

        // Se a resposta contém a palavra 'connected' diretamente, tratar como conectado
        if (rawText.includes("connected")) {
          data = { status: "connected" };
        } else {
          // Tentar parse como JSON
          data = JSON.parse(rawText);
        }
      } catch (error) {
        console.log("Erro ao processar resposta como JSON:", error);

        // Se não for JSON válido, mas contém 'connected', criar objeto manualmente
        if (rawText.includes("connected")) {
          data = { status: "connected" };
        } else if (rawText.includes("expired")) {
          data = { status: "expired" };
        } else if (rawText.includes("pending")) {
          data = { status: "pending" };
        } else {
          console.error("Resposta não reconhecida:", rawText);
          setIsWaitingForStatus(false);
          return;
        }
      }

      console.log("Dados processados:", data);

      if (data.status === "connected") {
        // Conexão bem-sucedida
        console.log("Status definido como connected, atualizando interface");
        setConnectionStatus("connected");
        setQrCodeData(null);

        // Atualizar o store de conexão do WhatsApp
        connectWhatsApp(formData.email);

        // Limpar o timeout de expiração
        if (statusCheckTimeoutRef.current) {
          clearTimeout(statusCheckTimeoutRef.current);
          statusCheckTimeoutRef.current = null;
        }

        // Salvar o nome da instância no perfil do usuário
        // setUserData({ // This line was removed as per the new_code, as useUser is no longer used.
        //   name: formData.name,
        //   photo: formData.photo,
        //   plan,
        //   phoneNumber: formData.phoneNumber,
        //   email: formData.email
        // });

        toast.success("WhatsApp conectado com sucesso!");
      } else if (data.status === "expired") {
        // QR code expirado
        console.log("Status definido como expired, atualizando interface");
        setConnectionStatus("expired");
        setPersistedConnectionStatus("expired");
        setQrCodeData(null);

        // Limpar o timeout de expiração
        if (statusCheckTimeoutRef.current) {
          clearTimeout(statusCheckTimeoutRef.current);
          statusCheckTimeoutRef.current = null;
        }

        toast.error("O QR code expirou. Gere um novo para continuar.");
      } else if (data.status === "pending") {
        // Ainda aguardando conexão, não fazer nada e deixar o timeout de expiração lidar com isso
        console.log("Conexão ainda pendente, aguardando...");
      }
    } catch (error) {
      console.error("Erro ao verificar status da conexão:", error);
    } finally {
      setIsWaitingForStatus(false);
    }
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (max 300KB)
      if (file.size > 300 * 1024) {
        setImageError("O arquivo deve ter no máximo 300KB");
        toast.error("O arquivo deve ter no máximo 300KB", { duration: 5000 });
        return;
      } else {
        setImageError(null);
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith("image/")) {
        setImageError("Por favor, selecione apenas arquivos de imagem");
        toast.error("Por favor, selecione apenas arquivos de imagem");
        return;
      } else {
        setImageError(null);
      }

      setIsLoadingAvatar(true);
      try {
        // Mostrar preview imediatamente
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPreviewUrl(base64String);
          setFormData((prev) => ({ ...prev, photo: base64String }));
        };
        reader.readAsDataURL(file);

        // Fazer upload para a API
        if (!token) throw new Error("Token não encontrado");
        const updatedUser = await userService.updateAvatar(token, file);
        useAuthStore
          .getState()
          .updateUser({ avatarUrl: updatedUser.avatarUrl });

        // Forçar atualização do localStorage
        const currentAuth = JSON.parse(
          localStorage.getItem("auth-status") || "{}"
        );
        if (currentAuth.state) {
          currentAuth.state.user = {
            ...currentAuth.state.user,
            ...updatedUser,
          };
          localStorage.setItem("auth-status", JSON.stringify(currentAuth));
        }

        // Atualizar também o estado local para garantir consistência
        if (updatedUser.avatarUrl) {
          setPreviewUrl(updatedUser.avatarUrl);
          setFormData((prev) => ({ ...prev, photo: updatedUser.avatarUrl }));
        }

        toast.success("Avatar atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar avatar:", error);
        toast.error("Erro ao atualizar avatar. Tente novamente.");

        // Reverter preview em caso de erro
        setPreviewUrl(user?.avatarUrl || "");
        setFormData((prev) => ({ ...prev, photo: user?.avatarUrl || "" }));
      } finally {
        setIsLoadingAvatar(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    setIsLoadingAvatar(true);
    try {
      if (!token) throw new Error("Token não encontrado");
      await userService.removeAvatar(token);

      setPreviewUrl("");
      setFormData((prev) => ({ ...prev, photo: "" }));

      if (user) {
        useAuthStore.getState().updateUser({ avatarUrl: "" });
      }

      toast.success("Avatar removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      toast.error("Erro ao remover avatar. Tente novamente.");
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação apenas do nome, já que o email é obtido automaticamente
    if (!formData.name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não identificado");
      return;
    }

    if (!token) {
      toast.error("Token não encontrado");
      return;
    }

    setIsLoadingProfile(true);
    try {
      const updatedUser = await userService.updateUser(token, user.id, {
        name: formData.name.trim(),
        language: "pt-BR", // Valor padrão
        timezone: "America/Sao_Paulo", // Valor padrão
      });

      useAuthStore
        .getState()
        .updateUser({
          name: updatedUser.name,
          language: updatedUser.language,
          timezone: updatedUser.timezone,
        });

      const currentAuth = JSON.parse(
        localStorage.getItem("auth-status") || "{}"
      );
      if (currentAuth.state) {
        currentAuth.state.user = { ...currentAuth.state.user, ...updatedUser };
        localStorage.setItem("auth-status", JSON.stringify(currentAuth));
      }

      toast.success("Perfil atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleShowInstructions = () => {
    if (!formData.email.trim()) {
      toast.error("O email é obrigatório para conectar o WhatsApp");
      return;
    }

    // Verificar se já existe uma conexão com esse email
    checkExistingConnection();
  };

  const checkExistingConnection = async () => {
    setIsLoadingQrCode(true);

    try {
      // Usar o serviço de proxy para fazer a requisição
      const response = await proxyService.post("check-existing", {
        email: formData.email,
      });

      if (!response.ok) {
        throw new Error("Falha ao verificar conexão existente");
      }

      const data = await response.json();

      if (data.exists) {
        // Já existe uma conexão com esse nome
        setConnectionStatus("exists");
        setExistingConnectionInfo({
          name: data.name || formData.name,
          phoneNumber: data.phoneNumber || "",
          email: formData.email,
        });
        toast.success("Já existe uma conexão com esse nome");
      } else {
        // Não existe conexão, mostrar instruções
        setShowInstructions(true);
      }
    } catch (error) {
      console.error("Erro ao verificar conexão existente:", error);
      // Se houver erro, prosseguir com as instruções
      setShowInstructions(true);
    } finally {
      setIsLoadingQrCode(false);
    }
  };

  const handleGenerateQrCode = async () => {
    if (!formData.email) {
      toast.error("O email é obrigatório para gerar o QR code");
      return;
    }

    setIsLoadingQrCode(true);
    setQrCodeData(null);
    setShowInstructions(false);
    setConnectionStatus("pending");
    setConnectionId(null);
    setIsWaitingForStatus(false);

    // Limpar qualquer intervalo de polling existente
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    try {
      // Usar o serviço de proxy para fazer a requisição
      const response = await proxyService.post("qrcode", {
        email: formData.email,
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar QR code");
      }

      // Obter a resposta como texto para analisar manualmente
      const responseText = await response.text();
      console.log("Resposta do webhook QR code (texto):", responseText);

      try {
        // Tentar analisar como JSON
        const data = JSON.parse(responseText);
        console.log("Resposta do webhook QR code (JSON):", data);

        // Verificar se a conexão já existe
        if (data.exists) {
          setConnectionStatus("exists");
          setExistingConnectionInfo({
            name: data.name || formData.name,
            phoneNumber: data.phoneNumber || "",
            email: formData.email,
          });
          toast.success("Já existe uma conexão com esse nome");
          setIsLoadingQrCode(false);
          return;
        }

        // Verificar se temos um ID de conexão
        if (data && data.connectionId) {
          setConnectionId(data.connectionId);
        }

        // Verificar se é um objeto JSON válido com QR code
        if (data && typeof data === "object") {
          // Verificar campos específicos
          let qrCodeBase64 = null;

          if (data.cleanBase64) {
            qrCodeBase64 = data.cleanBase64;
          } else if (data.code) {
            qrCodeBase64 = data.code;
          } else if (data.qrcode) {
            qrCodeBase64 = data.qrcode;
          } else if (data.image_base64) {
            qrCodeBase64 = data.image_base64;
          }

          if (qrCodeBase64) {
            // Remover prefixos de data URL se existirem
            if (qrCodeBase64.includes("data:image")) {
              qrCodeBase64 = qrCodeBase64.split("base64,")[1];
            }

            setQrCodeData(qrCodeBase64);
            toast.success("QR code gerado com sucesso!");

            // A verificação de status será iniciada automaticamente pelo useEffect
            setIsLoadingQrCode(false);
            return;
          }
        }
      } catch (jsonError) {
        console.log(
          "Resposta não é um JSON válido, tentando extrair base64 diretamente"
        );
      }

      // Verificar se a resposta contém o padrão específico do N8N
      const n8nPattern =
        /\[\{\s*\$node\["Code"\]\.json\["cleanBase64"\]\s*\}\]/;
      if (n8nPattern.test(responseText)) {
        // Neste caso, estamos recebendo a string de template do N8N em vez do valor real
        console.log(
          "Detectado padrão de template N8N, fazendo requisição direta"
        );

        // Gerar um ID de conexão aleatório para testes
        const tempConnectionId = Math.random().toString(36).substring(2, 15);
        setConnectionId(tempConnectionId);

        // Fazer uma requisição direta para o endpoint que gera o QR code
        try {
          // Simular um atraso para dar tempo ao N8N de processar
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Fazer uma nova requisição para obter o QR code real
          // Usamos o email em vez do nome da instância
          const directResponse = await fetch(
            "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://instance.connect/" +
              formData.email,
            {
              method: "GET",
            }
          );

          if (directResponse.ok) {
            // Converter a resposta para blob e depois para base64
            const blob = await directResponse.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
              const base64data = reader.result as string;
              // Extrair apenas a parte base64 da string data URL
              const base64Content = base64data.split(",")[1];
              setQrCodeData(base64Content);
              toast.success("QR code gerado com sucesso!");
              setIsLoadingQrCode(false);

              // A verificação de status será iniciada automaticamente pelo useEffect
            };
            return;
          }
        } catch (directError) {
          console.error("Erro ao fazer requisição direta:", directError);
        }
      }

      // Se chegou aqui, não conseguiu extrair o QR code
      setConnectionStatus("failed");
      toast.error("Não foi possível gerar o QR code. Tente novamente.");
    } catch (error) {
      console.error("Erro ao gerar QR code:", error);
      toast.error("Erro ao gerar QR code. Tente novamente.");
      setConnectionStatus("failed");
    } finally {
      setIsLoadingQrCode(false);
    }
  };

  const handleResetConnection = () => {
    setConnectionStatus("idle");
    disconnectWhatsApp();
    setQrCodeData(null);
    toast.success(
      "Conexão do WhatsApp removida. Você pode conectar novamente quando desejar."
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      {/* Bloco de informações do plano */}
      {organization && (
        <div className="mb-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#7f00ff] text-lg">
              {organization.plan?.name || "Plano Básico"}
            </span>
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                organization.subscriptionStatus === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {organization.subscriptionStatus === "ACTIVE"
                ? "Ativo"
                : "Inativo"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span>
              Boards extras: <b>{organization.extraBoards}</b>
            </span>
            <span>
              Membros extras: <b>{organization.extraTeamMembers}</b>
            </span>
            <span>
              Triggers extras: <b>{organization.extraTriggers}</b>
            </span>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-700">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera size={32} />
                </div>
              )}
            </div>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isLoadingAvatar}
                className={`absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 ${
                  isLoadingAvatar ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoadingAvatar ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            )}
          </div>
          <div>
            <label
              htmlFor="photo-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 ${
                isLoadingAvatar ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoadingAvatar ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Camera size={16} className="mr-2" />
                  Alterar foto
                </>
              )}
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isLoadingAvatar}
                className="hidden"
              />
            </label>
            {imageError && (
              <div className="text-red-600 text-sm mt-1">{imageError}</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Seu nome"
            required
          />

          {/* Exibir o email como informação, não como campo editável */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">
              {formData.email}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              O email é sincronizado automaticamente com sua conta
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Plano atual:{" "}
              <span className="font-medium text-[#7f00ff]">{user?.plan}</span>
            </p>
          </div>

          {/* Status da conexão do WhatsApp */}
          {(connectionState === "ativo" ||
            connectionStateRef.current === "ativo") && (
            <div className="mt-4 bg-green-100 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-400">
              <div className="flex items-center mb-2">
                <CheckCircle
                  size={18}
                  className="mr-2 text-green-700 dark:text-green-400"
                />
                <span className="font-semibold">WhatsApp Conectado</span>
              </div>
              <p className="ml-6">
                Seu WhatsApp foi conectado com sucesso usando o email "
                {formData.email}".
              </p>
            </div>
          )}

          {/* Estado "CONECTANDO" */}
          {(connectionState === "conectando" ||
            connectionStateRef.current === "conectando") && (
            <div className="mt-4 bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
              <div className="flex items-center mb-2">
                <Loader
                  size={18}
                  className="mr-2 text-yellow-700 dark:text-yellow-400 animate-spin"
                />
                <span className="font-semibold">WhatsApp Conectando</span>
              </div>
              <p className="ml-6">
                Seu WhatsApp está sendo conectado usando o email "
                {formData.email}". Por favor, aguarde...
              </p>
            </div>
          )}

          {/* Estado "INATIVO" */}
          {(connectionState === "inativo" ||
            connectionStateRef.current === "inativo") && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-400">
              <div className="flex items-center mb-2">
                <AlertTriangle
                  size={18}
                  className="mr-2 text-red-700 dark:text-red-400"
                />
                <span className="font-semibold">WhatsApp Inativo</span>
              </div>
              <p className="ml-6">
                O WhatsApp não está ativo. Gere um QR code para conectar.
              </p>
            </div>
          )}

          {connectionStatus === "exists" && existingConnectionInfo && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-400">
                    Conexão Existente
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Já existe uma conexão com o nome "
                    {existingConnectionInfo.name}".
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Você pode alterar os dados ou reconectar com os mesmos
                    dados.
                  </p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      type="button"
                      onClick={handleResetConnection}
                      className="text-sm text-blue-700 dark:text-blue-300 underline hover:text-blue-800"
                    >
                      Alterar dados
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateQrCode}
                      className="text-sm text-blue-700 dark:text-blue-300 underline hover:text-blue-800"
                    >
                      Reconectar mesmo assim
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {connectionStatus === "expired" && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-400">
                    QR Code Expirado
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    O QR code expirou. Você precisa gerar um novo para conectar
                    o WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateQrCode}
                    className="mt-3 flex items-center text-sm text-yellow-700 dark:text-yellow-300 underline hover:text-yellow-800"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Gerar novo QR code
                  </button>
                </div>
              </div>
            </div>
          )}

          {connectionStatus !== "connected" &&
            connectionStatus !== "exists" &&
            connectionStatus !== "expired" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleShowInstructions}
                  disabled={
                    !formData.email.trim() ||
                    isLoadingQrCode ||
                    !!qrCodeData ||
                    connectionStatus === "pending"
                  }
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg ${
                    !formData.email.trim() ||
                    isLoadingQrCode ||
                    !!qrCodeData ||
                    connectionStatus === "pending"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-dark-600 dark:text-gray-400"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <QrCode size={16} className="mr-2" />
                  {isLoadingQrCode ? "Gerando QR Code..." : "Conectar WhatsApp"}
                </button>
              </div>
            )}

          {showInstructions &&
            connectionStatus !== "connected" &&
            connectionStatus !== "exists" && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-400">
                    Instruções para conectar o WhatsApp
                  </h3>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Por motivos de segurança, você deve ser rápido ao escanear o
                  QR code. Siga os passos:
                </p>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal pl-5 space-y-1">
                  <li>Abra seu WhatsApp</li>
                  <li>Toque em Menu (três pontos)</li>
                  <li>Selecione "Dispositivos conectados"</li>
                  <li>Toque em "Conectar dispositivo"</li>
                  <li>Prepare-se para escanear o QR code que será exibido</li>
                </ol>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleGenerateQrCode}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Conectar Agora
                  </button>
                </div>
              </div>
            )}

          {qrCodeData && connectionStatus === "pending" && (
            <div className="mt-4 flex flex-col items-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Escaneie o QR code com seu WhatsApp para conectar
              </p>
              <div className="bg-white p-4 rounded-lg">
                {/* Tentar exibir como imagem primeiro */}
                {qrCodeData.match(/^[A-Za-z0-9+/=]+$/) ? (
                  <img
                    src={`data:image/png;base64,${qrCodeData}`}
                    alt="QR Code para WhatsApp"
                    className="w-64 h-64"
                    onError={(e) => {
                      console.error("Erro ao carregar QR code como imagem");
                      e.currentTarget.style.display = "none";

                      // Criar um elemento para exibir o texto do QR code
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        const textElement = document.createElement("div");
                        textElement.className =
                          "p-4 bg-gray-100 rounded overflow-auto max-w-full max-h-64";
                        textElement.style.wordBreak = "break-all";
                        textElement.textContent = qrCodeData;
                        container.appendChild(textElement);
                      }

                      toast.error(
                        "Erro ao exibir QR code como imagem. Exibindo como texto."
                      );
                    }}
                  />
                ) : (
                  // Se não parece ser um base64 válido, exibir como texto
                  <div
                    className="p-4 bg-gray-100 rounded overflow-auto max-w-full max-h-64 text-xs"
                    style={{ wordBreak: "break-all" }}
                  >
                    {qrCodeData}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-center">
                  {isWaitingForStatus ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Aguardando resposta do servidor...
                    </>
                  ) : connectionStatus === "pending" ? (
                    "Aguardando conexão... O QR code expirará em breve."
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={handleResetConnection}
                  className="px-4 py-2 text-sm text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {connectionStatus === "failed" && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-400">
                    Falha na conexão
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Não foi possível conectar o WhatsApp. Verifique seu número e
                    tente novamente.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetConnection}
                    className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:text-red-800"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoadingProfile}
            className={`px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 flex items-center ${
              isLoadingProfile ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoadingProfile ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
