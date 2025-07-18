import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIError } from "../services/errors/api.errors";
import { permissionsService } from "../services/permission/permissions.service";
import { OutputPermissionDTO } from "../types/team.types";

interface SystemPermissionsState {
  systemPermissions: OutputPermissionDTO[];
  isLoading: boolean;
  error: string | null;
  fetchAllSystemPermissions: (token: string) => Promise<void>;
}

export const useSystemPermissionsStore = create<SystemPermissionsState>()(
  persist(
    (set, get) => ({
      systemPermissions: [],
      isLoading: false,
      error: null,

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
    }),
    {
      name: "system-permissions-store",
      partialize: (state) => ({
        systemPermissions: state.systemPermissions,
      }),
    }
  )
);
