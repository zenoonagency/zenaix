import React, { useState } from 'react';
import { FileText, X, Eye } from 'lucide-react';
import { Contract } from '../../Contracts/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../utils/formatters';
import { PDFViewer } from '../../../components/PDFViewer';
import { DummyPDF } from '../../../components/DummyPDF';
import { isPdfUrl } from '../../../utils/pdfUtils';

interface ContractPreviewProps {
  contracts: Contract[];
}

export function ContractPreview({ contracts }: ContractPreviewProps) {
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  if (contracts.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No contracts available. Create your first contract!
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {contracts.map((contract) => (
          <div 
            key={contract.id} 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            onClick={() => contract.file && setViewingContract(contract)}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[#7f00ff]" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">{contract.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {contract.clientName} • {formatCurrency(contract.value)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Expires {format(new Date(contract.expirationDate), "d 'de' MMM", { locale: ptBR })}
              </div>
              {contract.file && (
                <Eye className="w-4 h-4 text-[#7f00ff]" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para visualização do PDF */}
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
            
            <div className="flex-1 overflow-hidden">
              {viewingContract.file && isPdfUrl(viewingContract.file) ? (
                <PDFViewer 
                  fileUrl={viewingContract.file}
                  height="calc(100vh - 200px)"
                  className="rounded-md w-full"
                  showControls={true}
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