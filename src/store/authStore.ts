import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "@supabase/supabase-js";
import { User, AuthState } from "../types/auth"; // Seus tipos customizados
import { OrganizationOutput } from "../types/organization";
import { supabase } from "../lib/supabaseClient";
import { userService } from "../services/user/user.service";
import { organizationService } from "../services/oganization/organization.service";
import { handleSupabaseError } from "../utils/supabaseErrorTranslator";

// Função para limpar todas as stores de dados do usuário
const cleanAllUserDataStores = () => {
  try {
    // Verificar se está fazendo logout para evitar chamadas desnecessárias
    const { isLoggingOut } = useAuthStore.getState();
    if (isLoggingOut()) {
      return;
    }

    const stores = [
      () =>
        import("./boardStore").then((m) => {
          try {
            m.useBoardStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar boardStore:", e);
          }
        }),
      () =>
        import("./cardStore").then((m) => {
          try {
            m.useCardStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar cardStore:", e);
          }
        }),
      () =>
        import("./listStore").then((m) => {
          try {
            m.useListStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar listStore:", e);
          }
        }),
      () =>
        import("./tagStore").then((m) => {
          try {
            m.useTagStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar tagStore:", e);
          }
        }),
      () =>
        import("./contractStore").then((m) => {
          try {
            m.useContractStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar contractStore:", e);
          }
        }),
      () =>
        import("./transactionStore").then((m) => {
          try {
            m.useTransactionStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar transactionStore:", e);
          }
        }),
      () =>
        import("./teamMembersStore").then((m) => {
          try {
            m.useTeamMembersStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar teamMembersStore:", e);
          }
        }),
      () =>
        import("./embedPagesStore").then((m) => {
          try {
            m.useEmbedPagesStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar embedPagesStore:", e);
          }
        }),
      () =>
        import("./whatsAppInstanceStore").then((m) => {
          try {
            m.useWhatsAppInstanceStore.getState().cleanUserData();
          } catch (e) {
            console.warn(
              "[AuthStore] Erro ao limpar whatsAppInstanceStore:",
              e
            );
          }
        }),
      () =>
        import("./inviteStore").then((m) => {
          try {
            m.useInviteStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar inviteStore:", e);
          }
        }),
      () =>
        import("./dashboardStore").then((m) => {
          try {
            m.useDashboardStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar dashboardStore:", e);
          }
        }),
      () =>
        import("./dashboardTransactionStore").then((m) => {
          try {
            m.useDashboardTransactionStore.getState().cleanUserData();
          } catch (e) {
            console.warn(
              "[AuthStore] Erro ao limpar dashboardTransactionStore:",
              e
            );
          }
        }),
      () =>
        import("./dataTablesStore").then((m) => {
          try {
            m.useDataTablesStore.getState().cleanUserData();
          } catch (e) {
            console.warn("[AuthStore] Erro ao limpar dataTablesStore:", e);
          }
        }),
      () =>
        import("./systemPermissionsStore").then((m) => {
          try {
            m.useSystemPermissionsStore.getState().cleanUserData();
          } catch (e) {
            console.warn(
              "[AuthStore] Erro ao limpar systemPermissionsStore:",
              e
            );
          }
        }),
    ];

    // Executar limpeza de forma assíncrona e silenciosa
    Promise.allSettled(stores.map((store) => store()));
  } catch (error) {
    // Silenciar erros de limpeza
  }
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
          cleanAllUserDataStores();
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
            isAuthenticated: true,
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

      logout: () => {
        // Marcar que está fazendo logout para evitar chamadas de API
        set({ _isLoggingOut: true });

        // Limpar dados primeiro para evitar erros durante o logout
        get().clearAuth();

        // Fazer logout do Supabase
        supabase.auth
          .signOut()
          .then(() => {
            set({ _isLoggingOut: false });
          })
          .catch((error) => {
            console.error(
              "[AuthStore] ❌ Erro no logout do Supabase:",
              handleSupabaseError(error, "Erro no logout")
            );
            set({ _isLoggingOut: false });
          });
      },

      clearAuth: () => {
        // Limpar estado primeiro
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
        });

        // Limpar outras stores de forma assíncrona
        setTimeout(() => {
          cleanAllUserDataStores();
        }, 0);
      },

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
