import { useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Send,
  Paperclip,
  Mic,
  Play,
  Pause,
  Trash2,
  Square,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/chat/use-toast";

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendMedia: (
    content: string,
    type: "image" | "audio" | "document",
    file: File
  ) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  onSendMedia,
  disabled = false,
  placeholder = "Digite sua mensagem...",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordingInterval, setRecordingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Carregar duração do áudio quando audioUrl mudar
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        setAudioDuration(audio.duration);
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [audioUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    const isDocument =
      file.type.startsWith("application/") ||
      file.type.includes("pdf") ||
      file.type.includes("doc") ||
      file.type.includes("text/");

    if (!isImage && !isAudio && !isDocument) {
      return;
    }

    const type = isImage ? "image" : isAudio ? "audio" : "document";
    onSendMedia(file.name, type, file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Para todas as tracks do stream
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Iniciar contador de tempo
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } catch (error) {
      toast({
        title: "Erro ao acessar microfone",
        description: "Permita o acesso ao microfone para gravar áudio",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);

      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSendAudio = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
        type: "audio/webm",
      });
      onSendMedia(`Áudio gravado`, "audio", audioFile);
      resetRecording();
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    resetRecording();
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingTime(0);
    setAudioDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setMediaRecorder(null);

    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // Interface de gravação (estilo WhatsApp)
  if (isRecording) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Gravando... {formatTime(recordingTime)}
            </span>
          </div>
          <Button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
            size="sm"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Interface de preview do áudio (estilo WhatsApp)
  if (audioBlob && audioUrl) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePlayPause}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white"
            size="sm"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Áudio gravado
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(recordingTime)} / {formatTime(audioDuration)}
              </span>
            </div>

            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1 mt-1">
              <div
                className="bg-purple-600 h-1 rounded-full transition-all duration-100"
                style={{
                  width: "0%", // Progresso seria calculado baseado no currentTime do áudio
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendAudio}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCancelRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Interface normal do input
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <div className="flex gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startRecording}
            disabled={disabled}
            className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,application/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden "
          />
        </div>

        <div className="flex-1 min-h-[40px] bg-white">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          size="default"
          className={cn(
            "px-3 bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
