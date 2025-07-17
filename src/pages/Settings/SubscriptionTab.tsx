import { useState, useMemo } from "react";
import { useAuthStore } from "../../store/authStore";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { subscriptionService } from "../../services/subscription/subscription.service";
import { toast } from "react-toastify";
import { usePlanStore } from "../../store/planStore";
import { useNavigate } from "react-router-dom";
import { InputCreateSubscriptionDTO } from "../../types/subscription";
import { formatDateTimeGeneral } from "../../utils/dateUtils";
import { formatMessageTime } from "../../utils/dateUtils";
import { Modal } from "../../components/Modal";
import { ManageResourcesForm } from "../../components/ManageResourcesForm";
import { formatCurrency } from "../../utils/formatters";

export function SubscriptionTab() {
  const { organization, token, fetchAndSyncUser } = useAuthStore();
  const plan = organization?.plan;
  const [isSubmittingManage, setIsSubmittingManage] = useState(false);
  const [isSubmittingAddons, setIsSubmittingAddons] = useState(false);
  const { addOns, isLoading } = usePlanStore();
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const navigate = useNavigate();

  const totalMonthlyCost = useMemo(() => {
    if (!plan || !organization) return 0;
    const basePrice = plan.price || 0;
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
  }, [plan, organization, addOns]);

  // --- NOVAS FUNÇÕES DE AÇÃO ---

  const handleCancel = async () => {
    if (!token || !organization?.id) return;
    setIsSubmittingManage(true);
    try {
      await subscriptionService.cancel(token, organization.id);
      await fetchAndSyncUser();
      toast.success("Assinatura agendada para cancelamento com sucesso!");
      setShowCancelModal(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cancelar assinatura.";
      toast.error(message);
    } finally {
      setIsSubmittingManage(false);
    }
  };

  const handleReactivate = async () => {
    if (!token || !organization?.id) return;
    setIsSubmittingManage(true);
    try {
      await subscriptionService.reactivate(token, organization.id);

      await fetchAndSyncUser();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao reativar assinatura.";
      toast.error(message);
    } finally {
      setIsSubmittingManage(false);
      toast.success("Assinatura reativada com sucesso!");
    }
  };

  const handleManage = async () => {
    if (!token || !organization?.id) return;
    setIsSubmittingManage(true);
    try {
      const data = await subscriptionService.managePlan(token, organization.id);
      setCheckoutUrl(data.portal_url);
      setShowManageModal(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao gerenciar assinatura.";
      toast.error(message);
    } finally {
      setIsSubmittingManage(false);
    }
  };

  const handleManageAddons = async () => {
    setIsSubmittingAddons(true);
    setShowAddonsModal(true);
    setTimeout(() => setIsSubmittingAddons(false), 300); // garante loading visual rápido
  };

  const renderManagementButton = () => {
    if (!organization) return null;

    switch (organization.subscription_status) {
      case "ACTIVE":
      case "TRIALING":
        if (organization.subscription_ends_at) {
          return (
            <>
              <button
                onClick={handleReactivate}
                disabled={isSubmittingManage}
                className="w-full mt-4 px-4 py-2 mb-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmittingManage ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                Reativar Assinatura
              </button>
              <p>
                Sua assinatura encerra em:{" "}
                {formatDateTimeGeneral(organization.subscription_ends_at)} ás{" "}
                {formatMessageTime(organization.subscription_ends_at)}
              </p>
            </>
          );
        }
        return (
          <>
            <div className="flex flex-row gap-4 mb-4">
              <button
                onClick={handleManage}
                disabled={isSubmittingManage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmittingManage ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                Gerenciar Assinatura e Pagamento
              </button>
              <button
                onClick={handleManageAddons}
                disabled={isSubmittingAddons}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmittingAddons ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                Gerenciar Recursos adicionais
              </button>
            </div>
          </>
        );
      case "PAST_DUE":
      case "INCOMPLETE":
        return (
          <button
            onClick={handleManage}
            disabled={isSubmittingManage}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmittingManage ? (
              <Loader2 className="animate-spin mr-2" />
            ) : null}
            Gerenciar Assinatura e Pagamento
          </button>
        );
      case "CANCELED":
        return (
          <button
            onClick={() => navigate("/dashboard/plans")}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reativar Assinatura
          </button>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex">
        <span className="flex flex-1 items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando...
        </span>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="border-2 border-purple-400 rounded-2xl p-8 bg-white dark:bg-dark-800 shadow-md">
          <div className="flex flex-col gap-10 items-center justify-center mb-2">
            <h2 className="text-2xl font-bold text-[#7f00ff]">
              Você não tem nenhum plano ativo, clique no botão abaixo pra
              conhecer nossas opções!
            </h2>

            <button
              type="button"
              onClick={() => navigate("/dashboard/plans")}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#7f00ff] to-[#7f00ff]/90 text-white px-6 py-3 rounded-lg font-medium hover:from-[#7f00ff]/90 hover:to-[#7f00ff]/80 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Conhecer planos
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto mt-8 mb-8">
      {/* Título de seção: Assinatura ativa */}
      {(organization?.subscription_status === "ACTIVE" ||
        organization?.subscription_status === "TRIALING") && (
        <h2 className="text-2xl font-bold text-[#7f00ff] mb-6">
          Assinatura ativa
        </h2>
      )}
      <div className="border-2 border-purple-400 rounded-2xl p-8 bg-white dark:bg-dark-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-[#7f00ff]">
            {plan?.name || "Plano"}
          </h2>
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              organization?.subscription_status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {organization?.subscription_status === "ACTIVE"
              ? "Ativo"
              : "Inativo"}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {plan?.description}
        </p>

        <ul className="space-y-2 mb-4">
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Até {plan?.max_contacts} contatos
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Até {plan?.max_triggers} disparos por mês
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>{" "}
            Até {plan?.max_boards} Kanbans
          </li>
          <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#7f00ff] text-white">
              <Check size={16} />
            </span>
            "Suporte 24/7 por whatsapp"
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
        <div className="flex flex-wrap gap-4 my-3 text-sm">
          <span>
            Quadros Kanban adicionais: <b>{organization?.extra_boards}</b>
          </span>
          <span>
            Membros adicionais: <b>{organization?.extra_team_members}</b>
          </span>
          <span>
            Disparos adicionais: <b>{organization?.extra_triggers}</b>
          </span>
        </div>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          {formatCurrency(totalMonthlyCost)}
          <span className="text-base font-medium text-gray-500">/mês</span>
        </div>

        <div className="border-t border-gray-200 dark:border-dark-700 mt-6 py-4">
          {renderManagementButton()}
        </div>
      </div>
      {/* Seção de cancelamento, só aparece se assinatura ativa ou trialing */}
      {(organization?.subscription_status === "ACTIVE" ||
        organization?.subscription_status === "TRIALING") && (
        <div className="border-t border-gray-200 mt-8 pt-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-[#7f00ff] mb-4">
            Cancelamento de assinatura
          </h3>
          <div className="text-left text-gray-700 dark:text-gray-300 space-y-3">
            <p>
              Ao cancelar sua assinatura, você terá até <b>30 dias</b> para
              reativá-la sem perder seus dados e configurações. Após esse
              período, sua assinatura será encerrada definitivamente e será
              necessário contratar um novo plano para continuar utilizando a
              plataforma.
            </p>
            <p>
              Essa política segue as regras do Stripe, nosso processador de
              pagamentos. Para mais informações, consulte nossos
              <a
                href="/termos"
                className="text-[#7f00ff] underline font-medium hover:text-purple-800 transition-colors mx-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Termos de Uso
              </a>
              .
            </p>
            <p className="mt-4">
              Se mesmo assim você quiser solicitar o cancelamento,{" "}
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-red-600 underline hover:text-red-800 font-normal px-0 py-0 bg-transparent border-none inline"
                style={{ textDecorationThickness: 1 }}
              >
                clique aqui
              </button>
              .
            </p>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento */}
      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title="Gerenciar Assinatura"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Você será redirecionado para o painel de gerenciamento do Stripe
            para atualizar suas informações de pagamento e gerenciar sua
            assinatura.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowManageModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (checkoutUrl) {
                  window.open(checkoutUrl, "_blank");
                }
                setShowManageModal(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <ExternalLink size={16} className="mr-2" />
              Ir para o Painel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddonsModal}
        onClose={() => setShowAddonsModal(false)}
        title="Gerenciar Recursos"
        size="medium"
      >
        <ManageResourcesForm
          plan={plan}
          organization={organization}
          addOns={addOns}
          valorAtual={totalMonthlyCost}
          onClose={() => setShowAddonsModal(false)}
          fetchAndSyncUser={fetchAndSyncUser}
        />
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Confirmar Cancelamento"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Tem certeza que deseja cancelar sua assinatura? Esta ação irá
            agendar o cancelamento para o final do período atual.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmittingManage}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isSubmittingManage ? (
                <Loader2 className="animate-spin mr-2" />
              ) : null}
              Confirmar Cancelamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
