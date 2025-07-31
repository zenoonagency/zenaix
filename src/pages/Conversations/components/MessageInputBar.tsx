import React, { useRef, useState } from "react";
import { Mic, Paperclip, Send, Trash2 } from "lucide-react";

function RecordingWave() {
  // Onda fake animada
  return (
    <svg
      height="24"
      width="60"
      className="mx-2 animate-pulse"
      style={{ minWidth: 40 }}
    >
      <rect x="2" y="10" width="2" height="4" rx="1" fill="#bbb" />
      <rect x="8" y="6" width="2" height="12" rx="1" fill="#bbb" />
      <rect x="14" y="12" width="2" height="6" rx="1" fill="#bbb" />
      <rect x="20" y="8" width="2" height="10" rx="1" fill="#bbb" />
      <rect x="26" y="4" width="2" height="16" rx="1" fill="#bbb" />
      <rect x="32" y="8" width="2" height="10" rx="1" fill="#bbb" />
      <rect x="38" y="12" width="2" height="6" rx="1" fill="#bbb" />
      <rect x="44" y="6" width="2" height="12" rx="1" fill="#bbb" />
      <rect x="50" y="10" width="2" height="4" rx="1" fill="#bbb" />
    </svg>
  );
}

export function MessageInputBar({
  selectedContactId,
  activeInstance,
  showToast,
  setShowAudioModal, // não será mais usado
  isSendingFile,
  fileInputRef,
  newMessage,
  setNewMessage,
  handleKeyPress,
  isSendingMessage,
  handleSendMessage,
  handleFileSelect,
  isLoadingMessages,
  handleSendAudio, // função para enviar áudio
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;

  // Iniciar gravação
  const startRecording = async () => {
    if (!selectedContactId) {
      showToast("Selecione um contato para gravar áudio", "error");
      return;
    }
    if (activeInstance?.status !== "CONNECTED") {
      showToast("Instância não está conectada", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      setRecordingTime(0);
      setIsRecording(true);
      setAudioBlob(null);
      mediaRecorder.start();
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      showToast("Não foi possível acessar o microfone", "error");
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Cancelar gravação ou preview
  const cancelRecording = () => {
    stopRecording();
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // Regravar
  const reRecord = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    startRecording();
  };

  // Enviar áudio
  const sendAudio = () => {
    if (audioBlob) {
      handleSendAudio(audioBlob);
      setIsRecording(false);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  // Formatar tempo
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // Barra de gravação/preview igual WhatsApp
  if (isRecording || audioBlob) {
    return (
      <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Cancelar */}
          <button
            onClick={cancelRecording}
            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
            title="Cancelar"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          {/* Preview ou gravação */}
          {audioBlob ? (
            <>
              <audio src={audioUrl!} controls className="h-8" />
              <span className="font-mono text-xs text-gray-700 dark:text-gray-200 min-w-[40px]">
                {formatTime(recordingTime)}
              </span>
              {/* Regravar */}
              <button
                onClick={reRecord}
                className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full"
                title="Regravar"
              >
                <Mic className="w-5 h-5" />
              </button>
              {/* Enviar */}
              <button
                onClick={sendAudio}
                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"
                title="Enviar áudio"
                disabled={!audioBlob}
              >
                <Send className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-200 min-w-[40px]">
                  {formatTime(recordingTime)}
                </span>
              </span>
              <RecordingWave />
              {/* Parar gravação */}
              <button
                onClick={stopRecording}
                className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                title="Parar gravação"
              >
                {/* Ícone de quadrado (stop) */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="block"
                >
                  <rect
                    x="5"
                    y="5"
                    width="10"
                    height="10"
                    rx="2"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Barra padrão
  return (
    <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2">
        {/* Botão de áudio */}
        <button
          onClick={startRecording}
          disabled={
            !selectedContactId ||
            (activeInstance && activeInstance.status !== "CONNECTED")
          }
          className={`p-2 transition-colors ${
            selectedContactId && activeInstance?.status === "CONNECTED"
              ? "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
          title={
            !selectedContactId
              ? "Selecione um contato"
              : activeInstance?.status !== "CONNECTED"
              ? "Instância não conectada"
              : "Gravar áudio"
          }
        >
          <Mic className="w-5 h-5" />
        </button>
        {/* Botão de anexo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 transition-colors ${
            !isSendingFile
              ? "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
          title="Anexar arquivo"
          disabled={isSendingFile}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        {/* Campo de mensagem */}
        <div className="flex-1">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="w-full px-4 py-2 bg-white dark:bg-dark-900 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isSendingMessage || isLoadingMessages}
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>
        {/* Botão de enviar texto */}
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSendingMessage}
          className={`p-2 rounded-full transition-colors ${
            newMessage.trim() && !isSendingMessage
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
          title="Enviar mensagem"
        >
          <Send className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.txt"
          className="hidden"
        />
      </div>
    </div>
  );
}
