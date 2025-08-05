import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "@supabase/supabase-js";
import { User, AuthState } from "../types/auth";
import { OrganizationOutput } from "../types/organization";
import { supabase } from "../lib/supabaseClient";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      permissions: [],
      plan: null,
      _hasHydrated: false,
      _isLoggingOut: false,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setSession: (session: Session) => {
        set({ token: session.access_token, isLoading: true });
      },

      updateUserDataSilently: (meData: User) => {
        const { organization, permissions, ...userData } = meData;
        set((state) => ({
          isAuthenticated: true,
          isLoading: false,
          user: {
            ...(state.user as User),
            ...userData,
          },
          organization: organization
            ? { ...(state.organization as OrganizationOutput), ...organization }
            : state.organization,
          permissions: permissions || state.permissions,
        }));
      },

      logout: async () => {
        if (get()._isLoggingOut) return;
        set({ _isLoggingOut: true });

        try {
          get().clearAuth();
          localStorage.clear();

          await supabase.auth.signOut();
        } catch (e) {
          console.error("[AuthStore] Erro ao fazer signOut do Supabase:", e);
        } finally {
          set({ _isLoggingOut: false });
          window.location.href = "/login";
        }
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
          plan: null,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => {
          if (!state.user) return {};
          return { user: { ...state.user, ...userData } };
        });
      },

      // Funções que não mudam
      updateToken: (newToken: string) => set({ token: newToken }),
      setOrganization: (organizationData: OrganizationOutput) =>
        set({ organization: organizationData }),
      hasPermission: (permission: string) =>
        get().permissions.includes(permission),
      isLoggingOut: () => get()._isLoggingOut,

      // Função para sincronizar dados do usuário
      fetchAndSyncUser: async () => {
        try {
          const token = get().token;
          if (!token) return;
          const userData = await (
            await import("../services/user/user.service")
          ).userService.getMe(token);
          get().updateUserDataSilently(userData);
        } catch (error) {
          console.error(
            "[AuthStore] Erro ao sincronizar dados do usuário:",
            error
          );
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        organization: state.organization,
        permissions: state.permissions,
        plan: state.plan,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
