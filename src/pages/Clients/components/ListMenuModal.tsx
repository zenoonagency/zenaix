import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Edit2, Copy, Trash2 } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

interface ListMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  duplicating?: boolean;
  deleting?: boolean;
}

export function ListMenuModal({
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  canDelete = true,
  duplicating = false,
  deleting = false,
}: ListMenuModalProps) {
  const { hasPermission } = useAuthStore();
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="modal-container-enter"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="modal-container-leave"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="modal-container bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto z-[9999]">
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
                    Opções da Lista
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
                    className={`w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center transition-colors ${
                      duplicating || deleting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={duplicating || deleting}
                    style={{
                      display: hasPermission("lists:update") ? "flex" : "none",
                    }}
                  >
                    <Edit2 className="w-5 h-5 mr-3 text-purple-500" />
                    Editar
                  </button>
                  <button
                    onClick={onDuplicate}
                    className={`w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center transition-colors ${
                      duplicating || deleting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={duplicating || deleting}
                    style={{
                      display: hasPermission("lists:create") ? "flex" : "none",
                    }}
                  >
                    <Copy className="w-5 h-5 mr-3 text-purple-500" />
                    {duplicating ? "Duplicando..." : "Duplicar"}
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={!canDelete || duplicating || deleting}
                    className={`w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center transition-colors ${
                      !canDelete || duplicating || deleting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    style={{
                      display: hasPermission("lists:delete") ? "flex" : "none",
                    }}
                  >
                    <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                    {deleting ? "Excluindo..." : "Excluir"}
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
