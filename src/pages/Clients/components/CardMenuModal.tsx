import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Pencil, Copy, ArrowUpDown, Trash2 } from 'lucide-react';

interface CardMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onDelete: () => void;
}

export function CardMenuModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDuplicate, 
  onMove, 
  onDelete 
}: CardMenuModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="modal-overlay-enter"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="modal-overlay-leave"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="modal-enter"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="modal-leave"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="modal-content w-full max-w-xs transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-4 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-2">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Opções do Cartão
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      onEdit();
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center transition-colors"
                  >
                    <Pencil className="w-5 h-5 mr-3 text-purple-500" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate();
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center transition-colors"
                  >
                    <Copy className="w-5 h-5 mr-3 text-purple-500" />
                    Duplicar
                  </button>
                  <button
                    onClick={() => {
                      onMove();
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center transition-colors"
                  >
                    <ArrowUpDown className="w-5 h-5 mr-3 text-purple-500" />
                    Mover
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg flex items-center transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                    Excluir
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 