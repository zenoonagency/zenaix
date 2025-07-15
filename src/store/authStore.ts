import { persist } from "zustand/middleware";
import { User, AuthState, AuthSuccessPayload } from "../types/auth";
import { userService } from "../services/user/user.service";
import { OrganizationOutput } from "../types/organization";
import { createWithEqualityFn } from "zustand/traditional";
import { Permission } from "../config/permissions";
import { supabase } from "../lib/supabaseClient";

import { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      organization: null,
      permissions: [],
      realtimeChannel: null,
      _hasHydrated: false,
      isSyncingUser: false,
      orgRealtimeChannel: null,
      userRealtimeChannel: null,

      hasPermission: (permission: Permission): boolean => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      login: async (payload: AuthSuccessPayload) => {
        console.log("---------------------PAYLOAD=------");
        console.log(payload);
        const { data, error } = await supabase.auth.setSession({
          access_token: payload.token,
          refresh_token: payload.token,
        });

        supabase.realtime.setAuth(payload.token);

        if (error) {
          console.error(
            "[AuthStore] ❌ ERRO ao definir a sessão do Supabase:",
            error
          );
        } else {
          console.log(
            "[AuthStore] ✅ Sessão do cliente Supabase definida COM SUCESSO. Dados da sessão:",
            data.session
          );
        }

        set({
          isAuthenticated: true,
          user: payload.user,
          token: payload.token,
          permissions: payload.permissions || [],
          organization: payload.user.organization || null,
        });
      },

      setToken: (newToken: string) => {
        set({ token: newToken });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const newUser = { ...currentUser, ...userData };

          set({
            user: newUser,
            organization: newUser.organization || get().organization,
            permissions: Array.isArray(newUser.permissions)
              ? newUser.permissions
              : get().permissions,
          });
        }
      },

      setOrganization: (organizationData: OrganizationOutput) => {
        set({ organization: organizationData });
      },

      fetchAndSyncUser: async (): Promise<User | null> => {
        const { logout, token, updateUser, isSyncingUser } = get();

        if (!token) {
          logout();
          return null;
        }

        if (isSyncingUser) return get().user;
        set({ isSyncingUser: true });
        try {
          const user = await userService.getMe(token);
          updateUser(user);
          return user;
        } catch (error) {
          if (
            error.name === "AbortError" ||
            (error instanceof TypeError && error.message === "Failed to fetch")
          ) {
            console.warn(
              "AuthStore: Sincronização cancelada pelo cliente. Operação ignorada."
            );
            return;
          }

          console.error(
            "Falha ao sincronizar dados do utilizador, a fazer logout:",
            error
          );
          logout();
          return null;
        } finally {
          set({ isSyncingUser: false });
        }
      },

      connectToUserChanges: (userId: string) => {
        if (get().userRealtimeChannel) return;

        console.log(
          `[AuthStore] 📢 Conectando ao Realtime do Utilizador ${userId}...`
        );
        const channel = supabase
          .channel(`user-${userId}`)
          .on<User>(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "User",
              filter: `id=eq.${userId}`,
            },
            (payload) => {
              console.log(
                "📢 Evento de UPDATE no Utilizador recebido!",
                payload
              );
              // Atualiza a store com os novos dados do utilizador, o que irá disparar outros efeitos
              get().updateUser(payload.new);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log(
                `[AuthStore] ✅ Inscrito com sucesso no canal do utilizador!`
              );
            }
          });
        set({ userRealtimeChannel: channel });
      },

      disconnectFromUserChanges: () => {
        const { userRealtimeChannel } = get();
        if (userRealtimeChannel) {
          supabase.removeChannel(userRealtimeChannel);
          set({ userRealtimeChannel: null });
        }
      },
      connectToOrgChanges: () => {
        const { token, user, realtimeChannel } = get();
        if (realtimeChannel || !token || !user?.organization_id) return;

        const channel = supabase
          .channel(`organization-${user.organization_id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "Organization",
              // filter: `id=eq.${user.organization_id}`,
            },
            (payload: RealtimePostgresUpdatePayload<OrganizationOutput>) => {
              set({ organization: payload.new });
            }
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              console.log(
                `[AuthStore] ✅ Inscrito com sucesso no canal da organização!`
              );
            }
            if (status === "CHANNEL_ERROR") {
              console.error(
                `[AuthStore] ❌ Erro ao conectar no canal da organização:`,
                err
              );
            }
          });
        set({ realtimeChannel: channel });
      },
      disconnectFromOrgChanges: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          set({ realtimeChannel: null });
        }
      },
    }),
    {
      name: "auth-status",
      partialize: (state) => {
        const userForStorage = state.user
          ? { ...state.user, organization: undefined }
          : null;

        return {
          isAuthenticated: state.isAuthenticated,
          user: userForStorage,
          token: state.token,
          organization: state.organization,
          permissions: state.permissions,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          const { isAuthenticated, user, token } = state;
          if (isAuthenticated && (!user || !token)) {
            console.warn("Auth state corrupted. Clearing state.", state);
            state.logout();
          }
        }
      },
    }
  )
);
