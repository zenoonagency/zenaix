import React, { useState } from "react";
import { Bot, AlertTriangle, Trash2 } from "lucide-react";
import { AIControlButton } from "../../components/buttons/AIControlButton";
import { DocumentUploadButton } from "../../components/buttons/DocumentUploadButton";
import { Input } from "../../components/ui/Input";

export function AIAgent() {
  const [agentWebhook, setAgentWebhook] = useState("");
  const [fileWebhook, setFileWebhook] = useState("");
  const [prompt, setPrompt] = useState("");
  const [memoryCount, setMemoryCount] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteMemory = async () => {
    // Implementar a lógica de deleção de memória
    console.log("Deletando memória:", memoryCount || "toda");
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Bot className="w-8 h-8 text-[#7f00ff] mr-3" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Controle do Agente de IA
          </h1>
        </div>

        {/* Aviso de Sensibilidade */}
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Área Sensível - Atenção Requerida
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Esta é uma área sensível do sistema. Alterações nas
                configurações do agente podem afetar significativamente seu
                funcionamento. Por favor, proceda com cautela e certifique-se de
                entender o impacto de cada alteração.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Controles Principais */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Controles Principais
              </h2>
              <div className="space-y-4">
                <AIControlButton
                  isActive={false}
                  onStatusChange={() => {}}
                  webhook={agentWebhook}
                />
                <DocumentUploadButton webhook={fileWebhook} />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Configuração de Webhooks
              </h2>
              <div className="space-y-4">
                <Input
                  type="url"
                  value={agentWebhook}
                  onChange={(e) => setAgentWebhook(e.target.value)}
                  label="Webhook do Agente"
                  placeholder="https://seu-webhook/agente"
                />
                <Input
                  type="url"
                  value={fileWebhook}
                  onChange={(e) => setFileWebhook(e.target.value)}
                  label="Webhook de Arquivos"
                  placeholder="https://seu-webhook/arquivos"
                />
              </div>
            </div>
          </div>

          {/* Coluna 2: Configurações Avançadas */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Configuração do Prompt
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prompt do Agente
                  </label>
                  <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7f00ff] to-[#e100ff] rounded-lg opacity-50"></div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="relative w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                      placeholder="Digite as instruções para o agente..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Trash2 className="w-5 h-5 text-red-500 mr-2" />
                Gerenciamento de Memória
              </h2>
              <div className="space-y-4">
                <Input
                  type="number"
                  value={memoryCount}
                  onChange={(e) => setMemoryCount(e.target.value)}
                  label="Quantidade de Memórias"
                  placeholder="Digite um número ou deixe vazio para deletar tudo"
                />
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Memória
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Deleção */}
      {isDeleteModalOpen && (
        <div className="modal-container">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirmar Deleção de Memória
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {memoryCount
                ? `Você está prestes a deletar ${memoryCount} memórias do agente.`
                : "Você está prestes a deletar toda a memória do agente."}
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteMemory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Confirmar Deleção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
