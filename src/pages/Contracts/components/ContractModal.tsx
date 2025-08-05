import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  ContractStatus,
  InputCreateContractDTO,
} from "../../../types/contract";
import { useAuthStore } from "../../../store/authStore";
import { contractService } from "../../../services/contract/contract.service";
import { useCustomModal } from "../../../components/CustomModal";
import { useContractStore } from "../../../store/contractStore";
import { useToast } from "../../../hooks/useToast";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: InputCreateContractDTO) => Promise<boolean>;
  contractId?: string;
  mode: "add" | "edit";
}

export function ContractModal({
  isOpen,
  onClose,
  onSave,
  contractId,
  mode,
}: ContractModalProps) {
  const contract = useContractStore((state) =>
    state.contracts.find((c) => c.id === contractId)
  );

  const [title, setTitle] = useState(contract?.title || "");
  const [description, setDescription] = useState(contract?.description || "");
  const [clientName, setClientName] = useState(contract?.client_name || "");
  const [status, setStatus] = useState<ContractStatus>(
    contract?.status || "DRAFT"
  );
  const [value, setValue] = useState(contract?.value?.toString() || "");
  const [expirationDate, setExpirationDate] = useState(
    contract?.expiration_date?.split("T")[0] ||
      new Date().toISOString().split("T")[0]
  );
  const [file, setFile] = useState<File | null>(null);
  const [selectFile, setSelectFile] = useState<File | null>(null);
  useEffect(() => {
    if (contract) {
      setTitle(contract.title || "");
      setDescription(contract.description || "");
      setClientName(contract.client_name || "");
      setStatus(contract.status || "DRAFT");
      setValue(contract.value?.toString() || "");
      setExpirationDate(
        contract.expiration_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0]
      );
      setFile(null);
      setSelectFile(null);
    }
  }, [contract]);
  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
  }));
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { customConfirm, modal: customModalElement } = useCustomModal();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await onSave({
      title,
      description,
      client_name: clientName,
      status,
      value: parseFloat(value) || 0,
      expiration_date: expirationDate,
      file: file || undefined,
    });
    setLoading(false);
    if (result === true) onClose();
  };

  if (!isOpen) return null;

  const handleRemoveFile = async () => {
    if (!token || !organizationId || !contract) return;
    const confirmed = await customConfirm(
      "Remover arquivo",
      "Tem certeza que deseja remover o arquivo deste contrato?"
    );
    if (!confirmed) return;
    try {
      const updatedContract = await contractService.deleteFile(
        token,
        organizationId,
        contract.id
      );
    } catch (err) {
      alert("Erro ao remover arquivo.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setSelectFile(selectedFile);
    if (selectedFile && selectedFile.type !== "application/pdf") {
      alert("Por favor, selecione um arquivo PDF válido.");
      e.target.value = "";
      return;
    }
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      alert("O arquivo deve ter no máximo 5MB.");
      e.target.value = "";
      return;
    }
    setFile(selectedFile || null);
    if (selectedFile && token && organizationId && contract) {
      setUploading(true);
      try {
        const updatedContract = await contractService.uploadFile(
          token,
          organizationId,
          contract.id,
          selectedFile
        );
        showToast("Arquivo enviado com sucesso!", "success");
      } catch (err) {
        alert("Erro ao fazer upload do arquivo.");
      }
      setUploading(false);
    }
  };

  // Adiciona função para remover arquivo selecionado antes de salvar
  const handleRemoveSelectedFile = () => {
    setFile(null);
    setSelectFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="modal-container bg-black/30">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {mode === "add" ? "Novo Contrato" : "Editar Contrato"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Cliente
            </label>
            <Input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContractStatus)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              required
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PENDING">Pendente</option>
              <option value="ACTIVE">Ativo</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor
            </label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Expiração
            </label>
            <Input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Arquivo PDF
            </label>
            {contract?.pdf_file_name && !file && (
              <div className="mb-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                Arquivo atual: {contract.pdf_file_name}{" "}
                <button
                  type="button"
                  className="flex items-center justify-center px-1 py-2 bg-red-100 dark:bg-red-900 text-red-600 hover:bg-red-200 dark:hover:bg-red-800 rounded-md  ml-1"
                  style={{ height: "10px" }}
                  title="Remover arquivo"
                  onClick={handleRemoveFile}
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="flex items-center my-3">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,application/pdf"
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="file-upload"
                className={`px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 flex items-center min-h-[40px] ${
                  uploading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50 dark:hover:bg-dark-600 cursor-pointer"
                }`}
                style={{
                  height: "40px",
                  pointerEvents: uploading ? "none" : undefined,
                }}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  "Escolher arquivo"
                )}
              </label>
            </div>
            {selectFile && (
              <div className="flex">
                {selectFile.name}{" "}
                <button
                  type="button"
                  className="flex items-center justify-center px-1 py-2  text-red-600   rounded-md  ml-1"
                  style={{ height: "10px" }}
                  title="Remover arquivo"
                  onClick={handleRemoveSelectedFile}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {customModalElement}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors flex items-center justify-center min-w-[140px]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === "add" ? "Criando..." : "Salvando..."}
                </>
              ) : (
                <>{mode === "add" ? "Criar Contrato" : "Salvar Alterações"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
