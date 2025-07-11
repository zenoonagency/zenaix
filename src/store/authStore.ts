import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  AuthState as UseAuthState,
  AuthSuccessPayload,
} from "../types/auth";
import { userService } from "../services/user/user.service";
import { OrganizationOutput } from "../types/organization";

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  organization: OrganizationOutput | null;
  login: (
    user: User,
    token: string,
    organization: OrganizationOutput | null
  ) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setOrganization: (organization: OrganizationOutput) => void;
}

export const useAuthStore = create<UseAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,

      login: (payload: AuthSuccessPayload) => {
        console.log("Login payload:", payload);
        set({
          isAuthenticated: true,
          user: payload.user,
          token: payload.token,
          organization: payload.organization,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null, // Limpa a organização no logout
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
        try {
          const { user, organization } = await userService.getMe();
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

      onRehydrateStorage: () => (state) => {
        if (state) {
          const { isAuthenticated, user, token } = state;
          if (isAuthenticated && (!user || !token)) {
            console.warn("Auth state corrupted. Clearing state.");
            state.logout();
          }
        }
      },
    }
  )
);
