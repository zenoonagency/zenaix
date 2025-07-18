import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIError } from "../services/errors/api.errors";
import {
  InputAcceptInvitationDTO,
  InputAddTeamMemberDTO,
  OutputInvitation,
} from "../types/invites.types";
import { inviteService } from "../services/invite/invite.service";

interface TeamInviteState {
  invites: OutputInvitation[];
  isLoadingInvites: boolean;
  inviteError: string | null;
  lastFetchedInvites: number | null;

  setInvites: (invites: OutputInvitation[]) => void;
  addInvite: (invite: OutputInvitation) => void;
  updateInvite: (invite: OutputInvitation) => void;
  deleteInvite: (inviteId: string) => void;
  fetchAllInvites: (token: string, organizationId: string) => Promise<void>;
  sendInvite: (
    token: string,
    organizationId: string,
    data: InputAddTeamMemberDTO
  ) => Promise<void>;
  revokeInvite: (
    token: string,
    organizationId: string,
    inviteId: string
  ) => Promise<void>;
  acceptInvite: (
    token: string,
    data: InputAcceptInvitationDTO
  ) => Promise<void>;
}

export const useInviteStore = create<TeamInviteState>()(
  persist(
    (set, get) => ({
      invites: [],
      isLoadingInvites: false,
      inviteError: null,
      lastFetchedInvites: null,

      setInvites: (invites) => set({ invites }),

      addInvite: (invite) =>
        set((state) => ({
          invites: state.invites.some((i) => i.id === invite.id)
            ? state.invites
            : [...state.invites, invite],
        })),

      updateInvite: (invite) =>
        set((state) => ({
          invites: state.invites.map((i) => (i.id === invite.id ? invite : i)),
        })),

      deleteInvite: (inviteId) =>
        set((state) => ({
          invites: state.invites.filter((i) => i.id !== inviteId),
        })),

      fetchAllInvites: async (token, organizationId) => {
        const { isLoadingInvites } = get();
        if (isLoadingInvites) return;

        if (get().invites.length === 0) {
          set({ isLoadingInvites: true });
        }

        try {
          const fetchedInvites = await inviteService.findAll(
            token,
            organizationId
          );
          set({
            invites: fetchedInvites,
            isLoadingInvites: false,
            lastFetchedInvites: Date.now(),
            inviteError: null,
          });
        } catch (err: any) {
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Não foi possível carregar os convites.";
          set({ inviteError: errorMessage, isLoadingInvites: false });
        }
      },
      sendInvite: async (token, organizationId, data) => {
        try {
          await inviteService.sendInvite(token, organizationId, data);
        } catch (err: any) {
          set({ inviteError: err.message || "Erro ao enviar convite." });
          throw err;
        }
      },

      revokeInvite: async (token, organizationId, inviteId) => {
        try {
          await inviteService.revoke(token, organizationId, inviteId);
        } catch (err: any) {
          set({ inviteError: err.message || "Erro ao revogar convite." });
          throw err;
        }
      },

      acceptInvite: async (token, data) => {
        try {
          await inviteService.acceptInvite(token, data);
        } catch (err: any) {
          set({ inviteError: err.message || "Erro ao aceitar convite." });
          throw err;
        }
      },
    }),
    {
      name: "team-storage",
      partialize: (state) => ({
        invites: state.invites,
        lastFetchedInvites: state.lastFetchedInvites,
      }),
    }
  )
);
