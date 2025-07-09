import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const [fetchTimes, setFetchTimes] = useState<number[]>([]);

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Mostrar mensagem por 3 segundos quando a conexão voltar
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true); // Manter mensagem visível enquanto offline
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar qualidade da conexão a cada 20 segundos
  useEffect(() => {
    if (!isOnline) return;

    const checkConnectionSpeed = async () => {
      const startTime = Date.now();
      try {
        // Fazer uma requisição simples para verificar velocidade
        await fetch('https://www.google.com/favicon.ico', { 
          mode: 'no-cors',
          cache: 'no-store'
        });
        const endTime = Date.now();
        const fetchTime = endTime - startTime;
        
        // Manter um histórico das últimas 3 verificações
        setFetchTimes(prev => {
          const newTimes = [...prev, fetchTime].slice(-3);
          
          // Se a média dos últimos tempos for maior que 1000ms (1 segundo)
          // considerar conexão lenta
          const avgTime = newTimes.reduce((sum, time) => sum + time, 0) / newTimes.length;
          setSlowConnection(avgTime > 1000);
          
          return newTimes;
        });
      } catch (error) {
        // Erro ao verificar - possível problema de conexão
        console.log("Erro ao verificar conexão", error);
      }
    };

    // Verificar imediatamente e depois a cada 20 segundos
    checkConnectionSpeed();
    const interval = setInterval(checkConnectionSpeed, 20000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Se está online e não há mensagem ou problema de conexão, não mostrar nada
  if (isOnline && !showMessage && !slowConnection) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      !isOnline
        ? 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200'
        : slowConnection
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200'
          : 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff size={20} />
          <span>Você está offline. Verifique sua conexão.</span>
        </>
      ) : slowConnection ? (
        <>
          <Wifi size={20} />
          <span>Conexão lenta detectada. O desempenho pode ser afetado.</span>
        </>
      ) : (
        <>
          <Wifi size={20} />
          <span>Conexão restabelecida.</span>
        </>
      )}
    </div>
  );
}; 