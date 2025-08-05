import { User } from "./auth";

export type TeamMemberRole = "MASTER" | "ADMIN" | "TEAM_MEMBER";

export interface TeamMember extends User {}

export interface InputUpdateTeamMemberRoleDTO {
  role: "ADMIN" | "TEAM_MEMBER";
}

export interface OutputPermissionDTO {
  name: string;
}

export interface GrantPermissionsDTO {
  permission_names: string[];
}

export interface RevokePermissionsDTO {
  permission_names: string[];
}

export interface TeamMembersState {
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
  cleanUserData: () => void;
}
