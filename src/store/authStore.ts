import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthState, AuthSuccessPayload } from "../types/auth";
import { userService } from "../services/user/user.service";
import { OrganizationOutput } from "../types/organization";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      _hasHydrated: false,

      login: (payload: AuthSuccessPayload) => {
        set({
          isAuthenticated: true,
          user: payload.user,
          token: payload.token,
          organization: payload.user.organization || null,
        });
      },

      logout: () => {
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
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setOrganization: (organizationData: OrganizationOutput) => {
        set({ organization: organizationData });
      },

      fetchAndSyncUser: async () => {
        const token = get().token;
        if (!token) {
          get().logout();
          return;
        }

        try {
          const { user, organization } = await userService.getMe(token);
          set({ user, organization, isAuthenticated: true });
        } catch (error) {
          console.error(
            "Falha ao sincronizar dados do utilizador, a fazer logout:",
            error
          );
          get().logout();
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
