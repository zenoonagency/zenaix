import React, { useState } from 'react';
import { Bot, CreditCard, FileText, Shield, Book, Database, Sparkles, ActivitySquare } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../store/settingsStore';
import { toast } from 'react-toastify';
import { PerformanceTab } from './PerformanceTab';
import { ProfileTab } from './ProfileTab';

export function Settings() {
  const { 
    ai, asaas, openai,
    updateAI, updateAsaas, updateOpenAI,
  } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<'general' | 'performance' | 'profile'>('general');

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Cabeçalho alinhado à esquerda e colado na borda */}
      <div className="p-8 pb-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
          Gerencie as configurações do seu sistema e integrações
        </p>
        
        {/* Abas de navegação */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'general' 
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('general')}
          >
            Configurações Gerais
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'profile' 
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Perfil
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'performance' 
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('performance')}
          >
            Diagnóstico de Desempenho
          </button>
        </div>
      </div>

      {/* Conteúdo da aba selecionada */}
      {activeTab === 'general' ? (
        /* Conteúdo centralizado */
        <div className="px-8 pb-8">
          <div className="space-y-6 flex flex-col items-center">
            {/* Primeira linha: IA, Arquivos, Asaas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl">
              {/* Agente de IA */}
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#2E2E2E]">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Agente de IA</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Configurações do agente principal</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="ID do Agente"
                      value={ai.agentId}
                      onChange={(e) => updateAI({ agentId: e.target.value })}
                      placeholder="agent-example"
                    />
                    <Input
                      type="text"
                      label="ID do Workflow"
                      value={ai.workflowId}
                      onChange={(e) => updateAI({ workflowId: e.target.value })}
                      placeholder="workflow-example"
                    />
                    <Input
                      type="url"
                      label="Webhook Memória"
                      value={ai.webhookMemory}
                      onChange={(e) => updateAI({ webhookMemory: e.target.value })}
                      placeholder="https://api.exemplo.com/memory"
                    />
                    <Input
                      type="url"
                      label="Webhook Prompt"
                      value={ai.webhookPrompt}
                      onChange={(e) => updateAI({ webhookPrompt: e.target.value })}
                      placeholder="https://api.exemplo.com/prompt"
                    />
                    <Input
                      type="url"
                      label="Webhook Toggle AI"
                      value={ai.webhookToggleAI}
                      onChange={(e) => updateAI({ webhookToggleAI: e.target.value })}
                      placeholder="https://api.exemplo.com/toggle"
                    />
                  </div>
                </div>
              </div>

              {/* Arquivos */}
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#2E2E2E]">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Arquivos</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciamento de dados</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="Nome do Database"
                      value={ai.databaseName}
                      onChange={(e) => updateAI({ databaseName: e.target.value })}
                      placeholder="Nome do seu banco de dados"
                    />
                    <Input
                      type="text"
                      label="ID do Database"
                      value={ai.databaseId}
                      onChange={(e) => updateAI({ databaseId: e.target.value })}
                      placeholder="ID único do banco de dados"
                    />
                    <Input
                      type="url"
                      label="Webhook Arquivo"
                      value={ai.webhookFile}
                      onChange={(e) => updateAI({ webhookFile: e.target.value })}
                      placeholder="https://api.exemplo.com/file"
                    />
                  </div>
                </div>
              </div>

              {/* Asaas */}
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#2E2E2E]">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Asaas</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Integração financeira</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      label="Chave de API"
                      value={asaas.apiKey}
                      onChange={(e) => updateAsaas({ apiKey: e.target.value })}
                      placeholder="Chave de API do Asaas"
                    />
                    
                    <div className="bg-gray-50 dark:bg-[#252525] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Atual</span>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {asaas.balance.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>Atualizado</span>
                        <span>{asaas.lastUpdated ? new Date(asaas.lastUpdated).toLocaleString() : 'Nunca'}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 py-2 px-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                        onClick={() => {}}
                      >
                        Atualizar Saldo
                      </button>
                      <button 
                        className="flex-1 py-2 px-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                        onClick={() => {}}
                      >
                        Ver Transações
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      O saldo é atualizado automaticamente a cada hora na página financeira.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda linha: OpenAI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
              {/* OpenAI */}
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#2E2E2E]">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">OpenAI</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Configurações da API</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      label="Chave da API"
                      value={openai.apiKey}
                      onChange={(e) => updateOpenAI({ apiKey: e.target.value })}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                    />
                    <Input
                      type="text"
                      label="ID do Agente"
                      value={openai.agentId}
                      onChange={(e) => updateOpenAI({ agentId: e.target.value })}
                      placeholder="agent-xxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Termos e Condições */}
            <div className="w-full max-w-6xl bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-[#2E2E2E]">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Documentação</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Políticas e manuais do sistema</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="#" 
                    className="group p-6 rounded-xl bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-all duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 mb-4 rounded-xl bg-white dark:bg-[#1E1E1E] flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Política de Privacidade</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Como tratamos seus dados de acordo com a LGPD
                      </p>
                    </div>
                  </a>

                  <a 
                    href="#" 
                    className="group p-6 rounded-xl bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-all duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 mb-4 rounded-xl bg-white dark:bg-[#1E1E1E] flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                        <Book className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Termos Gerais</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Informações gerais sobre nossos serviços
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-center w-full max-w-6xl">
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'profile' ? (
        <div className="px-8 pb-8">
          <ProfileTab />
        </div>
      ) : (
        /* Aba de Diagnóstico de Desempenho */
        <PerformanceTab />
      )}
    </div>
  );
} 