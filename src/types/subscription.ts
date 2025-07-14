export type SlotType = "board" | "member" | "trigger";

export interface InputCreateSubscriptionDTO {
  plan_id: string;
  extra_boards?: number;
  extra_team_members?: number;
  extra_triggers?: number;
}

export interface InputChangePlanDTO {
  new_plan_id: string;
}

export interface InputAddSlotsDTO {
  slot_type: SlotType;
  quantity: number;
}

export interface InputRemoveSlotsDTO {
  slot_type: SlotType;
  quantity_to_remove: number;
}

export interface InputPurchaseOneTimeTriggersDTO {
  quantity: number;
}

export interface CreateSessionResponse {
  checkout_url: string;
}

export interface PortalSessionResponse {
  portal_url: string;
}
