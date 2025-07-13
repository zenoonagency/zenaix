import { persist } from "zustand/middleware";
import { User, AuthState, AuthSuccessPayload } from "../types/auth";
import { userService } from "../services/user/user.service";
import { OrganizationOutput } from "../types/organization";
import { createWithEqualityFn } from "zustand/traditional";
import { createClient } from "@supabase/supabase-js";
import { API_CONFIG } from "../config/api.config";

const supabase = createClient(
  API_CONFIG.supabaseUrl,
  API_CONFIG.supabaseAnonKey
);

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      realtimeChannel: null,
      _hasHydrated: false,

      connectToRealtime: () => {
        const { token, user, realtimeChannel, fetchAndSyncUser } = get();

        if (realtimeChannel || !token || !user) {
          return;
        }

        supabase.realtime.setAuth(token);

        const channel = supabase
          .channel("db-user-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Organization",
            },
            (payload) => {
              console.log(
                "✅ Evento na tabela Organization recebido:",
                payload
              );
              fetchAndSyncUser();
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log(
                "✅ Conectado e inscrito para ouvir mudanças na organização!"
              );
            }
          });

        set({ realtimeChannel: channel });
      },
      disconnectFromRealtime: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          console.log("Desconectando do canal Realtime...");
          supabase.removeChannel(realtimeChannel);
          set({ realtimeChannel: null });
        }
      },

      login: (payload: AuthSuccessPayload) => {
        get().disconnectFromRealtime();
        set({
          isAuthenticated: true,
          user: payload.user,
          token: payload.token,
          organization: payload.user.organization || null,
        });
        get().connectToRealtime();
      },

      setToken: (newToken: string) => {
        set({ token: newToken });
      },

      logout: () => {
        get().disconnectFromRealtime();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
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
          });
        }
      },

      setOrganization: (organizationData: OrganizationOutput) => {
        set({ organization: organizationData });
      },

      fetchAndSyncUser: async () => {
        const { logout, token, updateUser } = get();

        if (!token) {
          logout();
          return;
        }

        try {
          const user = await userService.getMe(token);

          updateUser(user);
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
