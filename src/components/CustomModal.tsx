import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import "../styles/modal.css";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  type?: "confirm" | "alert";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  hideDefaultButton?: boolean;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  message,
  type = "confirm",
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  hideDefaultButton = false,
  confirmLoading = false,
  confirmDisabled = false,
}: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] !mt-0">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
        <div className="mb-6">{message}</div>
        <div className="flex justify-end gap-2">
          {type === "confirm" && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          {!hideDefaultButton && (
            <button
              onClick={type === "confirm" ? onConfirm : onClose}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                type === "confirm"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
              disabled={confirmDisabled || confirmLoading}
            >
              {confirmLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  {type === "confirm" && confirmText === "Excluir"
                    ? "Excluindo..."
                    : "Salvando..."}
                </span>
              ) : type === "confirm" ? (
                confirmText
              ) : (
                "OK"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Funções utilitárias para usar o modal como substituto dos métodos nativos
export function useCustomModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modalConfig, setModalConfig] = React.useState<
    Omit<CustomModalProps, "isOpen" | "onClose">
  >({
    title: "",
    type: "alert",
    message: "",
  });
  const [resolvePromise, setResolvePromise] = React.useState<
    ((value: any) => void) | null
  >(null);

  const showModal = (config: Omit<CustomModalProps, "isOpen" | "onClose">) => {
    return new Promise((resolve) => {
      setModalConfig(config);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resolvePromise?.(null);
    setResolvePromise(null);
  };

  const handleConfirm = () => {
    resolvePromise?.(true);
    handleClose();
  };

  const handleCancel = () => {
    resolvePromise?.(null);
    handleClose();
  };

  const modal = (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      {...modalConfig}
      onConfirm={handleConfirm}
    />
  );

  const customAlert = (title: string, message: string = "") =>
    showModal({ title, message, type: "alert" });

  const customConfirm = (title: string, message: string = "") =>
    showModal({ title, message, type: "confirm" });

  return {
    modal,
    customAlert,
    customConfirm,
  };
}
