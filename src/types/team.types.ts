import { User } from "./auth";

export type TeamMemberRole = "MASTER" | "ADMIN" | "TEAM_MEMBER";

export interface TeamMember extends User {
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
