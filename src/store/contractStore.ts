import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ContractOutput } from "../types/contract";
import { contractService } from "../services/contract/contract.service";
import { APIError } from "../services/errors/api.errors";

export interface ContractState {
  initialized: any;
  initialize(): any;
  contracts: ContractOutput[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  setContracts: (contracts: ContractOutput[]) => void;
  addContract: (contract: ContractOutput) => void;
  updateContract: (contract: ContractOutput) => void;
  deleteContract: (contractId: string) => void;
  fetchAllContracts: (token: string, organizationId: string) => Promise<void>;
}

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
