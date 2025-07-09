import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import '../styles/modal.css';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  type?: 'confirm' | 'alert';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'confirm',
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
        <div className="mb-6">
          {message}
        </div>
        <div className="flex justify-end gap-2">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={type === 'confirm' ? onConfirm : onClose}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              type === 'confirm'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {type === 'confirm' ? confirmText : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Funções utilitárias para usar o modal como substituto dos métodos nativos
export function useCustomModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modalConfig, setModalConfig] = React.useState<Omit<CustomModalProps, 'isOpen' | 'onClose'>>({
    title: '',
    type: 'alert',
  });
  const [resolvePromise, setResolvePromise] = React.useState<((value: any) => void) | null>(null);
  const [inputValue, setInputValue] = React.useState('');

  const showModal = (config: Omit<CustomModalProps, 'isOpen' | 'onClose'>) => {
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
    setInputValue('');
  };

  const handleConfirm = () => {
    if (modalConfig.type === 'prompt') {
      resolvePromise?.(inputValue);
    } else {
      resolvePromise?.(true);
    }
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
      onCancel={handleCancel}
      inputValue={inputValue}
      onInputChange={setInputValue}
    />
  );

  const customAlert = (title: string, message?: string) =>
    showModal({ title, message, type: 'alert' });

  const customConfirm = (title: string, message?: string) =>
    showModal({ title, message, type: 'confirm' });

  const customPrompt = (title: string, message?: string) =>
    showModal({ title, message, type: 'prompt' });

  return {
    modal,
    customAlert,
    customConfirm,
    customPrompt,
  };
} 