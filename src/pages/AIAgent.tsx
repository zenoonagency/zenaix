// import React, { useState } from 'react';
// import { Bot, AlertTriangle, Trash2, Upload, AlertCircle, Power } from 'lucide-react';
// import { AIControlButton } from '../components/buttons/AIControlButton';
// import { DocumentUploadButton } from '../components/buttons/DocumentUploadButton';
// import { Input } from '../components/ui/Input';

// export function AIAgent() {
//   const [prompt, setPrompt] = useState('');
//   const [memoryCount, setMemoryCount] = useState('');
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isActive, setIsActive] = useState(false);
//   const { webhookAgent, webhookTurnOnAI, webhookTurnOffAI, webhookMemory, webhookPrompt, webhookFile } = useSettingsStore();

//   const handleStatusChange = async (newStatus: boolean) => {
//     if (!webhookTurnOnAI || !webhookTurnOffAI) {
//       return;
//     }
//     setIsActive(newStatus);
//   };

//   const handleDeleteMemory = async () => {
//     if (!webhookMemory) {
//       return;
//     }
//     console.log('Deletando memória:', memoryCount || 'toda');
//     setIsDeleteModalOpen(false);
//   };

//   const handlePromptSubmit = async () => {
//     if (!webhookPrompt || !prompt.trim()) {
//       return;
//     }
//     console.log('Enviando prompt:', prompt);
//   };

//   const renderWebhookWarning = (message: string) => (
//     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-800 text-white px-4 py-2 rounded-lg shadow-lg border border-red-500/50 whitespace-nowrap z-50 flex items-center gap-2">
//       <AlertCircle className="w-4 h-4 text-red-500" />
//       <span className="text-sm">{message}</span>
//     </div>
//   );

//   return (
//     <div className="min-h-screen">
//       <div className="px-4 py-4 dark:border-dark-700">
//         <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
//           Controle do Agente de IA
//         </h1>
//       </div>

//       <div className="p-8">
//         <div className="max-w-7xl mx-auto space-y-6">
//           {/* Aviso de Sensibilidade */}
//           <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
//               <div>
//                 <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
//                   Área Sensível - Atenção Requerida
//                 </h3>
//                 <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
//                   Esta é uma área sensível do sistema. Alterações nas configurações do agente podem afetar significativamente seu funcionamento.
//                   Por favor, proceda com cautela e certifique-se de entender o impacto de cada alteração.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Coluna 1: Controles Principais */}
//             <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-dark-700 h-full">
//               <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
//                 <Bot className="w-5 h-5 text-[#7f00ff]" />
//                 Controles Principais
//               </h2>
//               <div className="space-y-6">
//                 <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-6 border border-gray-100 dark:border-dark-700">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <Bot className="w-5 h-5 text-[#7f00ff]" />
//                       <h3 className="text-lg font-medium text-gray-800 dark:text-white">Status da IA</h3>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
//                         {isActive ? 'Ativa' : 'Inativa'}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="mt-4 flex gap-3">
//                     <button
//                       onClick={() => handleStatusChange(true)}
//                       disabled={!webhookTurnOnAI || isActive}
//                       className={`flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${(!webhookTurnOnAI || isActive) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
//                     >
//                       <Power className="w-4 h-4" />
//                       Ligar IA
//                     </button>
//                     <button
//                       onClick={() => handleStatusChange(false)}
//                       disabled={!webhookTurnOffAI || !isActive}
//                       className={`flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${(!webhookTurnOffAI || !isActive) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
//                     >
//                       <Power className="w-4 h-4" />
//                       Desligar IA
//                     </button>
//                   </div>
//                 </div>

//                 <div className="relative group flex-1 bg-gray-50 dark:bg-dark-900 rounded-lg p-6 border border-gray-100 dark:border-dark-700">
//                   {!webhookFile && (
//                     <div className="hidden group-hover:block">
//                       {renderWebhookWarning('Configure o webhook de Arquivo nas configurações')}
//                     </div>
//                   )}
//                   <div className={`h-full ${!webhookFile ? 'cursor-not-allowed' : ''}`}>
//                     <DocumentUploadButton webhook={webhookFile} />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Coluna 2: Configurações Avançadas */}
//             <div className="space-y-6">
//               <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-dark-700">
//                 <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
//                   Configuração do prompt
//                 </h2>
//                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
//                   Escreva o que o agente deve saber sobre sua empresa (Área de risco)
//                 </p>
//                 <div className="space-y-4">
//                   <div className="relative group">
//                     {!webhookPrompt && (
//                       <div className="hidden group-hover:block">
//                         {renderWebhookWarning('Configure o webhook do Prompt nas configurações')}
//                       </div>
//                     )}
//                     <div className={!webhookPrompt ? 'cursor-not-allowed' : ''}>
//                       <div className="relative">
//                         <textarea
//                           value={prompt}
//                           onChange={(e) => setPrompt(e.target.value)}
//                           rows={6}
//                           className={`w-full px-4 py-3 bg-gray-100/50 dark:bg-dark-700/50 rounded-lg text-gray-900 dark:text-white focus:outline-none resize-none border border-transparent focus:border-[#7f00ff] transition-colors ${!webhookPrompt ? 'cursor-not-allowed opacity-75' : ''}`}
//                           placeholder="Digite as instruções para o agente..."
//                           disabled={!webhookPrompt}
//                         />
//                       </div>
//                       <button
//                         onClick={handlePromptSubmit}
//                         disabled={!webhookPrompt || !prompt.trim()}
//                         className={`mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${(!webhookPrompt || !prompt.trim()) ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
//                       >
//                         <Bot className="w-4 h-4" />
//                         Enviar Prompt
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-dark-700">
//                 <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
//                   Gerenciamento de memória
//                 </h2>
//                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
//                   Digite um número abaixo ou deixe vazio para deletar tudo
//                 </p>
//                 <div className="space-y-4">
//                   <div className="relative group">
//                     {!webhookMemory && (
//                       <div className="hidden group-hover:block">
//                         {renderWebhookWarning('Configure o webhook de Memória nas configurações')}
//                       </div>
//                     )}
//                     <Input
//                       type="number"
//                       value={memoryCount}
//                       onChange={(e) => setMemoryCount(e.target.value)}
//                       placeholder="Exemplo: 5599000000000"
//                       disabled={!webhookMemory}
//                       className={!webhookMemory ? 'cursor-not-allowed opacity-75' : ''}
//                     />
//                   </div>
//                   <div className="relative group">
//                     {!webhookMemory && (
//                       <div className="hidden group-hover:block">
//                         {renderWebhookWarning('Configure o webhook de Memória nas configurações')}
//                       </div>
//                     )}
//                     <button
//                       onClick={() => webhookMemory && setIsDeleteModalOpen(true)}
//                       className={`w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${!webhookMemory ? 'opacity-75 cursor-not-allowed' : ''}`}
//                     >
//                       <Trash2 className="w-4 h-4" />
//                       Deletar Memória
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal de Confirmação de Deleção */}
//       {isDeleteModalOpen && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-dark-700">
//             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//               Confirmar Deleção de Memória
//             </h3>
//             <p className="text-gray-600 dark:text-gray-300 mb-6">
//               {memoryCount
//                 ? `Você está prestes a deletar ${memoryCount} memórias do agente.`
//                 : 'Você está prestes a deletar toda a memória do agente.'}
//               Esta ação não pode ser desfeita.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setIsDeleteModalOpen(false)}
//                 className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
//               >
//                 Cancelar
//               </button>
//               <button
//                 onClick={handleDeleteMemory}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
//               >
//                 Confirmar Deleção
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }