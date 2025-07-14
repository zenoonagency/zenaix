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
      organization: null,
      permissions: [],
      realtimeChannel: null,
      _hasHydrated: false,
      isSyncingUser: false,

      hasPermission: (permission: Permission): boolean => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      login: (payload: AuthSuccessPayload) => {
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

          console.log(newUser);

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

      connectToOrgChanges: () => {
        const { token, user, realtimeChannel } = get();
        if (realtimeChannel || !token || !user?.organization_id) return;

        const channel = supabase
          .channel(`organization-${user.organization_id}`)
          // --- 2. REMOVA O <OrganizationOutput> DAQUI ---
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "Organization",
              filter: `"id"=eq.${user.organization_id}`,
            },
            // --- 3. APLIQUE O TIPO DIRETAMENTE NO PAYLOAD ---
            (payload: RealtimePostgresUpdatePayload<OrganizationOutput>) => {
              console.log(
                "✅ Evento de UPDATE na Organização recebido:",
                payload.new
              );
              // Agora 'payload.new' está corretamente tipado como OrganizationOutput
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
