import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { useWhatsappMessageStore } from "../store/whatsapp/whatsappMessageStore";

interface WhatsAppAudioPlayerProps {
  audioUrl: string;
  isOutgoing?: boolean;
  messageType?: string;
  mediaType?: string;
  avatarUrl?: string | null;
  contactName?: string;
  messageTime?: string;
  ack?: number;
  waMessageId?: string;
  instanceId?: string;
  contactId?: string;
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  audioUrl,
  isOutgoing = false,
  messageType,
  mediaType,
  avatarUrl,
  contactName,
  messageTime,
  ack: propAck,
  waMessageId,
  instanceId,
  contactId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Obter ack atualizado da store se tiver os dados necessários
  const messageStore = useWhatsappMessageStore();
  const storeAck =
    instanceId && contactId && waMessageId
      ? messageStore.messages[instanceId]?.[contactId]?.find(
          (m) => m.wa_message_id === waMessageId
        )?.ack
      : undefined;

  // Usar ack da store se disponível, senão usar a prop
  const currentAck = storeAck !== undefined ? storeAck : propAck;

  // Carregar áudio apenas quando necessário
  const loadAudio = async () => {
    if (!audioRef.current || isAudioLoaded) return;

    setIsLoading(true);
    setHasError(false);

    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.load(); // Força o carregamento

    // Aguardar o carregamento e depois tocar automaticamente
    const handleCanPlay = async () => {
      try {
        // Pausar todos os outros áudios antes de tocar este
        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((otherAudio) => {
          if (otherAudio !== audio) {
            otherAudio.pause();
          }
        });

        await audio.play();
        audio.removeEventListener("canplay", handleCanPlay);
      } catch (error) {
        console.error("Erro ao reproduzir áudio:", error);
        setHasError(true);
      }
    };

    audio.addEventListener("canplay", handleCanPlay);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
      setIsAudioLoaded(true);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e) => {
      console.error("Erro no áudio:", e);
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    // Se o áudio não foi carregado ainda, carrega primeiro
    if (!isAudioLoaded) {
      loadAudio();
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Pausar todos os outros áudios antes de tocar este
        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((audio) => {
          if (audio !== audioRef.current) {
            audio.pause();
          }
        });

        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
      setHasError(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || hasError) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * duration;
    audioRef.current.currentTime = seekTime;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Gera barras de onda fake (visual)
  const renderWaveform = () => {
    const bars = [];
    // Calcular largura disponível para as ondas (excluindo espaço do avatar)
    const availableWidth = 200; // Largura fixa para as ondas
    const barWidth = 3; // Largura de cada barra (2px + 1px margin)
    const totalBars = Math.floor(availableWidth / barWidth);

    for (let i = 0; i < totalBars; i++) {
      // Altura fake, mas com padrão de "onda"
      const base = [6, 10, 14, 18, 22, 18, 14, 10, 6];
      const height = base[i % base.length] + Math.floor(Math.random() * 3);
      const played = (i / totalBars) * 100 < progressPercentage;
      bars.push(
        <div
          key={i}
          className={`inline-block mx-[1px] rounded-full transition-all duration-75 ${
            played
              ? "bg-[#3b82f6] dark:bg-blue-400"
              : "bg-gray-400 dark:bg-gray-500"
          }`}
          style={{ width: 2, height: `${height}px` }}
        />
      );
    }
    // Posição do "ponteiro" azul
    const pointerIndex = Math.floor((progressPercentage / 100) * totalBars);
    if (pointerIndex < totalBars) {
      bars[pointerIndex] = (
        <div
          key={"pointer"}
          className="inline-block mx-[1px] rounded-full bg-blue-500"
          style={{ width: 4, height: 24, marginTop: -4 }}
        />
      );
    }
    return bars;
  };

  // Componente AckIcon
  const AckIcon = ({ ack }: { ack: number }) => {
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
  };

  if (hasError) {
    return (
      <div className="w-full flex items-center justify-center p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
        <span className="text-sm text-red-600 dark:text-red-400">
          Erro ao carregar áudio
        </span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center w-full">
        {/* Botão play/pause */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading || hasError}
          className="flex items-center justify-center w-8 h-8 mr-2"
          style={{ minWidth: 32 }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : hasError ? (
            <span className="text-sm">!</span>
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-blue-500" />
          ) : (
            <Play className="w-5 h-5 text-blue-500" />
          )}
        </button>
        {/* Barra de onda fake */}
        <div
          className="flex-1 flex items-end h-7 cursor-pointer select-none overflow-hidden"
          onClick={handleSeek}
        >
          <div className="flex items-end h-7">{renderWaveform()}</div>
        </div>
        {/* Avatar à direita */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={contactName || "avatar"}
            className="w-8 h-8 rounded-full object-cover ml-2"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 ml-2" />
        )}
      </div>
      {/* Horário e AckIcon apenas para mensagens OUTGOING */}
      {isOutgoing && (
        <div
          className="text-[11px] flex items-center justify-end mt-1"
          style={{
            color: "#cfcfff",
          }}
        >
          {messageTime &&
            new Date(messageTime).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          {currentAck !== undefined && <AckIcon ack={currentAck} />}
        </div>
      )}
      {/* Espaçamento para áudios recebidos para manter equilíbrio visual */}
      {!isOutgoing && <div className="h-4"></div>}
      <audio ref={audioRef} preload="none" className="hidden" />
    </div>
  );
};
