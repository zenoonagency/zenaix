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

export function SubscriptionTab() {
  const { organization, token, fetchAndSyncUser } = useAuthStore();
  const plan = organization?.plan;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addOns, isLoading } = usePlanStore();
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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

    const extraBoardsCost = (organization.extraBoards || 0) * boardAddOnPrice;
    const extraMembersCost =
      (organization.extraTeamMembers || 0) * memberAddOnPrice;
    const extraTriggersCost =
      (organization.extraTriggers || 0) * triggerAddOnPrice;

    return basePrice + extraBoardsCost + extraMembersCost + extraTriggersCost;
  }, [plan, organization, addOns]);

  // --- NOVAS FUNÇÕES DE AÇÃO ---

  const handleCancel = async () => {
    if (!token || !organization?.id) return;
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    if (!token || !organization?.id) return;
    setIsSubmitting(true);
    try {
      await subscriptionService.reactivate(token, organization.id);

      await fetchAndSyncUser();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao reativar assinatura.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      toast.success("Assinatura reativada com sucesso!");
    }
  };

  const handleManage = async () => {
    if (!token || !organization?.id) return;
    setIsSubmitting(true);
    try {
      const data = await subscriptionService.managePlan(token, organization.id);
      setCheckoutUrl(data.portalUrl);
      setShowManageModal(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao gerenciar assinatura.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderManagementButton = () => {
    if (!organization) return null;

    switch (organization.subscriptionStatus) {
      case "ACTIVE":
      case "TRIALING":
        if (organization.subscriptionEndsAt) {
          return (
            <>
              <button
                onClick={handleReactivate}
                disabled={isSubmitting}
                className="w-full mt-4 px-4 py-2 mb-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                Reativar Assinatura
              </button>
              <p>
                Sua assinatura encerra em:{" "}
                {formatDateTimeGeneral(organization.subscriptionEndsAt)} ás{" "}
                {formatMessageTime(organization.subscriptionEndsAt)}
              </p>
            </>
          );
        }
        return (
          <>
            <button
              onClick={handleManage}
              disabled={isSubmitting}
              className="w-full my-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
              Gerenciar Assinatura e Pagamento
            </button>

            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full px-4 py-2 cursor-pointer text-red-600 rounded-lg hover:text-red-700 hover:underline disabled:opacity-50 flex items-center justify-center"
            >
              Cancelar Assinatura
            </button>
          </>
        );
      case "PAST_DUE":
      case "INCOMPLETE":
        return (
          <button
            onClick={handleManage}
            disabled={isSubmitting}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
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
    <div className="max-w-2xl mx-auto mt-8">
      <div className="border-2 border-purple-400 rounded-2xl p-8 bg-white dark:bg-dark-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-[#7f00ff]">
            {plan?.name || "Plano"}
          </h2>
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
        </div>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          R${" "}
          {totalMonthlyCost.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}{" "}
          <span className="text-base font-medium text-gray-500">/mês</span>
        </div>

        <div className="border-t border-gray-200 dark:border-dark-700 mt-6 py-4">
          {renderManagementButton()}
        </div>
      </div>

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

      {/* Modal de Confirmação de Cancelamento */}
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
              Confirmar Cancelamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
