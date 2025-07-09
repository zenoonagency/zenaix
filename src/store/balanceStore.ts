import { create } from 'zustand';

interface BalanceState {
  currentBalance: number;
  lastUpdate: Date | null;
  isLoading: boolean;
  setCurrentBalance: (balance: number) => void;
  setLastUpdate: (date: Date) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  currentBalance: 0,
  lastUpdate: null,
  isLoading: false,
  setCurrentBalance: (balance) => set({ currentBalance: balance }),
  setLastUpdate: (date) => set({ lastUpdate: date }),
  setIsLoading: (loading) => set({ isLoading: loading }),
})); 