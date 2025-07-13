export type SlotType = "board" | "member" | "trigger";

export interface InputCreateSubscriptionDTO {
  planId: string;
  extraBoards?: number;
  extraTeamMembers?: number;
  extraTriggers?: number;
}

export interface InputChangePlanDTO {
  newPlanId: string;
}

export interface InputAddSlotsDTO {
  slotType: SlotType;
  quantity: number;
}

export interface InputRemoveSlotsDTO {
  slotType: SlotType;
  quantityToRemove: number;
}

export interface InputPurchaseOneTimeTriggersDTO {
  quantity: number;
  paymentMethodId: string;
}

export interface CreateSessionResponse {
  checkoutUrl: string;
}

export interface PortalSessionResponse {
  portalUrl: string;
}
