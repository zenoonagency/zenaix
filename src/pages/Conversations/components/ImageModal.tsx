import React from "react";
import { Download, X } from "lucide-react";
import { processWhatsAppMediaUrl } from "../../../utils/imageUtils";

export function ImageModal({ isOpen, selectedImage, onClose }) {
  if (!isOpen || !selectedImage) return null;
  const processedUrl = processWhatsAppMediaUrl(selectedImage);
  const isGif =
    selectedImage.toLowerCase().includes(".gif") ||
    selectedImage.toLowerCase().includes("image/gif");
  const isVideo =
    selectedImage.toLowerCase().includes(".mp4") ||
    selectedImage.toLowerCase().includes(".webm") ||
    selectedImage.toLowerCase().includes("video/");
  return (
    <div className="modal-overlay bg-black/80" onClick={onClose}>
      <div className="relative max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const response = await fetch(selectedImage);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `midia_${Date.now()}.${
                  selectedImage.includes(".gif") ? "gif" : "jpg"
                }`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                const link = document.createElement("a");
                link.href = selectedImage;
                link.download = `midia_${Date.now()}.${
                  selectedImage.includes(".gif") ? "gif" : "jpg"
                }`;
                link.click();
              }
            }}
            className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-dark-800/90 hover:bg-white dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
            title="Baixar mídia"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-dark-800/90 hover:bg-white dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {isGif ? (
          <img
            src={processedUrl}
            alt="GIF da mensagem"
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : isVideo ? (
          <video
            src={processedUrl}
            controls
            autoPlay
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={processedUrl}
            alt="Imagem da mensagem"
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}
