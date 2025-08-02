import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Crown, ArrowRight } from "lucide-react";

interface OrganizationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizationRequiredModal({
  isOpen,
  onClose,
}: OrganizationRequiredModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const goToPlans = () => {
    onClose();
    navigate("/dashboard/plans");
  };

  return (
    <div className="modal-overlay z-[9999]">
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 w-full max-w-md shadow-xl m-4 border border-gray-200 dark:border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recurso Premium
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>

            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Acesso Restrito
            </h4>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Este recurso está disponível apenas para usuários com plano ativo.
              Para acessar todas as funcionalidades da plataforma, você precisa
              fazer parte de uma organização.
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                ✨ Desbloqueie recursos premium como:
              </p>
              <ul className="text-sm text-purple-600 dark:text-purple-400 mt-2 space-y-1">
                <li>• Gestão completa de funil de vendas</li>
                <li>• Controle financeiro avançado</li>
                <li>• Integração com WhatsApp</li>
                <li>• Relatórios e dashboards</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={goToPlans}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] font-medium"
          >
            <Crown className="w-4 h-4" />
            Conhecer Nossos Planos
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
          >
            Continuar Navegando
          </button>
        </div>
      </div>
    </div>
  );
}
