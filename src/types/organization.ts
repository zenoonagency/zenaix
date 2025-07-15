import { PlanOutput } from "./plan";

export interface InputCreateOrgAndSubscribeDTO {
  name: string;
  document: string;
  plan_id: string;
  extra_boards?: number;
  extra_team_members?: number;
  extra_triggers?: number;
}

export interface CreateOrgResponse {
  checkout_url: string;
}

export interface InputUpdateOrganizationDTO {
  name?: string;
}

export interface OrganizationOutput {
  id: string;
  name: string;
  document: string;
  master_user_id: string;
  plan_id: string;
  plan?: PlanOutput;
  subscription_status: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  extra_boards: number;
  extra_team_members: number;
  extra_triggers: number;
  one_time_triggers: number;
  triggers_used_this_month: number;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}
