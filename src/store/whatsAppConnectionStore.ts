import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ConnectionStatus = 'idle' | 'pending' | 'connected' | 'failed' | 'expired' | 'exists';

interface WhatsAppConnectionState {
  isConnected: boolean;
  phoneNumber: string;
  connectedAt: string | null;
  status: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  connect: (phoneNumber: string) => void;
  disconnect: () => void;
}

export const useWhatsAppConnectionStore = create<WhatsAppConnectionState>()(
  persist(
    (set) => ({
      isConnected: false,
      phoneNumber: '',
      connectedAt: null,
      status: 'idle',
      
      setConnectionStatus: (status: ConnectionStatus) => 
        set(() => ({
          status,
          isConnected: status === 'connected',
        })),
      
      connect: (phoneNumber: string) => 
        set(() => ({
          isConnected: true,
          phoneNumber,
          status: 'connected',
          connectedAt: new Date().toISOString(),
        })),
      
      disconnect: () => 
        set(() => ({
          isConnected: false,
          status: 'idle',
        })),
    }),
    {
      name: 'whatsapp-connection-store',
    }
  )
); 