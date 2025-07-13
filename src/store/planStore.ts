import { create } from "zustand";
import { persist } from "zustand/middleware"; // 1. Importe o 'persist'
import { PlanOutput, PlanState } from "../types/plan";
import { planService } from "../services/plan/plan.service";

const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      basePlans: [],
      addOns: [],
      oneTime: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchAllPlans: async (token: string) => {
        const { plans, isLoading, lastFetched } = get();

        const now = Date.now();
        if (
          lastFetched &&
          now - lastFetched < CACHE_DURATION &&
          plans.length > 0
        ) {
          console.log("A usar planos do cache.");
          return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const fetchedPlans = await planService.findAll(token);

          const basePlans = fetchedPlans.filter((p) => p.type === "BASE");
          const addOns = fetchedPlans.filter((p) => p.type === "ADD_ON");
          const oneTime = fetchedPlans.filter((p) => p.type === "ONE_TIME");

          set({
            basePlans,
            addOns,
            oneTime,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err) {
          console.error("Erro ao buscar planos:", err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Não foi possível carregar os planos.";
          set({ error: errorMessage, isLoading: false });
        }
      },

      getAddOnPrice: (addOnName) => {
        const addOn = get().addOns.find((p) => p.name === addOnName);
        return addOn?.price ?? 0;
      },
    }),
    {
      name: "plan-catalog-storage",
      partialize: (state) => ({
        basePlans: state.basePlans,
        addOns: state.addOns,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
