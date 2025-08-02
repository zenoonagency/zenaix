import React from "react";
import { Paperclip, Send } from "lucide-react";

export function FileModal({
  isOpen,
  selectedFile,
  fileUrl,
  fileCaption,
  setFileCaption,
  isSendingFile,
  handleCancelFile,
  handleSendFile,
}) {
  if (!isOpen || !selectedFile) return null;
  return (
    <div className="modal-container">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Enviar Arquivo
          </h3>
          <button
            onClick={handleCancelFile}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mb-4">
          {fileUrl && selectedFile && (
            <>
              {selectedFile.type.startsWith("image/") ? (
                <div className="relative">
                  <img
                    src={fileUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {selectedFile.type.split("/")[1].toUpperCase()}
                  </div>
                </div>
              ) : selectedFile.type.startsWith("video/") ? (
                <div className="relative">
                  <video
                    src={fileUrl}
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {selectedFile.type.split("/")[1].toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-dark-700 rounded-lg">
                  <Paperclip className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Legenda (opcional)
          </label>
          <textarea
            value={fileCaption}
            onChange={(e) => setFileCaption(e.target.value)}
            placeholder="Adicione uma legenda para o arquivo..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-dark-700 dark:text-white"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancelFile}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendFile}
            disabled={isSendingFile}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSendingFile ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
