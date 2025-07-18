import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APIError } from "../services/errors/api.errors";
import { teamService } from "../services/team/team.service";
import { TeamMember, InputUpdateTeamMemberRoleDTO } from "../types/team.types";

interface TeamMembersState {
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  setMembers: (members: TeamMember[]) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (member: TeamMember) => void;
  removeMember: (memberId: string) => void;

  fetchAllMembers: (token: string, organizationId: string) => Promise<void>;

  updateMemberRole: (
    token: string,
    organizationId: string,
    memberId: string,
    data: InputUpdateTeamMemberRoleDTO
  ) => Promise<void>;
  removeMemberFromOrg: (
    token: string,
    organizationId: string,
    memberId: string
  ) => Promise<void>;
}

export const useTeamMembersStore = create<TeamMembersState>()(
  persist(
    (set, get) => ({
      members: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      setMembers: (members) => set({ members }),

      addMember: (member) =>
        set((state) => ({
          members: state.members.some((m) => m.id === member.id)
            ? state.members
            : [...state.members, member],
        })),

      updateMember: (member) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === member.id ? member : m)),
        })),

      removeMember: (memberId) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== memberId),
        })),

      fetchAllMembers: async (token, organizationId) => {
        if (get().isLoading) return;
        if (get().members.length === 0) {
          set({ isLoading: true });
        }
        try {
          const fetchedMembers = await teamService.findAll(
            token,
            organizationId
          );
          set({
            members: fetchedMembers,
            isLoading: false,
            lastFetched: Date.now(),
            error: null,
          });
        } catch (err: any) {
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Não foi possível carregar os membros.";
          set({ error: errorMessage, isLoading: false });
        }
      },

      updateMemberRole: async (token, organizationId, memberId, data) => {
        try {
          await teamService.updateRole(token, organizationId, memberId, data);
        } catch (err: any) {
          set({ error: err.message || "Erro ao atualizar papel do membro." });
          throw err;
        }
      },
      removeMemberFromOrg: async (token, organizationId, memberId) => {
        try {
          await teamService.remove(token, organizationId, memberId);
        } catch (err: any) {
          set({ error: err.message || "Erro ao remover membro." });
          throw err;
        }
      },
    }),
    {
      name: "team-members-store",
      partialize: (state) => ({
        members: state.members,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
