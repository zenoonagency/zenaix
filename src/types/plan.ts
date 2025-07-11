export interface PlanInput {
  name: string;
  maxBoards: number;
  maxTeamMembers: number;
  maxTriggers: number;
  maxContacts: number;
  price: number;
  pricePerYear?: number;
  stripePriceId: string;
  stripePriceIdPerYear?: string;
  description?: string;
}

export type PlanUpdate = Partial<PlanInput>;

export interface PlanOutput extends PlanInput {
  id: string;
  type: "BASE" | "ADD_ON" | "ONE_TIME";
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  status: number;
}
