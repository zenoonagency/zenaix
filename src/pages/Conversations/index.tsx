import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export function Conversations() {
  // Estados para controlar o carregamento e erros
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOpenExternal, setShowOpenExternal] = useState(false);
  const { showToast } = useToast();
  
  // URL do Chatwoot
  const chatwootUrl = 'https://chatwoot-chatwoot.mgmxhs.easypanel.host';
  // Montar a URL completa para a interface completa do Chatwoot
  const chatwootEmbedUrl = `${chatwootUrl}/app/`;
  
  // Configurar um timeout para detectar problemas de carregamento
  useEffect(() => {
    if (isLoading) {
      // Se demorar mais de 10 segundos para carregar, mostrar opção de abrir em nova janela
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setShowOpenExternal(true);
        }
      }, 10000);
      
      // Se demorar mais de 30 segundos para carregar, mostrar erro
      const errorTimeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setError('O sistema de conversas está demorando muito para responder. Tente novamente mais tarde ou abra em uma nova janela.');
          showToast('Tempo limite excedido ao carregar o sistema de conversas', 'error');
        }
      }, 30000);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(errorTimeoutId);
      };
    }
  }, [isLoading, showToast]);
  
  // Simular login no Chatwoot (apenas log para debug)
  useEffect(() => {
    if (isLoading) {
      console.log('Preparando integração com Chatwoot...');
    }
    // Log para facilitar debug
    console.log('Integrando com Chatwoot');
  }, [isLoading]);
  
  // Garantir que o iframe ocupe a altura total disponível
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Função para tratar o evento de carregamento do iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
    setShowOpenExternal(false);
    showToast('Sistema de conversas carregado com sucesso', 'success');
  };
  
  // Função para tratar erros no iframe
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Não foi possível carregar o Chatwoot. Verifique sua conexão de internet.');
    showToast('Erro ao carregar sistema de conversas', 'error');
  };
  
  // Função para abrir o Chatwoot em uma nova aba
  const openInNewTab = () => {
    window.open(chatwootEmbedUrl, '_blank', 'noopener,noreferrer');
    showToast('Abrindo sistema de conversas em nova aba', 'info');
  };
  
  // Se houver um erro, mostrar mensagem de erro
  if (error) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-white dark:bg-dark-800 rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Erro ao carregar sistema de conversas
        </h3>
        <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {error}
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </button>
          <button 
            onClick={openInNewTab}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir em nova janela
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex overflow-hidden bg-white dark:bg-dark-800 rounded-lg shadow-lg p-0 relative">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-dark-800 z-10">
          <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Carregando Chatwoot
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Preparando seu ambiente de conversas...
          </p>
          
          {showOpenExternal && (
            <button 
              onClick={openInNewTab}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em nova janela
            </button>
          )}
        </div>
      )}
      
      <iframe 
        src={chatwootEmbedUrl}
        title="Chatwoot Inbox"
        className="w-full h-full border-none"
        allow="camera; microphone; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-storage-access-by-user-activation"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
} 