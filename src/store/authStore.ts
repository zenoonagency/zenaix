
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (user: User, token: string) => {
        console.log('AuthStore - Login:', { user, token });
        set({
          isAuthenticated: true,
          user,
          token,
        });
        console.log('AuthStore - Estado após login:', get());
      },
      logout: () => {
        console.log('AuthStore - Logout');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
        console.log('AuthStore - Estado após logout:', get());
      },
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: 'auth-status',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('AuthStore - Rehydrated state:', state);
      },
    }
  )
);