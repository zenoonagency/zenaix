import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  name: string;
  photo: string;
  plan: string;
  phoneNumber: string;
  setUserData: (data: { name: string; photo: string; plan: string; phoneNumber?: string }) => void;
}

export const useUser = create<UserStore>()(
  persist(
    (set) => ({
      name: 'Usuário',
      photo: '',
      plan: 'Plano Básico',
      phoneNumber: '',
      setUserData: (data) => set(data),
    }),
    {
      name: 'user-store', // nome único para o armazenamento
    }
  )
); 