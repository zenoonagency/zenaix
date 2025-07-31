import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface WhatsAppAudioPlayerProps {
  audioUrl: string;
  isOutgoing?: boolean;
  messageType?: string;
  mediaType?: string;
  avatarUrl?: string | null;
  contactName?: string;
  messageTime?: string;
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  audioUrl,
  isOutgoing = false,
  messageType,
  mediaType,
  avatarUrl,
  contactName,
  messageTime,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
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
    const totalBars = 28;
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
          className="flex-1 flex items-end h-7 cursor-pointer select-none"
          onClick={handleSeek}
        >
          {renderWaveform()}
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
      {/* Duração e hora embaixo */}
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[11px] text-gray-500">
          {formatTime(duration)}
        </span>
        <span className="text-[11px] text-gray-500">
          {messageTime &&
            new Date(messageTime).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
};
