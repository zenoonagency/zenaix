import React from 'react';

export function Connections() {
  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Conexões
        </h1>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Hello World - Página de Conexões
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Esta é a página de conexões. Aqui você poderá gerenciar suas integrações e conexões com outras plataformas.
          </p>
        </div>
      </div>
    </div>
  );
} 