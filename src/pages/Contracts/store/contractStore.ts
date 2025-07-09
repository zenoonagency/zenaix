import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contract } from '../types';
import { generateId } from '../../../utils/generateId';

// Removido o PDF de exemplo que estava sendo usado em vez do arquivo do usuário
// const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

interface ContractState {
  contracts: Contract[];
  searchQuery: string;
  addContract: (contract: Omit<Contract, 'id' | 'versions' | 'lastModified'>) => void;
  updateContract: (contract: Contract) => void;
  deleteContract: (id: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useContractStore = create<ContractState>()(
  persist(
    (set) => ({
      contracts: [],
      searchQuery: '',

      addContract: (contractData) =>
        set((state) => ({
          contracts: [...state.contracts, {
            ...contractData,
            id: generateId(),
            lastModified: new Date().toISOString(),
            // Usar o arquivo fornecido pelo usuário em vez do exemplo
            file: contractData.file || '',
            versions: [{
              id: generateId(),
              timestamp: new Date().toISOString(),
              modifiedBy: 'Current User',
              changes: 'Initial contract creation'
            }]
          }],
        })),

      updateContract: (updatedContract) =>
        set((state) => ({
          contracts: state.contracts.map((contract) =>
            contract.id === updatedContract.id ? updatedContract : contract
          ),
        })),

      deleteContract: (id) =>
        set((state) => ({
          contracts: state.contracts.filter((contract) => contract.id !== id),
        })),

      setSearchQuery: (query) =>
        set({
          searchQuery: query,
        }),
    }),
    {
      name: 'contract-store',
    }
  )
);