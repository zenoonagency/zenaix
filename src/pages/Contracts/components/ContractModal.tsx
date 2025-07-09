import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Contract, ContractStatus } from '../types';
import { generateId } from '../../../utils/generateId';
import { PDFViewer } from '../../../components/PDFViewer';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Omit<Contract, 'id' | 'versions' | 'lastModified'>) => void;
  contract?: Contract;
  mode: 'add' | 'edit';
}

export function ContractModal({ isOpen, onClose, onSave, contract, mode }: ContractModalProps) {
  const [title, setTitle] = useState(contract?.title || '');
  const [description, setDescription] = useState(contract?.description || '');
  const [clientName, setClientName] = useState(contract?.clientName || '');
  const [status, setStatus] = useState<ContractStatus>(contract?.status || 'Draft');
  const [value, setValue] = useState(contract?.value?.toString() || '');
  const [expirationDate, setExpirationDate] = useState(
    contract?.expirationDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let fileUrl = contract?.file || '';
    
    if (file) {
      // Verificar se o arquivo é realmente um PDF
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione um arquivo PDF válido.');
        return;
      }
      
      try {
        // Convert file to base64 for storage
        const reader = new FileReader();
        fileUrl = await new Promise((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log("Arquivo convertido para base64:", result.substring(0, 50) + "...");
            resolve(result);
          };
          reader.onerror = () => {
            console.error("Erro ao ler o arquivo");
            alert('Ocorreu um erro ao processar o arquivo. Tente novamente.');
            resolve('');
          };
          reader.readAsDataURL(file);
        });
        
        if (!fileUrl) {
          alert('Ocorreu um erro ao processar o arquivo. Tente novamente.');
          return;
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        alert('Ocorreu um erro ao processar o arquivo. Tente novamente.');
        return;
      }
    }
    
    onSave({
      title,
      description,
      clientName,
      status,
      value: parseFloat(value) || 0,
      expirationDate,
      file: fileUrl,
      customFields: {},
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'add' ? 'Novo Contrato' : 'Editar Contrato'}
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
            <input
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
            <textarea
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
            <input
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
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContractStatus)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
              required
            >
              <option value="Draft">Rascunho</option>
              <option value="Pending">Pendente</option>
              <option value="Active">Ativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor
            </label>
            <input
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
            <input
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
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile && selectedFile.type !== 'application/pdf') {
                      alert('Por favor, selecione um arquivo PDF válido.');
                      e.target.value = '';
                      return;
                    }
                    setFile(selectedFile || null);
                  }}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 cursor-pointer"
                >
                  Escolher arquivo
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {file ? file.name : 'Nenhum arquivo escolhido'}
                </span>
              </div>
              
              {contract?.file && !file && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Arquivo atual: {contract.title}.pdf
                  </p>
                  
                  {/* Prévia do PDF atual */}
                  <div className="h-32 border border-gray-200 dark:border-dark-600 rounded-md overflow-hidden">
                    <PDFViewer 
                      fileUrl={contract.file}
                      height="100%"
                      showControls={false}
                    />
                  </div>
                </div>
              )}
            </div>
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
              className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors"
            >
              {mode === 'add' ? 'Criar Contrato' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}