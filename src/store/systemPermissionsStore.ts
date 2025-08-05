import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIError } from "../services/errors/api.errors";
import { permissionsService } from "../services/permission/permissions.service";
import { OutputPermissionDTO } from "../types/team.types";
import { cleanUserData } from "../utils/dataOwnership";

interface SystemPermissionsState {
  systemPermissions: any[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  cleanUserData: () => void;
  fetchAllSystemPermissions: (token: string) => Promise<void>;
}

export const useSystemPermissionsStore = create<SystemPermissionsState>()(
  persist(
    (set, get) => ({
      systemPermissions: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchAllSystemPermissions: async (token: string) => {
        if (get().isLoading) return;

        if (get().systemPermissions.length === 0) {
          set({ isLoading: true });
        }

        try {
          const fetchedPermissions = await permissionsService.listAllSystem(
            token
          );
          set({
            systemPermissions: fetchedPermissions,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Não foi possível carregar as permissões do sistema.";
          set({ error: errorMessage, isLoading: false });
        }
      },
      cleanUserData: () => {
        set({
          systemPermissions: [],
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },
    }),
    {
      name: "system-permissions-store",
      partialize: (state) => ({
        systemPermissions: state.systemPermissions,
      }),
    }
  )
);
