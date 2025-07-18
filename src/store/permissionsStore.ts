import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIError } from "../services/errors/api.errors";
import { permissionsService } from "../services/permission/permissions.service";
import {
  OutputPermissionDTO,
  GrantPermissionsDTO,
  RevokePermissionsDTO,
} from "../types/team.types";

interface PermissionsState {
  permissions: OutputPermissionDTO[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  setPermissions: (permissions: OutputPermissionDTO[]) => void;
  fetchPermissions: (
    token: string,
    organizationId: string,
    memberId: string
  ) => Promise<void>;
  grantPermissions: (
    token: string,
    organizationId: string,
    memberId: string,
    data: GrantPermissionsDTO
  ) => Promise<void>;
  revokePermissions: (
    token: string,
    organizationId: string,
    memberId: string,
    data: RevokePermissionsDTO
  ) => Promise<void>;
}

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      permissions: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      setPermissions: (permissions) => set({ permissions }),

      fetchPermissions: async (token, organizationId, memberId) => {
        set({ isLoading: true, error: null });
        try {
          const fetchedPermissions = await permissionsService.list(
            token,
            organizationId,
            memberId
          );
          set({
            permissions: fetchedPermissions,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Não foi possível carregar as permissões.";
          set({ error: errorMessage, isLoading: false });
        }
      },

      grantPermissions: async (token, organizationId, memberId, data) => {
        try {
          await permissionsService.grant(token, organizationId, memberId, data);
        } catch (err: any) {
          set({ error: err.message || "Erro ao conceder permissões." });
          throw err;
        }
      },

      revokePermissions: async (token, organizationId, memberId, data) => {
        try {
          await permissionsService.revoke(
            token,
            organizationId,
            memberId,
            data
          );
        } catch (err: any) {
          set({ error: err.message || "Erro ao revogar permissões." });
          throw err;
        }
      },
    }),
    {
      name: "permissions-store",
      partialize: (state) => ({
        permissions: state.permissions,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
