import React, { useState, useEffect } from "react";
import {
  X,
  Webhook,
  ArrowRight,
  Plus,
  Trash2,
  Tag as TagIcon,
} from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useBoardStore } from "../../../store/boardStore";
import { useThemeStore } from "../../../store/themeStore";
import { useToast } from "../../../hooks/useToast";
import { Board } from "../../types/board";
import { List } from "../../types/list";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { useTagStore } from "../../../store/tagStore";

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

type TriggerType = "card_moved" | "card_created";

interface Automation {
  id: string;
  name: string;
  triggerType: TriggerType;
  sourceListId?: string;
  targetListId?: string;
  webhookUrl: string;
  active: boolean;
}

export function AutomationModal({
  isOpen,
  onClose,
  boardId,
}: AutomationModalProps) {
  const { boards } = useBoardStore();
  const { theme } = useThemeStore();
  const { showToast } = useToast();
  const { members } = useTeamMembersStore();
  const { tags } = useTagStore();
  const isDark = theme === "dark";
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [currentAutomation, setCurrentAutomation] = useState<Automation>({
    id: "",
    name: "",
    triggerType: "card_moved",
    sourceListId: "",
    targetListId: "",
    webhookUrl: "",
    active: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState<"list" | "create">("list");
  const currentBoard = boards.find((b) => b.id === boardId);
  useEffect(() => {
    const savedAutomations = localStorage.getItem(`automations_${boardId}`);
    if (savedAutomations) {
      setAutomations(JSON.parse(savedAutomations));
    }
  }, [boardId]);
  const saveAutomations = (newAutomations: Automation[]) => {
    localStorage.setItem(
      `automations_${boardId}`,
      JSON.stringify(newAutomations)
    );
    setAutomations(newAutomations);
  };
  const handleToggleActive = (id: string) => {
    const updatedAutomations = automations.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    saveAutomations(updatedAutomations);
    showToast("Status da automação atualizado!", "success");
  };
  const resetForm = () => {
    setCurrentAutomation({
      id: "",
      name: "",
      triggerType: "card_moved",
      sourceListId: "",
      targetListId: "",
      webhookUrl: "",
      active: true,
    });
    setIsEditing(false);
    setStep("list");
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };
  const getTriggerDescription = (automation: Automation) => {
    const getListName = (listId?: string) => {
      if (!listId) return "qualquer lista";
      const list = currentBoard?.lists?.find((l) => l.id === listId);
      return list ? list.title : "lista removida";
    };
    switch (automation.triggerType) {
      case "card_moved":
        return `Quando um cartão for movido de ${getListName(
          automation.sourceListId
        )} para ${getListName(automation.targetListId)}`;
      case "card_created":
        return `Quando um cartão for criado em ${getListName(
          automation.sourceListId
        )}`;
      default:
        return "Tipo de gatilho não definido";
    }
  };
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9998]" onClose={handleClose}>
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
              <Dialog.Panel className="modal-content w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Automações
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {step === "list" ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3
                        className={`text-lg font-medium ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Automações configuradas
                      </h3>
                      <button
                        onClick={() => setStep("create")}
                        className="flex items-center px-3 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Automação
                      </button>
                    </div>

                    {automations.length === 0 ? (
                      <div
                        className={`text-center py-12 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Webhook className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Nenhuma automação configurada</p>
                        <p className="text-sm mt-2">
                          Clique em "Nova Automação" para começar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {automations.map((automation) => (
                          <div
                            key={automation.id}
                            className={`p-4 rounded-lg border ${
                              isDark
                                ? automation.active
                                  ? "border-gray-700 bg-dark-700"
                                  : "border-gray-800 bg-dark-800 opacity-60"
                                : automation.active
                                ? "border-gray-200 bg-white"
                                : "border-gray-200 bg-gray-50 opacity-60"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4
                                  className={`font-medium ${
                                    isDark ? "text-gray-100" : "text-gray-900"
                                  }`}
                                >
                                  {automation.name}
                                </h4>
                                <p
                                  className={`text-sm mt-1 ${
                                    isDark ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {getTriggerDescription(automation)}
                                </p>
                                <div className="mt-2 flex items-center">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      automation.active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {automation.active ? "Ativo" : "Inativo"}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">
                                    Webhook:{" "}
                                    {automation.webhookUrl.substring(0, 30)}...
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleToggleActive(automation.id)
                                  }
                                  className={`p-1.5 rounded-md ${
                                    isDark
                                      ? "hover:bg-dark-600 text-gray-400 hover:text-gray-300"
                                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                  }`}
                                  title={
                                    automation.active ? "Desativar" : "Ativar"
                                  }
                                >
                                  <div
                                    className={`w-8 h-4 rounded-full relative ${
                                      automation.active
                                        ? "bg-[#7f00ff]"
                                        : isDark
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                                    }`}
                                  >
                                    <div
                                      className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                                        automation.active
                                          ? "right-0.5 bg-white"
                                          : "left-0.5 bg-gray-100 dark:bg-gray-500"
                                      }`}
                                    />
                                  </div>
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditAutomation(automation)
                                  }
                                  className={`p-1.5 rounded-md ${
                                    isDark
                                      ? "hover:bg-dark-600 text-gray-400 hover:text-gray-300"
                                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                  }`}
                                  title="Editar"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteAutomation(automation.id)
                                  }
                                  className={`p-1.5 rounded-md ${
                                    isDark
                                      ? "hover:bg-dark-600 text-red-400 hover:text-red-300"
                                      : "hover:bg-gray-100 text-red-500 hover:text-red-700"
                                  }`}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleClose}
                        className={`px-4 py-2 rounded-lg ${
                          isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3
                        className={`text-lg font-medium ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {isEditing ? "Editar Automação" : "Nova Automação"}
                      </h3>
                      <button
                        onClick={() => setStep("list")}
                        className={`p-1.5 rounded-md ${
                          isDark
                            ? "hover:bg-dark-600 text-gray-400 hover:text-gray-300"
                            : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Nome da automação
                        </label>
                        <input
                          type="text"
                          value={currentAutomation.name}
                          onChange={(e) =>
                            setCurrentAutomation({
                              ...currentAutomation,
                              name: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? "bg-dark-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                          placeholder="Ex: Notificar quando cliente virar lead"
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Tipo de gatilho
                        </label>
                        <select
                          value={currentAutomation.triggerType}
                          onChange={(e) =>
                            setCurrentAutomation({
                              ...currentAutomation,
                              triggerType: e.target.value as TriggerType,
                              sourceListId: "",
                              targetListId: "",
                            })
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? "bg-dark-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                        >
                          <option value="">Selecione um tipo de gatilho</option>
                          <option value="card_moved">
                            Quando um cartão for movido entre listas
                          </option>
                          <option value="card_created">
                            Quando um cartão for criado em uma lista
                          </option>
                        </select>
                      </div>

                      {currentAutomation.triggerType === "card_moved" ? (
                        <div className="space-y-4">
                          <div>
                            <label
                              className={`block text-sm font-medium mb-1 ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Lista de origem
                            </label>
                            <select
                              value={currentAutomation.sourceListId || ""}
                              onChange={(e) =>
                                setCurrentAutomation({
                                  ...currentAutomation,
                                  sourceListId: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark
                                  ? "bg-dark-700 border-gray-600 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                            >
                              <option value="">Selecione uma lista</option>
                              {currentBoard?.lists?.map((list) => (
                                <option key={list.id} value={list.id}>
                                  {list.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              className={`block text-sm font-medium mb-1 ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Lista de destino
                            </label>
                            <select
                              value={currentAutomation.targetListId || ""}
                              onChange={(e) =>
                                setCurrentAutomation({
                                  ...currentAutomation,
                                  targetListId: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark
                                  ? "bg-dark-700 border-gray-600 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                            >
                              <option value="">Selecione uma lista</option>
                              {currentBoard?.lists?.map((list) => (
                                <option key={list.id} value={list.id}>
                                  {list.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : currentAutomation.triggerType === "card_created" ? (
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Lista a ser monitorada
                          </label>
                          <select
                            value={currentAutomation.sourceListId || ""}
                            onChange={(e) =>
                              setCurrentAutomation({
                                ...currentAutomation,
                                sourceListId: e.target.value,
                              })
                            }
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDark
                                ? "bg-dark-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                          >
                            <option value="">Selecione uma lista</option>
                            {currentBoard?.lists?.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          URL do Webhook
                        </label>
                        <input
                          type="url"
                          value={currentAutomation.webhookUrl}
                          onChange={(e) =>
                            setCurrentAutomation({
                              ...currentAutomation,
                              webhookUrl: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? "bg-dark-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-[#7f00ff]`}
                          placeholder="https://exemplo.com/webhook"
                        />
                        <p
                          className={`mt-1 text-xs ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          O webhook receberá os dados do cartão e da lista em
                          formato JSON.
                        </p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="active"
                          checked={currentAutomation.active}
                          onChange={(e) =>
                            setCurrentAutomation({
                              ...currentAutomation,
                              active: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-[#7f00ff] border-gray-300 rounded focus:ring-[#7f00ff]"
                        />
                        <label
                          htmlFor="active"
                          className={`ml-2 text-sm ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Ativar automação imediatamente
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setStep("list")}
                        className={`px-4 py-2 rounded-lg ${
                          isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateAutomation}
                        className="px-4 py-2 bg-[#7f00ff] hover:bg-[#7f00ff]/90 text-white rounded-lg"
                      >
                        {isEditing ? "Atualizar" : "Criar"} Automação
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
