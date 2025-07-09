import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { WebhookResponseViewer } from '../pages/Conversations/components/WebhookResponseViewer';

interface WebhookDebugButtonProps {
  data: string;
  className?: string;
  buttonText?: string;
  iconOnly?: boolean;
}

/**
 * Botão para visualizar dados brutos de webhook 
 * Útil para depuração e visualização de conteúdo base64
 */
export function WebhookDebugButton({ 
  data, 
  className = '',
  buttonText = 'Ver dados originais',
  iconOnly = false
}: WebhookDebugButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Se não houver dados, não renderizar o botão
  if (!data || data.length < 20) return null;
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline ${className}`}
      >
        <Eye className="w-3 h-3 mr-1" />
        {!iconOnly && buttonText}
      </button>
      
      <WebhookResponseViewer
        data={data}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
} 