import React from "react";
import { X } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}) => {
  const { theme } = useThemeStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${
          sizeClasses[size]
        } max-h-[90vh] rounded-lg shadow-xl ${
          theme === "dark" ? "bg-dark-900" : "bg-white"
        } ${className}`}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-dark-700">
          {title && (
            <h2
              className={`text-xl font-semibold ${
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 pt-4">{children}</div>
      </div>
    </div>
  );
};
