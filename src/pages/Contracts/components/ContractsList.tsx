import React, { useState } from "react";
import { Eye, Download, FileText, Edit, Trash2, X } from "lucide-react";
import { ContractOutput } from "../../../types/contract";
import { ContractModal } from "./ContractModal";
import { PDFViewer } from "../../../components/PDFViewer";
import { DummyPDF } from "../../../components/DummyPDF";
import { formatCurrency } from "../../../utils/formatters";
import { useCustomModal } from "../../../components/CustomModal";
import { contractService } from "../../../services/contract/contract.service";
import { useAuthStore } from "../../../store/authStore";
import { FileText as FileTextIcon, FileImage } from "lucide-react";
import { formatContractExpirationDate } from "../../../utils/dateUtils";
import { useContractStore } from "../../../store/contractStore";

interface ContractsListProps {
  itensFiltrados?: ContractOutput[] | null;
}

export function ContractsList({ itensFiltrados }: ContractsListProps) {
  const [viewingContract, setViewingContract] = useState<ContractOutput | null>(
    null
  );
  const { customConfirm, modal: customModalElement } = useCustomModal();
  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
  }));
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );
  const { contracts } = useContractStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const contratosParaExibir =
    itensFiltrados !== null && itensFiltrados !== undefined
      ? itensFiltrados
      : contracts;

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      ACTIVE:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      DRAFT: "bg-gray-200 text-gray-900 dark:bg-gray-600/50 dark:text-gray-200",
    };
    const statusLabels: Record<string, string> = {
      ACTIVE: "Ativo",
      PENDING: "Pendente",
      DRAFT: "Rascunho",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusClasses[status] || ""
        }`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  function getFileIcon(fileName?: string) {
    if (!fileName) return <FileTextIcon className="h-6 w-6 text-gray-400" />;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileTextIcon className="h-6 w-6 text-red-500" />;
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext || ""))
      return <FileImage className="h-6 w-6 text-blue-400" />;
    return <FileTextIcon className="h-6 w-6 text-gray-400" />;
  }

  async function handleDownload(contract: ContractOutput) {
    if (!token || !organizationId || !contract.id) return;
    try {
      const url = await contractService.downloadFile(
        token,
        organizationId,
        contract.id
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = contract.pdf_file_name || "contrato.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Erro ao baixar arquivo.");
    }
  }

  async function handleViewContract(contract: ContractOutput) {
    setViewingContract(contract);
    setLoadingPdf(true);
    setPdfUrl(null);
    try {
      const pdfUrlResult = await contractService.downloadFile(
        token,
        organizationId,
        contract.id
      );
      setPdfUrl(pdfUrlResult);
    } catch (e) {
      alert("Erro ao carregar PDF");
    }
    setLoadingPdf(false);
  }

  const handleUpdateContract = async (
    updatedData: Partial<ContractOutput> & { file?: File }
  ) => {
    if (selectedContractId && token && organizationId) {
      try {
        const { file, ...rest } = updatedData;
        await contractService.update(
          token,
          organizationId,
          selectedContractId,
          rest
        );
        setSelectedContractId(null);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!token || !organizationId) return;
    const confirmed = await customConfirm(
      "Excluir contrato",
      "Tem certeza de que deseja excluir este contrato?"
    );
    if (confirmed) {
      setDeletingId(contractId);
      try {
        await contractService.delete(token, organizationId, contractId);
      } catch (error) {
        console.error("Erro ao excluir contrato", error);
      }
      setDeletingId(null);
    }
  };

  return (
    <>
      {customModalElement}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {contratosParaExibir.map((contract) => (
                <tr
                  key={contract.id}
                  className={`hover:bg-gray-50 dark:hover:bg-dark-700 ${
                    deletingId === contract.id
                      ? "opacity-80 pointer-events-none"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getFileIcon(contract.pdf_file_name)}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {contract.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {contract.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {contract.client_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatContractExpirationDate(contract.expiration_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(contract.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      {contract.pdf_file_name && (
                        <>
                          <button
                            onClick={() => handleViewContract(contract)}
                            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
                            title="Visualizar PDF"
                            disabled={loadingPdf}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(contract)}
                            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
                            title="Download"
                            disabled={loadingPdf}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedContractId(contract.id)}
                        className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContract(contract.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title="Excluir"
                        disabled={deletingId === contract.id}
                      >
                        {deletingId === contract.id ? (
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedContractId && (
        <ContractModal
          contractId={selectedContractId}
          isOpen={true}
          onClose={() => setSelectedContractId(null)}
          onSave={handleUpdateContract}
          mode="edit"
        />
      )}

      {viewingContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="w-full max-w-4xl bg-white dark:bg-dark-800 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {viewingContract.title}
              </h2>
              <button
                onClick={() => setViewingContract(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            {viewingContract.pdf_file_name && (
              <div className="flex items-center mb-4 space-x-2">
                {getFileIcon(viewingContract.pdf_file_name)}
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  {viewingContract.pdf_file_name}
                </span>
              </div>
            )}
            <div className="flex-1 overflow-hidden flex items-center justify-center">
              {loadingPdf ? (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7f00ff]"></div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    Carregando PDF...
                  </p>
                </div>
              ) : pdfUrl ? (
                <PDFViewer
                  fileUrl={pdfUrl}
                  height="calc(100vh - 200px)"
                  className="rounded-md w-full"
                  showControls={true}
                  contractId={viewingContract.id}
                  organizationId={organizationId}
                  onFileDeleted={() => {
                    setViewingContract(null);
                    setPdfUrl(null);
                    // Se quiser atualizar a lista, faça via estado aqui
                  }}
                />
              ) : (
                <DummyPDF
                  message="Este contrato não possui um arquivo PDF ou o arquivo não está em um formato válido."
                  height="calc(100vh - 200px)"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
