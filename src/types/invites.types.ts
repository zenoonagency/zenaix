export interface InputAddTeamMemberDTO {
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
}

export interface InputAcceptInvitationDTO {
  token: string;
}

export interface OutputInvitation {
  id: string;
  email: string;
  organization_id: string;
  inviter_id: string;
  role_assigned: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AcceptInvitationResponse {
  invitationId: string;
  organization_id: string;
  user_id: string;
  newRole: string;
  accessToken: string;
}
