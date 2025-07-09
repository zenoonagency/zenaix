import React from 'react';
import { Bot } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface AIControlButtonProps {
  isActive: boolean;
  onStatusChange: (status: boolean) => void;
  webhook: string;
}

export function AIControlButton({ isActive, onStatusChange, webhook }: AIControlButtonProps) {
  const { showToast } = useToast();

  const triggerWebhook = async (action: 'liga' | 'desliga') => {
    if (!webhook) {
      showToast('Por favor, insira o webhook do agente.', 'error');
      return;
    }

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Falha ao disparar webhook');
      
      showToast(`Webhook ${action} disparado com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao disparar webhook:', error);
      showToast('Erro ao disparar webhook.', 'error');
    }
  };

  const handleStartAI = async () => {
    try {
      await triggerWebhook('liga');
      onStatusChange(true);
    } catch (error) {
      console.error('Erro ao ativar IA:', error);
    }
  };

  const handleStopAI = async () => {
    try {
      await triggerWebhook('desliga');
      onStatusChange(false);
    } catch (error) {
      console.error('Erro ao desativar IA:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center">
        <Bot className="w-6 h-6 text-[#7f00ff] mr-3" />
        <span className="font-medium text-gray-700 dark:text-gray-300">Status da IA:</span>
        <span className={`ml-2 ${isActive ? 'text-green-600' : 'text-red-600'}`}>
          {isActive ? 'Ativa' : 'Inativa'}
        </span>
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleStartAI}
          disabled={!webhook}
          className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Ligar IA
        </button>
        <button
          onClick={handleStopAI}
          disabled={!webhook}
          className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Desligar IA
        </button>
      </div>
    </div>
  );
}