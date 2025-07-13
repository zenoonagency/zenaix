import { PlanOutput } from "./plan";

export interface InputCreateOrgAndSubscribeDTO {
  name: string;
  document: string;
  planId: string;
  extraBoards?: number;
  extraTeamMembers?: number;
  extraTriggers?: number;
}

export interface CreateOrgResponse {
  checkoutUrl: string;
}

export interface InputUpdateOrganizationDTO {
  name?: string;
}

export interface OrganizationOutput {
  id: string;
  name: string;
  document: string;
  masterUserId: string;
  planId: string;
  plan?: PlanOutput;
  subscriptionStatus: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  extraBoards: number;
  extraTeamMembers: number;
  extraTriggers: number;
  triggersUsedThisMonth: number;
  oneTimeTriggers: number;
  subscriptionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}
