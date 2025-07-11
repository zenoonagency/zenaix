import React, { useEffect, useState } from "react";
import { PlanCard } from "./components/PlanCard";
import {
  CalendarDays,
  Calendar,
  Copy,
  ExternalLink,
  User,
  KanbanSquare,
  Zap,
} from "lucide-react";
import { Modal } from "../../components/Modal";
import { toast } from "react-toastify";
import { planService } from "../../services/plan/plan.service";
import { PlanOutput } from "../../types/plan";
import { useAuthStore } from "../../store/authStore";
import {
  organizationService,
  InputCreateOrgAndSubscribeDTO,
} from "../../services/oganization/organization.service";

export function Plans() {
  const [plans, setPlans] = useState<PlanOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("essential");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  // Adiciona estado para modal de organização e dados do formulário
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: "",
    document: "",
    extraTeamMembers: 0,
    extraBoards: 0,
    extraTriggers: 0,
  });
  const [orgLoading, setOrgLoading] = useState(false);

  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedPlans = await planService.findAll(token);
        setPlans(fetchedPlans);

        // Seleciona o primeiro plano BASE como padrão, se existir
        const firstBasePlan = fetchedPlans.find((plan) => plan.type === "BASE");
        if (firstBasePlan) setSelectedPlan(firstBasePlan.id);
      } catch (err) {
        console.error("Erro ao buscar planos:", err);
        setError("Não foi possível carregar os planos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filtrar ADD_ONs
  const addOns = plans.filter((p) => p.type === "ADD_ON");
  const memberAddOn = addOns.find((p) =>
    p.name.toLowerCase().includes("membro")
  );
  const boardAddOn = addOns.find((p) => p.name.toLowerCase().includes("board"));
  const triggerAddOn = addOns.find((p) =>
    p.name.toLowerCase().includes("disparo")
  );

  // Ao clicar em pagamento, abrir modal de organização
  const handlePayment = () => {
    setShowOrgModal(true);
  };

  // Função para criar organização e seguir para pagamento
  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgLoading(true);
    try {
      const data: InputCreateOrgAndSubscribeDTO = {
        name: orgForm.name,
        document: orgForm.document,
        planId: selectedPlan,
        extraBoards: orgForm.extraBoards,
        extraTeamMembers: orgForm.extraTeamMembers,
        extraTriggers: orgForm.extraTriggers,
      };
      const res = await organizationService.createOrganizationAndSubscribe(
        data,
        token
      );
      setShowOrgModal(false);
      setPaymentLink(res.data.checkoutUrl);
      setShowPaymentModal(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar organização");
    } finally {
      setOrgLoading(false);
    }
  };

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);

  // Loading visual
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <span className="ml-4 text-lg text-gray-700 dark:text-gray-200">
          Carregando planos...
        </span>
      </div>
    );
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-dark-700">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Gerenciamento de Planos
        </h1>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Seletor de Período */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-1 inline-flex shadow-sm">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <CalendarDays size={16} />
                Mensal
              </button>
              {/* Removido botão Anual */}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Coluna da esquerda - Planos */}
            <div className="w-full lg:w-2/3 space-y-3">
              {plans
                .filter((plan) => plan.type === "BASE")
                .map((plan) => (
                  <PlanCard
                    key={plan.id}
                    title={plan.name}
                    description={plan.description}
                    price={plan.price}
                    billingPeriod={billingPeriod}
                    features={[
                      `Até ${plan.maxContacts} contatos`,
                      "Disparo em massa padrão",
                      "Suporte 24/7 por whatsapp",
                      "Controle financeiro e contratual",
                      "CRM avançado",
                      `Até ${plan.maxBoards} Kanbans`,
                      `Até ${plan.maxTriggers} Disparos por mês`,
                    ]}
                    isPopular={true}
                    gradient={"from-purple-500 to-indigo-600"}
                    baseUsers={plan.maxTeamMembers}
                    isSelected={selectedPlan === plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                  />
                ))}
            </div>

            {/* Coluna da direita - Licenças */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-4">
                <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Resumo do plano
                  </h3>

                  {/* Seleção de Licenças - Substituído por texto informativo */}
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                      Licenças
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      1 licença incluída
                      <br />
                      Opção de licenças adicionais dentro do checkout
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Total {billingPeriod === "monthly" ? "mensal" : "anual"}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatPrice(
                          billingPeriod === "monthly"
                            ? selectedPlanData?.price || 0
                            : selectedPlanData?.pricePerYear || 0
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Botão */}
                  <button
                    onClick={handlePayment}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Seguir para pagamento
                  </button>

                  {/* Container dos Termos */}
                  <div className="bg-white dark:bg-dark-800 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Visualize nossos termos
                    </h4>
                    <div className="space-y-2">
                      <a
                        href="#"
                        className="block text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de uso
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de segurança
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos gerais
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pagamento Seguro"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-dark-800 p-6 rounded-xl mb-6 shadow flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                  {selectedPlanData?.name}
                </p>
                {/* Resumo dos adicionais em lista vertical com ícones */}
                <div className="flex flex-col gap-1 mb-1">
                  {orgForm.extraTeamMembers > 0 && (
                    <span className="flex items-center text-xs text-gray-700 dark:text-gray-300 gap-1">
                      <User
                        size={14}
                        className="text-purple-600 dark:text-purple-400"
                      />
                      +{orgForm.extraTeamMembers} membro
                      {orgForm.extraTeamMembers > 1 ? "s" : ""}
                    </span>
                  )}
                  {orgForm.extraBoards > 0 && (
                    <span className="flex items-center text-xs text-gray-700 dark:text-gray-300 gap-1">
                      <KanbanSquare
                        size={14}
                        className="text-purple-600 dark:text-purple-400"
                      />
                      +{orgForm.extraBoards} board
                      {orgForm.extraBoards > 1 ? "s" : ""}
                    </span>
                  )}
                  {orgForm.extraTriggers > 0 && (
                    <span className="flex items-center text-xs text-gray-700 dark:text-gray-300 gap-1">
                      <Zap
                        size={14}
                        className="text-purple-600 dark:text-purple-400"
                      />
                      +{orgForm.extraTriggers} disparo
                      {orgForm.extraTriggers > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Período: {billingPeriod === "monthly" ? "Mensal" : "Anual"}
                </p>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(
                  (selectedPlanData?.price || 0) +
                    orgForm.extraTeamMembers * (memberAddOn?.price || 0) +
                    orgForm.extraBoards * (boardAddOn?.price || 0) +
                    orgForm.extraTriggers * (triggerAddOn?.price || 0)
                )}
              </div>
            </div>
          </div>
          <div className="text-center space-y-6">
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Escolha como deseja prosseguir com o pagamento:
              </p>
            </div>
            {/* Botões de ação */}
            <div className="space-y-4">
              <button
                onClick={() => window.open(paymentLink, "_blank")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-base font-semibold"
              >
                <ExternalLink size={20} />
                Abrir página de pagamento
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(paymentLink);
                  toast.success("Link copiado para a área de transferência!");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-base"
              >
                <Copy size={20} />
                Copiar link de pagamento
              </button>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você será redirecionado para nossa página segura de pagamento no
                Stripe
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de cadastro de organização */}
      {showOrgModal && (
        <Modal
          size="large"
          isOpen={showOrgModal}
          onClose={() => setShowOrgModal(false)}
          title="Cadastrar Empresa"
        >
          <div className="w-full flex flex-col md:flex-row gap-10">
            {/* Coluna esquerda: Resumo do plano */}
            <div className="flex-1 bg-white dark:bg-dark-900 rounded-2xl p-8 shadow-lg mb-6 md:mb-0 border border-gray-200 dark:border-dark-700 min-w-[320px]">
              <h3 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-300">
                {selectedPlanData?.name || "Plano selecionado"}
              </h3>
              <div className="text-base text-gray-500 mb-4">
                {selectedPlanData?.description || "Descrição do plano."}
              </div>
              <div className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white flex items-end gap-2">
                {formatPrice( 
                  (selectedPlanData?.price || 0) +
                    orgForm.extraTeamMembers * (memberAddOn?.price || 0) +
                    orgForm.extraBoards * (boardAddOn?.price || 0) +
                    orgForm.extraTriggers * (triggerAddOn?.price || 0)
                )}
                <span className="text-base font-normal text-gray-500 mb-1">
                  /mês
                </span>
              </div>
              <ul className="mb-6 text-base text-gray-700 dark:text-gray-200 space-y-2">
                <li>
                  <b>{selectedPlanData?.maxTeamMembers ?? "-"}</b>
                  {orgForm.extraTeamMembers > 0 && (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {" "}
                      + {orgForm.extraTeamMembers}
                    </span>
                  )}{" "}
                  membros
                </li>
                <li>
                  <b>{selectedPlanData?.maxBoards ?? "-"}</b>
                  {orgForm.extraBoards > 0 && (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {" "}
                      + {orgForm.extraBoards}
                    </span>
                  )}{" "}
                  boards
                </li>
                <li>
                  <b>{selectedPlanData?.maxTriggers ?? "-"}</b>
                  {orgForm.extraTriggers > 0 && (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {" "}
                      + {orgForm.extraTriggers}
                    </span>
                  )}{" "}
                  disparos/mês
                </li>
                <li>
                  <b>{selectedPlanData?.maxContacts ?? "-"}</b> contatos
                </li>
                <li>Disparo em massa padrão</li>
                <li>Suporte 24/7 por whatsapp</li>
                <li>Controle financeiro e contratual</li>
                <li>CRM avançado</li>
              </ul>
              <div className="text-xs text-gray-400 mt-2">
                O valor total é atualizado conforme você adiciona recursos
                extras.
              </div>
            </div>
            {/* Coluna direita: Formulário */}
            <form
              onSubmit={handleOrgSubmit}
              className="flex-1 space-y-6 p-2 md:p-0 flex flex-col justify-center min-w-[320px]"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome da empresa
                </label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) =>
                    setOrgForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Documento (CPF ou CNPJ)
                </label>
                <input
                  type="text"
                  required
                  value={orgForm.document}
                  onChange={(e) =>
                    setOrgForm((f) => ({ ...f, document: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded border"
                />
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Membros adicionais
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={orgForm.extraTeamMembers}
                    onChange={(e) =>
                      setOrgForm((f) => ({
                        ...f,
                        extraTeamMembers: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded border"
                  />
                  {memberAddOn && (
                    <span className="text-xs text-gray-500">
                      R$ {memberAddOn.price.toFixed(2)} cada
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Boards adicionais
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={orgForm.extraBoards}
                    onChange={(e) =>
                      setOrgForm((f) => ({
                        ...f,
                        extraBoards: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded border"
                  />
                  {boardAddOn && (
                    <span className="text-xs text-gray-500">
                      R$ {boardAddOn.price.toFixed(2)} cada
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Disparos adicionais
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={orgForm.extraTriggers}
                    onChange={(e) =>
                      setOrgForm((f) => ({
                        ...f,
                        extraTriggers: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded border"
                  />
                  {triggerAddOn && (
                    <span className="text-xs text-gray-500">
                      R$ {triggerAddOn.price.toFixed(2)} cada
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={orgLoading}
                  className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
                >
                  {orgLoading ? "Enviando..." : "Continuar para pagamento"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
