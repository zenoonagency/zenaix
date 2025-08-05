import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrganizationAccess } from "../hooks/useOrganizationAccess";
import { Crown, ArrowLeft } from "lucide-react";

interface OrganizationProtectedRouteProps {
  children: React.ReactNode;
}

export function OrganizationProtectedRoute({
  children,
}: OrganizationProtectedRouteProps) {
  const { checkAccess } = useOrganizationAccess();
  const navigate = useNavigate();
  const location = useLocation();

  const hasAccess = checkAccess(location.pathname);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-dark-700">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Acesso Restrito
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Esta página está disponível apenas para usuários com plano ativo.
            Para acessar todos os recursos da plataforma, você precisa fazer
            parte de uma organização.
          </p>

          {/* Features */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
              🚀 Recursos Premium Incluem:
            </h3>
            <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
              <li>• Gestão completa de funil de vendas</li>
              <li>• Controle financeiro detalhado</li>
              <li>• Integração com WhatsApp Business</li>
              <li>• Relatórios e dashboards avançados</li>
              <li>• Gestão de equipe e permissões</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard/plans")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] font-medium shadow-md"
            >
              <Crown className="w-4 h-4" />
              Ver Planos Disponíveis
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
