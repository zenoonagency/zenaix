import React from 'react';
import { X, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contract } from '../types';
import { formatCurrency } from '../../../utils/formatters';
import { CustomFieldsDisplay } from '../../../components/CustomFieldsDisplay';

interface ContractDetailModalProps {
  contract: Contract;
  onClose: () => void;
}

const statusColors = {
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Draft: 'bg-gray-100 text-gray-800 dark:bg-dark-700 dark:text-dark-400',
};

const statusLabels = {
  Active: 'Ativo',
  Pending: 'Pendente',
  Draft: 'Rascunho',
};

export function ContractDetailModal({ contract, onClose }: ContractDetailModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = contract.file;
    link.download = `${contract.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-dark-800 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100">
              {contract.title}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[contract.status]}`}>
              {statusLabels[contract.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {contract.description && (
            <div className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-dark-400 mb-2">
                Descrição
              </h3>
              <p className="text-gray-900 dark:text-dark-100">{contract.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-dark-400 mb-2">
                <User className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Cliente</h3>
              </div>
              <p className="text-gray-900 dark:text-dark-100">{contract.clientName}</p>
            </div>

            <div className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-dark-400 mb-2">
                <DollarSign className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Valor</h3>
              </div>
              <p className="text-gray-900 dark:text-dark-100">{formatCurrency(contract.value)}</p>
            </div>

            <div className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-dark-400 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Data de Expiração</h3>
              </div>
              <p className="text-gray-900 dark:text-dark-100">
                {format(new Date(contract.expirationDate), "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-dark-400 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Arquivo</h3>
              </div>
              <button
                onClick={handleDownload}
                className="text-[#7f00ff] hover:text-[#7f00ff]/80 text-sm font-medium"
              >
                Download PDF
              </button>
            </div>
          </div>

          {contract.customFields && Object.keys(contract.customFields).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Campos Personalizados
              </h3>
              <CustomFieldsDisplay fields={contract.customFields} />
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Histórico de Versões
            </h3>
            <div className="space-y-2">
              {contract.versions.map((version) => (
                <div
                  key={version.id}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  <p>
                    {format(new Date(version.timestamp), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500">
                    {version.changes} por {version.modifiedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}