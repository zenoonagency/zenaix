export type TeamMemberRole = "MASTER" | "ADMIN" | "TEAM_MEMBER";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: TeamMemberRole;
  organization_id: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

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
