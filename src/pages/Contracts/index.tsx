import { useEffect, useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { ContractsList } from "./components/ContractsList";
import { ContractModal } from "./components/ContractModal";
import { PageContainer } from "../../components/PageContainer";
import { useAuthStore } from "../../store/authStore";
import { contractService } from "../../services/contract/contract.service";
// import { useDebounce } from "../../hooks/useDebounce"; // Para futura implementação com backend
import { useContractStore } from "../../store/contractStore";

export function Contracts() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itensFiltrados, setItensFiltrados] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  // const debouncedSearch = useDebounce(searchQuery, 800); // Para futura implementação com backend
  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
  }));
  const { contracts } = useContractStore();

  useEffect(() => {
    // Busca local pela store (não precisa debounce)
    if (searchQuery.trim()) {
      setLoading(true);
      const filtered = contracts.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setItensFiltrados(filtered);
      setLoading(false);
    } else {
      setItensFiltrados(null);
      setLoading(false);
    }
    // Para futura implementação com backend, use debounce:
    // useEffect(() => {
    //   if (debouncedSearch.trim()) {
    //     setLoading(true);
    //     // chamada à API
    //     setLoading(false);
    //   }
    // }, [debouncedSearch, ...]);
  }, [searchQuery, contracts]);

  const handleAddContract = async (contractData: any) => {
    if (!token || !organizationId) return;
    try {
      const { file, ...rest } = contractData;
      const newContract = await contractService.create(
        token,
        organizationId,
        rest
      );
      let contractWithFile = newContract;
      if (file) {
        contractWithFile = await contractService.uploadFile(
          token,
          organizationId,
          newContract.id,
          file
        );
      }
      return true;
    } catch (error) {
      alert("Erro ao criar contrato.");
      console.error(error);
      return false;
    }
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
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-dark-600 rounded-md leading-5 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                placeholder="Buscar contratos..."
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => setSearchQuery("")}
                  tabIndex={-1}
                  type="button"
                  aria-label="Limpar busca"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <span className="text-gray-500 dark:text-gray-300">
            Carregando contratos...
          </span>
        </div>
      ) : itensFiltrados && itensFiltrados.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <span className="text-gray-500 dark:text-gray-300">
            Nenhum contrato encontrado para sua busca.
          </span>
        </div>
      ) : (
        <ContractsList itensFiltrados={itensFiltrados} />
      )}
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
