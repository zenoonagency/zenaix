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
        console.log(
          "[AuthStore] Session token received. User is NOT authenticated yet."
        );
        set({ token: session.access_token, isLoading: true });
      },

      updateUserDataSilently: (meData: User) => {
        console.log(
          "[AuthStore] User data received. Setting as AUTHENTICATED."
        );
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
        await supabase.auth.signOut();
        get().clearAuth();
        localStorage.clear(); 
        set({ _isLoggingOut: false });
        window.location.href = "/login";
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
