import { useEffect, useCallback, useRef } from 'react';
import { useBalanceStore } from '../store/balanceStore';

export function useBalanceUpdate() {
  const { setCurrentBalance, setLastUpdate, setIsLoading } = useBalanceStore();
  const intervalRef = useRef<NodeJS.Timeout>();

  const updateBalance = useCallback(async () => {
    // Aqui você pode implementar sua própria lógica de atualização de saldo
    // Por enquanto, vamos apenas simular um saldo
    const mockBalance = 1000;
    setCurrentBalance(mockBalance);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    // Atualiza imediatamente ao montar o componente
    updateBalance();

    // Configura o intervalo para atualizar a cada 30 minutos (1800000 ms)
    intervalRef.current = setInterval(updateBalance, 1800000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateBalance]);

  return { updateBalance };
} 