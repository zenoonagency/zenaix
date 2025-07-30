import React, { useState, useEffect } from "react";
import { X, Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (audioBlob: Blob) => void;
  isSending?: boolean;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending = false,
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const handleClose = () => {
    resetRecording();
    setAudioUrl(null);
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen) return null;

  // Verificar se o navegador suporta gravação de áudio
  const isAudioSupported =
    window.MediaRecorder &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gravar Áudio
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!isAudioSupported && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            Gravação de áudio não é suportada neste navegador. Use um navegador
            moderno como Chrome, Firefox ou Edge.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          {!audioBlob ? (
            // Interface de gravação
            <div>
              <div className="mb-4">
                <div className="w-24 h-24 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Mic
                    className={`w-12 h-12 ${
                      isRecording
                        ? "text-red-500 animate-pulse"
                        : "text-purple-600 dark:text-purple-400"
                    }`}
                  />
                </div>
              </div>

              <div className="text-2xl font-mono mb-4">
                {formatTime(recordingTime)}
              </div>

              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={!isAudioSupported}
                    className={`px-6 py-3 rounded-full transition-colors flex items-center gap-2 ${
                      isAudioSupported
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                    Iniciar Gravação
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={resumeRecording}
                        disabled={!isAudioSupported}
                        className={`px-4 py-2 rounded-full transition-colors ${
                          isAudioSupported
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={pauseRecording}
                        disabled={!isAudioSupported}
                        className={`px-4 py-2 rounded-full transition-colors ${
                          isAudioSupported
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={handleStopRecording}
                      disabled={!isAudioSupported}
                      className={`px-4 py-2 rounded-full transition-colors ${
                        isAudioSupported
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-400 text-gray-200 cursor-not-allowed"
                      }`}
                    >
                      <Square className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Interface de reprodução
            <div>
              <div className="mb-4">
                <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Play className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="text-2xl font-mono mb-4">
                {formatTime(recordingTime)}
              </div>

              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                className="hidden"
              />

              <div className="flex justify-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {isPlaying ? "Pausar" : "Reproduzir"}
                </button>

                <button
                  onClick={resetRecording}
                  className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Regravar
                </button>
              </div>
            </div>
          )}
        </div>

        {audioBlob && (
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Áudio
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
