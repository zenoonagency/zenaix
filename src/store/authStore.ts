import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "@supabase/supabase-js";
import { User, AuthState } from "../types/auth"; // Seus tipos customizados
import { OrganizationOutput } from "../types/organization";
import { supabase } from "../lib/supabaseClient";
import { userService } from "../services/user/user.service";
import { organizationService } from "../services/oganization/organization.service";
import { handleSupabaseError } from "../utils/supabaseErrorTranslator";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      permissions: [],
      _hasHydrated: false,
      _isLoggingOut: false,

      setSession: (session: Session) => {
        const currentUser = get().user;
        const supabaseUser = session.user;

        if (!supabaseUser) return;

        console.log(
          "[AuthStore] setSession chamado com token:",
          session.access_token ? "presente" : "ausente"
        );

        if (currentUser && currentUser.id !== supabaseUser.id) {
          // Remover tudo de cleanAllUserDataStores e o array stores, pois não são mais necessários com o novo logout seguro.
        }

        // Criar usuário básico apenas com dados do Supabase (sem organização)
        const basicUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || "Usuário",
          first_name: supabaseUser.user_metadata?.first_name,
          last_name: supabaseUser.user_metadata?.last_name,
          role: supabaseUser.user_metadata?.role || "TEAM_MEMBER",
          organization_id: supabaseUser.user_metadata?.organization_id,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          language: supabaseUser.user_metadata?.language || "pt-BR",
          timezone: supabaseUser.user_metadata?.timezone || "America/Sao_Paulo",
          created_at:
            supabaseUser.user_metadata?.created_at || supabaseUser.created_at,
          updated_at:
            supabaseUser.user_metadata?.updated_at ||
            supabaseUser.updated_at ||
            supabaseUser.created_at,
          email_verified: supabaseUser.user_metadata?.email_verified || false,
          permissions: [],
        };

        // Se já temos dados completos no localStorage, usar eles
        const existingUser = get().user;
        const existingOrganization = get().organization;
        const existingPermissions = get().permissions;

        if (
          existingUser &&
          existingOrganization &&
          existingPermissions.length > 0
        ) {
          console.log("[AuthStore] Usando dados existentes do localStorage");
          set({
            isAuthenticated: true,
            token: session.access_token,
            user: existingUser,
            organization: existingOrganization,
            permissions: existingPermissions,
          });
        } else {
          console.log(
            "[AuthStore] Dados incompletos, definindo usuário básico"
          );
          set({
            isAuthenticated: false, // Só fica true após getMe
            token: session.access_token,
            user: basicUser,
            organization: null,
            permissions: [],
          });
        }
      },

      updateToken: (newToken: string) => {
        set({ token: newToken });
      },

      fetchAndSetDeepUserData: async () => {
        const { token, user, organization, permissions } = get();
        if (!token) return;

        // Se já temos dados completos, fazer fetch em segundo plano
        if (user && organization && permissions.length > 0) {
          console.log(
            "[AuthStore] Dados já existem, fazendo fetch em segundo plano"
          );

          userService
            .getMe(token)
            .then((fullUserPayload) => {
              const { organization: newOrg, ...userWithoutOrganization } =
                fullUserPayload as any;

              set({
                user: userWithoutOrganization,
                organization: newOrg,
                permissions: fullUserPayload.permissions || [],
              });

              console.log("[AuthStore] Dados atualizados em segundo plano");
            })
            .catch((error) => {
              console.warn(
                "[AuthStore] Erro ao atualizar dados em segundo plano:",
                error
              );
            });

          return;
        }

        // Se não temos dados completos, fazer fetch síncrono
        try {
          console.log(
            "[AuthStore] Buscando dados completos do usuário via getMe"
          );
          const fullUserPayload = await userService.getMe(token);

          // Extrair a organização do payload do usuário (getMe retorna user + organization)
          const { organization: newOrg, ...userWithoutOrganization } =
            fullUserPayload as any;

          // Sempre atualizar com dados completos do servidor
          set({
            user: userWithoutOrganization,
            organization: newOrg,
            permissions: fullUserPayload.permissions || [],
          });

          console.log(
            "[AuthStore] Dados completos atualizados no localStorage"
          );
        } catch (error) {
          console.error("Falha ao buscar dados completos do usuário:", error);
          get().logout();
        }
      },

      logout: async () => {
        set({ _isLoggingOut: true });

        // 1. Desconectar do Supabase
        await supabase.auth.signOut();

        // 2. Limpar estado da store
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
          plan: null,
        });

        // 3. Limpar stores persistidas explicitamente
        localStorage.removeItem("dashboard-store");
        // (adicione outras chaves de stores persistidas se necessário)

        // 4. Limpar TODO o localStorage do app
        localStorage.clear();

        // 5. Redirecionar para login e garantir memória limpa
        window.location.href = "/login";
      },

      setUserDataFromMe: (meData) => {
        set({
          user: meData,
          organization: meData.organization,
          permissions: meData.permissions,
          plan: meData.plan,
          isAuthenticated: true, // Só aqui fica true!
        });
      },
      clearAuth: () => set({ user: null, organization: null, permissions: [], plan: null }),

      setOrganization: (organizationData: OrganizationOutput) => {
        set({ organization: organizationData });
      },

      // Função utilitária para verificar se está fazendo logout
      isLoggingOut: () => {
        return get()._isLoggingOut;
      },

      // Função para verificar permissões
      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => {
          if (!state.user) return {};

          const updatedUser = { ...state.user, ...userData };

          return {
            user: updatedUser,
          };
        });
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
        }
      },
    }
  )
);
