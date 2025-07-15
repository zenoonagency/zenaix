import React, { useEffect, useState, useRef } from "react";
import { PlanCard } from "./components/PlanCard";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  User,
  KanbanSquare,
  Zap,
} from "lucide-react";
import { Modal } from "../../components/Modal";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/authStore";
import { organizationService } from "../../services/oganization/organization.service";
import { InputCreateOrgAndSubscribeDTO } from "../../types/organization";
import { usePlanStore } from "../../store/planStore";
import { subscriptionService } from "../../services/subscription/subscription.service";
import { InputCreateSubscriptionDTO } from "../../types/subscription";
import { ManageAddonsForm } from "./components/ManageAddonsForm";

export function Plans() {
  const { token, organization, fetchAndSyncUser } = useAuthStore();
  const { basePlans, addOns, isLoading } = usePlanStore();
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (organization?.plan?.id) return organization.plan.id;
    return basePlans[0]?.id || null;
  });
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: organization?.name || "",
    document: organization?.document || "",
    extra_team_members: organization?.extra_team_members || 0,
    extra_boards: organization?.extra_boards || 0,
    extra_triggers: organization?.extra_triggers || 0,
  });
  const [orgLoading, setOrgLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"planos" | "recursos">("planos");
  const [isOneTimePayment, setIsOneTimePayment] = useState(false);
  const [showConfirmAddonsModal, setShowConfirmAddonsModal] = useState(false);
  const [pendingAddonsForm, setPendingAddonsForm] = useState(null);
  const [loadingAddons, setLoadingAddons] = useState(false);

  // Ref para o ManageAddonsForm
  const manageAddonsFormRef = useRef(null);

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
      if (organization) {
        const data: InputCreateSubscriptionDTO = {
          plan_id: selectedPlan,
          extra_boards: orgForm.extra_boards,
          extra_team_members: orgForm.extra_team_members,
          extra_triggers: orgForm.extra_triggers,
        };

        const res = await subscriptionService.createCheckoutSession(
          token,
          organization.id,
          data
        );

        setShowOrgModal(false);
        setPaymentLink(res.checkout_url);
        setShowPaymentModal(true);
      } else {
        const data: InputCreateOrgAndSubscribeDTO = {
          name: orgForm.name,
          document: orgForm.document,
          plan_id: selectedPlan, // Corrigido para camelCase pois o tipo exige assim
          extra_boards: orgForm.extra_boards,
          extra_team_members: orgForm.extra_team_members,
          extra_triggers: orgForm.extra_triggers,
        };
        const res = await organizationService.createCheckoutSessionForNewOrg(
          data,
          token
        );

        setShowOrgModal(false);
        setPaymentLink(res.checkout_url);
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar organização");
    } finally {
      setOrgLoading(false);
    }
  };

  const selectedPlanData = basePlans.find((plan) => plan.id === selectedPlan);

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

  // Valor atual já pago (igual ao Settings)
  const valorAtual = (() => {
    if (!organization || !addOns) return 0;
    const basePrice = organization?.plan?.price || 0;
    const boardAddOnPrice =
      addOns.find((p) => p.name.includes("Board"))?.price || 0;
    const memberAddOnPrice =
      addOns.find((p) => p.name.includes("Membro"))?.price || 0;
    const triggerAddOnPrice =
      addOns.find((p) => p.name.includes("Disparo"))?.price || 0;
    const extraBoardsCost = (organization.extra_boards || 0) * boardAddOnPrice;
    const extraMembersCost =
      (organization.extra_team_members || 0) * memberAddOnPrice;
    const extraTriggersCost =
      (organization.extra_triggers || 0) * triggerAddOnPrice;
    return basePrice + extraBoardsCost + extraMembersCost + extraTriggersCost;
  })();
  // Valor novo
  const valorNovo =
    (memberAddOn?.price || 0) * orgForm.extra_team_members +
    (boardAddOn?.price || 0) * orgForm.extra_boards +
    (triggerAddOn?.price || 0) * orgForm.extra_triggers +
    (organization?.plan?.price || 0);

  // Só mostra o botão se houver alteração
  const recursosAlterados =
    orgForm.extra_boards > 0 ||
    orgForm.extra_team_members > 0 ||
    orgForm.extra_triggers > 0;

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

          {/* Tabs de Planos e Recursos adicionais */}
          {organization && (
            <div className="flex gap-2 mb-8">
              <button
                className={`px-6 py-2 rounded-t-lg font-semibold text-base border-b-2 transition-colors ${
                  activeTab === "planos"
                    ? "border-[#7f00ff] text-[#7f00ff] bg-white"
                    : "border-transparent text-gray-500 bg-gray-100 hover:text-[#7f00ff]"
                }`}
                onClick={() => setActiveTab("planos")}
              >
                Planos
              </button>
              <button
                className={`px-6 py-2 rounded-t-lg font-semibold text-base border-b-2 transition-colors ${
                  activeTab === "recursos"
                    ? "border-[#7f00ff] text-[#7f00ff] bg-white"
                    : "border-transparent text-gray-500 bg-gray-100 hover:text-[#7f00ff]"
                }`}
                onClick={() => setActiveTab("recursos")}
              >
                Recursos adicionais
              </button>
            </div>
          )}

          {/* Conteúdo das abas */}
          <>
            {(!organization || activeTab === "planos") && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Coluna da esquerda - Planos */}
                <div className="w-full lg:w-2/3 space-y-3">
                  {basePlans.map((plan) => {
                    const isCurrentPlan = organization?.plan?.id === plan.id;
                    return (
                      <PlanCard
                        key={plan.id}
                        title={plan.name}
                        description={plan.description}
                        price={plan.price}
                        billingPeriod={billingPeriod}
                        features={[
                          `Até ${plan.max_contacts} contatos`,
                          "Disparo em massa padrão",
                          "Suporte 24/7 por whatsapp",
                          "Controle financeiro e contratual",
                          "CRM avançado",
                          `Até ${plan.max_boards} Kanbans`,
                          `Até ${plan.max_triggers} Disparos por mês`,
                        ]}
                        isPopular={true}
                        gradient={"from-purple-500 to-indigo-600"}
                        baseUsers={plan.max_team_members}
                        isSelected={selectedPlan === plan.id}
                        onClick={() => {
                          if (!isCurrentPlan) setSelectedPlan(plan.id);
                        }}
                        className={
                          isCurrentPlan ? "opacity-50 pointer-events-none" : ""
                        }
                      />
                    );
                  })}
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
                            Total{" "}
                            {billingPeriod === "monthly" ? "mensal" : "anual"}
                          </span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatPrice(
                              billingPeriod === "monthly"
                                ? selectedPlanData?.price || 0
                                : selectedPlanData?.price || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Botão */}
                      <button
                        onClick={handlePayment}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200"
                        disabled={organization?.plan?.id === selectedPlan}
                        style={{
                          opacity:
                            organization?.plan?.id === selectedPlan ? 0.5 : 1,
                        }}
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
            )}

            {organization && activeTab === "recursos" && (
              <ManageAddonsForm
                ref={manageAddonsFormRef}
                organization={organization}
                addOns={addOns}
                memberAddOn={memberAddOn}
                boardAddOn={boardAddOn}
                triggerAddOn={triggerAddOn}
                formatPrice={formatPrice}
                onSubmit={(form) => {
                  // Se for compra de disparo único, abrir modal direto com o link
                  if (form && form.oneTimePaymentUrl) {
                    setPaymentLink(form.oneTimePaymentUrl);
                    setIsOneTimePayment(true);
                    setShowPaymentModal(true);
                    return;
                  }
                  // Caso padrão: recursos adicionais
                  setPendingAddonsForm(form);
                  setShowConfirmAddonsModal(true);
                }}
              />
            )}
          </>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pagamento Seguro"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-dark-800 p-6 rounded-xl mb-6 shadow flex flex-col gap-2">
            {isOneTimePayment ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                      Compra de disparo único
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {/* O valor será mostrado no botão de compra, mas pode ser passado como prop se quiser exibir aqui também */}
                  </div>
                </div>
                <div className="text-center space-y-6">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Clique abaixo para finalizar a compra dos disparos únicos.
                    </p>
                  </div>
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
                        toast.success(
                          "Link copiado para a área de transferência!"
                        );
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-base"
                    >
                      <Copy size={20} />
                      Copiar link de pagamento
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Você será redirecionado para nossa página segura de
                      pagamento no Stripe
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                      {selectedPlanData?.name}
                    </p>
                    {/* Resumo dos adicionais em lista vertical com ícones */}
                    <div className="flex flex-col gap-1 mb-1">
                      {orgForm.extra_team_members > 0 && (
                        <span className="flex items-center text-xs text-gray-700 dark:text-gray-300 gap-1">
                          <User
                            size={14}
                            className="text-purple-600 dark:text-purple-400"
                          />
                          +{orgForm.extra_team_members} membro
                          {orgForm.extra_team_members > 1 ? "s" : ""}
                        </span>
                      )}
                      {orgForm.extra_boards > 0 && (
                        <span className="flex items-center text-xs text-gray-700 dark:text-gray-300 gap-1">
                          <KanbanSquare
                            size={14}
                            className="text-purple-600 dark:text-purple-400"
                          />
                          +{orgForm.extra_boards} board
                          {orgForm.extra_boards > 1 ? "s" : ""}
                        </span>
                      )}
                      {orgForm.extra_triggers > 0 && (
                        <span className="flex items-center text-xs text-gray-700 dark:text-gray-300 gap-1">
                          <Zap
                            size={14}
                            className="text-purple-600 dark:text-purple-400"
                          />
                          +{orgForm.extra_triggers} disparo
                          {orgForm.extra_triggers > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Período:{" "}
                      {billingPeriod === "monthly" ? "Mensal" : "Anual"}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(
                      (selectedPlanData?.price || 0) +
                        orgForm.extra_team_members * (memberAddOn?.price || 0) +
                        orgForm.extra_boards * (boardAddOn?.price || 0) +
                        orgForm.extra_triggers * (triggerAddOn?.price || 0)
                    )}
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
                        toast.success(
                          "Link copiado para a área de transferência!"
                        );
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-base"
                    >
                      <Copy size={20} />
                      Copiar link de pagamento
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Você será redirecionado para nossa página segura de
                      pagamento no Stripe
                    </p>
                  </div>
                </div>
              </>
            )}
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
                    orgForm.extra_team_members * (memberAddOn?.price || 0) +
                    orgForm.extra_boards * (boardAddOn?.price || 0) +
                    orgForm.extra_triggers * (triggerAddOn?.price || 0)
                )}
                <span className="text-base font-normal text-gray-500 mb-1">
                  /mês
                </span>
              </div>
              <ul className="mb-6 text-base text-gray-700 dark:text-gray-200 space-y-2">
                <li>
                  <b>{selectedPlanData?.max_team_members ?? "-"}</b>
                  {orgForm.extra_team_members > 0 && (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {" "}
                      + {orgForm.extra_team_members}
                    </span>
                  )}{" "}
                  membros
                </li>
                <li>
                  <b>{selectedPlanData?.max_boards ?? "-"}</b>
                  {orgForm.extra_boards > 0 && (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {" "}
                      + {orgForm.extra_boards}
                    </span>
                  )}{" "}
                  boards
                </li>
                <li>
                  <b>{selectedPlanData?.max_triggers ?? "-"}</b>
                  {orgForm.extra_triggers > 0 && (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {" "}
                      + {orgForm.extra_triggers}
                    </span>
                  )}{" "}
                  disparos
                </li>
                <li>
                  <b>{selectedPlanData?.max_contacts ?? "-"}</b> contatos
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
                  disabled={organization && organization.name.length > 0}
                  value={organization ? organization.name : orgForm.name}
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
                  disabled={organization && organization.document.length > 0}
                  value={
                    organization ? organization.document : orgForm.document
                  }
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
                    value={orgForm.extra_team_members}
                    onChange={(e) =>
                      setOrgForm((f) => ({
                        ...f,
                        extra_team_members: Number(e.target.value),
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
                    value={orgForm.extra_boards}
                    onChange={(e) =>
                      setOrgForm((f) => ({
                        ...f,
                        extra_boards: Number(e.target.value),
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
                    value={orgForm.extra_triggers}
                    onChange={(e) =>
                      setOrgForm((f) => ({
                        ...f,
                        extra_triggers: Number(e.target.value),
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
      {/* Modal de confirmação de compra de recursos adicionais */}
      <Modal
        isOpen={showConfirmAddonsModal}
        onClose={() => setShowConfirmAddonsModal(false)}
        title="Confirmar compra de recursos adicionais"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Você confirma a compra de:
          </p>
          <ul className="text-base text-gray-700 dark:text-gray-300 space-y-1 font-medium">
            {pendingAddonsForm?.extra_team_members > 0 && (
              <li>
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  +{pendingAddonsForm.extra_team_members}
                </span>{" "}
                membros
              </li>
            )}
            {pendingAddonsForm?.extra_boards > 0 && (
              <li>
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  +{pendingAddonsForm.extra_boards}
                </span>{" "}
                boards
              </li>
            )}
            {pendingAddonsForm?.extra_triggers > 0 && (
              <li>
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  +{pendingAddonsForm.extra_triggers}
                </span>{" "}
                disparos/mês
              </li>
            )}
          </ul>
          {/* Cálculo dos valores total atual e novo total */}
          {(() => {
            // Valor total atual
            const valorAtual = (() => {
              if (!organization || !addOns) return 0;
              const basePrice = organization?.plan?.price || 0;
              const boardAddOnPrice =
                addOns.find((p) => p.name.includes("Board"))?.price || 0;
              const memberAddOnPrice =
                addOns.find((p) => p.name.includes("Membro"))?.price || 0;
              const triggerAddOnPrice =
                addOns.find((p) => p.name.includes("Disparo"))?.price || 0;
              const extraBoardsCost =
                (organization.extra_boards || 0) * boardAddOnPrice;
              const extraMembersCost =
                (organization.extra_team_members || 0) * memberAddOnPrice;
              const extraTriggersCost =
                (organization.extra_triggers || 0) * triggerAddOnPrice;
              return (
                basePrice +
                extraBoardsCost +
                extraMembersCost +
                extraTriggersCost
              );
            })();
            // Valor dos recursos adicionais (apenas o que está sendo comprado agora)
            const valorAdicionais =
              (memberAddOn?.price || 0) *
                (pendingAddonsForm?.extra_team_members || 0) +
              (boardAddOn?.price || 0) *
                (pendingAddonsForm?.extra_boards || 0) +
              (triggerAddOn?.price || 0) *
                (pendingAddonsForm?.extra_triggers || 0);
            return (
              <div className="flex flex-col gap-1 mt-4">
                {/* <span className="text-gray-500 line-through text-base">
                  Valor atual: {formatPrice(valorAtual)}
                </span> */}
                <span className="text-lg font-bold">
                  Valor dos recursos: {formatPrice(valorAdicionais)}
                </span>
              </div>
            );
          })()}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowConfirmAddonsModal(false)}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-dark-700 text-gray-800 dark:text-gray-200"
              disabled={loadingAddons}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                if (!organization || !token || !pendingAddonsForm) return;
                setLoadingAddons(true);
                try {
                  // Para cada recurso adicional comprado, chama a service separadamente
                  const promises = [];
                  if (pendingAddonsForm.extra_boards > 0) {
                    promises.push(
                      subscriptionService.addSlots(token, organization.id, {
                        slot_type: "board",
                        quantity: pendingAddonsForm.extra_boards,
                      })
                    );
                  }
                  if (pendingAddonsForm.extra_team_members > 0) {
                    promises.push(
                      subscriptionService.addSlots(token, organization.id, {
                        slot_type: "member",
                        quantity: pendingAddonsForm.extra_team_members,
                      })
                    );
                  }
                  if (pendingAddonsForm.extra_triggers > 0) {
                    promises.push(
                      subscriptionService.addSlots(token, organization.id, {
                        slot_type: "trigger",
                        quantity: pendingAddonsForm.extra_triggers,
                      })
                    );
                  }
                  await Promise.all(promises);
                  toast.success("Recursos adicionais comprados com sucesso!");
                  if (
                    manageAddonsFormRef.current &&
                    manageAddonsFormRef.current.resetForm
                  ) {
                    manageAddonsFormRef.current.resetForm();
                  }
                } catch (err) {
                  toast.error("Erro ao comprar recursos adicionais.");
                } finally {
                  fetchAndSyncUser();
                  setLoadingAddons(false);
                  setShowConfirmAddonsModal(false);
                }
              }}
              className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
              disabled={
                loadingAddons ||
                !(
                  pendingAddonsForm?.extra_boards > 0 ||
                  pendingAddonsForm?.extra_team_members > 0 ||
                  pendingAddonsForm?.extra_triggers > 0
                )
              }
            >
              {loadingAddons ? "Confirmando..." : "Confirmar compra"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
