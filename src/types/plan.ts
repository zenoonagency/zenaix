export interface PlanInput {
  name: string;
  max_boards: number;
  max_team_members: number;
  max_triggers: number;
  max_contacts: number;
  price: number;
  stripe_price_id: string;
  description?: string;
}

export type PlanUpdate = Partial<PlanInput>;

export interface PlanOutput extends PlanInput {
  id: string;
  type: "BASE" | "ADD_ON" | "ONE_TIME";
  created_at: string;
  updated_at: string;
}

export interface PlanState {
  plans: PlanOutput[];
  basePlans: PlanOutput[];
  addOns: PlanOutput[];
  oneTime: PlanOutput[];
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
  fetchAllPlans: (token: string, forceRefresh?: boolean) => Promise<void>;
  getAddOnPrice: (
    addOnName: "Board Adicional" | "Membro Adicional" | "Disparo Adicional"
  ) => number;
}
