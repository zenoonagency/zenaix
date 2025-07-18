import React, { useState, useEffect } from "react";
import { X, Users, UserCheck, Settings } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useKanbanStore } from "../store/kanbanStore";
import { useThemeStore } from "../../../store/themeStore";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { useToast } from "../../../hooks/useToast";

interface BoardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

interface BoardConfig {
  visibility: "all" | "creator" | "selected";
  allowedUsers: string[];
}

export function BoardConfigModal({
  isOpen,
  onClose,
  boardId,
}: BoardConfigModalProps) {
  const { boards, updateBoard } = useKanbanStore();
  const { theme } = useThemeStore();
  const { members } = useTeamMembersStore();
  const { showToast } = useToast();
  const isDark = theme === "dark";

  const currentBoard = boards.find((b) => b.id === boardId);

  // Inicializa a configuração a partir do board atual ou com valores padrão
  const [config, setConfig] = useState<BoardConfig>({
    visibility: currentBoard?.config?.visibility || "all",
    allowedUsers: currentBoard?.config?.allowedUsers || [],
  });

  // Atualiza o estado quando o board muda
  useEffect(() => {
    if (currentBoard?.config) {
      setConfig(currentBoard.config);
    } else {
      setConfig({
        visibility: "all",
        allowedUsers: [],
      });
    }
  }, [currentBoard]);

  const handleSaveConfig = () => {
    if (!currentBoard) return;

    updateBoard(boardId, {
      ...currentBoard,
      config,
    });

    showToast("Configurações do quadro salvas com sucesso!", "success");
    onClose();
  };

  const handleVisibilityChange = (
    visibility: "all" | "creator" | "selected"
  ) => {
    setConfig((prev) => ({
      ...prev,
      visibility,
    }));
  };

  const handleToggleUser = (userId: string) => {
    setConfig((prev) => {
      const isSelected = prev.allowedUsers.includes(userId);

      if (isSelected) {
        return {
          ...prev,
          allowedUsers: prev.allowedUsers.filter((id) => id !== userId),
        };
      } else {
        return {
          ...prev,
          allowedUsers: [...prev.allowedUsers, userId],
        };
      }
    });
  };

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
              <Dialog.Panel className="modal-content w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center"
                  >
                    <Settings className="w-5 h-5 mr-2 text-[#7f00ff]" />
                    Configurações do Quadro
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <h4
                      className={`text-base font-medium mb-3 ${
                        isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Visibilidade do quadro
                    </h4>

                    <div className="space-y-2">
                      <label
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                          config.visibility === "all"
                            ? isDark
                              ? "bg-dark-700 border border-[#7f00ff]/50"
                              : "bg-purple-50 border border-[#7f00ff]/20"
                            : isDark
                            ? "bg-dark-900 hover:bg-dark-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={config.visibility === "all"}
                          onChange={() => handleVisibilityChange("all")}
                          className="sr-only"
                        />
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-full ${
                            config.visibility === "all"
                              ? "bg-[#7f00ff] ring-2 ring-[#7f00ff]/20"
                              : isDark
                              ? "bg-dark-600 border border-gray-600"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          {config.visibility === "all" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            Visível para todos
                          </span>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Todos os membros da equipe podem ver este quadro
                          </p>
                        </div>
                        <Users
                          className={`w-5 h-5 ${
                            config.visibility === "all"
                              ? "text-[#7f00ff]"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        />
                      </label>

                      <label
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                          config.visibility === "creator"
                            ? isDark
                              ? "bg-dark-700 border border-[#7f00ff]/50"
                              : "bg-purple-50 border border-[#7f00ff]/20"
                            : isDark
                            ? "bg-dark-900 hover:bg-dark-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={config.visibility === "creator"}
                          onChange={() => handleVisibilityChange("creator")}
                          className="sr-only"
                        />
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-full ${
                            config.visibility === "creator"
                              ? "bg-[#7f00ff] ring-2 ring-[#7f00ff]/20"
                              : isDark
                              ? "bg-dark-600 border border-gray-600"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          {config.visibility === "creator" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            Apenas eu
                          </span>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Somente você poderá ver este quadro
                          </p>
                        </div>
                        <UserCheck
                          className={`w-5 h-5 ${
                            config.visibility === "creator"
                              ? "text-[#7f00ff]"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        />
                      </label>

                      <label
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                          config.visibility === "selected"
                            ? isDark
                              ? "bg-dark-700 border border-[#7f00ff]/50"
                              : "bg-purple-50 border border-[#7f00ff]/20"
                            : isDark
                            ? "bg-dark-900 hover:bg-dark-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={config.visibility === "selected"}
                          onChange={() => handleVisibilityChange("selected")}
                          className="sr-only"
                        />
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-full ${
                            config.visibility === "selected"
                              ? "bg-[#7f00ff] ring-2 ring-[#7f00ff]/20"
                              : isDark
                              ? "bg-dark-600 border border-gray-600"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          {config.visibility === "selected" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            Membros específicos
                          </span>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Selecione quem pode ver este quadro
                          </p>
                        </div>
                        <Users
                          className={`w-5 h-5 ${
                            config.visibility === "selected"
                              ? "text-[#7f00ff]"
                              : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        />
                      </label>
                    </div>
                  </div>

                  {config.visibility === "selected" && (
                    <div>
                      <h4
                        className={`text-base font-medium mb-3 ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Selecione os membros
                      </h4>

                      <div className="space-y-2 mt-2">
                        {members.length === 0 ? (
                          <p
                            className={`text-sm italic ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Nenhum membro na equipe
                          </p>
                        ) : (
                          members.map((member) => (
                            <label
                              key={member.id}
                              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                                isDark
                                  ? "bg-dark-900 hover:bg-dark-700"
                                  : "bg-gray-50 hover:bg-gray-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={config.allowedUsers.includes(
                                  member.id
                                )}
                                onChange={() => handleToggleUser(member.id)}
                                className="sr-only"
                              />
                              <div
                                className={`flex items-center justify-center w-5 h-5 rounded ${
                                  config.allowedUsers.includes(member.id)
                                    ? "bg-[#7f00ff] text-white"
                                    : isDark
                                    ? "border-2 border-gray-600"
                                    : "border-2 border-gray-300"
                                }`}
                              >
                                {config.allowedUsers.includes(member.id) && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <span
                                  className={`font-medium ${
                                    isDark ? "text-gray-200" : "text-gray-800"
                                  }`}
                                >
                                  {member.name}
                                </span>
                                <p
                                  className={`text-xs ${
                                    isDark ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {member.email} • {member.role}
                                </p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 transition-colors"
                  >
                    Salvar Configurações
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
