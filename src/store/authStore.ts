import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "@supabase/supabase-js";
import { User, AuthState } from "../types/auth"; // Seus tipos customizados
import { OrganizationOutput } from "../types/organization";
import { supabase } from "../lib/supabaseClient";
import { userService } from "../services/user/user.service";

// A função para limpar as outras stores (continua a mesma)
const cleanAllUserDataStores = () => {
  // ... sua lógica de limpeza ...
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      permissions: [],
      _hasHydrated: false,

      setSession: (session: Session) => {
        const currentUser = get().user;
        const supabaseUser = session.user;

        if (!supabaseUser) return;

        if (currentUser && currentUser.id !== supabaseUser.id) {
          cleanAllUserDataStores();
        }

        // Extrair organização diretamente dos metadados do usuário
        const organizationFromMetadata = supabaseUser.user_metadata?.organization;
        
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || 'Usuário',
          role: supabaseUser.user_metadata?.role || 'TEAM_MEMBER',
          organization_id: supabaseUser.user_metadata?.organization_id,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          
          organization: organizationFromMetadata || null,
          
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at || supabaseUser.created_at,
          permissions: [], 
        };
        
        set({
          isAuthenticated: true,
          token: session.access_token,
          user: mappedUser,
          organization: organizationFromMetadata || null,
        });

        console.log("[AuthStore] Sessão definida:", {
          hasOrganization: !!organizationFromMetadata,
          organization: organizationFromMetadata
        });

        // Só buscar dados adicionais se não tivermos a organização completa
        if (!organizationFromMetadata) {
          get().fetchAndSetDeepUserData();
        }
      },

      fetchAndSetDeepUserData: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const fullUserPayload = await userService.getMe(token);

          set({
            user: fullUserPayload,
            organization: fullUserPayload.organization,
            permissions: fullUserPayload.permissions,
          });

        } catch (error) {
          console.error("Falha ao buscar dados completos do usuário:", error);
          get().logout();
        }
      },

      logout: () => {
        supabase.auth.signOut();
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
        });
        cleanAllUserDataStores();
      },
      
      setOrganization: (organizationData: OrganizationOutput) => {
        set({ organization: organizationData });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        organization: state.organization,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          console.log("[AuthStore] Estado reidratado:", {
            isAuthenticated: state.isAuthenticated,
            hasUser: !!state.user,
            hasOrganization: !!state.organization,
            organization: state.organization
          });
        }
      },
    }
  )
);  