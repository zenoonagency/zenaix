import React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  message: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  type,
  message,
}: FeedbackModalProps) {
  if (!isOpen) return null;

  const Icon = type === "success" ? CheckCircle : AlertCircle;
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";
  const title = type === "success" ? "Sucesso" : "Erro";

  return (
    <div className="modal-container">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200/10 dark:border-gray-700/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Icon className={`${iconColor} w-5 h-5 mr-2`} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        <div className="p-4 border-t border-gray-200/10 dark:border-gray-700/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
