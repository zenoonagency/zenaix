import React from 'react';
import { FileText } from 'lucide-react';

interface DummyPDFProps {
  message?: string;
  height?: string;
  width?: string;
  className?: string;
}

/**
 * Componente para exibir um espaço reservado quando não há PDF para mostrar
 */
export function DummyPDF({
  message = 'Documento PDF não disponível',
  height = '600px',
  width = '100%',
  className = ''
}: DummyPDFProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-gray-200 dark:border-dark-700 rounded-lg ${className}`}
      style={{ height, width }}
    >
      <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs px-6">
        {message}
      </p>
    </div>
  );
} 