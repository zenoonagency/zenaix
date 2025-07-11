import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { planService } from "../../services/plan/plan.service";
import { Check } from "lucide-react";

export function SubscriptionTab() {
  const organization = useAuthStore((state) => state.organization);
  const token = useAuthStore((state) => state.token);
  // Não precisa mais de useEffect/fetch para buscar o plano
  // const [plan, setPlan] = useState<any>(null);
  // useEffect(() => { ... });

  // Novo: usar o plano direto da organização
  const plan = organization?.plan;
  const [showExtrasInfo, setShowExtrasInfo] = useState(false);

  // Cálculo do valor total (plano + adicionais)
  const extrasTotal =
    ((organization?.extraBoards || 0) +
      (organization?.extraTeamMembers || 0) +
      (organization?.extraTriggers || 0)) *
    (plan?.pricePerExtra || 0);
  const total =
    (plan?.price || 0) +
    (organization?.extraBoards || 0) * (plan?.pricePerExtraBoard || 0) +
    (organization?.extraTeamMembers || 0) * (plan?.pricePerExtraMember || 0) +
    (organization?.extraTriggers || 0) * (plan?.pricePerExtraTrigger || 0);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="border-2 border-purple-400 rounded-2xl p-8 bg-white dark:bg-dark-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-[#7f00ff]">
            {plan?.name || "Plano"}
          </h2>
          {plan?.tag && (
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
              {plan.tag}
            </span>
          )}
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              organization?.subscriptionStatus === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {organization?.subscriptionStatus === "ACTIVE"
              ? "Ativo"
              : "Inativo"}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {plan?.description}
        </p>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
          <span className="text-base font-medium text-gray-500">/mês</span>
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {plan?.includedLicenses && (
            <span>
              {plan.includedLicenses} licença
              {plan.includedLicenses > 1 ? "s" : ""} incluída
              {plan.includedLicenses > 1 ? "s" : ""}
            </span>
          )}
          {plan?.includedLicenses && (
            <span className="ml-2">
              Licenças adicionais disponíveis no checkout
            </span>
          )}
        </div>
        <ul className="space-y-2 mb-4">
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Até {plan?.maxContacts} contatos
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Até {plan?.maxTriggers} disparos por mês
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Até {plan?.maxBoards} Kanbans
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            {plan?.support || "Suporte 24/7 por whatsapp"}
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Controle financeiro e contratual
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            CRM avançado
          </li>
        </ul>
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <span>
            Quadros Kanban adicionais: <b>{organization?.extraBoards}</b>
          </span>
          <span>
            Membros adicionais: <b>{organization?.extraTeamMembers}</b>
          </span>
          <span>
            Disparos adicionais: <b>{organization?.extraTriggers}</b>
          </span>
          <button
            type="button"
            onClick={() => setShowExtrasInfo(true)}
            className="text-[#7f00ff] underline text-xs font-medium"
          >
            + adicionais
          </button>
        </div>
        {showExtrasInfo && (
          <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-gray-700 dark:text-gray-200">
            <b>Adicionais:</b> São recursos extras contratados além do limite do
            seu plano principal. <br />
            <b>Quadros Kanban adicionais:</b> Permite criar mais quadros além do
            limite do plano.
            <br />
            <b>Membros adicionais:</b> Permite adicionar mais membros à equipe
            além do limite do plano.
            <br />
            <b>Disparos adicionais:</b> Permite realizar mais
            automações/disparos além do limite do plano.
            <br />
            <button
              type="button"
              onClick={() => setShowExtrasInfo(false)}
              className="mt-2 text-[#7f00ff] underline"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
