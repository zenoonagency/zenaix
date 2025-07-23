import { persist } from "zustand/middleware";
import { User, AuthState, AuthSuccessPayload } from "../types/auth";
import { userService } from "../services/user/user.service";
import { authService } from "../services/authService";
import { OrganizationOutput } from "../types/organization";
import { createWithEqualityFn } from "zustand/traditional";
import { Permission } from "../config/permissions";
import { supabase } from "../lib/supabaseClient";
import { cleanUserData } from "../utils/dataOwnership";
import { useBoardStore } from "./boardStore";
import { useTransactionStore } from "./transactionStore";
import { useCalendarStore } from "./calendarStore";
import { useCardStore } from "./cardStore";
import { useContactsStore } from "../pages/Contacts/store/contactsStore";
import { useListStore } from "./listStore";
import { useContractStore } from "./contractStore";
import { useTeamMembersStore } from "./teamMembersStore";
import { useTagStore } from "./tagStore";
import { useEmbedPagesStore } from "./embedPagesStore";
import { useInviteStore } from "./inviteStore";
import { useDataTablesStore } from "./dataTablesStore";
import { useDashboardTransactionStore } from "./dashboardTransactionStore";
import { usePermissionsStore } from "./permissionsStore";
import { useSystemPermissionsStore } from "./systemPermissionsStore";
import { useDashboardStore } from "./dashboardStore";

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      permissions: [],
      _hasHydrated: false,
      isSyncingUser: false,

      hasPermission: (permission: Permission): boolean => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      login: async (payload: AuthSuccessPayload) => {
        const currentUser = get().user;
        const newUser = payload.user;

        const isDifferentUser = !currentUser || currentUser.id !== newUser.id;

        if (isDifferentUser) {
          console.log(
            "[AuthStore] 🧹 Usuário diferente detectado, limpando dados das stores"
          );
          useBoardStore.getState().cleanUserData();
          useTransactionStore.getState().cleanUserData();
          useCalendarStore.getState().cleanUserData();
          useCardStore.getState().cleanUserData();
          useContactsStore.getState().cleanUserData();
          useListStore.getState().cleanUserData();
          useContractStore.getState().cleanUserData();
          useTeamMembersStore.getState().cleanUserData();
          useTagStore.getState().cleanUserData();
          useEmbedPagesStore.getState().cleanUserData();
          useInviteStore.getState().cleanUserData();
          useDataTablesStore.getState().cleanUserData();
          useDashboardTransactionStore.getState().cleanUserData();
          usePermissionsStore.getState().cleanUserData();
          useSystemPermissionsStore.getState().cleanUserData();
          useDashboardStore.getState().cleanUserData();
        } else {
          console.log(
            "[AuthStore] ✅ Mesmo usuário, mantendo dados das stores"
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

      setSession: async (accessToken: string) => {
        set({ token: accessToken });
      },

      logout: () => {
        supabase.auth.signOut();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
        });
        // Limpa dados das principais stores
        useBoardStore.getState().cleanUserData();
        useTransactionStore.getState().cleanUserData();
        useCalendarStore.getState().cleanUserData();
        useCardStore.getState().cleanUserData();
        useContactsStore.getState().cleanUserData();
        useListStore.getState().cleanUserData();
        useContractStore.getState().cleanUserData();
        useTeamMembersStore.getState().cleanUserData();
        useTagStore.getState().cleanUserData();
        useEmbedPagesStore.getState().cleanUserData();
        useInviteStore.getState().cleanUserData();
        useDataTablesStore.getState().cleanUserData();
        useDashboardTransactionStore.getState().cleanUserData();
        usePermissionsStore.getState().cleanUserData();
        useSystemPermissionsStore.getState().cleanUserData();
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

      refreshToken: async (): Promise<boolean> => {
        try {
          const { token } = await authService.refreshToken();
          set({ token });
          return true;
        } catch (error) {
          console.error("Falha ao renovar token:", error);
          return false;
        }
      },

      fetchAndSyncUser: async (): Promise<User | null> => {
        const { logout, token, updateUser, isSyncingUser, refreshToken } =
          get();

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
            return get().user;
          }

          // Se for erro 401 (Unauthorized), tenta renovar o token
          if (
            error.response?.status === 401 ||
            error.message?.includes("401")
          ) {
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
              try {
                // Tenta novamente com o novo token
                const user = await userService.getMe(get().token!);
                updateUser(user);
                return user;
              } catch (retryError) {
                console.error("Falha mesmo após renovar token:", retryError);
                logout();
                return null;
              }
            }
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

      // Função para limpar dados das outras stores
      cleanAllStoresData: () => {
        // Importa as stores dinamicamente para evitar dependências circulares
        try {
          // Board Store
          const { useBoardStore } = require("./boardStore");
          const boardStore = useBoardStore.getState();
          if (boardStore.boards && boardStore.boards.length > 0) {
            const cleanedBoards = cleanUserData(boardStore.boards);
            boardStore.setBoards(cleanedBoards);
          }

          // Contacts Store
          const {
            useContactsStore,
          } = require("../pages/Contacts/store/contactsStore");
          const contactsStore = useContactsStore.getState();
          contactsStore.cleanUserData();

          // Transaction Store
          const { useTransactionStore } = require("./transactionStore");
          const transactionStore = useTransactionStore.getState();
          if (
            transactionStore.transactions &&
            transactionStore.transactions.length > 0
          ) {
            const cleanedTransactions = cleanUserData(
              transactionStore.transactions
            );
            transactionStore.setTransactions(cleanedTransactions);
          }

          console.log("Dados das stores limpos com sucesso");
        } catch (error) {
          console.error("Erro ao limpar dados das stores:", error);
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
