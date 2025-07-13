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

export interface PlanState {
  plans: PlanOutput[];
  basePlans: PlanOutput[];
  addOns: PlanOutput[];
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
  fetchAllPlans: (token: string) => Promise<void>;
  getAddOnPrice: (
    addOnName: "Board Adicional" | "Membro Adicional" | "Disparo Adicional"
  ) => number;
}
