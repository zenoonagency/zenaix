import React from "react";
import { AlertTriangle } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonClass = "bg-[#7f00ff] hover:bg-[#7f00ff]/90",
  isLoading = false,
}: ConfirmationModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          if (!isLoading) {
            onClose();
          }
        }}
      />
      <div
        className={`relative w-full max-w-md p-6 rounded-lg shadow-lg  ${
          isDark ? "bg-[#1e1f25] text-gray-100" : "bg-white text-gray-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#7f00ff]/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-[#7f00ff]" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoading) {
                onClose();
              }
            }}
            className={`px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? "text-gray-300 hover:bg-gray-700/50"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoading) {
                onConfirm();
              }
            }}
            className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmButtonClass}`}
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
