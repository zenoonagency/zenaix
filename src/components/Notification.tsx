import React from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";

export type NotificationType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: NotificationType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          type,
        },
      ],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

const icons = {
  success: <CheckCircle className="w-5 h-5 text-white" />,
  error: <AlertCircle className="w-5 h-5 text-white" />,
  info: <Info className="w-5 h-5 text-white" />,
  warning: <AlertTriangle className="w-5 h-5 text-white" />,
};

const colors = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  warning: "bg-yellow-500",
};

export interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

export function NotificationSingle({
  message,
  type,
  onClose,
}: NotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-[99999]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`flex items-center justify-between min-w-[300px] p-4 rounded-lg shadow-lg ${colors[type]}`}
      >
        <div className="flex items-center">
          {icons[type]}
          <span className="ml-3 text-white font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white/80 hover:text-white focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}

export function Notification() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  // Remover toast automaticamente após 3 segundos
  React.useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 3000);

      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  return (
    <div className="fixed top-4 right-4 z-[99999] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`flex items-center justify-between min-w-[300px] p-4 rounded-lg shadow-lg ${
              colors[toast.type]
            }`}
          >
            <div className="flex items-center">
              {icons[toast.type]}
              <span className="ml-3 text-white font-medium">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white/80 hover:text-white focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
