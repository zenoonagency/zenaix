import React from "react";
import { Mic, Paperclip, Send } from "lucide-react";

export function MessageInputBar({
  selectedContactId,
  activeInstance,
  showToast,
  setShowAudioModal,
  isSendingFile,
  fileInputRef,
  newMessage,
  setNewMessage,
  handleKeyPress,
  isSendingMessage,
  handleSendMessage,
  handleFileSelect,
  isLoadingMessages,
}) {
  return (
    <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!selectedContactId) {
              showToast("Selecione um contato para gravar áudio", "error");
              return;
            }
            if (activeInstance?.status !== "CONNECTED") {
              showToast("Instância não está conectada", "error");
              return;
            }
            setShowAudioModal(true);
          }}
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
