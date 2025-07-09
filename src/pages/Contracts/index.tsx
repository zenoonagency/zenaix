import React, { useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { ContractsList } from './components/ContractsList';
import { ContractModal } from './components/ContractModal';
import { useContractStore } from './store/contractStore';
import { Contract } from './types';
import { PageContainer } from '../../components/PageContainer';

export function Contracts() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { contracts, addContract } = useContractStore();

  const filteredContracts = contracts.filter((contract) =>
    contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContract = (contractData: Omit<Contract, 'id' | 'versions' | 'lastModified'>) => {
    addContract(contractData);
    setShowModal(false);
  };

  return (
    <PageContainer
      icon={<FileText className="w-5 h-5 text-purple-600" />}
      title="Contratos"
      subtitle="Gerencie todos os seus contratos"
      actionButton={
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo contrato
        </button>
      }
      search={
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-md leading-5 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                placeholder="Buscar contratos..."
              />
            </div>
          </div>
        </div>
      }
    >
      <ContractsList contracts={filteredContracts} />
      {showModal && (
        <ContractModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleAddContract}
          mode="add"
        />
      )}
    </PageContainer>
  );
}