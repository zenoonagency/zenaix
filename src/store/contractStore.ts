import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ContractOutput, ContractState } from "../types/contract";
import { contractService } from "../services/contract/contract.service";
import { APIError } from "../services/errors/api.errors";

const CACHE_DURATION = 60 * 60 * 1000;

export const useContractStore = create<ContractState>()(
  persist(
    (set, get) => ({
      contracts: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      setContracts: (contracts) => set({ contracts }),

      addContract: (newContract) =>
        set((state) => ({
          contracts: [...state.contracts, newContract],
        })),

      updateContract: (updatedContract) =>
        set((state) => ({
          contracts: state.contracts.map((contract) =>
            contract.id === updatedContract.id ? updatedContract : contract
          ),
        })),

      deleteContract: (contractId) =>
        set((state) => ({
          contracts: state.contracts.filter(
            (contract) => contract.id !== contractId
          ),
        })),

      fetchAllContracts: async (token: string, organizationId: string) => {
        const { contracts, isLoading } = get();

        if (contracts.length === 0) {
          set({ isLoading: true });
        }

        if (isLoading) return;
        try {
          const fetchedContracts = await contractService.findAll(
            token,
            organizationId
          );
          set({
            contracts: fetchedContracts,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          console.error("ContractStore: Error fetching contracts:", err);
          const errorMessage =
            err instanceof APIError ? err.message : "Failed to load contracts.";
          set({ error: errorMessage, isLoading: false });
        }
      },
      cleanUserData: () => {
        set({
          contracts: [],
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },
    }),
    {
      name: "contract-store",
      partialize: (state) => ({
        contracts: state.contracts,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
